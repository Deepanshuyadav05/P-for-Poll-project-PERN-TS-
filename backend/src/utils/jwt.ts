import jwt from 'jsonwebtoken';
import 'dotenv/config';
import type { StringValue } from 'ms';

export interface AccessTokenPayload {
    sub: string; // user id
}

//Access Token

export const generateAccessToken = (payload:AccessTokenPayload) => {
    return jwt.sign(payload, process.env.JWT_ACCESS_SECRET!, {expiresIn: (process.env.JWT_ACCESS_EXPIRES_IN || '7d') as StringValue })
}

export const verifyAccessToken = (payload:string) => {
    return jwt.verify(payload, process.env.JWT_ACCESS_SECRET!) as AccessTokenPayload;
}
