import express from 'express';
import { summary } from '../controllers/reportController.js';
import { authenticate, authorizeAdmin } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate, authorizeAdmin);
router.get('/summary', summary);

export default router;

