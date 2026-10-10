import { Router } from 'express';
import authRoutes from './authRoutes.js';
import membersRoutes from './membersRoutes.js';
import leadershipRoutes from './leadershipRoutes.js';
import paymentsRoutes from './paymentsRoutes.js';
import projectsRoutes from './projectsRoutes.js';
import categoriesRoutes from './categoriesRoutes.js';
import configRoutes from './configRoutes.js';
import reportsRoutes from './reportsRoutes.js';
import eventsRoutes from './eventsRoutes.js';
import newsRoutes from './newsRoutes.js';
import galleryRoutes from './galleryRoutes.js';
import messagesRoutes from './messagesRoutes.js';
import uploadRoutes from './uploadRoutes.js';

const router = Router();

// Route Mount Points
router.use('/auth', authRoutes);
router.use('/members', membersRoutes);
router.use('/leadership', leadershipRoutes);
router.use('/payments', paymentsRoutes);
router.use('/projects', projectsRoutes);
router.use('/categories', categoriesRoutes);
router.use('/config', configRoutes);
router.use('/reports', reportsRoutes);
router.use('/events', eventsRoutes);
router.use('/news', newsRoutes);
router.use('/gallery', galleryRoutes);
router.use('/messages', messagesRoutes);
router.use('/upload', uploadRoutes);

// API Root Index Info
router.get('/', (req, res) => {
  res.json({
    name: 'CIC Enugu 1995 Alumni Association REST API',
    set: 'CIC-ENUGU-25-SET',
    motto: 'Semper Fidelis',
    version: '1.0.0',
    status: 'online',
    timestamp: new Date().toISOString()
  });
});

export default router;
