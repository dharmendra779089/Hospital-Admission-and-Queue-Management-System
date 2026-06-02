// Import Express to define appointment router endpoints
const express = require('express');
// Import PrismaClient to interact with the database
const { PrismaClient } = require('@prisma/client');
// Import the authenticate middleware to secure routes
const { authenticate } = require('../middleware/auth');

// Create the Express router instance
const router = express.Router();
// Create the Prisma database client
const prisma = new PrismaClient();

// GET /api/appointments - Retrieve scheduled bookings with filters
router.get('/', authenticate, async (req, res) => {
  // Try block to intercept database query failures safely
  try {
    // Destructure doctorId filter and status filter from query parameters
    const { doctorId, status } = req.query;

    // Initialize an empty query condition mapping object
    const where = {};
    // If doctorId query parameter is provided, add it to filter criteria
    if (doctorId) where.doctorId = doctorId;
    // If status query parameter is provided, add it to filter criteria
    if (status) where.status = status;

    // Retrieve appointments list matching filters sorted chronologically ascending
    const appointments = await prisma.appointment.findMany({
      where,
      orderBy: { appointmentDate: 'asc' }, // Sort upcoming bookings first
      // Eagerly load details from the related patient and doctor models in a single query
      include: {
        patient: {
          select: { id: true, name: true, phoneNumber: true, age: true, medicalHistory: true },
        },
        doctor: {
          select: { id: true, name: true, specialization: true },
        },
      },
    });

    // Respond with a success token, result count, and the retrieved appointments array
    res.json({
      success: true,
      count: appointments.length,
      appointments,
    });
  // Catch database execution exceptions
  } catch (error) {
    // Return a 500 status indicating query transaction failed
    res.status(500).json({ error: 'Failed to retrieve appointments' });
  }
});

// POST /api/appointments - Schedule a new appointment slot
router.post('/', authenticate, async (req, res) => {
  // Try block to intercept validation and creation exceptions
  try {
    // Extract parameters from request body
    const { patientId, doctorId, appointmentDate, reason } = req.body;

    // Validate that all required properties exist in request body payload
    if (!patientId || !doctorId || !appointmentDate) {
      // Reject request with a 400 Bad Request if validation checks fail
      return res.status(400).json({ error: 'Patient, Doctor, and Appointment Date are required.' });
    }

    // Convert date string parameter into a standard JavaScript Date instance
    const appDate = new Date(appointmentDate);

    // Check for an existing booking matching the same doctor and slot that is not cancelled
    const existingBooking = await prisma.appointment.findFirst({
      where: {
        doctorId,
        appointmentDate: appDate,
        status: { not: 'CANCELLED' },
      },
    });

    // If a double-booking slot collision is detected
    if (existingBooking) {
      // Return 400 Bad Request error indicating slot unavailability
      return res.status(400).json({ error: 'Doctor already has an appointment at this time.' });
    }

    // Insert new appointment record into database table
    const appointment = await prisma.appointment.create({
      data: {
        patientId,
        doctorId,
        appointmentDate: appDate,
        reason: reason || '',
        status: 'PENDING', // Default new bookings status state to PENDING
      },
    });

    // Respond with a 201 Created status code, return success message and appointment record
    res.status(201).json({ message: 'Appointment booked successfully', appointment });
  // Handle scheduling creation failures
  } catch (error) {
    // Return a 500 status indicating insert transaction failed
    res.status(500).json({ error: 'Failed to book appointment' });
  }
});

// PATCH /api/appointments/:id - Update status of an existing appointment booking
router.patch('/:id', authenticate, async (req, res) => {
  // Try block to intercept data update fails safely
  try {
    // Extract new status parameter from request body
    const { status } = req.body;

    // Validate that status parameter exists in request payload
    if (!status) {
      // Return a 400 Bad Request error
      return res.status(400).json({ error: 'Status is required' });
    }

    // Execute the update operation targeting the unique appointment ID
    const updated = await prisma.appointment.update({
      where: { id: req.params.id },
      data: { status },
    });

    // Respond with the updated database object details
    res.json(updated);
  // Catch database execution exceptions
  } catch (error) {
    // Return a 500 status indicating update transaction failed
    res.status(500).json({ error: 'Failed to update appointment' });
  }
});

// Export the configured appointments router module
module.exports = router;