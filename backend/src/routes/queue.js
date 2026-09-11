// Import the Express library to create route handlers
const express = require('express');
// Import shared PrismaClient singleton instance
const prisma = require('../prisma');
// Import the authenticate middleware to secure protected routes
const { authenticate } = require('../middleware/auth');

// Create a new Express router instance for our queue API endpoints
const router = express.Router();

// Define a public GET route handler to retrieve today's active queue tokens (used by live monitor board)
router.get('/', async (req, res) => {
  try {
    // Destructure doctorId and status from the incoming query parameters
    const { doctorId, status } = req.query;

    // Calculate midnight UTC for today to scope live queue queries
    const now = new Date();
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));

    // Initialize dynamic SQL WHERE filtering clause scoped to today's operations
    const where = {
      createdAt: { gte: today },
    };

    // If a doctorId parameter is supplied, add it to the filter criteria
    if (doctorId) where.doctorId = doctorId;

    // If a status filter parameter is supplied, use it; otherwise default to active queue tokens
    if (status) {
      where.status = status;
    } else {
      where.status = { in: ['WAITING', 'CALLING'] };
    }

    // Fetch matching queue tokens using PrismaClient sorted by creation timestamp ascending
    const tokens = await prisma.queueToken.findMany({
      where,
      include: {
        patient: true,
        doctor: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Send the retrieved queue token array back as a JSON response with status 200
    res.json(tokens);
  } catch (error) {
    console.error('Failed to retrieve queue:', error);
    res.status(500).json({ error: 'Failed to retrieve active token queue' });
  }
});

// Define a POST route handler to safely register and check-in a patient using an atomic DB transaction
router.post('/checkin', authenticate, async (req, res) => {
  const { patientId, doctorId, appointmentId } = req.body;

  // Validate that both required identifiers exist in the request body
  if (!patientId || !doctorId) {
    return res.status(400).json({ error: 'Patient and Doctor ID are required for check-in.' });
  }

  try {
    // Execute token calculation and record creation inside an atomic Prisma database transaction
    const newToken = await prisma.$transaction(async (tx) => {
      const now = new Date();
      const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));

      // Compute current max token number for this physician today
      const maxTokenResult = await tx.queueToken.aggregate({
        where: {
          doctorId,
          createdAt: { gte: today },
        },
        _max: {
          tokenNumber: true,
        },
      });

      const nextTokenNumber = (maxTokenResult._max.tokenNumber || 0) + 1;

      // Create new waiting token record
      const token = await tx.queueToken.create({
        data: {
          tokenNumber: nextTokenNumber,
          patientId,
          doctorId,
          appointmentId: appointmentId || null,
          status: 'WAITING',
        },
        include: {
          patient: true,
          doctor: true,
        },
      });

      // If an existing appointment is associated with this check-in, update status to CHECKED_IN
      if (appointmentId) {
        await tx.appointment.update({
          where: { id: appointmentId },
          data: { status: 'CHECKED_IN' },
        });
      }

      return token;
    });

    res.status(201).json({
      message: 'Checked in successfully. Token generated.',
      token: newToken,
    });
  } catch (error) {
    console.error('Queue check-in transaction error:', error);
    res.status(500).json({ error: 'Check-in transaction failed' });
  }
});

// Define a PATCH route handler to update the status of an existing queue token
router.patch('/:id', authenticate, async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const updatedToken = await prisma.queueToken.update({
      where: { id: req.params.id },
      data: { status },
      include: {
        patient: true,
        doctor: true,
      },
    });

    res.json(updatedToken);
  } catch (error) {
    console.error('Failed to update queue token:', error);
    res.status(500).json({ error: 'Failed to update queue token' });
  }
});

module.exports = router;