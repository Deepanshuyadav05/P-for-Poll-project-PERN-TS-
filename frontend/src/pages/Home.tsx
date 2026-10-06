import {useState, useEffect} from "react";
import {api} from "../api/client.ts";
import {handleErrorTostify} from "../utils/tostify.error.msg.ts";
import axios from "axios";
import {handleSuccessTostify} from "../utils/tostify.success.msg.ts";
import {Link, useNavigate} from "react-router-dom";

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
    };

    const [userName, setUserName] = useState("User");
    const [isLoading, setIsLoading] = useState(true);
    const [myPolls, setMyPolls] = useState<Poll[]>([]);


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

    if (isLoading) return <div>⏳ Loading data, please wait...</div>

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



    return (
        <div>
            <nav>
                <h1>Welcome {userName}</h1>
                <button onClick={() => {handleLogout()}}>Logout</button>
            </nav>
            <main>
                <Link to={'/poll/createPoll'}>
                    <button>Create Poll</button>
                </Link>

                <div>
                    <h3>My Polls</h3>
                    {myPolls.length === 0 && <p>You haven't created any polls yet.</p>}
                    <ul>
                            {
                                myPolls.map((poll) => (
                                    <li key={poll.id}>
                                        Title : {poll.title}
                                        Description : {poll.description}
                                        Poll type : {poll.isPublic ? "Public" : "Private"}
                                        Created at : {poll.createdAt}
                                        Expires on : {poll.expiresAt}

                                        <Link to={`/poll/${poll.slug}/pollResult`}>View Result</Link>
                                        <Link to={`/poll/${poll.slug}/pollVote`}>Votes</Link>

                                        <button onClick={() => {handleDelete(poll.slug)}} >Delete</button>
                                    </li>
                                  )
                                )
                            }

                    </ul>
                </div>

            </main>


        </div>
    )
}

export default Home
