const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Asset = sequelize.define('Asset', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  code: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false
  },
  location: {
    type: DataTypes.STRING,
    allowNull: false
  },
  condition: {
    type: DataTypes.ENUM('Excellent', 'Good', 'Fair', 'Poor', 'Broken'),
    defaultValue: 'Good',
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('Operational', 'Issue Reported', 'Under Inspection', 'Under Maintenance', 'Out of Service', 'Retired'),
    defaultValue: 'Operational',
    allowNull: false
  },
  lastServiceDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  nextServiceDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  qrCodeUrl: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  retiredAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
});

module.exports = Asset;
