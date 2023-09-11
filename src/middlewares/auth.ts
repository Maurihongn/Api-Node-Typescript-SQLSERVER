import { Request, Response, NextFunction } from 'express';
import jwt, { Secret } from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

export const authToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const token: string | undefined = req
    .header('Authorization')
    ?.replace('Bearer ', '');
  if (!token) {
    res.status(401).send('Access Denied');
    return;
  }

  const secret: Secret | undefined = process.env.TOKEN_SECRET;

  if (!secret) {
    res.status(500).send('Internal Server Error: JWT secret not defined');
    return;
  }
  try {
    const verified: any = jwt.verify(token, secret, {
      maxAge: '15d',
    });
    req.body.userId = verified.userId;

    console.log(req.body);
    next();
  } catch (error) {
    res.status(401).json({
      message: 'Invalid Token',
      error,
    });
    return;
  }
};

export const readToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const token: string | undefined = req
    .header('Authorization')
    ?.replace('Bearer ', '');

  const secret: Secret | undefined = process.env.TOKEN_SECRET;

  if (!secret) {
    res.status(500).send('Internal Server Error: JWT secret not defined');
    return;
  }

  if (token) {
    try {
      const verified: any = jwt.verify(token, secret, {
        maxAge: '15d',
      });
      req.body.userId = verified.userId;
      console.log(req.body.userId);
    } catch (error) {
      req.body.userId = null;
    } finally {
      next();
    }
  } else {
    req.body.userId = null;
    next();
  }
};