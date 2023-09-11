import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const TOKEN_SECRET = process.env.TOKEN_SECRET;

if (!TOKEN_SECRET) {
  throw new Error('TOKEN_SECRET no está definido en el archivo .env');
}

// Usar las claves en tus funciones para generar tokens
export const generateToken = (userId: number): string => {
  return jwt.sign({ userId: userId }, TOKEN_SECRET, {
    expiresIn: '15d',
  });
};
