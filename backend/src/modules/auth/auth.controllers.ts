import * as auth_service from "./auth.services.js";
import type {Request, Response} from "express";
import {z} from "zod";
import {signupSchema} from "./auth.validations.zod.js";

const signupController = async (req: Request, res: Response) => {
    try {
        console.log(req.body);

        const result = signupSchema.safeParse(req.body);

        if (!result.success) {
            const errors = result.error.flatten().fieldErrors;
            // → { email: ["Invalid email address"], password: ["Password must be at least 8 characters"] }
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors,
            });
        }

        req.body = result.data; // ← CRITICAL: use the cleaned/transformed data

        const safeUser = await auth_service.signupService(req.body);

        return res.status(201).send({safeUser});

    } catch (err) {

        if (err instanceof Error) {
            return res.status(500).send({error: err.message});
        }

        return res.status(500).send({error: "Something went wrong"});
    }
}

export {signupController};