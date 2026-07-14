const { Sequelize } = require('sequelize');
const path = require('path');

const storagePath = process.env.VERCEL 
  ? '/tmp/database.sqlite' 
  : path.join(__dirname, '../../database.sqlite');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: storagePath,
  logging: false // disable logging for clean console output
});

module.exports = sequelize;
