import { CircleHelp } from 'lucide-react'

export function HelpHint({ text, className = '' }) {
  return (
    <span className={`relative inline-flex items-center ${className}`}>
      <button
        type="button"
        className="group inline-flex h-4 w-4 items-center justify-center rounded-full text-[hsl(var(--muted-foreground))] transition hover:text-[hsl(var(--foreground))] focus-visible:outline-none"
        aria-label={text}
      >
        <CircleHelp size={14} />
        <span className="pointer-events-none absolute left-1/2 top-full z-50 mt-2 w-52 -translate-x-1/2 rounded-md border bg-[hsl(var(--card))] px-2 py-1 text-left text-xs font-normal text-[hsl(var(--card-foreground))] opacity-0 shadow-lg transition duration-100 group-hover:opacity-100 group-focus-visible:opacity-100">
          {text}
        </span>
      </button>
    </span>
  )
}
