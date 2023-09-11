import fs from 'fs';
import https from 'https';
import cors from 'cors';
import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import { connectDb, sql } from './database/dbConfig';
import userRoutes from './routes/user.routes';
import categoryRoutes from './routes/category.routes';
import itemRoutes from './routes/item.routes';

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

app.get('/', (req: Request, res: Response) => {
  res.send('Hola mundo');
});

//rutas de usuario

const certPath = __dirname + '/../cert.pem';
const keyPath = __dirname + '/../key.pem';

const cert = fs.readFileSync(certPath);
const key = fs.readFileSync(keyPath);
const passphrase = process.env.PASSPHRASE;

// Crear un servidor HTTPS
const options = {
  key: key,
  cert: cert,
  passphrase: passphrase,
};

const server = https.createServer(options, app);

const HTTPSPORT = process.env.HTTPSPORT;
// Escuchar en el puerto 8080
server.listen(HTTPSPORT, () => {
  console.log(`Servidor iniciado en el puerto ${HTTPSPORT}`);
});

export default app;
