import * as auth_service from "./auth.services.js";
import type {Request, Response} from "express";
import {z} from "zod";

const signupController = async (req: Request, res: Response) => {
    try {
        console.log(req.body);
        const safeUser = await auth_service.signupService(req.body);

        return res.status(201).send({safeUser});

    } catch (err) {

        if (err instanceof z.ZodError) {
            return res.status(400).send({error: z.treeifyError(err)});
        }

        if (err instanceof Error) {
            return res.status(500).send({error: err.message});
        }

        return res.status(500).send({error: "Something went wrong"});
    }
}

export {signupController};