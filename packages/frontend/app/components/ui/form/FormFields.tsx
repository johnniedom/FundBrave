import React, { useCallback } from "react";
import { ChevronDown, Image as ImageIcon, Smile, Calendar, MapPin } from "lucide-react";
import { cn } from "@/app/lib/utils";
import type { 
  MediaActionsProps,
  SelectFieldProps,
  InputFieldProps,
  TextAreaFieldProps
} from "../../types/CreatePost.types";

// Custom SVG Icons
const GifIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <rect
      x="2"
      y="6"
      width="20"
      height="12"
      rx="2"
      stroke="currentColor"
      strokeWidth="2"
    />
    <path
      d="M8 12v-2a1 1 0 0 1 1-1h2"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
    />
    <path d="M12 9h2" stroke="currentColor" strokeWidth="2" />
    <path d="M8 12h2" stroke="currentColor" strokeWidth="2" />
    <path
      d="M14 12v2a1 1 0 0 0 1 1h1"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
    />
  </svg>
);

const PollIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <rect
      x="3"
      y="3"
      width="18"
      height="18"
      rx="2"
      stroke="currentColor"
      strokeWidth="2"
    />
    <path d="M7 8h10" stroke="currentColor" strokeWidth="2" />
    <path d="M7 12h8" stroke="currentColor" strokeWidth="2" />
    <path d="M7 16h6" stroke="currentColor" strokeWidth="2" />
  </svg>
);

// Icon Button Component
const IconButton: React.FC<{
  children: React.ReactNode;
  onClick: () => void;
  ariaLabel: string;
  type?: "button" | "submit" | "reset";
  className?: string;
}> = ({ children, onClick, ariaLabel, type = "button", className }) => (
  <button
    type={type}
    onClick={onClick}
    aria-label={ariaLabel}
    className={cn(
      "p-2 rounded-full transition-colors duration-200",
      "hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500",
      className
    )}
  >
    {children}
  </button>
);

// Media Actions Component
const MediaActions: React.FC<MediaActionsProps> = ({
  onImageClick,
  onGifClick,
  onPollClick,
  onEmojiClick,
  onCalendarClick,
  onLocationClick,
}) => {
  const mediaButtons = [
    { icon: ImageIcon, label: "Insert Image", onClick: onImageClick },
    { icon: GifIcon, label: "Insert GIF", onClick: onGifClick },
    { icon: PollIcon, label: "Insert Poll", onClick: onPollClick },
    { icon: Smile, label: "Insert Emoji", onClick: onEmojiClick },
    { icon: Calendar, label: "Insert Calendar", onClick: onCalendarClick },
    { icon: MapPin, label: "Insert Location", onClick: onLocationClick },
  ];

  return (
    <div className="flex items-center gap-4 mt-4">
      {mediaButtons.map(({ icon: Icon, label, onClick }) => (
        <IconButton
          key={label}
          ariaLabel={label}
          type="button"
          onClick={onClick}
          className="hover:bg-white/10 transition-colors"
        >
          <Icon size={20} />
        </IconButton>
      ))}
    </div>
  );
};

// SelectField Component
export const SelectField: React.FC<SelectFieldProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder = "Select",
  required = false,
}) => {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onChange(e.target.value);
    },
    [onChange]
  );

  return (
    <div className="flex flex-col gap-2">
      <label className="font-['Poppins'] font-medium text-[18px] text-white tracking-[0.72px] leading-[36px]">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={handleChange}
          aria-label={label}
          required={required}
          className={cn(
            "w-full bg-[#221A31] rounded-[20px] px-8 py-[18px] h-14",
            "font-['Poppins'] font-medium text-[16px] tracking-[0.64px] leading-[36px]",
            "text-white/60 appearance-none cursor-pointer outline-none",
            "focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50",
            "transition-all duration-200"
          )}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <ChevronDown
          size={16}
          className="absolute right-8 top-1/2 -translate-y-1/2 text-white/60 pointer-events-none"
        />
      </div>
    </div>
  );
};

// InputField Component
export const InputField: React.FC<InputFieldProps> = ({
  label,
  value,
  onChange,
  placeholder = "",
  required = false,
}) => {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value);
    },
    [onChange]
  );

  return (
    <div className="flex flex-col gap-2">
      <label className="font-['Poppins'] font-medium text-[18px] text-white tracking-[0.72px] leading-[36px]">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        required={required}
        className={cn(
          "w-full bg-[#221A31] rounded-[20px] px-8 py-[18px] h-14",
          "font-['Poppins'] font-medium text-[16px] tracking-[0.64px] leading-[36px]",
          "text-white placeholder:text-white/60 outline-none",
          "focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50",
          "transition-all duration-200"
        )}
      />
    </div>
  );
};

// TextAreaField Component
export const TextAreaField: React.FC<TextAreaFieldProps> = ({
  label,
  value,
  onChange,
  placeholder = "",
  minHeight = "272px",
  showMediaActions = true,
  required = false,
  mediaActions,
}) => {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e.target.value);
    },
    [onChange]
  );

  // Convert minHeight to Tailwind class if it's a standard value
  const getMinHeightClass = (height: string) => {
    switch (height) {
      case "272px":
        return "min-h-[272px]";
      case "188px":
        return "min-h-[188px]";
      default:
        return "";
    }
  };

  const minHeightClass = getMinHeightClass(minHeight);
  const containerStyle = minHeightClass ? {} : { minHeight };

  return (
    <div className="flex flex-col gap-2">
      <label className="font-['Poppins'] font-medium text-[18px] text-white tracking-[0.72px] leading-[36px]">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      <div
        className={cn(
          "bg-[#221A31] rounded-[20px] p-8 flex flex-col justify-between",
          "focus-within:ring-2 focus-within:ring-purple-500 focus-within:ring-opacity-50",
          "transition-all duration-200",
          minHeightClass
        )}
        {...(Object.keys(containerStyle).length > 0 && {
          style: containerStyle,
        })}
      >
        <textarea
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          required={required}
          className={cn(
            "bg-transparent text-white/60 font-['Poppins'] font-medium",
            "text-[16px] tracking-[0.64px] placeholder:text-white/60",
            "resize-none flex-1 outline-none leading-[36px]"
          )}
        />
        {showMediaActions && mediaActions && <MediaActions {...mediaActions} />}
      </div>
    </div>
  );
};