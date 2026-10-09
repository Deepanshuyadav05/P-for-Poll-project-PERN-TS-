/*
  DESIGN CONTRACT (CreatePoll)
  THESIS: creating a poll is drafting a ballot. The form sits on the dark sheet and the ballot itself fills in
  beside it as you type. It refuses the default of a lone centered form card.
  OWN-WORLD: same as Home. Near-black dotted paper, off-white ink, glass fields, and the marigold used as one
  whole field: here it is the ballot paper.
  STORY: the creator writes the poll, sees exactly what voters will get, creates it and copies the link.
  FIRST VIEWPORT: wordmark and "Back to polls"; the heading; fields on the left; the marigold ballot preview
  and the "Create poll" button on the right (below the fields on small screens).
  FORM: form with a live artifact preview; shaped directly, no seed.
*/
import {useFieldArray, useForm, useWatch} from "react-hook-form";
import {type CreatePollInput, createPollSchema} from "../utils/poll.frontend.zod.validations.ts";
import {zodResolver} from "@hookform/resolvers/zod";
import {api} from "../api/client.ts";
import axios from "axios";
import {handleErrorTostify} from "../utils/tostify.error.msg.ts";
import {handleSuccessTostify} from "../utils/tostify.success.msg.ts";
import {Link} from "react-router-dom";
import {useState} from "react";
import FieldError from "../components/FieldError.tsx";
import {TallyGroup} from "../components/TallyMarks.tsx";
import {ArrowIcon, PlusIcon, TrashIcon} from "../components/Icons.tsx";


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

    // useWatch gives the current form values on every keystroke, which is what the ballot preview is drawn from.
    // (register alone does not re-render the component while typing, so without this the preview would never update.)
    const preview = useWatch({control})

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

    const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mark/70 focus-visible:ring-offset-2 focus-visible:ring-offset-void"
    // focus ring for controls that sit on the marigold, where a marigold ring would be invisible
    const focusRingOnMark = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-void focus-visible:ring-offset-2 focus-visible:ring-offset-mark"

    if (pollLink) {
        return (
            <div className="flex min-h-dvh items-center justify-center px-5 py-10">
                <div className="sheet-grid pointer-events-none fixed inset-0 -z-10" aria-hidden="true" />

                <div className="card-enter relative w-full max-w-xl overflow-hidden rounded-card bg-mark px-6 py-10 text-void sm:px-10 sm:py-12">
                    <div className="ink-dots pointer-events-none absolute inset-0" aria-hidden="true" />

                    <div className="relative">
                        <TallyGroup scale={3} strike="var(--color-void)" />
                        <h1 className="mt-6 font-display text-[clamp(2.5rem,8vw,3.75rem)] font-semibold leading-none tracking-[-0.03em]">Poll created!</h1>
                        <p className="mt-5 text-body font-medium text-void/80">Share this link:</p>

                        <div className="mt-3 flex flex-col gap-2.5 sm:flex-row">
                            <input className={`min-w-0 flex-1 rounded-field bg-void px-4 py-3 font-body text-body text-fog ${focusRingOnMark}`} type="text" readOnly value={pollLink} aria-label="Poll link" />
                            <button className={`rounded-field border-2 border-void px-6 py-3 text-small font-semibold uppercase tracking-[0.08em] text-void transition-colors duration-150 hover:bg-void hover:text-fog ${focusRingOnMark}`}
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
                        </div>

                        <Link className={`mt-8 inline-flex items-center gap-2 rounded-sm text-small font-semibold text-void underline decoration-void/40 underline-offset-[5px] transition-colors duration-150 hover:decoration-void ${focusRingOnMark}`} to="/home">Back to Home <ArrowIcon /></Link>
                    </div>
                </div>
            </div>
        )
    }

    const fieldBase = "w-full rounded-field border border-hairline bg-glass px-4 py-[13px] font-body text-body text-fog placeholder:text-ash outline-none transition-colors duration-150 focus:border-mark/70 focus:bg-glass-strong aria-invalid:border-fog"
    const labelBase = "mb-2 block text-label font-semibold uppercase tracking-[0.08em] transition-colors duration-150"
    const labelClass = (hasError: boolean) => `${labelBase} ${hasError ? "text-fog" : "text-ash"}`
    const sectionHeading = "font-display text-[1.375rem] font-medium leading-tight tracking-[-0.01em] text-fog"

    // text that is still empty in the form shows up on the ballot as a faded stand-in
    const filled = "text-void"
    const blank = "text-void/65"
    const previewOptions = preview.question?.options ?? []

    return (
        <div className="mx-auto max-w-5xl px-5 pb-24 sm:px-8">
            <div className="sheet-grid pointer-events-none fixed inset-0 -z-10" aria-hidden="true" />

            <nav className="flex items-center justify-between py-6">
                <span className="flex items-center gap-3 font-display text-[1.0625rem] font-medium text-fog">
                    <TallyGroup animate={false} />
                    P for Poll
                </span>
                <Link className={`inline-flex items-center gap-2 rounded-full border border-hairline px-4 py-2 text-small font-medium text-ash transition-colors duration-150 hover:border-fog/40 hover:text-fog ${focusRing}`} to={'/home'}>
                    {/* the same arrow icon as everywhere else, turned around to point back */}
                    <span className="rotate-180"><ArrowIcon /></span>
                    Home
                </Link>
            </nav>

            <header className="pt-8 pb-12 sm:pt-12">
                <h1 className="text-balance font-display text-[clamp(2.5rem,7vw,4.5rem)] font-semibold leading-[0.98] tracking-[-0.03em] text-fog">Create a poll</h1>
                <p className="mt-5 max-w-[52ch] text-body text-ash">Write the question and its options. The ballot fills in as you type, so you see what voters will get.</p>
            </header>

            {/* noValidate turns off the browser's own validation popups, so the zod errors below are the only ones shown */}
            <form className="grid gap-x-12 gap-y-12 lg:grid-cols-[minmax(0,1fr)_23rem]" onSubmit={handleSubmit(onSubmitHandler)} noValidate>

                <div className="min-w-0">
                    <section>
                        <h2 className={sectionHeading}>The poll</h2>

                        {/*Title*/}
                        <div className="mt-6">
                            <label className={labelClass(!!errors.title)} htmlFor="title">Title</label>
                            <input className={fieldBase}
                                type="text"
                                id="title"
                                required
                                placeholder="Team lunch on Friday"
                                aria-invalid={errors.title ? "true" : "false"}
                                {...register("title")}
                            />
                            <FieldError message={errors.title?.message} />
                        </div>

                        {/*Description*/}
                        <div className="mt-5">
                            <label className={labelClass(!!errors.description)} htmlFor="description">Description (optional)</label>
                            <input className={fieldBase}
                                type="text"
                                id="description"
                                placeholder="A line of context for voters"
                                aria-invalid={errors.description ? "true" : "false"}
                                {...register("description")}
                            />
                            <FieldError message={errors.description?.message} />
                        </div>
                    </section>

                    <section className="mt-12 border-t border-hairline pt-10">
                        <h2 className={sectionHeading}>The question</h2>

                        {/*Question input*/}
                        <div className="mt-6">
                            <label className={labelClass(!!errors.question?.questionText)} htmlFor="question">Question</label>
                            <input className={fieldBase}
                                type="text"
                                id="question"
                                required
                                placeholder="Where should we eat?"
                                aria-invalid={errors.question?.questionText ? "true" : "false"}
                                // because question is an object.
                                {...register("question.questionText")}
                            />
                            <FieldError message={errors.question?.questionText?.message} />
                        </div>

                        <div className="mt-5">
                            <p className={labelClass(!!errors.question?.options?.root)}>Options</p>

                            {/*Options input*/}
                            <div className="grid gap-2.5">
                                {fields.map((field, index) => (
                                    <div key={field.id}>
                                        <div className="flex items-center gap-2.5">
                                            {/* the empty circle a voter will fill in */}
                                            <span className="size-4 shrink-0 rounded-full border-2 border-smoke" aria-hidden="true" />
                                            <input className={fieldBase}
                                                type="text"
                                                placeholder={`Option ${index + 1}`}
                                                aria-label={`Option ${index + 1}`}
                                                aria-invalid={errors.question?.options?.[index]?.value ? "true" : "false"}
                                                {...register(`question.options.${index}.value`)}
                                            />
                                            {fields.length > 2 && (
                                                <button className={`flex size-[50px] shrink-0 items-center justify-center rounded-field border border-hairline text-ash transition-colors duration-150 hover:border-fog/40 hover:text-fog ${focusRing}`} type="button" onClick={() => remove(index)} aria-label={`Remove option ${index + 1}`}>
                                                    <TrashIcon />
                                                </button>
                                            )}
                                        </div>
                                        {errors.question?.options?.[index]?.value && (
                                            <div className="pl-[26px]">
                                                <FieldError message={errors.question.options[index].value.message} />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/*// "Add option" button and the list-level error*/}
                            {fields.length < 10 && (
                                <button className={`mt-2.5 ml-[26px] flex w-[calc(100%-26px)] items-center justify-between rounded-field border border-dashed border-hairline px-4 py-[13px] text-small font-semibold text-ash transition-colors duration-150 hover:border-fog/40 hover:text-fog ${focusRing}`} type="button" onClick={() => append({value: ""})}>
                                    <span className="flex items-center gap-2"><PlusIcon /> Add option</span>
                                    <span className="font-medium tabular-nums">{fields.length} of 10</span>
                                </button>
                            )}
                            <FieldError message={errors.question?.options?.root?.message} />
                        </div>
                    </section>

                    <section className="mt-12 border-t border-hairline pt-10">
                        <h2 className={sectionHeading}>Closing</h2>

                        {/*//Expire Date*/}
                        <div className="mt-6">
                            <label className={labelClass(!!errors.expiresAt)} htmlFor="expiresAt">Expires at (optional)</label>
                            <input className={`${fieldBase} sm:max-w-xs`}
                                // It gives you a plain string like "2026-10-05T15:30", or "" if the user leaves it untouched. That string is in the user's local time and carries no timezone information.
                                type="datetime-local"
                                id="expiresAt"
                                aria-invalid={errors.expiresAt ? "true" : "false"}
                                {...register("expiresAt")}
                            />
                            <FieldError message={errors.expiresAt?.message} />
                            <p className="mt-2 text-small text-ash">Leave it empty and the poll stays open.</p>
                        </div>
                    </section>
                </div>

                {/* right column: the ballot preview and the submit button. On large screens it stays in view while the form scrolls. */}
                <div className="grid gap-5 lg:sticky lg:top-8 lg:self-start">

                    <p className="-mb-2 flex items-center gap-2 text-label font-semibold uppercase tracking-[0.08em] text-ash">
                        <span className="size-1.5 rounded-full bg-mark" aria-hidden="true" />
                        Voter live preview
                    </p>

                    {/* aria-hidden: this only repeats what is already in the form fields, so screen readers skip it */}
                    <aside className="relative overflow-hidden rounded-card bg-mark px-6 py-7 text-void sm:px-7" aria-hidden="true">
                        <div className="ink-dots pointer-events-none absolute inset-0" />

                        <div className="relative">
                            <p className={`break-words font-display text-[1.625rem] font-semibold leading-[1.1] tracking-[-0.02em] ${preview.title ? filled : blank}`}>{preview.title || "Your poll title"}</p>
                            {preview.description && <p className="mt-2 break-words text-small font-medium text-void/80">{preview.description}</p>}

                            <div className="mt-6 border-t border-dashed border-void/40 pt-5">
                                <p className={`break-words text-body font-semibold ${preview.question?.questionText ? filled : blank}`}>{preview.question?.questionText || "Your question"}</p>

                                <ul className="mt-4 grid gap-2">
                                    {previewOptions.map((option, index) => (
                                        <li key={index} className={`flex items-center gap-3 rounded-field border border-void/30 px-3.5 py-2.5 text-small font-semibold ${option?.value ? filled : blank}`}>
                                            <span className="size-3.5 shrink-0 rounded-full border-2 border-void/70" />
                                            <span className="min-w-0 break-words">{option?.value || `Option ${index + 1}`}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <p className="mt-6 text-small font-medium text-void/80">
                                {preview.expiresAt
                                    ? `Closes ${new Date(preview.expiresAt).toLocaleString(undefined, {dateStyle: "medium", timeStyle: "short"})}`
                                    : "No closing date"}
                            </p>
                        </div>
                    </aside>

                    <button className={`flex w-full items-center justify-center gap-2.5 rounded-full bg-fog px-6 py-4 text-small font-semibold uppercase tracking-[0.08em] text-void transition-colors duration-150 hover:bg-mark disabled:cursor-not-allowed disabled:bg-glass-strong disabled:text-ash ${focusRing}`}
                        type="submit"
                        disabled={isSubmitting}
                    >{isSubmitting ? "Creating…" : "Create poll"}
                    </button>
                </div>

            </form>

        </div>
    )
}

export default CreatePoll
