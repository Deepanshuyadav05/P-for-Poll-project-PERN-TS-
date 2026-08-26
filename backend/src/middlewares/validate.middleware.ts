import type {NextFunction, Request, Response} from "express";
import {z} from "zod";

type RequestSource = "body" | "query" | "params";

const validate = (schema: z.ZodType, source: RequestSource = "body") =>
    (req: Request, res: Response, next: NextFunction) => {
        const result = schema.safeParse(req[source]);

        if (!result.success) {
            return res.status(400).send({error: z.treeifyError(result.error)});
        }

        req[source] = result.data;
        next();
    };

export {validate};
