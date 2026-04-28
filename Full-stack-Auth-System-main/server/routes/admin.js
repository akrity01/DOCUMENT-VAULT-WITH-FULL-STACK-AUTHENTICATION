import express from 'express';
import { getAllUsers, assignHardToken, toggleUserStatus, getDashboardStats } from '../controllers/adminController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);
router.use(requireAdmin);

router.get('/users', getAllUsers);
router.get('/stats', getDashboardStats);
router.post('/users/:userId/hard-token', assignHardToken);
router.patch('/users/:userId/toggle-status', toggleUserStatus);

export default router;