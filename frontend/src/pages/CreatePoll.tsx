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
            <div className="mx-auto max-w-xl space-y-4 p-6">
                <h1 className="text-2xl font-bold">Poll created!</h1>
                <p>Share this link:</p>
                <input className="w-full rounded border border-neutral-700 bg-neutral-800 px-3 py-2" type="text" readOnly value={pollLink} />
                <button className="rounded bg-blue-600 px-4 py-2 hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
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
                <Link className="text-blue-400 underline" to="/home">Back to Home</Link>
            </div>
        )
    }

    return (
        <div className="mx-auto max-w-xl space-y-4 p-6">
            <Link className="text-blue-400 underline" to={'/home'}>Home</Link>

            <h1 className="text-2xl font-bold">CreatePoll</h1>
            <form className="space-y-4" onSubmit={handleSubmit(onSubmitHandler)}>
                {/*Title*/}
                <div>
                    <label className="mb-1 block text-sm" htmlFor="title">Title</label>
                    <input className="w-full rounded border border-neutral-700 bg-neutral-800 px-3 py-2"
                        type="text"
                        id="title"
                        required
                        {...register("title")}
                    />
                    {errors.title && <p className="text-sm text-red-400">{errors.title.message}</p>}
                </div>

                {/*Description*/}
                <div>
                    <label className="mb-1 block text-sm" htmlFor="description">Description</label>
                    <input className="w-full rounded border border-neutral-700 bg-neutral-800 px-3 py-2"
                        type="text"
                        id="description"
                        {...register("description")}
                    />
                    {errors.description && <p className="text-sm text-red-400">{errors.description.message}</p>}
                </div>

                {/*Question input*/}
                <div>
                    <label className="mb-1 block text-sm" htmlFor="question">Question</label>
                    <input className="w-full rounded border border-neutral-700 bg-neutral-800 px-3 py-2"
                        type="text"
                        id="question"
                        required
                        // because question is an object.
                        {...register("question.questionText")}
                    />
                    {errors.question?.questionText && <p className="text-sm text-red-400">{errors.question.questionText.message}</p>}
                </div>

                {/*Options input*/}
                {fields.map((field, index) => (
                    <div key={field.id} className="flex flex-wrap gap-2">
                        <input className="min-w-0 flex-1 rounded border border-neutral-700 bg-neutral-800 px-3 py-2"
                            type="text"
                            placeholder={`Option ${index + 1}`}
                            {...register(`question.options.${index}.value`)}
                        />
                        {fields.length > 2 && (
                            <button className="rounded bg-blue-600 px-4 py-2 hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50" type="button" onClick={() => remove(index)}>Remove</button>
                        )}
                        {errors.question?.options?.[index]?.value && (
                            <p className="w-full text-sm text-red-400">{errors.question.options[index].value.message}</p>
                        )}
                    </div>
                ))}

                {/*// "Add option" button and the list-level error*/}
                {fields.length < 10 && (
                    <button className="rounded bg-blue-600 px-4 py-2 hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50" type="button" onClick={() => append({value: ""})}>Add option</button>
                )}
                {errors.question?.options?.root && <p className="text-sm text-red-400">{errors.question.options.root.message}</p>}

                {/*//Expire Date*/}
                <div>
                    <label className="mb-1 block text-sm" htmlFor="expiresAt">Expires at (optional)</label>
                    <input className="w-full rounded border border-neutral-700 bg-neutral-800 px-3 py-2"
                        // It gives you a plain string like "2026-10-05T15:30", or "" if the user leaves it untouched. That string is in the user's local time and carries no timezone information.
                        type="datetime-local"
                        id="expiresAt"
                        {...register("expiresAt")}
                    />
                    {errors.expiresAt && <p className="text-sm text-red-400">{errors.expiresAt.message}</p>}
                </div>

                <button className="rounded bg-blue-600 px-4 py-2 hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                    type="submit"
                    disabled={isSubmitting}
                >{isSubmitting ? "Submitting" : "Submit"}
                </button>

                
            </form>

        </div>
    )
}

export default CreatePoll
