import {Link, useNavigate} from "react-router-dom";
import {useForm} from "react-hook-form";
import {type LoginFormInputs, loginSchema} from "../utils/auth.frontend.zod.validations.ts";
import {zodResolver} from "@hookform/resolvers/zod";
import {api} from "../api/client.ts";
import {handleSuccessTostify} from "../utils/tostify.success.msg.ts";
import axios from "axios";
import {handleErrorTostify} from "../utils/tostify.error.msg.ts";


function Login() {

    const navigate = useNavigate();

    const {register, handleSubmit, formState:{isSubmitting, errors}} = useForm<LoginFormInputs>({
        resolver: zodResolver(loginSchema), // zodResolver populates formState.error
        defaultValues: { email: "", password: "" },
        mode: "onTouched",
    })

    const onSubmitHandler = async(data:LoginFormInputs) => {

        try {

            await  api.post('/auth/login', data)
            handleSuccessTostify("Login successful!")
            navigate('/home')

        }catch(error) {
            console.error(error)
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
            <h1>Login</h1>
            <form onSubmit={handleSubmit(onSubmitHandler)}>

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
                    Don't have an account?
                    <Link to="/signup">Signup</Link>
                </span>
            </form>
        </div>
    )
}

export default Login
