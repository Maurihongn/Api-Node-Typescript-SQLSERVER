import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import categoryRoutes from './routes/category.routes';
import itemRoutes from './routes/item.routes';
import userRoutes from './routes/user.routes';

import { swaggerDocs } from './swagger';

//HABILITAR DOTENV
dotenv.config();
const app = express();
app.use(express.static('public'));

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

dotenv.config();
// Rutas

app.use('/api/user', userRoutes);
app.use('/api/category', categoryRoutes);
app.use('/api/item', itemRoutes);
// app.use('/api/item', itemRoutes);

//rutas de usuario

const PORT = process.env.PORT ? process.env.PORT : '8080';

const _PORT = parseInt(PORT, 10);
// // Escuchar en el puerto 8080
app.listen(_PORT, () => {
  swaggerDocs(app, _PORT);
});

export default app;
