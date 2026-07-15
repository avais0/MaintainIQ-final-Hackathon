const express = require('express');
const router = express.Router();
const { Asset, AssetHistory, Issue } = require('../models');
const { authenticate, requireRole } = require('../middleware/auth');
const QRCode = require('qrcode');
const { Op } = require('sequelize');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Generate QR Code data URL for an asset code
const generateQRCode = async (code) => {
  try {
    const publicUrl = `${FRONTEND_URL}/public/asset/${code}`;
    return await QRCode.toDataURL(publicUrl, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 300
    });
  } catch (err) {
    console.error('Error generating QR code', err);
    return null;
  }
};

// GET /api/assets (Admin & Technician, search/filter)
router.get('/', authenticate, requireRole(['admin', 'technician']), async (req, res) => {
  try {
    const { search, status, category, location } = req.query;
    const where = {};

    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { code: { [Op.like]: `%${search}%` } }
      ];
    }
    if (status) {
      where.status = status;
    }
    if (category) {
      where.category = category;
    }
    if (location) {
      where.location = location;
    }

    const assets = await Asset.findAll({
      where,
      order: [['createdAt', 'DESC']]
    });

    // Determine dynamic FRONTEND_URL from request origin/referer
    let dynamicFrontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const origin = req.headers.origin;
    const referer = req.headers.referer;
    
    if (origin) {
      dynamicFrontendUrl = origin;
    } else if (referer) {
      try {
        const parsedReferer = new URL(referer);
        dynamicFrontendUrl = parsedReferer.origin;
      } catch (e) {}
    }

    // Generate dynamic QR Codes on-the-fly for list view
    const mappedAssets = await Promise.all(assets.map(async (asset) => {
      let dynamicQrCode = asset.qrCodeUrl;
      try {
        const publicUrl = `${dynamicFrontendUrl}/public/asset/${asset.code}`;
        dynamicQrCode = await QRCode.toDataURL(publicUrl, {
          errorCorrectionLevel: 'H',
          margin: 2,
          width: 300
        });
      } catch (e) {}
      
      return {
        ...asset.toJSON(),
        qrCodeUrl: dynamicQrCode
      };
    }));

    res.json(mappedAssets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/assets/public/:code (Publicly accessible, safe details only)
router.get('/public/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const asset = await Asset.findOne({
      where: { code },
      include: [
        {
          model: AssetHistory,
          as: 'history',
          attributes: ['id', 'action', 'details', 'createdAt'],
          order: [['createdAt', 'DESC']],
          limit: 10
        }
      ]
    });

    if (!asset) {
      return res.status(404).json({ error: 'Asset not found.' });
    }

    // Determine dynamic FRONTEND_URL from request origin/referer
    let dynamicFrontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const origin = req.headers.origin;
    const referer = req.headers.referer;
    
    if (origin) {
      dynamicFrontendUrl = origin;
    } else if (referer) {
      try {
        const parsedReferer = new URL(referer);
        dynamicFrontendUrl = parsedReferer.origin;
      } catch (e) {}
    }

    // Generate dynamic QR Code on-the-fly to guarantee correctness
    let dynamicQrCode = asset.qrCodeUrl;
    try {
      const publicUrl = `${dynamicFrontendUrl}/public/asset/${asset.code}`;
      dynamicQrCode = await QRCode.toDataURL(publicUrl, {
        errorCorrectionLevel: 'H',
        margin: 2,
        width: 300
      });
    } catch (qrErr) {
      console.error('Error generating dynamic QR code on the fly:', qrErr);
    }

    // Expose only safe information
    const safeAsset = {
      id: asset.id,
      code: asset.code,
      name: asset.name,
      category: asset.category,
      location: asset.location,
      condition: asset.condition,
      status: asset.status,
      lastServiceDate: asset.lastServiceDate,
      nextServiceDate: asset.nextServiceDate,
      qrCodeUrl: dynamicQrCode,
      retiredAt: asset.retiredAt,
      // Provide clean activity timeline without technician or cost details
      history: asset.history.map(h => ({
        id: h.id,
        action: h.action,
        details: h.details,
        createdAt: h.createdAt
      }))
    };

    res.json(safeAsset);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/assets (Admin only, create asset)
router.post('/', authenticate, requireRole(['admin']), async (req, res) => {
  try {
    const { code, name, category, location, condition, lastServiceDate, nextServiceDate } = req.body;
    
    if (!code || !name || !category || !location) {
      return res.status(400).json({ error: 'Asset code, name, category, and location are required.' });
    }

    // Duplicate asset code check
    const existingAsset = await Asset.findOne({ where: { code } });
    if (existingAsset) {
      return res.status(400).json({ error: 'An asset with this code already exists.' });
    }

    // Generate Base64 QR code representation
    const qrCodeUrl = await generateQRCode(code);

    const asset = await Asset.create({
      code,
      name,
      category,
      location,
      condition: condition || 'Good',
      status: 'Operational',
      lastServiceDate,
      nextServiceDate,
      qrCodeUrl
    });

    // Create history record
    await AssetHistory.create({
      assetId: asset.id,
      action: 'Asset Registered',
      details: `Asset '${name}' registered with code ${code}.`,
      actorName: req.user.username,
      actorRole: req.user.role
    });

    res.status(201).json(asset);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/assets/:id (Admin only, update asset)
router.put('/:id', authenticate, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, location, condition, status, lastServiceDate, nextServiceDate } = req.body;

    const asset = await Asset.findByPk(id);
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found.' });
    }

    // Capture changes for logs
    const changes = [];
    if (name && name !== asset.name) {
      changes.push(`name to '${name}'`);
      asset.name = name;
    }
    if (category && category !== asset.category) {
      changes.push(`category to '${category}'`);
      asset.category = category;
    }
    if (location && location !== asset.location) {
      changes.push(`location to '${location}'`);
      asset.location = location;
    }
    if (condition && condition !== asset.condition) {
      changes.push(`condition to '${condition}'`);
      asset.condition = condition;
    }
    if (status && status !== asset.status) {
      changes.push(`status to '${status}'`);
      asset.status = status;
      if (status === 'Retired') {
        asset.retiredAt = new Date();
      } else {
        asset.retiredAt = null;
      }
    }
    if (lastServiceDate !== undefined) {
      asset.lastServiceDate = lastServiceDate;
    }
    if (nextServiceDate !== undefined) {
      asset.nextServiceDate = nextServiceDate;
    }

    await asset.save();

    if (changes.length > 0) {
      await AssetHistory.create({
        assetId: asset.id,
        action: 'Asset Updated',
        details: `Updated ${changes.join(', ')}.`,
        actorName: req.user.username,
        actorRole: req.user.role
      });
    }

    res.json(asset);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/assets/:id (Admin only, retires/removes asset)
router.delete('/:id', authenticate, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const asset = await Asset.findByPk(id);
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found.' });
    }

    // Set asset to Retired instead of hard delete to preserve history
    asset.status = 'Retired';
    asset.retiredAt = new Date();
    await asset.save();

    await AssetHistory.create({
      assetId: asset.id,
      action: 'Asset Retired',
      details: 'Asset has been permanently retired.',
      actorName: req.user.username,
      actorRole: req.user.role
    });

    res.json({ message: 'Asset retired successfully', asset });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
