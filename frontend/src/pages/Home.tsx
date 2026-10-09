/*
  DESIGN CONTRACT (Home)
  THESIS: Home is count night. The header is one solid marigold block carrying every vote as a hand-drawn
  tally, and each poll is a ballot slip. It refuses the dashboard default of equal grey cards on black.
  OWN-WORLD: near-black dotted paper, off-white ink, one marigold used as a whole field. Slips with a count
  stub, a dashed tear line and notches; tally strokes in bundles of five; a "Live" tab and a crooked "Closed" stamp.
  STORY: the creator sees which polls are live and how many people voted, then opens results, shares the
  link or creates the next poll.
  FIRST VIEWPORT: wordmark and Logout; the marigold block with the welcome, summary, "Create poll" and the
  big tally on the right; the first slips below.
  FORM: tally board, fourth on the structure list; seed bc9242be.
*/
import {useState, useEffect} from "react";
import {api} from "../api/client.ts";
import {handleErrorTostify} from "../utils/tostify.error.msg.ts";
import axios from "axios";
import {handleSuccessTostify} from "../utils/tostify.success.msg.ts";
import {Link, useNavigate} from "react-router-dom";
import TallyMarks, {TallyGroup} from "../components/TallyMarks.tsx";
import {ArrowIcon, LinkIcon, PlusIcon, TrashIcon} from "../components/Icons.tsx";
import AppLoading from "../components/AppLoading.tsx";

const MINUTE = 60 * 1000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

// "2026-10-05T10:00:00.000Z" -> "5 Oct 2026" (in the user's own locale and timezone)
function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString(undefined, {day: "numeric", month: "short", year: "numeric"})
}

// Turns the expiry into words: "Closes in 2 days", "Closes tomorrow", "Closed 3 hours ago"
function closingLabel(expiresAt: string | null, now: number) {
    if (!expiresAt) return "No closing date"

    const diff = new Date(expiresAt).getTime() - now
    const abs = Math.abs(diff)
    // pick the biggest unit that fits, so we say "2 days" and not "2880 minutes"
    const [value, unit]: [number, Intl.RelativeTimeFormatUnit] =
        abs >= DAY ? [Math.round(abs / DAY), "day"]
        : abs >= HOUR ? [Math.round(abs / HOUR), "hour"]
        : [Math.max(1, Math.round(abs / MINUTE)), "minute"]

    // Intl.RelativeTimeFormat writes the phrase for us: a negative value means the past ("3 days ago"), a positive one the future ("in 3 days")
    const relative = new Intl.RelativeTimeFormat("en", {numeric: "auto"}).format(diff < 0 ? -value : value, unit)
    return diff < 0 ? `Closed ${relative}` : `Closes ${relative}`
}

