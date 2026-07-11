const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const AssetHistory = sequelize.define('AssetHistory', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  action: {
    type: DataTypes.STRING,
    allowNull: false
  },
  details: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  actorName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  actorRole: {
    type: DataTypes.STRING,
    allowNull: false
  }
});

module.exports = AssetHistory;
