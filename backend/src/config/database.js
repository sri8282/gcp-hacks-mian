const { Sequelize } = require('sequelize');
require('dotenv').config();

const dbName = process.env.DB_NAME;
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;
const dbHost = process.env.DB_HOST;
const dbPort = process.env.DB_PORT || 5432;

const isCloudSql = dbHost && dbHost.startsWith('/cloudsql/');

const options = {
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
};

if (isCloudSql) {
  options.host = dbHost;
  options.dialectOptions = {
    socketPath: dbHost,
  };
} else {
  options.host = dbHost || 'localhost';
  options.port = dbPort;
}


const sequelize = new Sequelize(dbName, dbUser, dbPassword, options);

module.exports = sequelize;
