export default function RichstokLogo() {
    return (
        <div className="inline-flex items-center gap-3 select-none">
            <svg
                viewBox="0 0 100 100"
                className="h-14 w-14 shrink-0"
                aria-hidden="true"
            >
                <g
                    className="animate-logo-spin-slow"
                    style={{ transformOrigin: "center", transformBox: "fill-box" }}
                >
                    <circle
                        cx="50"
                        cy="50"
                        r="31"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeDasharray="14 8"
                        strokeLinecap="round"
                        className="text-orange-500"
                    />
                </g>

                <g
                    className="animate-logo-spin-reverse"
                    style={{ transformOrigin: "center", transformBox: "fill-box" }}
                >
                    <circle
                        cx="50"
                        cy="50"
                        r="22"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeDasharray="10 6"
                        strokeLinecap="round"
                        className="text-orange-400/90"
                    />
                </g>

                <circle
                    cx="50"
                    cy="50"
                    r="10"
                    fill="currentColor"
                    className="text-orange-500 animate-logo-pulse"
                    style={{ transformOrigin: "center", transformBox: "fill-box" }}
                />

                <circle
                    cx="50"
                    cy="50"
                    r="16"
                    fill="none"
                    stroke="rgba(255,120,20,0.18)"
                    strokeWidth="2"
                />
            </svg>

            <div className="relative">
        <span
            className="
            logo-wordmark
            relative z-10
            text-[24px] md:text-[26px]
            font-extrabold uppercase tracking-[0.18em]
          "
                >
          Richstok
        </span>

                <span
                    className="
            pointer-events-none absolute left-0 right-0 bottom-[2px] h-[3px]
            rounded-full
            bg-gradient-to-r from-transparent via-red-500 to-transparent
            opacity-90 blur-[0.5px]
            animate-logo-sweep
          "
                />

                <span
                    className="
            pointer-events-none absolute -inset-x-1 -bottom-1 h-5
            bg-gradient-to-r from-transparent via-orange-500/20 to-transparent
            blur-md
          "
                />
            </div>
        </div>
    );
}