function Home() {
    const navigate = useNavigate();

    //passed useState an empty array [] with no type hint. With nothing to infer from, TypeScript sets the element type to never — so myPolls is typed never[], not "array of poll objects." That's a well-known TypeScript gotcha
    //   with useState([]).
    //   So when you write poll.title inside .map((poll, index) => ...), TypeScript sees poll: never and errors with something like:
    //   Property 'title' does not exist on type 'never'.
    //   Fix: give useState an explicit generic type that describes what a poll row actually looks like (matching the columns in pollTable from backend/src/db/schema.ts):
    type Poll = {
        id: string;
        userId: string;
        title: string;
        description: string | null;
        slug: string;
        isPublic: boolean;
        createdAt: string;
        expiresAt: string | null;
        // not a column: the backend counts the responses for each poll in listMyPollsService
        responseCount: number;
    };

    const [userName, setUserName] = useState("User");
    const [isLoading, setIsLoading] = useState(true);
    const [myPolls, setMyPolls] = useState<Poll[]>([]);
    // slug of the poll whose Delete was clicked once and is waiting for the second, confirming click
    const [confirmSlug, setConfirmSlug] = useState<string | null>(null);
    // "now" is read once when the page mounts. Calling Date.now() directly in the render body would make the render impure (a different result every time it runs).
    const [now] = useState(() => Date.now());


    useEffect(() => {
        async function fetchData() {

            try {
                const [fetchUserData, fetchPollData] = await Promise.all([
                    api.get("auth/get-me"),
                    api.get("polls/getMyPolls"),
                ])

                setUserName(fetchUserData.data.data.user.name);
                setMyPolls(fetchPollData.data.data)

            }
            catch(error){
                console.error(error)
                //we are doing this because type of 'e' is unknown
                // Why this works: axios.isAxiosError(e) is a type predicate — once that check passes, TypeScript narrows e from unknown down to AxiosError, so e.response?.data?.message is now legal. If it's not an Axios error (some other JS
                //   exception), you fall back to a generic message instead of trying to read properties off an unknown shape.
                const message = axios.isAxiosError(error)
                    // The ?? fallback fires when it is an axios error, but there's no usable message
                    ? error.response?.data?.message ?? "Something went wrong"
                    // The : (else) branch of the ternary fires when it's not an axios error at all (some other kind of JS exception — a bug elsewhere in the try block, for instance)
                    : "Something went wrong"
                handleErrorTostify(message)
            }
            finally {
                //If we wrote the code sequentially without a try/catch/finally block
                //like setting the loading true at the start of the useEffect and ending it at the end of the useEffect
                //If the network drops or the server returns a 500 error, JavaScript throws an exception and immediately stops running the rest of the code in that block.
                // The user would see a spinning loading wheel forever.
                setIsLoading(false);
            }
        }
        fetchData();

    },[])

    if (isLoading) return <AppLoading label="Loading your polls…" />

    async function handleDelete(slug: string) {

        try {
            const deleteMsg = await api.delete(`polls/deletePoll/${slug}`)
            // update myPolls state by filtering out that poll (no need to refetch the whole list)
            setMyPolls(prev => prev.filter(p => p.slug !== slug))
            handleSuccessTostify(deleteMsg.data.message)
        }
        catch(err){
            console.error(err)
            const message = axios.isAxiosError(err)
                ? err.response?.data?.message ?? "Something went wrong"
                : "Something went wrong"
            handleErrorTostify(message)
        }
        finally {
            setConfirmSlug(null)
        }
    }

    async function handleLogout(){
        try {
            const logoutMsg = await api.post(`auth/logout`)
            handleSuccessTostify(logoutMsg.data.message)
            navigate('/login')
        }
        catch(err){
            console.error(err)
            const message = axios.isAxiosError(err)
                ? err.response?.data?.message ?? "Something went wrong"
                : "Something went wrong"
            handleErrorTostify(message)
        }

    }

    async function handleCopyLink(slug: string) {
        try {
            // same link CreatePoll shows after creating a poll
            await navigator.clipboard.writeText(`${window.location.origin}/poll/${slug}/pollVote`)
            handleSuccessTostify("Link copied")
        }
        catch(err){
            console.error(err)
            handleErrorTostify("Could not copy the link")
        }
    }

    const isClosed = (poll: Poll) => poll.expiresAt !== null && new Date(poll.expiresAt).getTime() < now

    // the one-line summary under the welcome, built only from the real list
    const liveCount = myPolls.filter(poll => !isClosed(poll)).length
    const totalVoters = myPolls.reduce((sum, poll) => sum + poll.responseCount, 0)
    const summary = myPolls.length === 0
        ? "Nothing on the sheet yet."
        : `${myPolls.length} ${myPolls.length === 1 ? "poll" : "polls"}, ${liveCount} live, ${totalVoters} ${totalVoters === 1 ? "voter" : "voters"} so far.`

    const closedCount = myPolls.length - liveCount
    // the header tally is drawn larger when there are only a few strokes, so it always fills its corner
    const heroTallyScale = totalVoters <= 5 ? 5 : totalVoters <= 15 ? 3.4 : 2.4

    const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mark/70 focus-visible:ring-offset-2 focus-visible:ring-offset-void"
    const pill = "inline-flex items-center gap-2 rounded-full px-4 py-2 text-small font-semibold transition-colors duration-150"
    const solidPill = `${pill} bg-fog text-void hover:bg-mark ${focusRing}`
    const outlinePill = `${pill} border border-hairline text-fog hover:border-fog/50 hover:bg-glass ${focusRing}`
    const quietPill = `${pill} text-ash hover:bg-glass hover:text-fog ${focusRing}`

    return (
        <div className="mx-auto max-w-5xl px-5 pb-24 sm:px-8">
            {/* the dotted paper behind the whole page. fixed + -z-10 keeps it behind the content and still while scrolling */}
            <div className="sheet-grid pointer-events-none fixed inset-0 -z-10" aria-hidden="true" />

            <nav className="flex items-center justify-between py-6">
                <span className="flex items-center gap-3 font-display text-[1.0625rem] font-medium text-fog">
                    <TallyGroup animate={false} />
                    P for Poll
                </span>
                <button className={`rounded-full border border-hairline px-4 py-2 text-small font-medium text-ash transition-colors duration-150 hover:border-fog/40 hover:text-fog ${focusRing}`} onClick={() => {handleLogout()}}>Logout</button>
            </nav>

            {/* the header is one solid block of the accent color, with everything on it in dark ink */}
            <header className="relative mt-4 grid gap-10 overflow-hidden rounded-card bg-mark px-6 py-9 text-void sm:px-10 sm:py-12 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                <div className="ink-dots pointer-events-none absolute inset-0" aria-hidden="true" />

                <div className="relative min-w-0">
                    <h1 className="text-balance break-words font-display text-[clamp(2.5rem,7vw,4.5rem)] font-semibold leading-[0.98] tracking-[-0.03em]">Welcome, {userName}</h1>
                    <p className="mt-5 text-body font-medium text-void/80">{summary}</p>
                    <Link className={`mt-8 inline-flex items-center gap-2.5 rounded-full bg-void px-6 py-3.5 text-small font-semibold uppercase tracking-[0.08em] text-fog transition-colors duration-150 hover:bg-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-void focus-visible:ring-offset-2 focus-visible:ring-offset-mark`} to={'/poll/createPoll'}>
                        <PlusIcon />
                        Create poll
                    </Link>
                </div>

                {/* every vote across all polls, counted by hand at full size */}
                {totalVoters > 0 && (
                    <div className="relative max-w-[23rem] lg:justify-self-end">
                        <TallyMarks count={totalVoters} scale={heroTallyScale} strike="var(--color-void)" max={30} />
                    </div>
                )}
            </header>

            <main>
                <div className="mt-16 mb-6 flex items-end justify-between gap-4">
                    <h2 className="font-display text-[1.75rem] font-medium leading-none tracking-[-0.015em] text-fog">Your polls</h2>
                    {myPolls.length > 0 && <p className="text-small text-ash">{liveCount} live · {closedCount} closed</p>}
                </div>

                {myPolls.length === 0 && (
                    <div className="rounded-[20px] border border-dashed border-hairline px-6 py-14 sm:px-10">
                        <p className="font-display text-[3.5rem] font-medium leading-none text-ash">0</p>
                        <p className="mt-4 max-w-[46ch] text-body text-ash">You haven't created any polls yet. Create one, share its link, and the votes are counted here as they come in.</p>
                    </div>
                )}

                {myPolls.length > 0 && (
                    <ul className="grid gap-4">
                            {
                                myPolls.map((poll) => {
                                    const closed = isClosed(poll)

                                    return (
                                    // each poll is a ballot slip: a stub with the count on the left, torn along a dashed line from the details on the right
                                    <li key={poll.id} className="relative grid overflow-hidden rounded-[20px] border border-hairline bg-ink transition duration-200 ease-out hover:-translate-y-0.5 hover:border-fog/30 hover:shadow-[0_18px_40px_-18px_rgba(0,0,0,0.9)] sm:grid-cols-[11.5rem_minmax(0,1fr)]">

                                        {/* the two notches where the tear line meets the edge of the slip (half of each circle is cut off by overflow-hidden) */}
                                        <span className="absolute -top-2 left-[11.5rem] hidden size-4 -translate-x-1/2 rounded-full border border-hairline bg-void sm:block" aria-hidden="true" />
                                        <span className="absolute -bottom-2 left-[11.5rem] hidden size-4 -translate-x-1/2 rounded-full border border-hairline bg-void sm:block" aria-hidden="true" />

                                        {/* the stub: the number, and the same number as tally strokes */}
                                        <div className={`flex items-center justify-between gap-6 border-b border-dashed border-hairline p-6 sm:block sm:border-r sm:border-b-0 sm:p-7 ${closed ? "" : "bg-mark/[0.07]"}`}>
                                            <p className="flex items-baseline gap-2.5">
                                                <span className={`font-display text-[3.25rem] font-semibold leading-none tracking-[-0.03em] tabular-nums ${closed ? "text-ash" : "text-mark"}`}>{poll.responseCount}</span>
                                                <span className="text-small text-ash">{poll.responseCount === 1 ? "voter" : "voters"}</span>
                                            </p>
                                            {poll.responseCount > 0 && (
                                                <div className={`sm:mt-5 ${closed ? "text-ash" : "text-fog"}`}>
                                                    <TallyMarks count={poll.responseCount} strike={closed ? "currentColor" : undefined} max={20} />
                                                </div>
                                            )}
                                        </div>

                                        <div className="min-w-0 p-6 sm:p-7">
                                            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                                                <p className="flex flex-wrap items-center gap-x-3 gap-y-2 text-small font-medium text-ash">
                                                    {!closed && (
                                                        <span className="inline-flex items-center gap-2 rounded-full bg-mark px-2.5 py-1 text-label font-semibold uppercase tracking-[0.08em] text-void">
                                                            <span className="relative flex size-1.5" aria-hidden="true">
                                                                <span className="live-ping absolute inset-0 rounded-full bg-void" />
                                                                <span className="relative size-1.5 rounded-full bg-void" />
                                                            </span>
                                                            Live
                                                        </span>
                                                    )}
                                                    <span>{closingLabel(poll.expiresAt, now)}</span>
                                                </p>
                                                {/* a closed poll gets a rubber stamp, slightly crooked like a real one */}
                                                {closed && <span className="-rotate-6 rounded-md border-2 border-ash/70 px-2.5 py-1 font-display text-label font-semibold uppercase tracking-[0.16em] text-ash" aria-hidden="true">Closed</span>}
                                            </div>

                                            <h3 className={`mt-4 text-balance break-words font-display text-[1.5rem] font-medium leading-[1.15] tracking-[-0.015em] ${closed ? "text-ash" : "text-fog"}`}>{poll.title}</h3>
                                            {poll.description && <p className="mt-2 max-w-[65ch] break-words text-body text-ash">{poll.description}</p>}

                                            <p className="mt-3 text-small text-ash">{poll.isPublic ? "Public" : "Private"} · Created {formatDate(poll.createdAt)}</p>

                                            <div className="mt-6 flex flex-wrap items-center gap-2">
                                                {/* Delete asks once more in place before it really deletes: first click only sets confirmSlug */}
                                                {confirmSlug === poll.slug ? (
                                                    <>
                                                        <span className="mr-2 text-small text-ash">Delete this poll and its votes?</span>
                                                        <button className={solidPill} onClick={() => {handleDelete(poll.slug)}}>Yes, delete</button>
                                                        <button className={quietPill} onClick={() => setConfirmSlug(null)}>Cancel</button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Link className={solidPill} to={`/poll/${poll.slug}/pollResult`}>View results <ArrowIcon /></Link>
                                                        {/* a closed poll no longer accepts votes, so the link to the voting page is left out */}
                                                        {!closed && <Link className={outlinePill} to={`/poll/${poll.slug}/pollVote`}>Vote</Link>}
                                                        <button className={outlinePill} onClick={() => {handleCopyLink(poll.slug)}}><LinkIcon /> Copy link</button>
                                                        <button className={`${quietPill} sm:ml-auto`} onClick={() => setConfirmSlug(poll.slug)}><TrashIcon /> Delete</button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </li>
                                    )
                                })
                            }

                    </ul>
                )}

            </main>


        </div>
    )
}

export default Home
