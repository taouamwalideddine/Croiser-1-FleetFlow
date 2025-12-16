import express from 'express';
import {
  getJourneys,
  getJourneyById,
  createJourney,
  updateJourneyStatus,
  updateJourneyTracking,
  deleteJourney,
  generateJourneyPDF,
  checkTruckAvailability
} from '../controllers/journeyController.js';
import { authenticate, authorizeAdmin } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getJourneys);
router.get('/:id', getJourneyById);
router.get('/:id/pdf', generateJourneyPDF);
// Apply truck availability check to create and update routes
router.post('/', authorizeAdmin, checkTruckAvailability, createJourney);
router.patch('/:id/status', authorizeAdmin, checkTruckAvailability, updateJourneyStatus);
router.patch('/:id/tracking', updateJourneyTracking);
router.delete('/:id', authorizeAdmin, deleteJourney);

export default router;

