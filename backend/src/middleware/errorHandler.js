// Centralized error handling middleware

export class AppError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (err, req, res, next) => {
  let { statusCode, message } = err;

  // Default to 500 server error
  statusCode = statusCode || 500;
  message = message || 'Internal Server Error';

  // Log error for debugging
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', {
      statusCode,
      message,
      stack: err.stack,
      path: req.path,
      method: req.method
    });
  }

  res.status(statusCode).json({
    success: false,
    status: statusCode,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

// Async handler wrapper to catch errors
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
