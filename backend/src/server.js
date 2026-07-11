require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { sequelize, User, Asset, AssetHistory } = require('./models');
const routes = require('./routes');
const QRCode = require('qrcode');

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

app.use(cors());
app.use(express.json());

// Serve static upload folders (for maintenance evidence uploads)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Connect all api endpoints
app.use('/api', routes);

// Base route
app.get('/', (req, res) => {
  res.json({ message: 'MaintainIQ API is running successfully.' });
});

// Seed default database function
const seedDatabase = async () => {
  try {
    // 1. Seed Default Users
    const userCount = await User.count();
    if (userCount === 0) {
      console.log('Seeding default users...');
      await User.create({
        username: 'Admin User',
        email: 'admin@maintainiq.com',
        password: 'admin123',
        role: 'admin'
      });
      await User.create({
        username: 'Tech Pro',
        email: 'tech@maintainiq.com',
        password: 'tech123',
        role: 'technician'
      });
      console.log('Default users seeded successfully (Admin: admin@maintainiq.com, Tech: tech@maintainiq.com).');
    }

    // 2. Seed Default Assets
    const assetCount = await Asset.count();
    if (assetCount === 0) {
      console.log('Seeding 5 default assets...');
      const assetsData = [
        {
          code: 'ASSET-001',
          name: 'Classroom Projector 01',
          category: 'IT / AV Support',
          location: 'Classroom A-101',
          condition: 'Good',
          lastServiceDate: '2026-04-10',
          nextServiceDate: '2026-10-10'
        },
        {
          code: 'ASSET-002',
          name: 'Central AC Unit',
          category: 'HVAC',
          location: 'Rooftop East',
          condition: 'Fair',
          lastServiceDate: '2026-03-15',
          nextServiceDate: '2026-09-15'
        },
        {
          code: 'ASSET-003',
          name: 'Breakroom Refrigerator',
          category: 'Appliance',
          location: 'Staff Lounge',
          condition: 'Excellent',
          lastServiceDate: '2026-05-01',
          nextServiceDate: '2026-11-01'
        },
        {
          code: 'ASSET-004',
          name: 'Main Entrance Smart Lock',
          category: 'Security',
          location: 'Front Lobby',
          condition: 'Good',
          lastServiceDate: '2026-06-12',
          nextServiceDate: '2026-12-12'
        },
        {
          code: 'ASSET-005',
          name: 'Conference Room TV',
          category: 'IT / AV Support',
          location: 'Boardroom 302',
          condition: 'Excellent',
          lastServiceDate: '2026-01-20',
          nextServiceDate: '2026-07-20'
        }
      ];

      for (const item of assetsData) {
        // Generate QR code data URL
        const publicUrl = `${FRONTEND_URL}/public/asset/${item.code}`;
        const qrCodeUrl = await QRCode.toDataURL(publicUrl, {
          errorCorrectionLevel: 'H',
          margin: 2,
          width: 300
        });

        const asset = await Asset.create({
          ...item,
          qrCodeUrl
        });

        // Add history record for creation
        await AssetHistory.create({
          assetId: asset.id,
          action: 'Asset Registered',
          details: `Preloaded asset '${item.name}' during database seeding.`,
          actorName: 'System',
          actorRole: 'System'
        });
      }
      console.log('Seeded 5 default assets successfully.');
    }
  } catch (error) {
    console.error('Failed to seed database:', error);
  }
};

// Sync database and start server
sequelize.sync({ force: false }).then(async () => {
  console.log('SQLite Database synchronized.');
  await seedDatabase();
  
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Failed to sync database:', err);
});
