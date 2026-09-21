import {Link, useNavigate} from "react-router-dom"
import {useForm} from "react-hook-form";
import {api} from "../api/client.ts";
import {zodResolver} from "@hookform/resolvers/zod"
import {type SignupFormInputs, signupSchema} from "../utils/auth.frontend.zod.validations.ts";
import {handleSuccessTostify} from "../utils/tostify.success.msg.ts";
import {handleErrorTostify} from "../utils/tostify.error.msg.ts";
import axios from "axios";


function Signup() {

    const navigate = useNavigate();

    const {register, handleSubmit, formState:{isSubmitting, errors}} = useForm<SignupFormInputs>({
        resolver: zodResolver(signupSchema), // zodResolver populates formState.error
        defaultValues: { name: "", email: "", password: "" },
        mode: "onTouched",
    })

    const onSubmitHandler = async(data:SignupFormInputs) => {

        try {

            await  api.post('/auth/signup', data)
            handleSuccessTostify("Signup successful!")
            navigate('/login')

        }catch(error) {
            console.error(error)
            // a type guard function that axios ship (isAxiosError)
            // in the catch block, error is typed unknown — TypeScript refuses to let you access .response or .data on something of type unknow
            //"If this error came from an axios request: try to read the backend's message field out of the response body. If that's not available for any reason (no response, or the body doesn't have a message), fall back to a generic
            //   ▎ string. If the error wasn't an axios error at all (some other kind of exception), just use the generic string
            const message = axios.isAxiosError(error)
                // The ?? fallback fires when it is an axios error, but there's no usable message
                ? error.response?.data?.message ?? "Something went wrong"
                // The : (else) branch of the ternary fires when it's not an axios error at all (some other kind of JS exception — a bug elsewhere in the try block, for instance)
                : "Something went wrong"
            handleErrorTostify(message)
        }

    }


    return (
        <div>
            <h1>Signup</h1>
            <form onSubmit={handleSubmit(onSubmitHandler)}>
                <div>
                    <label htmlFor="name">Name</label>
                    <input
                        type="text"
                        id="name"
                        autoFocus
                        placeholder="Enter your name"
                        {...register("name")}
                    />
                    {errors.name && <p>{errors.name.message}</p>}
                </div>

                <div>
                    <label htmlFor="email">Email</label>
                    <input
                        type="email"
                        id="email"
                        placeholder="Enter your email"
                        {...register("email")}
                    />
                    {errors.email && <p>{errors.email.message}</p>}
                </div>


                <div>
                    <label htmlFor="password">Password</label>
                    <input
                        type="password"
                        id="password"
                        placeholder="Enter your password"
                        {...register("password")}
                    />
                    {errors.password && <p>{errors.password.message}</p>}
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                >{isSubmitting ? "Submitting" : "Submit"}
                </button>

                <span>
                    Already have an account?
                    <Link to="/login">Login</Link>
                </span>
            </form>
        </div>
    )
}


export default Signup

