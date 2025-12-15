import express from 'express';
import {
  getTrailers,
  getTrailerById,
  createTrailer,
  updateTrailer,
  deleteTrailer,
  updateTrailerTracking
} from '../controllers/trailerController.js';
import { authenticate, authorizeAdmin } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getTrailers);
router.get('/:id', getTrailerById);

router.post('/', authorizeAdmin, createTrailer);
router.put('/:id', authorizeAdmin, updateTrailer);
router.delete('/:id', authorizeAdmin, deleteTrailer);

router.patch('/:id/tracking', updateTrailerTracking);

export default router;

