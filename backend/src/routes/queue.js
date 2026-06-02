// Import the Express library to create route handlers
const express = require('express');
// Import PrismaClient from the @prisma/client package to interact with the database
const { PrismaClient } = require('@prisma/client');
// Import the authenticate middleware to secure protected routes
const { authenticate } = require('../middleware/auth');

// Create a new Express router instance for our queue API endpoints
const router = express.Router();
// Instantiate the PrismaClient to execute queries on our tables
const prisma = new PrismaClient();

// Define a public GET route handler to retrieve all active queue tokens (used by live monitor board)
router.get('/', async (req, res) => {
  // Begin try block to handle any unexpected database or processing errors safely
  try {
    // Destructure doctorId and status from the incoming query parameters
    const { doctorId, status } = req.query;

    // Initialize an empty object to build the dynamic SQL WHERE filtering clause
    const where = {};
    // If a doctorId parameter is supplied, add it to the filter criteria
    if (doctorId) where.doctorId = doctorId;
    // If a status filter parameter is supplied, add it to the filter criteria
    if (status) where.status = status;

    // Fetch matching queue tokens using PrismaClient sorted by creation timestamp ascending
    const tokens = await prisma.queueToken.findMany({
      // Apply the dynamic where criteria built from query parameters
      where,
      // Eagerly load the associated patient and doctor details using relation joins
      include: {
        patient: true,
        doctor: true,
      },
      // Order the returned list by createdAt in ascending order to preserve check-in sequences
      orderBy: { createdAt: 'asc' },
    });

    // Send the retrieved queue token array back as a JSON response with status 200
    res.json(tokens);
  // Catch block triggers if any database operations fail or raise exceptions
  } catch (error) {
    // Send a 500 status code back indicating an internal database fetch failure
    res.status(500).json({ error: 'Failed to retrieve queue', details: error.message });
  }
});

// Create a persistent Map to store promises for active queue check-ins by doctorId
const checkInLocks = new Map();

// Define an asynchronous helper function to acquire a mutex lock for a specific doctorId
async function acquireLock(doctorId) {
  // Loop to block the current execution path as long as a lock exists for this doctorId
  while (checkInLocks.has(doctorId)) {
    // Await the active check-in transaction lock promise to resolve
    await checkInLocks.get(doctorId);
  }
  // Declare a placeholder variable to store the resolver function for the new promise
  let resolveLock;
  // Instantiate a new promise and capture its resolve handler in our placeholder variable
  const promise = new Promise((resolve) => {
    resolveLock = resolve;
  });
  // Register the active promise lock in the Map associated with the doctorId key
  checkInLocks.set(doctorId, promise);
  // Return a cleanup callback function to release the lock when called
  return () => {
    // Remove the promise lock key from our active locks Map
    checkInLocks.delete(doctorId);
    // Resolve the promise to wake up any subsequent requests waiting in the while loop
    resolveLock();
  };
}

// Define a POST route handler to safely register and check-in a patient, returning a new token
router.post('/checkin', authenticate, async (req, res) => {
  // Extract patientId, doctorId, and optional appointmentId parameters from request payload
  const { patientId, doctorId, appointmentId } = req.body;

  // Validate that both required identifiers exist in the request body
  if (!patientId || !doctorId) {
    // Return a 400 Bad Request error if essential identifiers are missing
    return res.status(400).json({ error: 'Patient and Doctor ID are required for check-in.' });
  }

  // Acquire the exclusive application-level lock for the specified doctor to prevent concurrency races
  const release = await acquireLock(doctorId);
  // Begin protected execution block
  try {
    // Construct a new Date instance representing the current timestamp
    const today = new Date();
    // Zero out hours, minutes, seconds, and milliseconds to target today's date boundary
    today.setHours(0, 0, 0, 0);

    // Compute the maximum token number assigned to this doctor since midnight today
    const maxTokenResult = await prisma.queueToken.aggregate({
      // Apply filters for doctorId and date boundary
      where: {
        doctorId,
        createdAt: { gte: today },
      },
      // Request the maximum value of the tokenNumber column in aggregate
      _max: {
        tokenNumber: true,
      },
    });

    // Extract the max number found, falling back to 0 if no tokens were generated yet today
    const currentMax = maxTokenResult._max.tokenNumber || 0;
    // Increment the max value by 1 to compute the next valid sequential token number
    const nextTokenNumber = currentMax + 1;

    // Insert the new queue token record into the database table
    const newToken = await prisma.queueToken.create({
      // Populate fields with the computed sequential token number and references
      data: {
        tokenNumber: nextTokenNumber,
        patientId,
        doctorId,
        appointmentId: appointmentId || null,
        status: 'WAITING',
      },
      // Include the related patient and doctor models in the returned Prisma payload
      include: {
        patient: true,
        doctor: true,
      },
    });

    // Return a 201 Created response containing the newly created database object
    res.status(201).json({
      message: 'Checked in successfully. Token generated.',
      token: newToken,
    });
  // Handle any database exceptions or unique constraints failures safely
  } catch (error) {
    // Log the error to server standard error output for debug audits
    console.error('Queue check-in error:', error);
    // Return a 500 status code indicating transaction creation failure
    res.status(500).json({ error: 'Check-in failed', details: error.message });
  // Always execute clean up blocks regardless of try block outcomes
  } finally {
    // Release the active doctor mutex lock to unblock subsequent requests in the call stack
    release();
  }
});

// Define a PATCH route handler to update the status of an existing queue token
router.patch('/:id', authenticate, async (req, res) => {
  // Wrap update logic inside a try block to handle database constraint issues
  try {
    // Extract the new status value from the incoming request body
    const { status } = req.body;

    // Validate that a status update parameter was supplied in the payload
    if (!status) {
      // Return a 400 Bad Request error if the status field is missing
      return res.status(400).json({ error: 'Status is required' });
    }

    // Execute the database update query targeting the specific token by primary key id
    const updatedToken = await prisma.queueToken.update({
      // Target target row matching the path ID parameter
      where: { id: req.params.id },
      // Apply the new status payload update
      data: { status },
      // Join and load the associated patient and doctor relation details
      include: {
        patient: true,
        doctor: true,
      },
    });

    // Return the updated queue token database object as a JSON response with status 200
    res.json(updatedToken);
  // Handle any prisma record not found errors or update failures safely
  } catch (error) {
    // Return a 500 Internal Server Error indicating update transaction failed
    res.status(500).json({ error: 'Failed to update queue token', details: error.message });
  }
});

// Export our configured router instance for registration in server's entry index.js routing path
module.exports = router;