import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 transform hover:scale-105 active:scale-95",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-blue-500/80 to-purple-500/80 text-white shadow-lg hover:from-blue-400/90 hover:to-purple-400/90 backdrop-blur-xl",
        destructive:
          "bg-gradient-to-r from-red-500/80 to-pink-500/80 text-white shadow-lg hover:from-red-400/90 hover:to-pink-400/90 backdrop-blur-xl",
        outline: "border border-white/20 bg-white/10 text-white backdrop-blur-xl hover:bg-white/20",
        secondary:
          "bg-gradient-to-r from-emerald-500/80 to-teal-500/80 text-white shadow-lg hover:from-emerald-400/90 hover:to-teal-400/90 backdrop-blur-xl",
        ghost: "text-white hover:bg-white/10 backdrop-blur-sm",
        link: "text-blue-300 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-6 py-2",
        sm: "h-9 rounded-xl px-4",
        lg: "h-12 rounded-2xl px-8",
        icon: "h-11 w-11 rounded-2xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  },
)
Button.displayName = "Button"

export { Button, buttonVariants }
