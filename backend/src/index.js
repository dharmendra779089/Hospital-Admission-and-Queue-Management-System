// Import the Express framework to set up the HTTP API server
const express = require('express');
// Import the CORS middleware to handle Cross-Origin Resource Sharing rules
const cors = require('cors');
// Load environment variables from a local .env file into process.env
require('dotenv').config();
// Import the authentication route handlers (registration, login, profile)
const authRoutes = require('./routes/auth');
// Import the physician registry route handlers (filtering, staff stats)
const doctorRoutes = require('./routes/doctors');
// Import the patient registry route handlers (lookup directory, creation, deletion)
const patientRoutes = require('./routes/patients');
// Import the appointment booking route handlers (scheduling, slots, status updates)
const appointmentRoutes = require('./routes/appointments');
// Import the queue calling board route handlers (check-ins, token updates)
const queueRoutes = require('./routes/queue');
// Import the system-wide operations reports route handlers (revenue audits)
const reportRoutes = require('./routes/reports');

// Instantiate the Express application
const app = express();
// Configure the active port from process.env, defaulting to 5000 in dev
const PORT = process.env.PORT || 5000;

// Enable CORS requests with dynamic configuration mapping
app.use(cors({
  // Only permit incoming requests from the configured frontend URL origin
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  // Allow client requests to transmit cookie credentials or HTTP auth headers
  credentials: true,
  // List permitted HTTP request methods for standard interactions
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  // List permitted HTTP header keys client-side scripts can attach
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
// Configure preflight HTTP OPTIONS request routing for all paths globally
app.options('*', cors());

// Parse incoming requests containing application/json payloads automatically
app.use(express.json());

// Register API base paths to route handler modules
app.use('/api/auth', authRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/reports', reportRoutes);

// Register a global error fallback middleware handler
app.use((err, req, res, next) => {
  // Print stack traces to stdout for administrative logs
  console.error(err.stack);
  // Send 500 Internal Server Error back to client, selectively attaching trace stack details in dev mode
  res.status(500).json({
    error: 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// Boot the server to listen for active connections on the configured port
app.listen(PORT, () => {
  console.log(`HAQMS BACKEND SERVER IS RUNNING ON PORT ${PORT}`);
});