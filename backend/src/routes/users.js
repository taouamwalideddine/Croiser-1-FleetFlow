import express from 'express';
import { listUsers } from '../controllers/userController.js';
import { authenticate, authorizeAdmin } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate, authorizeAdmin);
router.get('/', listUsers);

export default router;

