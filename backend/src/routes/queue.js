const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/queue — PUBLIC (no auth, used by live monitor board)
router.get('/', async (req, res) => {
  try {
    const { doctorId, status } = req.query;

    const where = {};
    if (doctorId) where.doctorId = doctorId;
    if (status) where.status = status;

    const tokens = await prisma.queueToken.findMany({
      where,
      include: {
        patient: true,
        doctor: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    res.json(tokens);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve queue', details: error.message });
  }
});

// In-memory locks map to prevent duplicate queue token allocation concurrently
const checkInLocks = new Map();

async function acquireLock(doctorId) {
  while (checkInLocks.has(doctorId)) {
    await checkInLocks.get(doctorId);
  }
  let resolveLock;
  const promise = new Promise((resolve) => {
    resolveLock = resolve;
  });
  checkInLocks.set(doctorId, promise);
  return () => {
    checkInLocks.delete(doctorId);
    resolveLock();
  };
}

// POST /api/queue/checkin
router.post('/checkin', authenticate, async (req, res) => {
  const { patientId, doctorId, appointmentId } = req.body;

  if (!patientId || !doctorId) {
    return res.status(400).json({ error: 'Patient and Doctor ID are required for check-in.' });
  }

  const release = await acquireLock(doctorId);
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const maxTokenResult = await prisma.queueToken.aggregate({
      where: {
        doctorId,
        createdAt: { gte: today },
      },
      _max: {
        tokenNumber: true,
      },
    });

    const currentMax = maxTokenResult._max.tokenNumber || 0;
    const nextTokenNumber = currentMax + 1;

    const newToken = await prisma.queueToken.create({
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

    res.status(201).json({
      message: 'Checked in successfully. Token generated.',
      token: newToken,
    });
  } catch (error) {
    console.error('Queue check-in error:', error);
    res.status(500).json({ error: 'Check-in failed', details: error.message });
  } finally {
    release();
  }
});

// PATCH /api/queue/:id
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
    res.status(500).json({ error: 'Failed to update queue token', details: error.message });
  }
});

module.exports = router;