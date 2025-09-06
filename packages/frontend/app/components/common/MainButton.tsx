import { forwardRef, ReactElement } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import Image from "next/image";

type MainButtonProps = {
  text: string;
  form?: string;
  isLoading?: boolean;
  action?: () => void;
  isSubmitable?: boolean;
  disabled?: boolean;
  width?: "full_width" | "contain" | string; // custom width e.g. w-[180px] or raw 180px
  dataLoadingText?: string;
  variant?: "primary" | "secondary"; // could extend later (outline, ghost, etc.)
  className?: string;
  iconRoute?: string;
  rightIconRoute?: string;
  rightIconClass?: string;
  iconComponent?: ReactElement;
  size?: "small" | "normal" | "large";
};

const MainButton = forwardRef<HTMLButtonElement, MainButtonProps>(
  (
    {
      text,
      isLoading = false,
      form,
      action,
      disabled = false,
      isSubmitable,
      width,
      dataLoadingText = "Please wait ...",
      variant = "primary",
      className,
      iconRoute,
      rightIconRoute,
      rightIconClass = "w-[24px] h-[24px]",
      iconComponent,
      size = "normal",
    },
    ref
  ) => {
    // Width mapping
    let widthClass = "";
    if (width === "full_width") widthClass = "w-full";
    else if (width && width !== "contain") {
      // Accept either full utility (w-[180px]) or raw number (180px)
      widthClass =
        width.startsWith("w-") || width.startsWith("max-")
          ? width
          : width.match(/^[0-9.]+(px|rem|%)?$/)
          ? `w-[${width}]`
          : width; // fallback
    }

    // Size mapping using design tokens (spacing scale)
    const sizeClasses = {
      small: "h-[var(--spacing-10)] text-sm px-4",
      normal: "h-[var(--spacing-12)] text-base px-5",
      large: "h-[var(--spacing-16)] text-lg px-6",
    } as const;
    const sizeClass = sizeClasses[size] ?? sizeClasses.normal;

    // Variant styles leveraging design tokens
    const variantClasses = {
      primary:
        "bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:bg-[var(--color-primary-600)]",
      secondary:
        "bg-[var(--color-secondary)] text-[var(--color-secondary-foreground)] hover:bg-[var(--color-secondary-foreground)/10]",
    } as const;
    const variantClass = variantClasses[variant] ?? variantClasses.primary;

    const baseClasses = [
      "inline-flex items-center justify-center select-none gap-2",
      "rounded-[var(--radius-btn)] font-medium tracking-wide",
      "transition-colors duration-[var(--duration-fast)] ease-[var(--ease-snappy)]",
      "focus-ring disabled:opacity-50 disabled:cursor-not-allowed",
      "shadow-sm",
    ].join(" ");

    if (!isLoading) {
      return (
        <Button
          form={form}
          className={[
            baseClasses,
            variantClass,
            sizeClass,
            widthClass,
            className,
          ]
            .filter(Boolean)
            .join(" ")}
          onClick={!disabled ? action : () => undefined}
          type={isSubmitable ? "submit" : "button"}
          ref={ref}
          disabled={disabled}
        >
          {iconRoute && (
            <Image
              src={iconRoute}
              alt="left button icon"
              className="w-6 h-6"
              height={24}
              width={24}
            />
          )}
          {iconComponent}
          <span className="flex items-center">
            {text}
            {rightIconRoute && (
              <>
                <span className="ml-2 inline-flex">
                  <Image
                    src={rightIconRoute}
                    alt="right button icon"
                    className={rightIconClass}
                    height={24}
                    width={24}
                  />
                </span>
              </>
            )}
          </span>
        </Button>
      );
    }

    return (
      <Button
        className={[
          baseClasses,
          variantClasses[variant] ?? variantClasses.primary,
          sizeClass,
          widthClass,
          "cursor-not-allowed opacity-70",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        ref={ref}
        disabled
      >
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="ml-2">{dataLoadingText}</span>
      </Button>
    );
  }
);

// Assigned display name
MainButton.displayName = "MainButton";

export default MainButton;
