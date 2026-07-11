const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const MaintenanceRecord = sequelize.define('MaintenanceRecord', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  partsReplaced: {
    type: DataTypes.STRING,
    allowNull: true
  },
  cost: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    allowNull: false,
    validate: {
      min: 0
    }
  },
  inspectionFindings: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  workPerformed: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  finalCondition: {
    type: DataTypes.ENUM('Excellent', 'Good', 'Fair', 'Poor', 'Broken'),
    allowNull: false
  },
  evidenceUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  completedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false
  }
});

module.exports = MaintenanceRecord;
