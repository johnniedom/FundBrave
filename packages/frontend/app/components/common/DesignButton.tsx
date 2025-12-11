import { forwardRef } from "react";
import { cn } from "@/lib/utils";

// Figma mapping (node set 146:27) without Success Card
// Sizes: Large (60h), Big (56h), Medium (48h), Small (36h)
// Shared: radius 20px, Montserrat 600 16/24, tracking ~0.64px
// Primary: solid brand gradient / fallback primary, shadow glow
// Secondary: frosted glass w/ subtle border + shadow on layer
// Tertiary: gradient text only (no background) (acts like ghost/link)

type DesignButtonVariant = "primary" | "secondary" | "tertiary";
type DesignButtonSize = "large" | "big" | "medium" | "small";

export interface DesignButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: DesignButtonVariant;
  size?: DesignButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  loadingText?: string;
}

const sizeHeights: Record<DesignButtonSize, string> = {
  large: "h-[60px] px-[38px] py-[18px]",
  big: "h-[56px] px-8 py-4",
  medium: "h-[48px] px-6 py-3",
  small: "h-[36px] px-[18px] py-1.5",
};

// Gradient can be refined if design provides exact stops; using brand colors
const gradientClass =
  "bg-[linear-gradient(90deg,var(--color-primary)_0%,var(--color-purple-500)_50%,var(--color-soft-purple-500)_100%)]";

const variantBase: Record<DesignButtonVariant, string> = {
  primary: cn(
    gradientClass,
    "text-white shadow-[0_8px_30px_0_rgba(97,36,243,0.35)]",
    "hover:brightness-110 active:brightness-95"
  ),
  secondary: cn(
    "backdrop-blur-[18px] bg-[rgba(69,12,240,0.10)]",
    "relative text-white",
    "before:absolute before:inset-0 before:rounded-[20px] before:border before:border-[var(--color-primary)] before:shadow-[0_8px_30px_0_rgba(29,5,82,0.35)] before:pointer-events-none",
    "hover:bg-[rgba(69,12,240,0.14)] active:bg-[rgba(69,12,240,0.18)]"
  ),
  tertiary: cn(
    "relative text-transparent bg-clip-text",
    gradientClass,
    "hover:opacity-90 active:opacity-80"
  ),
};

export const DesignButton = forwardRef<HTMLButtonElement, DesignButtonProps>(
  (
    {
      className,
      children,
      variant = "primary",
      size = "large",
      fullWidth,
      loading = false,
      loadingText = "Please wait...",
      disabled,
      ...rest
    },
    ref
  ) => {
    const sizeClass = sizeHeights[size];
    const variantClass = variantBase[variant];
    const base = cn(
      "inline-flex items-center justify-center gap-2 select-none",
      "rounded-[20px] font-alt font-semibold tracking-[0.04em] text-[16px] leading-[24px]",
      "transition-all duration-[var(--duration-fast)] ease-[var(--ease-snappy)]",
      "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2",
      "disabled:opacity-50 disabled:cursor-not-allowed",
      sizeClass,
      variantClass,
      fullWidth && "w-full",
      className
    );

    return (
      <button
        ref={ref}
        className={base}
        disabled={disabled || loading}
        data-variant={variant}
        data-size={size}
        {...rest}
      >
        {loading && (
          <span className="inline-flex h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
        )}
        <span>{loading ? loadingText : children}</span>
      </button>
    );
  }
);

DesignButton.displayName = "DesignButton";

export default DesignButton;
