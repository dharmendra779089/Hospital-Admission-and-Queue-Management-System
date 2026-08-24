// Import Express to define auth router endpoints
const express = require('express');
// Import bcryptjs for hashing and comparing passwords securely
const bcrypt = require('bcryptjs');
// Import jsonwebtoken to create signed user session tokens
const jwt = require('jsonwebtoken');
// Import PrismaClient to interact with the database
const { PrismaClient } = require('@prisma/client');

// Initialize the Express router instance
const router = express.Router();
// Initialize the Prisma database client
const prisma = new PrismaClient();
// Store the JWT secret loaded from environment variables
const JWT_SECRET = process.env.JWT_SECRET;

// POST /api/auth/register - Register a new user account
router.post('/register', async (req, res) => {
  // Try block to intercept internal server errors during user registration
  try {
    // Destructure required request body fields
    const { email, password, name, role } = req.body;

    // Validate that required fields are supplied in the request body
    if (!email || !password || !name) {
      // Reject registration with 400 Bad Request if validation checks fail
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Verify if an existing user has already registered with the requested email address
    const existingUser = await prisma.user.findUnique({ where: { email } });
    // If the email address is already taken in our system
    if (existingUser) {
      // Return 400 Bad Request error indicating user already exists
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    // Generate a secure bcrypt salt factor for safe password hashing (work factor 10)
    const salt = await bcrypt.genSalt(10);
    // Hash the plaintext password string using the generated salt
    const hashedPassword = await bcrypt.hash(password, salt);

    // Save the new user record inside the database using the mapped parameters
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: role || 'RECEPTIONIST', // Default new accounts to RECEPTIONIST role if unspecified
      },
    });

    // Return a 210 Created status code returning safe fields without sensitive password hashes
    res.status(201).json({
      message: 'User registered successfully',
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  // Handle database exceptions or unexpected internal server errors
  } catch (error) {
    // Log exception stack trace to administrative logs for debugging
    console.error('Registration error:', error);
    // Send 500 status code indicating internal registration execution failure
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// POST /api/auth/login - Authenticate user credentials and return a session token
router.post('/login', async (req, res) => {
  // Try block to intercept exceptions during login credentials validation
  try {
    // Log the incoming email login request for audit checks (avoid logging plaintext passwords)
    console.log(`[AUTH] Login attempt for email: ${req.body.email}`);

    // Destructure the credentials payload from the request body
    const { email, password } = req.body;

    // Validate that both credentials fields are present in the payload
    if (!email || !password) {
      // Reject request with a 400 Bad Request if fields are absent
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Retrieve the user record from the database using their unique email key
    const user = await prisma.user.findUnique({ where: { email } });
    // If no matching user record is found in our database
    if (!user) {
      // Reject with 401 Unauthorized status for security (obscure specific user absence)
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Compare the incoming password attempt with the stored hashed password using bcrypt
    const isMatch = await bcrypt.compare(password, user.password);
    // If the passwords do not match
    if (!isMatch) {
      // Reject with a 401 Unauthorized credentials failure
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Sign a new session token containing user details, expiring in 8 hours for safety
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    // Return the generated session token and user details to the caller
    res.json({
      status: 'success',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
    });
  // Intercept unexpected system exceptions safely
  } catch (error) {
    // Log the error to stdout for debugging audits
    console.error('Login error:', error);
    // Return a clean 500 Internal Server Error without leaking internal server logs
    res.status(500).json({ error: error.message });
  }
});

// GET /api/auth/me - Retrieve profile context of the currently authenticated user
const { authenticate } = require('../middleware/auth');
// Mount request handler securing it with the authenticate JWT middleware
router.get('/me', authenticate, async (req, res) => {
  // Wrap database transaction query in a try block to handle query exceptions
  try {
    // Fetch user details from database using the authenticated user id context
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      // Select only required fields, excluding the hashed password for security
      select: { id: true, email: true, name: true, role: true },
    });

    // If the database record no longer exists
    if (!user) {
      // Return a 404 Not Found error
      return res.status(404).json({ error: 'User not found' });
    }

    // Respond with the clean user profile object and a 200 status code
    res.json(user);
  // Catch database execution exceptions
  } catch (error) {
    // Return a 500 status code indicating database fetch failure
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Export the configured auth router module
module.exports = router;