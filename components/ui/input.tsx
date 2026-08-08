import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, onClick, ...props }: React.ComponentProps<"input">) {
  // Date/time inputs only open their picker when the small calendar icon is
  // clicked, which reads as a dead field: clicking the text area does nothing.
  // Opening it on any click makes the whole control behave like the affordance
  // it looks like. showPicker() is optional-chained for browsers without it.
  const handleClick = (event: React.MouseEvent<HTMLInputElement>) => {
    if (type === "date" || type === "datetime-local" || type === "month" || type === "time") {
      event.currentTarget.showPicker?.()
    }
    onClick?.(event)
  }

  return (
    <input
      type={type}
      onClick={handleClick}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Input }
