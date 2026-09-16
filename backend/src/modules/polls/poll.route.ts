import {Router} from "express";
import {validateBody} from "../../middlewares/validate.middleware.js";
import {createPoll, getMyPollList, getPoll, getResults, submitVote} from "./poll.controller.js";
import {createPollSchema, submitVoteSchema} from "./poll.zod.validation.js";
import {authenticate} from "../auth/auth.middlewares.js";
import {ensureVoterId} from "./poll.middleware.js";

const route = Router();

route.post("/createPoll", authenticate,validateBody(createPollSchema), createPoll);
route.get("/getMyPolls", authenticate, getMyPollList);
route.get("/:slug", getPoll);
route.post("/:slug/vote", ensureVoterId, validateBody(submitVoteSchema), submitVote);
route.get("/:slug/results", getResults);



export default route;

// What "segments" means: think of a URL path as being split by /. /abc123 has one segment (abc123). /abc123/results has two segments (abc123 and results).
//
//   How Express decides which route handles a request: it walks through your registered routes in the order you wrote them, and for each one asks "does this request's path shape match this route's pattern?" — it stops at the very
//   first match and never looks further. A :param in a route only ever captures one segment, not several. So:
//   - /:slug matches any path with exactly one segment after /api/polls — /abc123, /mine, /hello, whatever. Express doesn't know or care what the text actually is; it just sees "one segment, :slug pattern matches, call this
//     handler" and passes whatever that segment was as req.params.slug.
//   - /:slug/results matches paths with exactly two segments — /abc123/results, /mine/results, etc.
//
//   Why /:slug and /:slug/results never collide, regardless of order: a request to /api/polls/abc123 has one segment — it can only ever match /:slug (one segment), never /:slug/results (which needs two). A request to
//   /api/polls/abc123/results has two segments — it can only match /:slug/results, never /:slug alone. They're simply never looking at the same shape of request, so there's no ambiguity to worry about no matter which one you list
//   first.
//
//   Why /mine is a real problem, though: /mine also has exactly one segment — the same shape as /:slug. So if you write:
//   route.get("/:slug", getPoll);
//   route.get("/mine", listMyPollsController);   // registered AFTER /:slug
//   and someone requests /api/polls/mine, Express checks routes top-to-bottom, hits /:slug first, sees "one segment, matches," and calls getPoll with req.params.slug = "mine" — it never even reaches your actual /mine route below
//   it, because Express already found a match and stopped looking. Your "list my polls" endpoint would silently never run; instead it'd try to look up a poll with slug "mine" and 404.
//
//   The fix is just ordering: put the literal, specific route before the generic wildcard one:
//   route.get("/mine", listMyPollsController);   // literal match, checked first
//   route.get("/:slug", getPoll);                // wildcard, checked second — only reached if nothing more specific matched