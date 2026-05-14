const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const publicRoutes = require('./routes/publicRoutes');
const adminRoutes = require('./routes/adminRoutes');
const warrantyRoutes = require('./routes/warrantyRoutes');
const adminWarrantyRoutes = require('./routes/adminWarrantyRoutes');

const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const app = express();

/*
  Security headers.
  Helps protect against common browser-level attacks.
*/
app.use(
  helmet({
    crossOriginResourcePolicy: false
  })
);

/*
  Enable gzip compression.
  Useful when APIs return larger JSON, QR lists, warranty records, etc.
*/
app.use(compression());

/*
  CORS.
  For local development this is open.
  Later in production, restrict this to emergency.tunwal.com.
*/
app.use(
  cors({
    origin: true,
    credentials: true
  })
);

/*
  Body parsers.
  Keep limit small. Your app does not need 10MB JSON payloads.
*/
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

/*
  Request logs.
*/
app.use(morgan('dev'));

/*
  General API rate limiter.
  This protects backend from too many API hits by same IP.
*/
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests. Please try again later.'
  }
});

app.use('/api', apiLimiter);

/*
  Health check route.
*/
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Emergency QR Backend API is running'
  });
});

/*
  API routes.
*/
app.use('/api/public', publicRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/warranty', warrantyRoutes);
app.use('/api/admin/warranty', adminWarrantyRoutes);

/*
  404 + global error handler.
*/
app.use(notFound);
app.use(errorHandler);

module.exports = app;