import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-bold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 font-comic uppercase tracking-wide",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground border-4 border-foreground hover:brightness-110 hover:-translate-y-1 rounded-lg shadow-[4px_4px_0_hsl(var(--foreground))]",
        destructive: "bg-destructive text-destructive-foreground border-4 border-foreground hover:brightness-110 hover:-translate-y-1 rounded-lg shadow-[4px_4px_0_hsl(var(--foreground))]",
        outline: "border-4 border-foreground bg-background text-foreground hover:bg-muted hover:-translate-y-1 rounded-lg shadow-[4px_4px_0_hsl(var(--foreground))]",
        secondary: "bg-secondary text-secondary-foreground border-4 border-foreground hover:brightness-110 hover:-translate-y-1 rounded-lg shadow-[4px_4px_0_hsl(var(--foreground))]",
        ghost: "hover:bg-accent hover:text-accent-foreground rounded-md",
        link: "text-primary underline-offset-4 hover:underline",
        comic: "bg-primary text-primary-foreground border-4 border-foreground shadow-[4px_4px_0_hsl(var(--foreground))] hover:shadow-[6px_6px_0_hsl(var(--foreground))] hover:-translate-y-1 hover:-translate-x-1 active:shadow-none active:translate-x-1 active:translate-y-1 rounded-lg",
        judge: "bg-amber-500 text-amber-950 border-4 border-foreground shadow-[4px_4px_0_hsl(var(--foreground))] hover:shadow-[6px_6px_0_hsl(var(--foreground))] hover:-translate-y-1 rounded-lg",
        prosecutor: "bg-red-500 text-white border-4 border-foreground shadow-[4px_4px_0_hsl(var(--foreground))] hover:shadow-[6px_6px_0_hsl(var(--foreground))] hover:-translate-y-1 rounded-lg",
        lawyer: "bg-green-500 text-white border-4 border-foreground shadow-[4px_4px_0_hsl(var(--foreground))] hover:shadow-[6px_6px_0_hsl(var(--foreground))] hover:-translate-y-1 rounded-lg",
      },
      size: {
        default: "h-12 px-6 py-2",
        sm: "h-10 rounded-md px-4",
        lg: "h-14 rounded-xl px-8 text-lg",
        xl: "h-16 rounded-xl px-10 text-xl",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
