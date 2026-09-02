import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../../utils/jwt.js";
import { ApiError } from "../../utils/api-error.js";

export const authenticate = (req: Request, _res: Response, next: NextFunction) => {
    const token = req.cookies?.accessToken;

    if (!token) {
        throw ApiError.unauthorized("Authentication required");
    }

    try {
        const payload = verifyAccessToken(token);
        req.userId = payload.sub;
    } catch {
        throw ApiError.unauthorized("Invalid or expired token");
    }

    next();
};
