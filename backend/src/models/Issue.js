const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Issue = sequelize.define('Issue', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  issueNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  priority: {
    type: DataTypes.ENUM('Low', 'Medium', 'High', 'Critical'),
    defaultValue: 'Medium',
    allowNull: false
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('Reported', 'Assigned', 'Inspection Started', 'Maintenance In Progress', 'Waiting for Parts', 'Resolved', 'Closed', 'Reopened'),
    defaultValue: 'Reported',
    allowNull: false
  },
  reporterName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  reporterEmail: {
    type: DataTypes.STRING,
    allowNull: false
  },
  aiSuggestedFields: {
    type: DataTypes.JSON, // Stores the AI triage fields: title, category, priority, possibleCauses, initialChecks, and userEdited flags
    allowNull: true
  }
});

module.exports = Issue;
