import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import fs from 'fs';
import https from 'https';
import { connectDb, sql } from './database/dbConfig';
import userRoutes from './routes/user.routes';
import categoryRoutes from './routes/category.routes';
import itemRoutes from './routes/item.routes';

import { swaggerDocs } from './swagger';

//HABILITAR DOTENV
dotenv.config();
const app = express();
app.use(express.static('public'));

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

async function serverInit() {
  try {
    await connectDb(); // Establece la conexión a la base de datos
    console.log('Conexión a la base de datos establecida.');

    // Resto del código para configurar tu servidor Express y rutas...
  } catch (error) {
    console.error('Error al conectar a la base de datos:', error);
  }
}

serverInit();

dotenv.config();
// Rutas

app.use('/api/user', userRoutes);
app.use('/api/category', categoryRoutes);
app.use('/api/item', itemRoutes);
// app.use('/api/item', itemRoutes);

//rutas de usuario

// const certPath = __dirname + '/../cert.pem';
// const keyPath = __dirname + '/../key.pem';

// const cert = fs.readFileSync(certPath);
// const key = fs.readFileSync(keyPath);
// const passphrase = process.env.PASSPHRASE;

// // Crear un servidor HTTPS
// const options = {
//   key: key,
//   cert: cert,
//   passphrase: passphrase,
// };

// const server = https.createServer(options, app);

// const HTTPSPORT = process.env.HTTPSPORT ? process.env.HTTPSPORT : '3443';

// const _HTTPSPORT = parseInt(HTTPSPORT, 10);

const HTTPPORT = process.env.HTTPPORT ? process.env.HTTPPORT : '8080';

const _HTTPPORT = parseInt(HTTPPORT, 10);
// // Escuchar en el puerto 8080
app.listen(_HTTPPORT, () => {
  console.log(`Servidor iniciado en el puerto ${_HTTPPORT}`);
  swaggerDocs(app, _HTTPPORT);
});

export default app;
