import type { SignupInput, LoginInput} from "./auth.validations.zod.js";
import {userTable} from "../../db/schema.js";
import bcrypt from "bcrypt";
import db from "../../db/index.js";
import {eq} from "drizzle-orm";
import {ApiError} from "../../utils/api-error.js";
import {generateAccessToken} from "../../utils/jwt.js";


type User = typeof userTable.$inferSelect;  //extract table design provided by drizzle
type SafeUser = Omit<User, "passwordHash">; //omit the passwordHash field

//signupInput is coming from Zod and as we have async function then it will return a promise and its structure will be safeUser

export async function signupService(input: SignupInput): Promise<SafeUser> {

    //if no user found it will return an empty array
    const isPresent = await db.select().from(userTable).where(eq( userTable.email, input.email )).limit(1)

    if(isPresent.length > 0) {
        throw ApiError.conflict("User already exists with email address");
    }

    const passwordHash = await bcrypt.hash(input.password, 12)

    //send email verification link (for v2)

    //The .returning() clause at the end of a Drizzle query tells the database to send back the data it just modified or inserted.
    const [user] = await db.insert(userTable).values({name: input.name, email: input.email, passwordHash}).returning()

    // .returning() gives back an array of the rows that were just inserted. Since you're only inserting one row, db.insert(...).returning() resolves to something like [{ id: ..., name: ..., email: ..., ... }]. The const [user] = ... destructures the first (only) element out of that array into user.
    // Normally that array will have exactly one item — the insert succeeded, so user is defined. But TypeScript doesn't know that for certain (array destructuring on an empty array just gives undefined, and Drizzle's return type reflects that possibility). So user is typed as UserRow | undefined, not just UserRow.
    // This matters below: your function's return type is Promise<SafeUser>, and SafeUser requires real user fields. If user could be undefined, TypeScript won't let you build a SafeUser from it. The if (!user) throw ... is a type guard — after that line, TypeScript narrows user's type from UserRow | undefined down to just UserRow, so the rest of the code can safely use it. It's less "this could realistically fail" and more "satisfy strict TypeScript so the next lines type-check" (though it's also a reasonable defensive check in case the insert genuinely returns nothing, e.g. a race condition).
    if (!user)  throw ApiError.internal("Failed to create user")   // strict mode makes you handle this

    //- passwordHash: _ — pulls the passwordHash field out and names it _ (a throwaway variable name, by convention meaning "I don't need this, I'm just discarding it")
    //...safeUser — the rest operator collects everything else from user (id, name, email, createdAt, updatedAt) into a new object called safeUser
    const {passwordHash : _ , ...safeUser} = user;

    return safeUser;

}

//Login service
export async function loginService(input: LoginInput): Promise<{ user: SafeUser; token: string} >  {
    if(process.env.NODE_ENV === "development") {
        console.log(input)
    }
    const isPresent = await db.select().from(userTable).where(eq( userTable.email, input.email )).limit(1);
    if(isPresent.length == 0) {
        throw ApiError.internal("Invalid credentials");
    }

    // array destructuring, not a copy of the array. The [ ] on the left isn't creating an array — it's a pattern that says "take the array on the right, and pull out element at index 0, and bind it to a
    //   variable named user.
    const [user] = isPresent
    // user is User | undefine
    if (!user) throw ApiError.unauthorized("Invalid credentials 1");

    const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);
    if(!isPasswordValid) {
        throw ApiError.unauthorized("Invalid credentials 2");
    }

    const AccessToken = generateAccessToken({ sub: user.id })

    const {passwordHash : _ , ...safeUser} = user;



    return { user: safeUser, token:AccessToken }


}

//Get me service
export async function getMe(input:any): Promise<{ user: SafeUser }> {
    //isPresent is array of object
    // isPresent = [
    //     { id: "abc", name: "Deep", email: "...", passwordHash: "...", createdAt: ..., updatedAt: ... }
    //   ]
    const isPresent = await db.select().from(userTable).where(eq( userTable.id, input.userId)).limit(1)

    //now user is single object of the element at index 0 of isPresent
    const [user] = isPresent

    if (!user) throw  ApiError.notFound("User not found");

    const {passwordHash : _ , ...safeUser} = user;

    return {user:safeUser}
}
