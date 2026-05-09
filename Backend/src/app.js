const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const publicRoutes = require('./routes/publicRoutes');
const adminRoutes = require('./routes/adminRoutes');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const warrantyRoutes = require('./routes/warrantyRoutes');

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

app.get('/', (req, res) => {
  res.json({
    message: 'Emergency QR Backend API is running'
  });
});

app.use('/api/public', publicRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/warranty', warrantyRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;