// Shared singleton PrismaClient instance across all backend routes
const { PrismaClient } = require('@prisma/client');

// Initialize Prisma client with log configuration
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

module.exports = prisma;
