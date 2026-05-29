const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/reports/doctor-stats
// FIX: Replaced sequential nested loop with parallel groupBy queries
// Went from O(n * 5) DB calls to O(3) total — massive speedup
router.get('/doctor-stats', authenticate, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Run all 3 queries in parallel
    const [doctors, appointmentStats, queueStats] = await Promise.all([
      prisma.doctor.findMany(),
      prisma.appointment.groupBy({
        by: ['doctorId', 'status'],
        _count: { id: true },
      }),
      prisma.queueToken.groupBy({
        by: ['doctorId'],
        where: { createdAt: { gte: today } },
        _count: { id: true },
      }),
    ]);

    // Build lookup maps for O(1) access
    const apptMap = {};
    for (const row of appointmentStats) {
      if (!apptMap[row.doctorId]) apptMap[row.doctorId] = {};
      apptMap[row.doctorId][row.status] = row._count.id;
    }

    const queueMap = Object.fromEntries(
      queueStats.map((r) => [r.doctorId, r._count.id])
    );

    const reportData = doctors.map((doc) => {
      const stats = apptMap[doc.id] || {};
      const completed = stats['COMPLETED'] || 0;
      const total = Object.values(stats).reduce((a, b) => a + b, 0);

      return {
        id: doc.id,
        name: doc.name,
        specialization: doc.specialization,
        department: doc.department,
        totalAppointments: total,
        completedAppointments: completed,
        cancelledAppointments: stats['CANCELLED'] || 0,
        todayQueueSize: queueMap[doc.id] || 0,
        revenue: completed * doc.consultationFee,
      };
    });

    res.json({ success: true, data: reportData });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

module.exports = router;