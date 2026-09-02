import * as auth_service from "./auth.services.js";
import type {Request, Response} from "express";
import {ApiResponse} from "../../utils/api-response.js";
import type {CookieOptions} from "express";

//shared cookie options for the accessToken cookie, used by both login and access
const accessCookieOptions : CookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV !== "development",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
}

const signupController = async (req: Request, res: Response) => {

        const result = await auth_service.signupService(req.body);
        return ApiResponse.created(res, "User created successfully", result);

}

const loginController = async (req: Request, res: Response) => {

        const {user, token} = await auth_service.loginService(req.body);
        res.cookie("accessToken", token, accessCookieOptions);
        return ApiResponse.created(res, "User logged in successfully", user);

}

export {signupController, loginController};