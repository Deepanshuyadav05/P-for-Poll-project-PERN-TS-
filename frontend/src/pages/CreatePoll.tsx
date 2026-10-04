import {useFieldArray, useForm} from "react-hook-form";
import {type CreatePollInput, createPollSchema} from "../utils/poll.frontend.zod.validations.ts";
import {zodResolver} from "@hookform/resolvers/zod";
import {api} from "../api/client.ts";
import axios from "axios";
import {handleErrorTostify} from "../utils/tostify.error.msg.ts";
import {handleSuccessTostify} from "../utils/tostify.success.msg.ts";
import {Link} from "react-router-dom";
import {useState} from "react";


function CreatePoll() {

    const [pollLink, setPollLink] = useState<string | null>(null);

    const {register, control, handleSubmit, formState:{isSubmitting, errors}} = useForm<CreatePollInput>({
        resolver: zodResolver(createPollSchema),
        defaultValues: {
            title: "",
            question: {
                questionText: "",
                allowMultiple: false,
                options: [{value: ""}, {value: ""}],
            },
            isPublic: true,
        },
    })

    const {fields, append, remove} = useFieldArray({
        control,
        name: "question.options",
    })

    async function onSubmitHandler(data: CreatePollInput) {
        const payload = {
            title: data.title,
            description: data.description || undefined,
            question: {
                questionText: data.question.questionText,
                options: data.question.options.map((o) => o.value),
            },
            // backend's .datetime() only accepts the full ISO format in UTC, like "2026-10-05T10:00:00.000Z", so the raw input value would be rejected. toISOString() does the conversio
            expiresAt: data.expiresAt ? new Date(data.expiresAt).toISOString() : undefined,
        }
        try {
            const res = await api.post(`polls/createPoll`, payload)
            console.log(res)
            const slug = res.data.data.poll.slug
            // The slug just isn't a link by itself, so you'd build the full URL.
            // window.location.origin is the site's own address (http://localhost:5173 in dev), so the link keeps working after you deploy
            setPollLink(`${window.location.origin}/poll/${slug}/pollVote`)
            handleSuccessTostify("Poll created successfully.")

        }
        catch (err) {
            console.error(err)
            const message = axios.isAxiosError(err)
                ? err.response?.data?.message ?? "Something went wrong"
                : "Something went wrong"
            handleErrorTostify(message)
        }
    }

    if (pollLink) {
        return (
            <div>
                <h1>Poll created!</h1>
                <p>Share this link:</p>
                <input type="text" readOnly value={pollLink} />
                <button
                    onClick={async () => {
                        try {
                            await navigator.clipboard.writeText(pollLink)
                            handleSuccessTostify("Link copied")
                        }
                        catch (err) {
                            console.error(err)
                            const message = axios.isAxiosError(err)
                                ? err.response?.data?.message ?? "Something went wrong"
                                : "Something went wrong"
                            handleErrorTostify(message)
                        }

                    }}
                >Copy</button>
                <Link to="/home">Back to Home</Link>
            </div>
        )
    }

    return (
        <div>
            <Link to={'/home'}>Home</Link>

            <h1>CreatePoll</h1>
            <form onSubmit={handleSubmit(onSubmitHandler)}>
                {/*Title*/}
                <div>
                    <label htmlFor="title">Title</label>
                    <input
                        type="text"
                        id="title"
                        required
                        {...register("title")}
                    />
                    {errors.title && <p>{errors.title.message}</p>}
                </div>

                {/*Description*/}
                <div>
                    <label htmlFor="description">Description</label>
                    <input
                        type="text"
                        id="description"
                        {...register("description")}
                    />
                    {errors.description && <p>{errors.description.message}</p>}
                </div>

                {/*Question input*/}
                <div>
                    <label htmlFor="question">Question</label>
                    <input
                        type="text"
                        id="question"
                        required
                        // because question is an object.
                        {...register("question.questionText")}
                    />
                    {errors.question?.questionText && <p>{errors.question.questionText.message}</p>}
                </div>

                {/*Options input*/}
                {fields.map((field, index) => (
                    <div key={field.id}>
                        <input
                            type="text"
                            placeholder={`Option ${index + 1}`}
                            {...register(`question.options.${index}.value`)}
                        />
                        {fields.length > 2 && (
                            <button type="button" onClick={() => remove(index)}>Remove</button>
                        )}
                        {errors.question?.options?.[index]?.value && (
                            <p>{errors.question.options[index].value.message}</p>
                        )}
                    </div>
                ))}

                {/*// "Add option" button and the list-level error*/}
                {fields.length < 10 && (
                    <button type="button" onClick={() => append({value: ""})}>Add option</button>
                )}
                {errors.question?.options?.root && <p>{errors.question.options.root.message}</p>}

                {/*//Expire Date*/}
                <div>
                    <label htmlFor="expiresAt">Expires at (optional)</label>
                    <input
                        // It gives you a plain string like "2026-10-05T15:30", or "" if the user leaves it untouched. That string is in the user's local time and carries no timezone information.
                        type="datetime-local"
                        id="expiresAt"
                        {...register("expiresAt")}
                    />
                    {errors.expiresAt && <p>{errors.expiresAt.message}</p>}
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                >{isSubmitting ? "Submitting" : "Submit"}
                </button>

                
            </form>

        </div>
    )
}

export default CreatePoll
