// How far each upright leans at the top and bottom (in viewBox units), so the strokes look drawn by hand instead of ruled
const LEAN = [[0.5, 0.1], [0.2, -0.3], [0.6, 0.2], [0.1, -0.2]]

type TallyGroupProps = {
    strokes?: number
    // this bundle's position in the whole count, used to stagger the draw-in animation
    startIndex?: number
    animate?: boolean
    // 1 = 26x20px. The big tally in the Home header uses a larger scale.
    scale?: number
    // color of the fifth, diagonal stroke
    strike?: string
}

// One bundle of tally strokes: up to four uprights, and the fifth is the diagonal strike.
export function TallyGroup({strokes = 5, startIndex = 0, animate = true, scale = 1.2, strike = "var(--color-mark)"}: TallyGroupProps) {
    const uprights = Math.min(strokes, 4)
    const strokeClass = animate ? "tally-stroke" : undefined

    return (
        <svg width={26 * scale} height={20 * scale} viewBox="0 0 26 20" fill="none" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true" className="shrink-0">
            {Array.from({length: uprights}, (_, i) => (
                <line
                    key={i}
                    className={strokeClass}
                    style={animate ? {animationDelay: `${(startIndex + i) * 24}ms`} : undefined}
                    pathLength={1}
                    x1={4 + i * 6 + LEAN[i][0]} y1={2.5} x2={4 + i * 6 + LEAN[i][1]} y2={17.5}
                    stroke="currentColor"
                />
            ))}
            {strokes >= 5 && (
                <line
                    className={strokeClass}
                    style={animate ? {animationDelay: `${(startIndex + 4) * 24}ms`} : undefined}
                    pathLength={1}
                    x1={1} y1={15.5} x2={25} y2={4.5}
                    stroke={strike}
                />
            )}
        </svg>
    )
}

type TallyMarksProps = {
    count: number
    scale?: number
    strike?: string
    // past this many strokes the sheet stops drawing and shows "+N" instead
    max?: number
}

// The count written the way votes are counted by hand: bundles of five.
function TallyMarks({count, scale = 1.2, strike, max = 50}: TallyMarksProps) {
    const shown = Math.min(count, max)
    // e.g. 12 -> [5, 5, 2]
    const groups = Array.from({length: Math.ceil(shown / 5)}, (_, i) => Math.min(5, shown - i * 5))

    return (
        // aria-hidden: the number next to it already says the count, the strokes are the picture of it
        <div className="flex flex-wrap items-center" style={{gap: `${8 * scale}px ${10 * scale}px`}} aria-hidden="true">
            {groups.map((strokes, i) => (
                <TallyGroup key={i} strokes={strokes} startIndex={i * 5} scale={scale} strike={strike} />
            ))}
            {count > max && <span className="text-small font-semibold">+{count - max}</span>}
        </div>
    )
}

export default TallyMarks
