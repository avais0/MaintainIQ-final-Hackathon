const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const assetRoutes = require('./assetRoutes');
const issueRoutes = require('./issueRoutes');
const maintenanceRoutes = require('./maintenanceRoutes');
const aiRoutes = require('./aiRoutes');

router.use('/auth', authRoutes);
router.use('/assets', assetRoutes);
router.use('/issues', issueRoutes);
router.use('/maintenance', maintenanceRoutes);
router.use('/ai', aiRoutes);

module.exports = router;
