import {useEffect, useState} from "react";
import {useNavigate, useParams} from "react-router-dom";
import {api} from "../api/client.ts";
import axios from "axios";
import {handleErrorTostify} from "../utils/tostify.error.msg.ts";

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
