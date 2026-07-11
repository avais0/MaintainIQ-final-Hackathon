const sequelize = require('../config/db');
const User = require('./User');
const Asset = require('./Asset');
const Issue = require('./Issue');
const MaintenanceRecord = require('./MaintenanceRecord');
const AssetHistory = require('./AssetHistory');

// Asset <-> Issue
Asset.hasMany(Issue, { foreignKey: 'assetId', as: 'issues' });
Issue.belongsTo(Asset, { foreignKey: 'assetId', as: 'asset' });

// Asset <-> AssetHistory
Asset.hasMany(AssetHistory, { foreignKey: 'assetId', as: 'history' });
AssetHistory.belongsTo(Asset, { foreignKey: 'assetId', as: 'asset' });

// User (Technician) <-> Issue
User.hasMany(Issue, { foreignKey: 'technicianId', as: 'assignedIssues' });
Issue.belongsTo(User, { foreignKey: 'technicianId', as: 'technician' });

// Issue <-> MaintenanceRecord
Issue.hasMany(MaintenanceRecord, { foreignKey: 'issueId', as: 'maintenanceRecords' });
MaintenanceRecord.belongsTo(Issue, { foreignKey: 'issueId', as: 'issue' });

// User (Technician) <-> MaintenanceRecord
User.hasMany(MaintenanceRecord, { foreignKey: 'technicianId', as: 'records' });
MaintenanceRecord.belongsTo(User, { foreignKey: 'technicianId', as: 'technician' });

// AssetHistory links (optional)
Issue.hasMany(AssetHistory, { foreignKey: 'issueId', as: 'historyLogs' });
AssetHistory.belongsTo(Issue, { foreignKey: 'issueId', as: 'issue' });

MaintenanceRecord.hasMany(AssetHistory, { foreignKey: 'maintenanceRecordId', as: 'historyLogs' });
AssetHistory.belongsTo(MaintenanceRecord, { foreignKey: 'maintenanceRecordId', as: 'maintenanceRecord' });

module.exports = {
  sequelize,
  User,
  Asset,
  Issue,
  MaintenanceRecord,
  AssetHistory
};
