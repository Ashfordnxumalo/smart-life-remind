import { forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type PasswordInputProps = Omit<React.ComponentPropsWithoutRef<typeof Input>, "type">;

/**
 * Password field with a reveal toggle. Typing a password blind on a phone
 * keyboard is the main cause of failed sign-ins, and the toggle is expected
 * behaviour now rather than a nicety.
 */
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, ...props }, ref) => {
    const [visible, setVisible] = useState(false);

    return (
      <div className="relative">
        <Input
          ref={ref}
          type={visible ? "text" : "password"}
          // Room for the button so a long password doesn't run underneath it.
          className={cn("pr-10", className)}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          // Announced state matters more than the icon for screen readers.
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          // Keeps the field focused, so revealing doesn't dismiss the keyboard.
          onMouseDown={(e) => e.preventDefault()}
          className="absolute right-0 top-0 flex h-full w-10 items-center justify-center rounded-r-md text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    );
  }
);

PasswordInput.displayName = "PasswordInput";
