/*
  DESIGN CONTRACT (PollVote)
  THESIS: this page is the ballot. One marigold ballot paper on the dark sheet, and choosing an option
  draws a cross on it by hand. It refuses the default of a grey card with browser radio buttons.
  OWN-WORLD: same as Home and CreatePoll. Near-black dotted paper, off-white ink, the marigold as one whole
  field, dashed tear lines, and the crooked "Closed" stamp.
  STORY: a voter arrives from a shared link with no account, reads the question, marks one option and votes.
  FIRST VIEWPORT: the wordmark, then the ballot: title, description, question, options, "Vote".
  FORM: the finished version of the ballot previewed on CreatePoll; shaped directly, no seed.
*/
import {useEffect, useState} from "react";
import {api} from "../api/client.ts";
import {Link, useNavigate, useParams} from "react-router-dom";
import axios from "axios";
import {handleErrorTostify} from "../utils/tostify.error.msg.ts";
import {handleSuccessTostify} from "../utils/tostify.success.msg.ts";
import {TallyGroup} from "../components/TallyMarks.tsx";
import {ArrowIcon} from "../components/Icons.tsx";
import AppLoading from "../components/AppLoading.tsx";

function PollVote() {

    const navigate = useNavigate();

    type Option = {
        id: string;
        optionText: string;
        displayOrder: number;
    }
    type PollData = {
        publicPoll: { title: string; description: string | null; expiresAt: string | null }
        question: { questionText: string; allowMultiple: boolean }
        options: Option[]
    }

    const [poll, setPoll] = useState<PollData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    const {slug} = useParams()


    useEffect(() => {
        if (!slug) return


        async function fetchData(slug: string) {

            try {

                const fetchPollData = await api.get(`polls/${slug}`)
                setPoll(fetchPollData.data.data)
            }

            catch(error)
            {
                console.log(error)
                const message = axios.isAxiosError(error)
                    // The ?? fallback fires when it is an axios error, but there's no usable message
                    ? error.response?.data?.message ?? "Something went wrong"
                    // The : (else) branch of the ternary fires when it's not an axios error at all (some other kind of JS exception — a bug elsewhere in the try block, for instance)
                    : "Something went wrong"
                handleErrorTostify(message)
            }
            finally{
                setIsLoading(false);
            }
        }
        fetchData(slug)

    }, [])
    // the top of every state of this page: the dotted paper behind, and the wordmark
    const pageTop = (
        <>
            <div className="sheet-grid pointer-events-none fixed inset-0 -z-10" aria-hidden="true" />
            <p className="flex items-center gap-3 py-6 font-display text-[1.0625rem] font-medium text-fog">
                <TallyGroup animate={false} />
                P for Poll
            </p>
        </>
    )
    const page = "mx-auto flex min-h-dvh max-w-xl flex-col px-5 pb-16 sm:px-8"
    const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mark/70 focus-visible:ring-offset-2 focus-visible:ring-offset-void"

    //early returns
    if (isLoading) return <AppLoading label="Loading the ballot…" />
    if (!poll) return (
        <div className={page}>
            {pageTop}
            <div className="my-auto rounded-[20px] border border-dashed border-hairline px-6 py-12 sm:px-10">
                <h1 className="font-display text-[2rem] font-medium leading-tight tracking-[-0.02em] text-fog">Poll not found</h1>
                <p className="mt-3 text-body text-ash">This link doesn't lead to a poll. It may have been deleted, or the link was copied incompletely.</p>
            </div>
        </div>
    )

    //If poll is expired then we will redirect the user to the result page
    const isExpired = poll.publicPoll.expiresAt && new Date(poll.publicPoll.expiresAt) < new Date()
    if (isExpired) return (
        <div className={page}>
            {pageTop}
            <div className="card-enter my-auto rounded-[20px] border border-hairline bg-ink px-6 py-10 sm:px-10">
                {/* the same crooked rubber stamp closed polls get on Home */}
                <span className="inline-block -rotate-6 rounded-md border-2 border-ash/70 px-2.5 py-1 font-display text-label font-semibold uppercase tracking-[0.16em] text-ash" aria-hidden="true">Closed</span>
                <h1 className="mt-6 text-balance break-words font-display text-[2rem] font-medium leading-[1.1] tracking-[-0.02em] text-ash">{poll.publicPoll.title}</h1>
                <p className="mt-3 text-body text-ash">This poll is closed.</p>
                <Link className={`mt-7 inline-flex items-center gap-2 rounded-full bg-fog px-5 py-2.5 text-small font-semibold text-void transition-colors duration-150 hover:bg-mark ${focusRing}`} to={`/poll/${slug}/pollResult`}>View results <ArrowIcon /></Link>
            </div>
        </div>
    )

    async function handleVoting(){
        if(!selectedOptionId) return
        setIsSubmitting(true);

        try {
            const res = await api.post(`polls/${slug}/vote`, {
                //optionIds: [selectedOptionId]: the backend expects an array, even for a single choice, so the id is wrapped in [ ].
                // The key must be exactly optionIds, because the backend schema is strict and rejects anything else.
                optionIds: [selectedOptionId],
            })
            handleSuccessTostify(res.data.message)
            navigate(`/poll/${slug}/pollResult`)
        }
        catch(err){
            console.error(err)
            const message = axios.isAxiosError(err)
                ? err.response?.data?.message ?? "Something went wrong"
                : "Something went wrong"
            handleErrorTostify(message)
            // when someone has already voted, send them to the results as well, since that's what they'd want to see. Inside the catch, after the toast:
            if (axios.isAxiosError(err) && err.response?.status === 409) {
                navigate(`/poll/${slug}/pollResult`)
            }
        }
        finally {
            setIsSubmitting(false)
        }

    }

    return (
        <div className={page}>
            {pageTop}

            {/* the ballot paper: one solid block of the accent color, everything on it in dark ink */}
            <main className="card-enter relative my-auto overflow-hidden rounded-card bg-mark px-6 py-9 text-void sm:px-10 sm:py-11">
                <div className="ink-dots pointer-events-none absolute inset-0" aria-hidden="true" />

                <div className="relative">
                    <h1 className="text-balance break-words font-display text-[clamp(2rem,7vw,2.75rem)] font-semibold leading-[1.02] tracking-[-0.03em]">{poll.publicPoll.title}</h1>
                    {poll.publicPoll.description && <p className="mt-3 break-words text-body font-medium text-void/80">{poll.publicPoll.description}</p>}

                    <div className="mt-8 border-t border-dashed border-void/40 pt-7">
                        <h2 className="break-words font-display text-[1.25rem] font-semibold leading-[1.25] tracking-[-0.01em]">{poll.question.questionText}</h2>

                        <div className="mt-5 grid gap-2.5">
                            {
                                poll.options.map((option) => {
                                    const selected = selectedOptionId === option.id

                                    return (
                                    // the whole row is the label, so clicking anywhere on it picks the option.
                                    // has-[:focus-visible] styles the row when the (visually hidden) radio inside it has keyboard focus.
                                    <label key={option.id} className={`flex cursor-pointer items-center gap-3.5 rounded-field border-2 px-4 py-3.5 text-body font-semibold transition-colors duration-150 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-void has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-mark ${selected ? "border-void bg-void text-fog" : "border-void/30 hover:border-void/70"}`}>
                                        <input
                                            // sr-only hides the browser's own radio dot but keeps it in the page for keyboards and screen readers
                                            className="sr-only"
                                            name="option"
                                            type="radio"
                                       /*checked tells a radio button whether to appear selected: checked={true} shows it filled in, checked={false} shows it empty.
                                        Here we don't hardcode true or false; we give it a comparison*/
                                      /*1. The user clicks Blue.
                                        2. onChange runs and calls setSelectedOptionId("b2").
                                        3. React re-renders the component.
                                        4. Every radio re-evaluates its checked. Only Blue's comparison is true.*/
                                            checked={selectedOptionId === option.id}
                                            onChange={() => setSelectedOptionId(option.id)}
                                        />
                                        {/* our own mark in place of the radio dot: an empty circle, or a cross drawn in when chosen */}
                                        <span className={`flex size-6 shrink-0 items-center justify-center rounded-full border-2 ${selected ? "border-mark" : "border-void/70"}`} aria-hidden="true">
                                            {selected && (
                                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="var(--color-mark)" strokeWidth="2.2" strokeLinecap="round">
                                                    <line className="tally-stroke" pathLength={1} x1="2" y1="2" x2="10" y2="10" />
                                                    <line className="tally-stroke" style={{animationDelay: "90ms"}} pathLength={1} x1="10" y1="2" x2="2" y2="10" />
                                                </svg>
                                            )}
                                        </span>
                                        <span className="min-w-0 break-words">{option.optionText}</span>
                                    </label>
                                    )
                                })
                            }
                        </div>
                    </div>

                    <button className="mt-7 w-full rounded-full bg-void px-6 py-4 text-small font-semibold uppercase tracking-[0.08em] text-fog transition-colors duration-150 hover:bg-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-void focus-visible:ring-offset-2 focus-visible:ring-offset-mark disabled:cursor-not-allowed disabled:bg-void/15 disabled:text-void/70"
                        // It's disabled until the user picks an option, and while a request is in flight, so a double-click can't send two votes
                        disabled={isSubmitting || !selectedOptionId}
                        onClick={()=>{handleVoting()}}
                    >
                            {isSubmitting ? 'Submitting...' : 'Vote'}
                    </button>

                    <p className="mt-5 text-small font-medium text-void/80">
                        {poll.publicPoll.expiresAt
                            ? `Closes ${new Date(poll.publicPoll.expiresAt).toLocaleString(undefined, {dateStyle: "medium", timeStyle: "short"})}`
                            : "No closing date"}
                        <span className="block">One vote per browser, no account needed.</span>
                    </p>
                </div>
            </main>
        </div>
    )
}

export default PollVote
