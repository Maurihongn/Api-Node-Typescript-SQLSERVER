import { Request, Response, NextFunction } from 'express';
import jwt, { Secret } from 'jsonwebtoken';
import dotenv from 'dotenv';
import fs from 'fs';
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
    if (req.file) {
      fs.unlinkSync(req.file!.path);
    }
    res.status(401).send('Access Denied');
    return;
  }

  const secret: Secret | undefined = process.env.TOKEN_SECRET;

  if (!secret) {
    if (req.file) {
      fs.unlinkSync(req.file!.path);
    }
    res.status(500).send('Internal Server Error: JWT secret not defined');
    return;
  }
  try {
    const verified: any = jwt.verify(token, secret, {
      maxAge: '15d',
    });
    req.body.userId = verified.userId;

    next();
  } catch (error) {
    if (req.file) {
      fs.unlinkSync(req.file!.path);
    }
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
