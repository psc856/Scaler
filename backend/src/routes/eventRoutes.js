import express from 'express';
import {
  getEvents,
  getEvent,
  createEvent,
  updateEvent,
  updateRecurringInstance,
  deleteEvent,
  deleteRecurringInstance,
  checkConflicts,
  bulkDeleteEvents
} from '../controllers/eventController.js';
import { validateEventRequest } from '../middleware/validateRequest.js';

const router = express.Router();

// Event CRUD routes
router.route('/')
  .get(getEvents)
  .post(validateEventRequest, createEvent);

router.route('/bulk-delete')
  .post(bulkDeleteEvents);

router.route('/conflicts')
  .get(checkConflicts);

router.route('/:id')
  .get(getEvent)
  .put(validateEventRequest, updateEvent)
  .delete(deleteEvent);

router.route('/:id/recurring-instance')
  .put(updateRecurringInstance)
  .delete(deleteRecurringInstance);

export default router;
