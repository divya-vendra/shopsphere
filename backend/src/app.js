const express        = require('express');
const helmet         = require('helmet');
const cors           = require('cors');
const morgan         = require('morgan');
const rateLimit      = require('express-rate-limit');
const mongoSanitize  = require('express-mongo-sanitize');
const xssClean       = require('xss-clean');
const hpp            = require('hpp');
const cookieParser   = require('cookie-parser');
const compression    = require('compression');

const globalErrorHandler = require('./middleware/error.middleware');
const AppError           = require('./utils/AppError');

// ── Route imports ──────────────────────────────────────────────────────────────
const authRoutes     = require('./routes/auth.routes');
const userRoutes     = require('./routes/user.routes');
const productRoutes  = require('./routes/product.routes');
const cartRoutes     = require('./routes/cart.routes');
const orderRoutes    = require('./routes/order.routes');
const paymentRoutes  = require('./routes/payment.routes');
const reviewRoutes   = require('./routes/review.routes');
const wishlistRoutes = require('./routes/wishlist.routes');
const adminRoutes    = require('./routes/admin.routes');

const app = express();

// ── CORS ───────────────────────────────────────────────────────────────────────
// Whitelist only our frontend origin. In production, set CLIENT_URL to the
// deployed Vercel domain.
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (server-to-server, Postman, mobile apps)
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error(`CORS policy: ${origin} is not allowed.`));
  },
  credentials: true, // Allow cookies (refresh token) to be sent cross-origin
}));

// ── Gzip compression ──────────────────────────────────────────────────────────
// Compresses all responses > 1 KB. Reduces payload by ~70% for JSON.
// Must come before route handlers so the response stream is compressed.
app.use(compression({ level: 6, threshold: 1024 }));

// ── Security HTTP headers (helmet) ────────────────────────────────────────────
app.use(helmet());

// ── Stripe webhook — MUST be raw body BEFORE express.json() ──────────────────
// Stripe requires the raw Buffer to verify the webhook signature.
// If express.json() runs first, the body is already parsed and verification fails.
app.use(
  '/api/v1/payments/webhook',
  express.raw({ type: 'application/json' })
);

// ── Body parsers ───────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));       // cap payload size
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// ── Request logging ────────────────────────────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ── Rate limiting ──────────────────────────────────────────────────────────────
// Global limiter — 200 requests per 15 minutes per IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      200,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { status: 'fail', message: 'Too many requests. Please try again in 15 minutes.' },
});

// Tighter limiter on auth routes to slow brute-force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      20,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { status: 'fail', message: 'Too many login attempts. Please try again in 15 minutes.' },
});

app.use('/api', globalLimiter);
app.use('/api/v1/auth', authLimiter);

// ── Data sanitization ─────────────────────────────────────────────────────────
// mongoSanitize: strips $ and . from req.body/query/params → prevents NoSQL injection
// xssClean: sanitises HTML characters in user input → prevents stored XSS
// hpp: removes duplicate query string parameters → prevents HTTP parameter pollution
app.use(mongoSanitize());
app.use(xssClean());
app.use(hpp({
  // Allow these fields to appear multiple times in query strings (for filtering)
  whitelist: ['price', 'ratings', 'category'],
}));

// ── Health check ───────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', env: process.env.NODE_ENV, timestamp: new Date().toISOString() });
});

// ── API routes ─────────────────────────────────────────────────────────────────
app.use('/api/v1/auth',      authRoutes);
app.use('/api/v1/users',     userRoutes);
app.use('/api/v1/products',  productRoutes);
app.use('/api/v1/cart',      cartRoutes);
app.use('/api/v1/orders',    orderRoutes);
app.use('/api/v1/payments',  paymentRoutes);
app.use('/api/v1/reviews',   reviewRoutes);
app.use('/api/v1/wishlist',  wishlistRoutes);
app.use('/api/v1/admin',     adminRoutes);

// ── 404 handler ────────────────────────────────────────────────────────────────
// Catches any unmatched route and converts it to an AppError.
app.all('*', (req, res, next) => {
  next(new AppError(`Cannot find ${req.method} ${req.originalUrl} on this server.`, 404));
});

// ── Global error handler ───────────────────────────────────────────────────────
// Must be the LAST middleware registered.
app.use(globalErrorHandler);

module.exports = app;
