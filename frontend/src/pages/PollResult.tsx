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
    if (isLoading) return <div>⏳ Loading data, please wait...</div>
    if (!result) return <div>Poll result not found</div>

    //If poll is expired then we will sow poll expired else we will show poll is live
    //by this we can get isExpired as string, or boolean, but we want it strictly true of false to use in the button
    // const isExpired = result.publicPoll.expiresAt && new Date(result.publicPoll.expiresAt) < new Date()
    const isExpired = result.publicPoll.expiresAt !== null && new Date(result.publicPoll.expiresAt) < new Date()


    return (
        <div>
            <h1>{isExpired ? "Poll is Expired" : "Poll is Live"}</h1>
            <div>
                        <div>
                            <h2>Title : {result.publicPoll.title}</h2>
                            <p>Description: {result.publicPoll.description}</p>
                            <h3>Question: {result.question.questionText}</h3>
                            {
                                result.results.map((optionsResult) => (
                                    <div key={optionsResult.optionId}>
                                        <p>{optionsResult.optionText}</p>
                                        <span>{optionsResult.voteCount}</span>
                                    </div>

                                ))
                            }
                            <button
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
