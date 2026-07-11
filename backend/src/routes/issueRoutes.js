const express = require('express');
const router = express.Router();
const { Issue, Asset, User, AssetHistory, MaintenanceRecord } = require('../models');
const { authenticate, requireRole } = require('../middleware/auth');
const { Op } = require('sequelize');

// Helper to generate next sequential Issue Number
const getNextIssueNumber = async () => {
  try {
    const lastIssue = await Issue.findOne({
      order: [['createdAt', 'DESC']]
    });
    if (!lastIssue) return 'REQ-1001';
    
    const numPart = lastIssue.issueNumber.split('-')[1];
    const nextNum = parseInt(numPart, 10) + 1;
    return `REQ-${nextNum}`;
  } catch (error) {
    return 'REQ-' + Math.floor(1000 + Math.random() * 9000);
  }
};

// GET /api/issues (Admin & Technician, with filter/search)
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, priority, category, technicianId } = req.query;
    const where = {};

    // Technicians see only their assigned issues, Admins see all
    if (req.user.role === 'technician') {
      where.technicianId = req.user.id;
    } else if (technicianId) {
      where.technicianId = technicianId;
    }

    if (status) {
      where.status = status;
    }
    if (priority) {
      where.priority = priority;
    }
    if (category) {
      where.category = category;
    }

    const issues = await Issue.findAll({
      where,
      include: [
        { model: Asset, as: 'asset', attributes: ['id', 'code', 'name', 'location'] },
        { model: User, as: 'technician', attributes: ['id', 'username', 'email'] }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json(issues);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/issues/:issueNumber (Auth required)
router.get('/:issueNumber', authenticate, async (req, res) => {
  try {
    const { issueNumber } = req.params;
    const issue = await Issue.findOne({
      where: { issueNumber },
      include: [
        { model: Asset, as: 'asset' },
        { model: User, as: 'technician', attributes: ['id', 'username', 'email'] },
        { 
          model: MaintenanceRecord, 
          as: 'maintenanceRecords',
          include: [{ model: User, as: 'technician', attributes: ['id', 'username'] }]
        }
      ]
    });

    if (!issue) {
      return res.status(404).json({ error: 'Issue not found.' });
    }

    // Technician restriction: can only view their own assigned issues unless they are admin
    if (req.user.role === 'technician' && issue.technicianId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden. You can only access assigned issues.' });
    }

    res.json(issue);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/issues (Public endpoint, reporting issue)
router.post('/', async (req, res) => {
  try {
    const { assetId, title, description, priority, category, reporterName, reporterEmail, aiSuggestedFields } = req.body;

    if (!assetId || !title || !description || !reporterName || !reporterEmail) {
      return res.status(400).json({ error: 'Asset, title, description, and reporter information are required.' });
    }

    const asset = await Asset.findByPk(assetId);
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found.' });
    }

    if (asset.status === 'Retired') {
      return res.status(400).json({ error: 'Cannot report issues against a retired asset.' });
    }

    const issueNumber = await getNextIssueNumber();

    const issue = await Issue.create({
      issueNumber,
      assetId,
      title,
      description,
      priority: priority || 'Medium',
      category: category || asset.category || 'General',
      status: 'Reported',
      reporterName,
      reporterEmail,
      aiSuggestedFields
    });

    // Update asset status to "Issue Reported"
    asset.status = 'Issue Reported';
    await asset.save();

    // Create history logs
    await AssetHistory.create({
      assetId: asset.id,
      issueId: issue.id,
      action: 'Issue Reported',
      details: `Issue ${issueNumber} (${title}) reported by ${reporterName}.`,
      actorName: reporterName,
      actorRole: 'Reporter'
    });

    res.status(201).json(issue);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/issues/:id/assign (Admin only, assign to technician)
router.put('/:id/assign', authenticate, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { technicianId } = req.body;

    const issue = await Issue.findByPk(id, {
      include: [{ model: Asset, as: 'asset' }]
    });
    if (!issue) {
      return res.status(404).json({ error: 'Issue not found.' });
    }

    if (technicianId) {
      const technician = await User.findByPk(technicianId);
      if (!technician || technician.role !== 'technician') {
        return res.status(400).json({ error: 'Invalid technician selected.' });
      }

      issue.technicianId = technicianId;
      issue.status = 'Assigned';
      await issue.save();

      // Log history
      await AssetHistory.create({
        assetId: issue.assetId,
        issueId: issue.id,
        action: 'Issue Assigned',
        details: `Issue assigned to technician ${technician.username}.`,
        actorName: req.user.username,
        actorRole: req.user.role
      });
    } else {
      // Unassign
      issue.technicianId = null;
      issue.status = 'Reported';
      await issue.save();
    }

    res.json(issue);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/issues/:id/status (Enforces roles and workflows)
router.put('/:id/status', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const issue = await Issue.findByPk(id, {
      include: [{ model: Asset, as: 'asset' }]
    });
    
    if (!issue) {
      return res.status(404).json({ error: 'Issue not found.' });
    }

    // Role-based restrictions
    if (req.user.role === 'technician' && issue.technicianId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden. You can only update issues assigned to you.' });
    }

    // Allowed status transitions
    const validStatuses = ['Reported', 'Assigned', 'Inspection Started', 'Maintenance In Progress', 'Waiting for Parts', 'Resolved', 'Closed', 'Reopened'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status value: ${status}` });
    }

    // Closed issue restriction
    if (issue.status === 'Closed' && status !== 'Reopened' && req.user.role !== 'admin') {
      return res.status(400).json({ error: 'Closed issues cannot be modified. Reopen the issue first.' });
    }

    const previousStatus = issue.status;
    issue.status = status;
    await issue.save();

    // Adjust Asset status based on business rules
    const asset = issue.asset;
    if (asset) {
      let newAssetStatus = asset.status;
      
      if (status === 'Inspection Started') {
        newAssetStatus = 'Under Inspection';
      } else if (status === 'Maintenance In Progress') {
        newAssetStatus = 'Under Maintenance';
      } else if (status === 'Resolved' || status === 'Closed') {
        // Check if there are other open/unresolved issues for this asset
        const unresolvedCount = await Issue.count({
          where: {
            assetId: asset.id,
            status: { [Op.notIn]: ['Resolved', 'Closed'] },
            id: { [Op.ne]: issue.id }
          }
        });
        newAssetStatus = unresolvedCount > 0 ? 'Issue Reported' : 'Operational';
      } else if (status === 'Reopened') {
        newAssetStatus = 'Issue Reported';
      }

      if (newAssetStatus !== asset.status) {
        asset.status = newAssetStatus;
        await asset.save();
      }
    }

    // Create history record
    await AssetHistory.create({
      assetId: issue.assetId,
      issueId: issue.id,
      action: `Status Update: ${status}`,
      details: `Issue status changed from '${previousStatus}' to '${status}'.`,
      actorName: req.user.username,
      actorRole: req.user.role
    });

    res.json(issue);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
