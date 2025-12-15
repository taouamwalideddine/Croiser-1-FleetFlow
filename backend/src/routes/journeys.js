import express from 'express';
import {
  getJourneys,
  getJourneyById,
  createJourney,
  updateJourneyStatus,
  updateJourneyTracking,
  deleteJourney
} from '../controllers/journeyController.js';
import { authenticate, authorizeAdmin } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getJourneys);
router.get('/:id', getJourneyById);
router.post('/', authorizeAdmin, createJourney);
router.patch('/:id/status', updateJourneyStatus);
router.patch('/:id/tracking', updateJourneyTracking);
router.delete('/:id', authorizeAdmin, deleteJourney);

export default router;

