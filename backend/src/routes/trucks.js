import express from 'express';
import {
  getTrucks,
  getTruckById,
  createTruck,
  updateTruck,
  deleteTruck,
  updateTruckTracking
} from '../controllers/truckController.js';
import { authenticate, authorizeAdmin } from '../middleware/auth.js';

const router = express.Router();

// All routes below require authentication
router.use(authenticate);

router.get('/', getTrucks);
router.get('/:id', getTruckById);

// Admin-only mutations
router.post('/', authorizeAdmin, createTruck);
router.put('/:id', authorizeAdmin, updateTruck);
router.delete('/:id', authorizeAdmin, deleteTruck);

// Tracking updates (driver or admin)
router.patch('/:id/tracking', updateTruckTracking);

export default router;

