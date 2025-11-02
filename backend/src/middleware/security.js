import rateLimit from 'express-rate-limit';
import { body, validationResult } from 'express-validator';

// Rate limiting middleware
export const createRateLimit = (windowMs = 15 * 60 * 1000, max = 100) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message: 'Too many requests from this IP, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// Input sanitization middleware
export const sanitizeInput = (req, res, next) => {
  const sanitize = (obj) => {
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        // Basic XSS prevention
        obj[key] = obj[key]
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+\s*=/gi, '');
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitize(obj[key]);
      }
    }
  };

  if (req.body) sanitize(req.body);
  if (req.query) sanitize(req.query);
  if (req.params) sanitize(req.params);
  
  next();
};

// Validation middleware
export const validateEvent = [
  body('title').trim().isLength({ min: 1, max: 200 }).escape(),
  body('description').optional().trim().isLength({ max: 1000 }).escape(),
  body('start_time').isISO8601().toDate(),
  body('end_time').isISO8601().toDate(),
  body('location').optional().trim().isLength({ max: 300 }).escape(),
  body('color').optional().matches(/^#[0-9A-F]{6}$/i),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    next();
  }
];

export default {
  createRateLimit,
  sanitizeInput,
  validateEvent
};