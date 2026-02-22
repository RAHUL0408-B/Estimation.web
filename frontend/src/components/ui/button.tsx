import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
    "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-200 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98]",
    {
        variants: {
            variant: {
                default:
                    "bg-primary text-primary-foreground shadow-[0_2px_10px_rgba(249,115,22,0.2)] hover:bg-primary/95 hover:shadow-[0_4px_20px_rgba(249,115,22,0.3)]",
                destructive:
                    "bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 dark:bg-red-900/10 dark:text-red-400 dark:border-red-900/20",
                outline:
                    "border border-slate-200 bg-transparent shadow-sm hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300",
                secondary:
                    "bg-slate-100 text-slate-900 hover:bg-slate-200 shadow-sm",
                ghost: "hover:bg-slate-100 hover:text-slate-900",
                premium: "bg-secondary text-white shadow-lg hover:bg-black/90",
                link: "text-primary underline-offset-4 hover:underline",
            },
            size: {
                default: "h-11 px-6 py-2.5",
                sm: "h-9 rounded-lg px-4 text-xs",
                lg: "h-14 rounded-xl px-10 text-base",
                icon: "h-11 w-11 rounded-lg",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
)

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
        // Basic Slot support simulation if @radix-ui/react-slot is not installed, 
        // but typically we'd install it. For now, assuming basic button usage.
        // To be safe without installing slot:
        const Comp = "button"
        return (
            <Comp
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            />
        )
    }
)
Button.displayName = "Button"

export { Button, buttonVariants }
