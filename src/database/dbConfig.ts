// database/dbConfig.js
import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

const sqlConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PWD,
  database: process.env.DB_NAME,
  server: 'localhost',
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
  options: {
    encrypt: false, // for azure
    trustServerCertificate: true, // change to true for local dev / self-signed certs
  },
};

async function connectDb() {
  try {
    await sql.connect(sqlConfig);
    console.log('Conexión exitosa a SQL Server');
  } catch (error) {
    console.log(error);
  }
}

export {
  connectDb,
  sql, // Esto permite que otros módulos accedan al cliente SQL si es necesario
};
