import { validateEvent } from '../utils/validators.js';
import { AppError } from './errorHandler.js';

export const validateEventRequest = (req, res, next) => {
  try {
    if (!req.body || typeof req.body !== 'object') {
      throw new AppError(400, 'Invalid request body');
    }

    const validation = validateEvent(req.body);

    if (!validation.isValid) {
      throw new AppError(400, validation.errors.join(', '));
    }

    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      console.error('Validation middleware error:', error.message);
      next(new AppError(500, 'Validation failed'));
    }
  }
};
