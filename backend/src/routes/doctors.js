// Import Express to define physician routes
const express = require('express');
// Import PrismaClient to interact with the database
const { PrismaClient } = require('@prisma/client');
// Import the authenticate middleware to secure routes
const { authenticate } = require('../middleware/auth');

// Create the Express router instance
const router = express.Router();
// Create the Prisma Client instance
const prisma = new PrismaClient();

// GET /api/doctors - Retrieve doctor registry list with optional search and filters
router.get('/', authenticate, async (req, res) => {
  // Try block to intercept database query failures safely
  try {
    // Destructure search string and specialization from query parameters
    const { search, specialization } = req.query;

    // Initialize an empty query filter mapping object
    const where = {};

    // If search text parameter is provided
    if (search) {
      // Filter records containing search string inside their names (case-insensitive mode)
      where.name = { contains: search, mode: 'insensitive' };
    }

    // If specialization filter is active and not set to default 'All' value
    if (specialization && specialization !== 'All') {
      // Restrict results matching this exact specialization value
      where.specialization = specialization;
    }

    // Execute safe database query to retrieve matching doctor records
    const doctors = await prisma.doctor.findMany({ where });
    // Respond with the array of doctors as JSON
    res.json(doctors);
  // Catch database execution exceptions
  } catch (error) {
    // Return a 500 status indicating query execution failure
    res.status(500).json({ error: 'Failed to fetch doctors' });
  }
});

// GET /api/doctors/stats - Retrieve high-level summary metrics about the medical staff
router.get('/stats', authenticate, async (req, res) => {
  // Try block to handle aggregate operation exceptions
  try {
    // Run all 4 SQL aggregation queries concurrently using parallel Promises
    const [totalDoctors, surgeonsCount, averageFee, highestExperience] = await Promise.all([
      // Query 1: Retrieve total doctor record count
      prisma.doctor.count(),
      // Query 2: Retrieve total count of doctors working in the Surgery department
      prisma.doctor.count({ where: { department: 'Surgery' } }),
      // Query 3: Compute the average value of the consultationFee column
      prisma.doctor.aggregate({ _avg: { consultationFee: true } }),
      // Query 4: Retrieve the maximum value found in the experience column
      prisma.doctor.aggregate({ _max: { experience: true } }),
    ]);

    // Return the collected metrics in a unified JSON payload
    res.json({
      success: true,
      data: {
        total: totalDoctors,
        surgeons: surgeonsCount,
        // Safely round the average fee value, defaulting to 0 if null
        averageFee: Math.round(averageFee._avg.consultationFee || 0),
        // Extract experience value, defaulting to 0 if null
        maxExperience: highestExperience._max.experience || 0,
      },
    });
  // Handle database aggregation failures
  } catch (error) {
    // Return a 500 status code returning the exception details
    res.status(500).json({ error: error.message });
  }
});

// GET /api/doctors/:id - Fetch details of a single physician by unique identifier
router.get('/:id', authenticate, async (req, res) => {
  // Try block to intercept database exceptions safely
  try {
    // Fetch unique doctor record matching the ID passed in the path parameter
    const doctor = await prisma.doctor.findUnique({
      where: { id: req.params.id },
    });

    // If the requested physician ID does not exist in the database
    if (!doctor) {
      // Return a 404 status code indicating record not found
      return res.status(404).json({ error: 'Doctor not found' });
    }

    // Respond with the fetched doctor record details and a 200 status code
    res.json(doctor);
  // Catch database execution exceptions
  } catch (error) {
    // Return a 500 status indicating transaction error
    res.status(500).json({ error: error.message });
  }
});

// Export the configured doctors router module
module.exports = router;