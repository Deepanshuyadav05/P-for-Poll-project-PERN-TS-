function FieldError({message}: {message?: string}) {
    if (!message) return null
    return (
        <p className="mt-1.5 flex items-center gap-1.5 text-small font-medium text-fog">
            <svg width="9" height="9" viewBox="0 0 10 10" fill="currentColor" aria-hidden="true" className="shrink-0">
                <path d="M5 0.5L9.5 9H0.5L5 0.5Z" />
            </svg>
            {message}
        </p>
    )
}

export default FieldError
