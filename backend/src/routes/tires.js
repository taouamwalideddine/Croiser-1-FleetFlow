import express from 'express';
import {
  listTires,
  getTire,
  createTire,
  updateTire,
  deleteTire,
  assignTire,
  unassignTire,
  updateTireWear
} from '../controllers/tireController.js';
import { authenticate, authorizeAdmin } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', authorizeAdmin, listTires);
router.get('/:id', authorizeAdmin, getTire);
router.post('/', authorizeAdmin, createTire);
router.put('/:id', authorizeAdmin, updateTire);
router.delete('/:id', authorizeAdmin, deleteTire);
router.patch('/:id/assign', authorizeAdmin, assignTire);
router.patch('/:id/unassign', authorizeAdmin, unassignTire);
router.patch('/:id/wear', authorizeAdmin, updateTireWear);

export default router;

