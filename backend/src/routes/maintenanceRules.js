import express from 'express';
import { listRules, createRule, updateRule, deleteRule, upcomingMaintenance } from '../controllers/maintenanceRuleController.js';
import { authenticate, authorizeAdmin } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate, authorizeAdmin);

router.get('/', listRules);
router.post('/', createRule);
router.put('/:id', updateRule);
router.delete('/:id', deleteRule);
router.get('/upcoming/all', upcomingMaintenance);

export default router;

