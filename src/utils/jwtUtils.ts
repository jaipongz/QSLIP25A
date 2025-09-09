import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET: Secret = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const JWT_EXPIRES_IN_SECONDS = 7 * 24 * 60 * 60; // 7 วัน


export interface JWTPayload {
  userId: string;
  email: string;
  [key: string]: any;
}

export class JWTUtils {
  static generateToken(payload: JWTPayload): string {
    const options: SignOptions = {
      expiresIn: JWT_EXPIRES_IN_SECONDS,
    };
    return jwt.sign(payload, JWT_SECRET, options);
  }

  static verifyToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  static decodeToken(token: string): JWTPayload | null {
    return jwt.decode(token) as JWTPayload | null;
  }
}
