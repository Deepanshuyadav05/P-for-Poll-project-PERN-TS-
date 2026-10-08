import {useEffect, useState} from "react";
import {useNavigate, useParams} from "react-router-dom";
import {api} from "../api/client.ts";
import axios from "axios";
import {handleErrorTostify} from "../utils/tostify.error.msg.ts";
import {socket} from "../api/socket.ts";

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



    //early return
    if (isLoading) return <div className="p-6">⏳ Loading data, please wait...</div>
    if (!result) return <div className="p-6">Poll result not found</div>

    //If poll is expired then we will sow poll expired else we will show poll is live
    //by this we can get isExpired as string, or boolean, but we want it strictly true of false to use in the button
    // const isExpired = result.publicPoll.expiresAt && new Date(result.publicPoll.expiresAt) < new Date()
    const isExpired = result.publicPoll.expiresAt !== null && new Date(result.publicPoll.expiresAt) < new Date()


    return (
        <div className="mx-auto max-w-xl space-y-4 p-6">
            <h1 className="text-2xl font-bold">{isExpired ? "Poll is Expired" : "Poll is Live"}</h1>
            <div>
                        <div className="space-y-3">
                            <h2 className="text-xl font-semibold">Title : {result.publicPoll.title}</h2>
                            <p className="text-neutral-400">Description: {result.publicPoll.description}</p>
                            <h3 className="text-lg font-semibold">Question: {result.question.questionText}</h3>
                            {
                                result.results.map((optionsResult) => (
                                    <div key={optionsResult.optionId} className="flex items-center justify-between rounded border border-neutral-700 px-3 py-2">
                                        <p>{optionsResult.optionText}</p>
                                        <span className="font-semibold">{optionsResult.voteCount}</span>
                                    </div>

                                ))
                            }
                            <button className="rounded bg-blue-600 px-4 py-2 hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                                disabled={isExpired}
                                onClick={()=> navigate(`/poll/${slug}/pollVote`)}
                            >
                                Vote
                            </button>

                        </div>
            </div>
        </div>
    )
}

export default PollResult
