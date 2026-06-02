// Import Express to define reports router endpoints
const express = require('express');
// Import PrismaClient to interact with the database
const { PrismaClient } = require('@prisma/client');
// Import authenticate middleware to secure reports queries
const { authenticate } = require('../middleware/auth');

// Create the Express router instance
const router = express.Router();
// Create the Prisma database client
const prisma = new PrismaClient();

// GET /api/reports/doctor-stats - Generate high-level doctor revenue and work stats report (Admin Only)
router.get('/doctor-stats', authenticate, async (req, res) => {
  // Try block to intercept database aggregation failures safely
  try {
    // Construct Date instance matching midnight today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Run 3 aggregation queries concurrently to avoid blocking event loops
    const [doctors, appointmentStats, queueStats] = await Promise.all([
      // Query 1: Fetch list of all registered physicians
      prisma.doctor.findMany(),
      // Query 2: Group appointment metrics by doctor and status
      prisma.appointment.groupBy({
        by: ['doctorId', 'status'],
        _count: { id: true },
      }),
      // Query 3: Group queue token counts for tokens checked in today by doctorId
      prisma.queueToken.groupBy({
        by: ['doctorId'],
        where: { createdAt: { gte: today } },
        _count: { id: true },
      }),
    ]);

    // Build appointment metrics mapping object for O(1) loop lookups
    const apptMap = {};
    for (const row of appointmentStats) {
      // Initialize sub-object matching specific doctorId key if missing
      if (!apptMap[row.doctorId]) apptMap[row.doctorId] = {};
      // Map status count to doctor id reference
      apptMap[row.doctorId][row.status] = row._count.id;
    }

    // Map queue metrics list into O(1) key-value lookup object
    const queueMap = Object.fromEntries(
      queueStats.map((r) => [r.doctorId, r._count.id])
    );

    // Map raw doctor list records into detailed reports objects array
    const reportData = doctors.map((doc) => {
      // Retrieve stats sub-object matching current doctor id
      const stats = apptMap[doc.id] || {};
      // Fetch total completed count or default to 0
      const completed = stats['COMPLETED'] || 0;
      // Aggregate total booking counts by summing up all active statuses
      const total = Object.values(stats).reduce((a, b) => a + b, 0);

      // Return calculated metrics payload
      return {
        id: doc.id,
        name: doc.name,
        specialization: doc.specialization,
        department: doc.department,
        totalAppointments: total,
        completedAppointments: completed,
        cancelledAppointments: stats['CANCELLED'] || 0,
        todayQueueSize: queueMap[doc.id] || 0, // Get count from today's queue map
        revenue: completed * doc.consultationFee, // Calculate revenue from completed consults
      };
    });

    // Return the report details data array to client
    res.json({ success: true, data: reportData });
  // Intercept query failures safely
  } catch (error) {
    // Return a 500 status indicating query aggregation failed
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// Export the configured reports router module
module.exports = router;