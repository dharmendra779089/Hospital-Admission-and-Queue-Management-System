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
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'https://haqms-frontend.onrender.com',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (e.g. mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    // Allow configured FRONTEND_URL, localhost, or any Render frontend deployment
    if (
      allowedOrigins.some((o) => origin.startsWith(o.replace(/\/$/, ''))) ||
      origin.endsWith('.onrender.com') ||
      process.env.NODE_ENV !== 'production'
    ) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
// Configure preflight HTTP OPTIONS request routing for all paths globally
app.options('*', cors());

// Parse incoming requests containing application/json payloads automatically
app.use(express.json());

// Cloud health check endpoints for Render and uptime monitors
app.get(['/health', '/api/health'], (req, res) => {
  res.status(200).json({ status: 'OK', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// Root API welcome endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    name: 'HAQMS REST API Server',
    status: 'Online',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      doctors: '/api/doctors',
      patients: '/api/patients',
      appointments: '/api/appointments',
      queue: '/api/queue',
      reports: '/api/reports',
    },
  });
});

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