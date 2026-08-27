// src/shared/api-response.ts
import type { Response } from "express";

export class ApiResponse {
    private constructor() {}

    static ok<T>(res: Response, message: string, data: T): Response {
        return res.status(200).json({ success: true, message, data });
    }

    static created<T>(res: Response, message: string, data: T): Response {
        return res.status(201).json({ success: true, message, data });
    }

    static noContent(res: Response): Response {
        return res.status(204).end();
    }
}