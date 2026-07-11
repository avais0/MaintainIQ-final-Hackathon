const express = require('express');
const router = express.Router();
const { MaintenanceRecord, Issue, Asset, AssetHistory } = require('../models');
const { authenticate, requireRole } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Config for local file uploads (evidence)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp|mp4|mov/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only images (jpg, png, webp) and videos (mp4, mov) are allowed.'));
  }
});

// POST /api/maintenance (Technician only, logs maintenance)
router.post('/', authenticate, requireRole(['technician', 'admin']), upload.single('evidence'), async (req, res) => {
  try {
    const { issueId, notes, partsReplaced, cost, finalCondition, nextServiceIntervalDays } = req.body;

    if (!issueId || !finalCondition) {
      return res.status(400).json({ error: 'Issue ID and final condition are required.' });
    }

    const parsedCost = parseFloat(cost || 0);
    if (parsedCost < 0) {
      return res.status(400).json({ error: 'Maintenance cost cannot be negative.' });
    }

    const issue = await Issue.findByPk(issueId, {
      include: [{ model: Asset, as: 'asset' }]
    });

    if (!issue) {
      return res.status(404).json({ error: 'Issue not found.' });
    }

    if (req.user.role === 'technician' && issue.technicianId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden. You are not assigned to this issue.' });
    }

    // Determine evidence URL/path if uploaded
    let evidenceUrl = null;
    if (req.file) {
      evidenceUrl = `/uploads/${req.file.filename}`;
    }

    // Create the Maintenance Record
    const record = await MaintenanceRecord.create({
      issueId,
      technicianId: req.user.id,
      notes,
      partsReplaced,
      cost: parsedCost,
      finalCondition,
      evidenceUrl
    });

    // Update Issue status to Resolved
    issue.status = 'Resolved';
    await issue.save();

    // Update Asset status & service dates
    const asset = issue.asset;
    if (asset) {
      asset.status = 'Operational';
      asset.condition = finalCondition;
      asset.lastServiceDate = new Date(); // Set to today

      // Project next service date
      const intervalDays = parseInt(nextServiceIntervalDays || 180, 10); // Default to 6 months
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + intervalDays);
      asset.nextServiceDate = nextDate;

      await asset.save();
    }

    // Record Asset History
    await AssetHistory.create({
      assetId: issue.assetId,
      issueId: issue.id,
      maintenanceRecordId: record.id,
      action: 'Maintenance Completed',
      details: `Maintenance recorded. Parts: ${partsReplaced || 'None'}, Cost: Rs. ${parsedCost.toFixed(2)}, Final Asset Condition: ${finalCondition}.`,
      actorName: req.user.username,
      actorRole: req.user.role
    });

    res.status(201).json(record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
