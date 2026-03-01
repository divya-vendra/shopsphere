// Load environment variables FIRST, before any other imports
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const http      = require('http');
const app       = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

// ── Unhandled promise rejection guard ────────────────────────────────────────
// Catches async errors that slip past all error handlers (e.g. DB query outside
// a request context). Gives the server a chance to finish in-flight requests.
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION:', err.name, err.message);
  console.error(err.stack);
  server.close(() => process.exit(1));
});

// ── Uncaught exception guard ──────────────────────────────────────────────────
// Synchronous errors that weren't caught. Must exit — Node is in an undefined state.
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err.name, err.message);
  console.error(err.stack);
  process.exit(1);
});

// ── Graceful shutdown on SIGTERM (Render / Railway sends this) ────────────────
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated.');
    process.exit(0);
  });
});

const server = http.createServer(app);

// Connect to MongoDB, then start listening
connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════╗
║  ShopSphere API                          ║
║  Environment : ${(process.env.NODE_ENV || 'development').padEnd(26)}║
║  Port        : ${String(PORT).padEnd(26)}║
╚══════════════════════════════════════════╝
    `);
  });
});
