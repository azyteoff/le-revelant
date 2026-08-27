import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "tomato";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 font-medium whitespace-nowrap rounded-full " +
  "transition-[background-color,color,border-color,transform,box-shadow] duration-300 " +
  "[transition-timing-function:var(--ease-soft)] active:scale-[0.97] disabled:opacity-40 " +
  "disabled:pointer-events-none select-none";

const variants: Record<Variant, string> = {
  primary:
    "bg-ink text-cream hover:bg-olive-deep shadow-[0_1px_2px_rgb(20_19_15/0.12)] hover:shadow-lift",
  secondary:
    "border border-ink/15 text-ink bg-transparent hover:bg-ink/[0.045] hover:border-ink/30",
  ghost: "text-ink hover:bg-ink/[0.05]",
  tomato: "bg-tomato text-cream hover:bg-tomato/90 shadow-lift",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-[0.8125rem]",
  md: "h-11 px-6 text-sm",
  lg: "h-[3.25rem] px-8 text-[0.9375rem]",
};

type CommonProps = { variant?: Variant; size?: Size; children: ReactNode };

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...rest
}: CommonProps & ComponentProps<"button">) {
  return (
    <button className={cn(base, variants[variant], sizes[size], className)} {...rest} />
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  ...rest
}: CommonProps & ComponentProps<typeof Link>) {
  return (
    <Link className={cn(base, variants[variant], sizes[size], className)} {...rest} />
  );
}
