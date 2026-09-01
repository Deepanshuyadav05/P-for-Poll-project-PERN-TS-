import * as auth_service from "./auth.services.js";
import type {Request, Response} from "express";
import {ApiResponse} from "../../utils/api-response.js";

const signupController = async (req: Request, res: Response) => {

        const result = await auth_service.signupService(req.body);
        return ApiResponse.created(res, "User created successfully", result);

}

export {signupController};