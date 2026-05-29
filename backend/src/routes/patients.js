const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorizeAdminOnlyLegacy } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/patients
// FIX: Replaced in-memory pagination with DB-level filtering using skip/take
router.get('/', authenticate, async (req, res) => {
  try {
    const { search, gender, page = 1, limit = 5 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const where = {};

    if (gender && gender !== 'All') {
      where.gender = { equals: gender, mode: 'insensitive' };
    }

    if (search) {
      const q = search.toLowerCase();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { phoneNumber: { contains: q } },
        { email: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [patients, total] = await Promise.all([
      prisma.patient.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.patient.count({ where }),
    ]);

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
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch patients' });
  }
});

// GET /api/patients/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const patient = await prisma.patient.findUnique({
      where: { id: req.params.id },
      include: { appointments: true },
    });

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    res.json(patient);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/patients
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, email, phoneNumber, age, gender, medicalHistory } = req.body;

    if (!name || !phoneNumber || !age || !gender) {
      return res.status(400).json({ error: 'Name, phoneNumber, age, and gender are required.' });
    }

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

    res.status(201).json(patient);
  } catch (error) {
    res.status(500).json({ error: 'Failed to register patient' });
  }
});

// DELETE /api/patients/:id
// FIX: authorizeAdminOnlyLegacy now actually checks for ADMIN role
router.delete('/:id', authenticate, authorizeAdminOnlyLegacy, async (req, res) => {
  try {
    const { id } = req.params;

    const patient = await prisma.patient.findUnique({ where: { id } });
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    await prisma.patient.delete({ where: { id } });
    res.json({ message: `Successfully deleted patient ${patient.name}` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete patient' });
  }
});

module.exports = router;