import {signupSchema, type SignupInput} from "./auth.validations.zod.js";
import {userTable} from "../../db/schema.js";
import bcrypt from "bcrypt";


type User = typeof userTable.$inferSelect;  //extract table design provided by drizzle
type SafeUser = Omit<User, "passwordHash">; //omit the passwordHash field

//signupInput is coming from Zod and as we have async function then it will return a promise and its structure will be safeUser
/*
export async function registerUser(input: SignupInput): Promise<SafeUser> {

    /!*find the user in db using email
    if we found the user, then throw the error that the user already exists.
        If you don't find the user, then you will hash the incoming password.
    And now we will create the user in the DB and store the hashed password with that.
        And at last we will return the safe user.*!/


  /!*const passwordHash = await bcrypt.hash(input.password, 12);

  const [user] = await db
    .insert(userTable)
    .values({ email: input.email, passwordHash })
    .returning();

  if (!user) throw new Error("INSERT_FAILED");   // strict mode makes you handle this

  const { passwordHash: _, ...safeUser } = user;*!/
  return safeUser;
}
*/

