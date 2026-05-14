const errorHandler = (err, req, res, next) => {
  console.error('GLOBAL ERROR:', {
    message: err.message,
    stack: err.stack,
    path: req.originalUrl,
    method: req.method
  });

  return res.status(err.statusCode || 500).json({
    success: false,
    message:
      process.env.NODE_ENV === 'production'
        ? 'Something went wrong. Please try again.'
        : err.message
  });
};

module.exports = errorHandler;