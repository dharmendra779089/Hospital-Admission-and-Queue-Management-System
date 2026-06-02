// Import Express to define patient registry router endpoints
const express = require('express');
// Import PrismaClient to execute queries on our tables
const { PrismaClient } = require('@prisma/client');
// Import authenticate and authorizeAdminOnlyLegacy middlewares
const { authenticate, authorizeAdminOnlyLegacy } = require('../middleware/auth');

// Create the Express router instance
const router = express.Router();
// Create the Prisma database client
const prisma = new PrismaClient();

// GET /api/patients - Fetch paginated and filtered patient directory
router.get('/', authenticate, async (req, res) => {
  // Try block to intercept database connection and execution exceptions
  try {
    // Destructure search query, gender filter, and pagination values (default page=1, limit=5)
    const { search, gender, page = 1, limit = 5 } = req.query;
    // Parse page query argument as an integer
    const pageNum = parseInt(page);
    // Parse limit query argument as an integer
    const limitNum = parseInt(limit);
    // Compute the SQL offset (skip) based on target page and page size
    const skip = (pageNum - 1) * limitNum;

    // Initialize an empty query mapping object
    const where = {};

    // Apply case-insensitive exact match check if gender is filtered (excluding 'All')
    if (gender && gender !== 'All') {
      where.gender = { equals: gender, mode: 'insensitive' };
    }

    // Apply case-insensitive lookup conditions if a search query is active
    if (search) {
      const q = search.toLowerCase();
      // Look for search text matches in patient name, phoneNumber, or email columns
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { phoneNumber: { contains: q } },
        { email: { contains: q, mode: 'insensitive' } },
      ];
    }

    // Run parallel database queries: fetching page subset and total record count
    const [patients, total] = await Promise.all([
      // Query 1: Fetch subset of patient records matching criteria, sorted by creation date
      prisma.patient.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum, // Apply limit bounds to fetch only current page row segment
      }),
      // Query 2: Retrieve total count matching search criteria to compute total pagination pages
      prisma.patient.count({ where }),
    ]);

    // Return the paginated patient records list and pagination metrics metadata
    res.json({
      success: true,
      patients,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalPatients: total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  // Handle database execution exceptions
  } catch (error) {
    // Return a 500 status indicating query execution failure
    res.status(500).json({ error: 'Failed to fetch patients' });
  }
});

// GET /api/patients/:id - Fetch profile details and appointment logs of a single patient
router.get('/:id', authenticate, async (req, res) => {
  // Try block to intercept database failures safely
  try {
    // Query database to retrieve patient matching dynamic dynamic ID parameter
    const patient = await prisma.patient.findUnique({
      where: { id: req.params.id },
      // Join and load all appointments booked by this patient historically
      include: { appointments: true },
    });

    // If no matching patient record exists
    if (!patient) {
      // Return a 404 status code indicating record not found
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Return the detailed patient profile JSON object with a 200 status code
    res.json(patient);
  // Catch database execution exceptions
  } catch (error) {
    // Return a 500 status indicating query execution error
    res.status(500).json({ error: error.message });
  }
});

// POST /api/patients - Register a new patient in the system directory
router.post('/', authenticate, async (req, res) => {
  // Try block to intercept data creation issues safely
  try {
    // Destructure properties from incoming request body
    const { name, email, phoneNumber, age, gender, medicalHistory } = req.body;

    // Validate that required fields are supplied in the request body
    if (!name || !phoneNumber || !age || !gender) {
      // Reject request with a 400 Bad Request if missing fields
      return res.status(400).json({ error: 'Name, phoneNumber, age, and gender are required.' });
    }

    // Insert new patient record into the database table
    const patient = await prisma.patient.create({
      data: {
        name,
        email: email || null,
        phoneNumber,
        age: parseInt(age),
        gender,
        medicalHistory: medicalHistory || null,
      },
    });

    // Return the newly created patient database object with a 201 status code
    res.status(201).json(patient);
  // Handle registration creation failure
  } catch (error) {
    // Return a 500 status indicating database insert failed
    res.status(500).json({ error: 'Failed to register patient' });
  }
});

// DELETE /api/patients/:id - Delete a patient record from the registry directory (Admin Only)
router.delete('/:id', authenticate, authorizeAdminOnlyLegacy, async (req, res) => {
  // Try block to intercept deletion transactions failures safely
  try {
    // Extract the ID value from path dynamic parameters
    const { id } = req.params;

    // Fetch the target patient record first to verify it exists
    const patient = await prisma.patient.findUnique({ where: { id } });
    // If no matching patient row exists
    if (!patient) {
      // Reject with a 404 Not Found error
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Execute the delete operation in the database
    await prisma.patient.delete({ where: { id } });
    // Respond with a success message confirming deletion
    res.json({ message: `Successfully deleted patient ${patient.name}` });
  // Intercept foreign key constraint violations or query execution issues
  } catch (error) {
    // Return a 500 status indicating deletion execution failure
    res.status(500).json({ error: 'Failed to delete patient' });
  }
});

// Export the configured patients router module
module.exports = router;