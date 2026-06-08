import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-20 w-full rounded-3xl border border-input bg-[#f5f5f5] px-6 py-5 text-lg font-bold text-[#0c0a09] shadow-sm transition-all outline-none focus-visible:border-[#bc8e5c] focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50 placeholder:text-neutral-300 resize-none",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
