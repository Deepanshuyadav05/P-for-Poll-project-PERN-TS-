import type { ErrorRequestHandler } from "express";
import {ZodError, z} from "zod";

import { ApiError } from "../utils/api-error.js";

export const errorHandler: ErrorRequestHandler = (
    err,
    _req,
    res,
    next
) => {
    if (res.headersSent) {
        return next(err);
    }

    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({
            success: false,
            code: err.code,
            message: err.message,
            details: err.details,
        });
    }

    if (err instanceof ZodError) {
        const { fieldErrors } = z.flattenError(err);
        //{
        //   fieldErrors: {
        //     email:    ["Invalid email address"],
        //     password: ["Too short", "Needs a number"],
        //   },
        // }
        return res.status(422).json({
            success: false,
            code: "VALIDATION_FAILED",
            message: "Validation failed",
            details: fieldErrors,
        });
    }

    console.error(err);
    //Anything else is an unexpected bug — never leak its message to the client.
    return res.status(500).json({
        success: false,
        code: "INTERNAL",
        message: "Internal server error",
    });
};