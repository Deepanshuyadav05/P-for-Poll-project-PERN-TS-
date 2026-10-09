# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
A portfolio project. The main audience is recruiters and other developers evaluating the build, plus the author using it to test. In the product itself there are two roles: a signed-in poll creator, and anonymous voters who arrive through a shared link.

## Product Purpose
P for Poll lets a signed-in user create a poll, share its link, and watch the results update live as votes arrive. Success for the portfolio is that a visitor quickly sees a complete, working, well-finished full stack app.

## Positioning
Voting needs no account (one vote per browser via a `voterId` cookie), and results update live over WebSockets without a refresh.

## Operating Context
A creator signs in, lands on Home (their dashboard), creates a poll, copies the share link, and returns to Home to open results, vote, or delete a poll. Voters open the link, pick an option, and are sent to the live results page.

## Capabilities and Constraints
- A poll has a title, optional description, one question, 2 to 10 options, and an optional expiry after which voting closes.
- Polls are public or private (`isPublic`).
- Home lists the creator's polls, newest first, with total votes per poll.
- Stack: React 19, TypeScript, Vite, Tailwind CSS 4, React Router 7; Express 5, Socket.IO, PostgreSQL with Drizzle.
- No analytics, teams, or billing exist; do not imply them.

## Brand Commitments
- Name: "P for Poll".
- Dark theme carried over from the author's Auth project: near-black ground, off-white text, Bricolage Grotesque for display and Inter for body.
- Login and Signup stay strictly monochrome. App pages may add one accent color.

## Evidence on Hand
Only real data from the API: poll titles, descriptions, status, dates and vote counts. There are no testimonials, user numbers or benchmarks; none may be invented.
