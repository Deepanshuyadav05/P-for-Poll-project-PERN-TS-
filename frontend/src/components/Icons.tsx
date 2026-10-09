import type {ReactNode} from "react";

// Small line icons, all drawn on the same 16px grid with the same stroke so they look like one set.
// They take the text color of whatever they sit in (stroke="currentColor").
function Icon({children}: {children: ReactNode}) {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
            {children}
        </svg>
    )
}

export function PlusIcon() {
    return <Icon><path d="M8 3v10M3 8h10" /></Icon>
}

export function ArrowIcon() {
    return <Icon><path d="M3 8h10M9 4l4 4-4 4" /></Icon>
}

export function LinkIcon() {
    return <Icon><path d="M6.8 9.2a2.6 2.6 0 0 0 3.7 0l2.2-2.2a2.6 2.6 0 0 0-3.7-3.7l-.9.9M9.2 6.8a2.6 2.6 0 0 0-3.7 0L3.3 9a2.6 2.6 0 0 0 3.7 3.7l.9-.9" /></Icon>
}

export function TrashIcon() {
    return <Icon><path d="M2.5 4.5h11M6.5 4.5V3h3v1.5M4 4.5l.6 8.5h6.8l.6-8.5M6.7 7.2v3.4M9.3 7.2v3.4" /></Icon>
}
