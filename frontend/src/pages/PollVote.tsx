import {useEffect, useState} from "react";
import {api} from "../api/client.ts";
import {Link, useNavigate, useParams} from "react-router-dom";
import axios from "axios";
import {handleErrorTostify} from "../utils/tostify.error.msg.ts";
import {handleSuccessTostify} from "../utils/tostify.success.msg.ts";

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
    if (isLoading) return <div>⏳ Loading data, please wait...</div>
    if (!poll) return <div>Poll not found</div>

    //If poll is expired then we will redirect the user to the result page
    const isExpired = poll.publicPoll.expiresAt && new Date(poll.publicPoll.expiresAt) < new Date()
    if (isExpired) return (
        <div>
            <p>This poll is closed.</p>
            <Link to={`/poll/${slug}/pollResult`}>View results</Link>
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
        <div>
            <h1>Poll Title : {poll.publicPoll.title}</h1>
            <p>Description : {poll.publicPoll.description}</p>
            <h3>Question : {poll.question.questionText}</h3>
            <div>
                {
                    poll.options.map((option) => (
                        <label key={option.id}>
                            <input
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
                            {option.optionText}
                        </label>
                    ))
                }
            </div>
            <button
                // It's disabled until the user picks an option, and while a request is in flight, so a double-click can't send two votes
                disabled={isSubmitting || !selectedOptionId}
                onClick={()=>{handleVoting()}}
            >
                    {isSubmitting ? 'Submitting...' : 'Vote'}
            </button>
        </div>
    )
}

export default PollVote
