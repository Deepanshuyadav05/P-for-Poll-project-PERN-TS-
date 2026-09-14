import {randomUUID} from "crypto";
import type {Request, Response, NextFunction} from "express";

export function ensureVoterId(req:Request, res:Response, next:NextFunction) {
    if(req.cookies?.voterId){
        req.voterId = req.cookies.voterId
        return next();
    }
    else{
        const id = randomUUID()
        res.cookie("voterId", id, {
            httpOnly: true,
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days,

        })
        req.voterId = id;
    }
    next()
}

//On where req.voterId comes from: it's not something Express provides — it comes from the file you already edited, src/types/express.d.ts:
//   interface Request {
//       userId: string;
//       voterId: string;
//   }
//   Express itself declares a global Express.Request interface. TypeScript lets multiple files declare the same interface name and merges all their properties together ("declaration merging") — so by adding voterId: string here,
//   every Request object in your whole codebase now type-checks as having a .voterId property, the same way userId already does for auth. That file only affects the type — it doesn't create the value. The actual value only exists
//   because your middleware does req.voterId = id before calling next(), exactly the same pattern as req.userId = payload.sub in authenticate. Whatever runs later in the request (the controller, the service) just reads whatever
//   your middleware put there.