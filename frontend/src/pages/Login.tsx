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
        <div className="mx-auto max-w-xl space-y-4 p-6">
            <h1 className="text-2xl font-bold">Login</h1>
            <form className="space-y-4" onSubmit={handleSubmit(onSubmitHandler)}>

                <div>
                    <label className="mb-1 block text-sm" htmlFor="email">Email</label>
                    <input className="w-full rounded border border-neutral-700 bg-neutral-800 px-3 py-2"
                        type="email"
                        id="email"
                        placeholder="Enter your email"
                        {...register("email")}
                    />
                    {errors.email && <p className="text-sm text-red-400">{errors.email.message}</p>}
                </div>


                <div>
                    <label className="mb-1 block text-sm" htmlFor="password">Password</label>
                    <input className="w-full rounded border border-neutral-700 bg-neutral-800 px-3 py-2"
                        type="password"
                        id="password"
                        placeholder="Enter your password"
                        {...register("password")}
                    />
                    {errors.password && <p className="text-sm text-red-400">{errors.password.message}</p>}
                </div>

                <button className="rounded bg-blue-600 px-4 py-2 hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                    type="submit"
                    disabled={isSubmitting}
                >{isSubmitting ? "Submitting" : "Submit"}
                </button>

                <span className="block text-sm">
                    Don't have an account?
                    <Link className="ml-1 text-blue-400 underline" to="/signup">Signup</Link>
                </span>
            </form>
        </div>
    )
}

export default Login
