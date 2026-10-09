/*
  DESIGN CONTRACT (PollResult)
  THESIS: this page is the count. The result is one slip: a solid marigold stub carrying the total as a
  numeral and hand tallies, torn from the bars beside it. It refuses the default of a chart in a grey card.
  OWN-WORLD: same as the other app pages. Near-black dotted paper, off-white ink, the marigold as a whole
  field, dashed tear lines, the "Live" tab and the crooked "Closed" stamp.
  STORY: a voter or the creator sees who is leading right now, and watches the bars move as votes arrive.
  FIRST VIEWPORT: wordmark and Home; status and the poll title; the slip with the total and the bars.
  FORM: tally board continued from Home; shaped directly, no seed.
*/
import {type CSSProperties, useEffect, useState} from "react";
import {Link, useNavigate, useParams} from "react-router-dom";
import {api} from "../api/client.ts";
import axios from "axios";
import {handleErrorTostify} from "../utils/tostify.error.msg.ts";
import {socket} from "../api/socket.ts";
import TallyMarks, {TallyGroup} from "../components/TallyMarks.tsx";
import {ArrowIcon} from "../components/Icons.tsx";
import AppLoading from "../components/AppLoading.tsx";

function PollResult() {
    const navigate = useNavigate();


    type ResultData = {
        publicPoll: {id:string, title: string; description: string | null; expiresAt: string | null }
        question: { questionText: string; allowMultiple: boolean }
        results: {optionId: string, optionText: string, displayOrder: number, voteCount: number}[]  //this field is array
    }

    const [result, setResult] = useState<ResultData | null>(null);  //store the array of result
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const {slug} = useParams()


    useEffect(() => {
        if (!slug) return

        async function fetchData(slug:string) {
            try {
                const res = await api.get(`/polls/${slug}/results`)
                setResult(res.data.data)
            }
            catch(error){
                console.log(error)
                const message = axios.isAxiosError(error)
                    // The ?? fallback fires when it is an axios error, but there's no usable message
                    ? error.response?.data?.message ?? "Something went wrong"
                    // The : (else) branch of the ternary fires when it's not an axios error at all (some other kind of JS exception — a bug elsewhere in the try block, for instance)
                    : "Something went wrong"
                handleErrorTostify(message)

            }
            finally {
                setIsLoading(false)
            }
        }
        fetchData(slug)



    },[])

    //Web-Sockets
    useEffect(() => {
        if (!slug) return
        // Define two handler functions. They need names so you can remove them later.

        socket.on("connect", handleConnect)
        socket.on("poll:results", handleResults)

        socket.connect()

        return () => {
            socket.off("connect", handleConnect)
            socket.off("poll:results", handleResults)
            socket.emit("poll:leave", slug)
            socket.disconnect()
        }

        //handler function of sockets
        function handleConnect(){
            // emits the join request, socket.emit("poll:join", slug). This is the message your backend's socket.on("poll:join") is waiting for.
            socket.emit("poll:join", slug)
        }

        function handleResults(newResults: ResultData["results"]){
            // receives the new counts and updates state. Its parameter is the results array the controller emitted, typed as ResultData["results"]:
            setResult(prev => prev ? { ...prev, results: newResults } : prev)
            // - newResults is the array the controller sent with .emit("poll:results", results). Whatever the server attaches to an emit arrives as the listener's argument.
            // - setResult(prev => ...) is the function form of the setter. React passes in the current state as prev, and you return the new state.
            // - { ...prev, results: newResults } copies everything from the old state (publicPoll, question) and replaces only results with the fresh counts.
            // - prev ? ... : prev covers prev being null, which happens if a socket message arrives before the first fetch finishes. In that case it leaves the state alone.
        }
    }, [slug])



    const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mark/70 focus-visible:ring-offset-2 focus-visible:ring-offset-void"
    const page = "mx-auto max-w-4xl px-5 pb-24 sm:px-8"

    // the top of every state of this page: the dotted paper behind, the wordmark, and the way back home
    const pageTop = (
        <>
            <div className="sheet-grid pointer-events-none fixed inset-0 -z-10" aria-hidden="true" />
            <nav className="flex items-center justify-between py-6">
                <span className="flex items-center gap-3 font-display text-[1.0625rem] font-medium text-fog">
                    <TallyGroup animate={false} />
                    P for Poll
                </span>
                <Link className={`inline-flex items-center gap-2 rounded-full border border-hairline px-4 py-2 text-small font-medium text-ash transition-colors duration-150 hover:border-fog/40 hover:text-fog ${focusRing}`} to="/home">
                    {/* the same arrow icon as everywhere else, turned around to point back */}
                    <span className="rotate-180"><ArrowIcon /></span>
                    Home
                </Link>
            </nav>
        </>
    )

    //early return
    if (isLoading) return <AppLoading label="Counting the votes…" />
    if (!result) return (
        <div className={page}>
            {pageTop}
            <div className="mt-16 rounded-[20px] border border-dashed border-hairline px-6 py-12 sm:px-10">
                <h1 className="font-display text-[2rem] font-medium leading-tight tracking-[-0.02em] text-fog">Poll result not found</h1>
                <p className="mt-3 text-body text-ash">This link doesn't lead to a poll. It may have been deleted, or the link was copied incompletely.</p>
            </div>
        </div>
    )

    //If poll is expired then we will sow poll expired else we will show poll is live
    //by this we can get isExpired as string, or boolean, but we want it strictly true of false to use in the button
    // const isExpired = result.publicPoll.expiresAt && new Date(result.publicPoll.expiresAt) < new Date()
    const isExpired = result.publicPoll.expiresAt !== null && new Date(result.publicPoll.expiresAt) < new Date()

    // every bar is drawn as its share of all the votes, so the bars together add up to 100%
    const totalVotes = result.results.reduce((sum, option) => sum + option.voteCount, 0)
    // the highest count is the leader (several options can share it when they are tied). Nobody leads at 0 votes.
    const topCount = Math.max(...result.results.map(option => option.voteCount))


    return (
        <div className={page}>
            {pageTop}

            <header className="pt-8 pb-10 sm:pt-12">
                {isExpired ? (
                    <p className="flex flex-wrap items-center gap-x-4 gap-y-2 text-small font-medium text-ash">
                        {/* the same crooked rubber stamp closed polls get on Home */}
                        <span className="-rotate-6 rounded-md border-2 border-ash/70 px-2.5 py-1 font-display text-label font-semibold uppercase tracking-[0.16em] text-ash" aria-hidden="true">Closed</span>
                        Poll is Expired. These are the final results.
                    </p>
                ) : (
                    <p className="flex flex-wrap items-center gap-x-3 gap-y-2 text-small font-medium text-ash">
                        <span className="inline-flex items-center gap-2 rounded-full bg-mark px-2.5 py-1 text-label font-semibold uppercase tracking-[0.08em] text-void">
                            <span className="relative flex size-1.5" aria-hidden="true">
                                <span className="live-ping absolute inset-0 rounded-full bg-void" />
                                <span className="relative size-1.5 rounded-full bg-void" />
                            </span>
                            Live
                        </span>
                        Poll is Live. The count updates as votes come in.
                    </p>
                )}

                <h1 className={`mt-6 text-balance break-words font-display text-[clamp(2.25rem,6vw,3.75rem)] font-semibold leading-[1.02] tracking-[-0.03em] ${isExpired ? "text-ash" : "text-fog"}`}>{result.publicPoll.title}</h1>
                {result.publicPoll.description && <p className="mt-4 max-w-[65ch] break-words text-body text-ash">{result.publicPoll.description}</p>}
            </header>

            {/* the result slip: a solid marigold stub with the total on the left, torn along a dashed line from the bars on the right */}
            <main className="relative grid overflow-hidden rounded-card border border-hairline bg-ink sm:grid-cols-[13rem_minmax(0,1fr)]">

                <div className="relative overflow-hidden border-b border-dashed border-void/40 bg-mark p-6 text-void sm:border-r sm:border-b-0 sm:p-8">
                    <div className="ink-dots pointer-events-none absolute inset-0" aria-hidden="true" />
                    <div className="relative flex items-center justify-between gap-6 sm:block">
                        <p className="flex items-baseline gap-2.5 sm:block">
                            <span className="font-display text-[4.5rem] font-semibold leading-[0.9] tracking-[-0.04em] tabular-nums">{totalVotes}</span>
                            <span className="text-small font-semibold text-void/80 sm:mt-2 sm:block">{totalVotes === 1 ? "vote counted" : "votes counted"}</span>
                        </p>
                        {totalVotes > 0 && (
                            <div className="sm:mt-6">
                                <TallyMarks count={totalVotes} scale={1.5} strike="var(--color-void)" max={25} />
                            </div>
                        )}
                    </div>
                </div>

                <div className="min-w-0 p-6 sm:p-9">
                    <h2 className="break-words font-display text-[1.5rem] font-medium leading-[1.2] tracking-[-0.015em] text-fog">{result.question.questionText}</h2>

                    <ul className="mt-7 grid gap-6">
                        {
                            result.results.map((optionsResult, index) => {
                                const percent = totalVotes === 0 ? 0 : Math.round((optionsResult.voteCount / totalVotes) * 100)
                                const leading = totalVotes > 0 && optionsResult.voteCount === topCount

                                return (
                                <li key={optionsResult.optionId}>
                                    <div className="flex items-baseline justify-between gap-4">
                                        <p className="min-w-0 break-words text-body font-semibold text-fog">{optionsResult.optionText}</p>
                                        <p className="shrink-0 text-small text-ash tabular-nums">
                                            <span className={`font-display text-[1.375rem] font-semibold leading-none ${leading ? "text-mark" : "text-fog"}`}>{optionsResult.voteCount}</span>
                                            <span className="ml-2">{percent}%</span>
                                        </p>
                                    </div>

                                    {/* the bar. aria-hidden because the number and percent above already say the same thing in text.
                                        --w is read by the .vote-bar class in index.css, which also animates it. Each bar starts a little after the one above it. */}
                                    <div className="mt-2.5 h-3 overflow-hidden rounded-full bg-glass-strong" aria-hidden="true">
                                        <div
                                            className={`vote-bar h-full rounded-full ${leading ? "bg-mark" : "bg-fog/60"}`}
                                            style={{"--w": `${percent}%`, transitionDelay: `${index * 70}ms`} as CSSProperties}
                                        />
                                    </div>
                                </li>
                                )
                            })
                        }
                    </ul>

                    <div className="mt-9 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-hairline pt-7">
                        <button className={`inline-flex items-center gap-2 rounded-full bg-fog px-6 py-3 text-small font-semibold uppercase tracking-[0.08em] text-void transition-colors duration-150 hover:bg-mark disabled:cursor-not-allowed disabled:bg-glass-strong disabled:text-ash ${focusRing}`}
                            disabled={isExpired}
                            onClick={()=> navigate(`/poll/${slug}/pollVote`)}
                        >
                            Vote
                            <ArrowIcon />
                        </button>
                        {isExpired && <p className="text-small text-ash">Voting has ended for this poll.</p>}
                    </div>
                </div>
            </main>
        </div>
    )
}

export default PollResult
