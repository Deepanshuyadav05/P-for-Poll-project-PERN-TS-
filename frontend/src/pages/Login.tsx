import {Link, useNavigate} from "react-router-dom";
import {useForm} from "react-hook-form";
import {type LoginFormInputs, loginSchema} from "../utils/auth.frontend.zod.validations.ts";
import {zodResolver} from "@hookform/resolvers/zod";
import {api} from "../api/client.ts";
import {handleSuccessTostify} from "../utils/tostify.success.msg.ts";
import axios from "axios";
import {handleErrorTostify} from "../utils/tostify.error.msg.ts";
import FieldError from "../components/FieldError.tsx";


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

    const fieldBase = "w-full rounded-field border border-hairline bg-glass px-4 py-[13px] font-body text-body text-fog placeholder:text-ash outline-none transition-colors duration-150 focus:border-fog/40 focus:bg-glass-strong aria-invalid:border-fog"
    const labelBase = "mb-2 block text-label font-semibold uppercase tracking-[0.08em] transition-colors duration-150"
    const labelClass = (hasError: boolean) => `${labelBase} ${hasError ? "text-fog" : "text-ash"}`

    return (
        <div className="flex min-h-dvh items-center justify-center px-4 py-10">
            <div className="card-enter w-full max-w-110 rounded-card border border-hairline bg-glass px-6 py-9 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.6)] sm:px-10 sm:py-10">

                <div className="mb-8">
                    <p className="text-label font-semibold uppercase tracking-[0.08em] text-ash">P for Poll</p>
                    <h1 className="mt-4 font-display text-[clamp(1.75rem,4vw,2.25rem)] font-medium leading-[1.1] tracking-[-0.01em] text-fog">Login</h1>
                    <p className="mt-2 text-body text-ash">Welcome back. Enter your details to continue.</p>
                </div>

                {/* noValidate turns off the browser's own validation popups, so the zod errors below are the only ones shown */}
                <form onSubmit={handleSubmit(onSubmitHandler)} noValidate>

                    <div>
                        <label className={labelClass(!!errors.email)} htmlFor="email">Email</label>
                        <input className={fieldBase}
                            type="email"
                            id="email"
                            autoComplete="email"
                            placeholder="Enter your email"
                            aria-invalid={errors.email ? "true" : "false"}
                            {...register("email")}
                        />
                        <FieldError message={errors.email?.message} />
                    </div>


                    <div className="mt-4">
                        <label className={labelClass(!!errors.password)} htmlFor="password">Password</label>
                        <input className={fieldBase}
                            type="password"
                            id="password"
                            autoComplete="current-password"
                            placeholder="Enter your password"
                            aria-invalid={errors.password ? "true" : "false"}
                            {...register("password")}
                        />
                        <FieldError message={errors.password?.message} />
                    </div>

                    <button className="mt-7 w-full rounded-button bg-fog py-3.5 text-small font-semibold uppercase tracking-[0.08em] text-void transition-colors duration-150 hover:bg-ash focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fog/40 focus-visible:ring-offset-2 focus-visible:ring-offset-void disabled:cursor-not-allowed disabled:bg-glass-strong disabled:text-smoke"
                        type="submit"
                        disabled={isSubmitting}
                    >{isSubmitting ? "Logging in…" : "Login"}
                    </button>

                    <p className="mt-6 text-center text-small text-ash">
                        Don't have an account?{' '}
                        <Link className="font-medium text-fog transition-opacity hover:opacity-80" to="/signup">Signup</Link>
                    </p>
                </form>
            </div>
        </div>
    )
}

export default Login
