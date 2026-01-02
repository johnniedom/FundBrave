import React, { useCallback } from "react";
import { ChevronDown } from "@/app/components/ui/icons";
import { cn } from "@/lib/utils";
import ReactRemoveScroll from "react-remove-scroll/dist/es5/Combination";
import IconButton from "../icon-button";
import motion from "motion";
import type {
  MediaActionsProps,
  SelectFieldProps,
  InputFieldProps,
  TextAreaFieldProps,
} from "../types/CreatePost.types";

import {
  GifIcon,
  PollIcon,
  Image as ImageIcon,
  MapPin,
  Calendar,
  Smile,
} from "../index";

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
    <div className="flex items-center gap-2 sm:gap-4 mt-4 flex-wrap">
      {mediaButtons.map(({ icon: Icon, label, onClick }) => (
        <IconButton
          key={label}
          ariaLabel={label}
          type="button"
          onClick={onClick}
          className="hover:bg-white/10 transition-colors p-2"
        >
          <Icon size={18} className="sm:w-5 sm:h-5" />
        </IconButton>
      ))}
    </div>
  );
};

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
      <label className="font-['Poppins'] font-medium text-[14px] sm:text-[16px] lg:text-[18px] text-white tracking-[0.72px] leading-[28px] sm:leading-[32px] lg:leading-[36px]">
        {label}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={handleChange}
          aria-label={label}
          required={required}
          className={cn(
            "w-full bg-neutral-dark-400 rounded-[12px] sm:rounded-[16px] lg:rounded-[20px]",
            "px-4 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-[18px]",
            "h-12 sm:h-13 lg:h-14",
            "font-['Poppins'] font-medium text-[14px] sm:text-[15px] lg:text-[16px]",
            "tracking-[0.64px] leading-[28px] sm:leading-[32px] lg:leading-[36px]",
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
          className="absolute right-4 sm:right-6 lg:right-8 top-1/2 -translate-y-1/2 text-white/60 pointer-events-none"
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
      <label className="font-['Poppins'] font-medium text-[14px] sm:text-[16px] lg:text-[18px] text-white tracking-[0.72px] leading-[28px] sm:leading-[32px] lg:leading-[36px]">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        required={required}
        className={cn(
          "w-full bg-neutral-dark-400 rounded-[12px] sm:rounded-[16px] lg:rounded-[20px]",
          "px-4 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-[18px]",
          "h-12 sm:h-13 lg:h-14",
          "font-['Poppins'] font-medium text-[14px] sm:text-[15px] lg:text-[16px]",
          "tracking-[0.64px] leading-[28px] sm:leading-[32px] lg:leading-[36px]",
          "text-white placeholder:text-white/60 outline-none",
          "focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50",
          "transition-all duration-200"
        )}
      />
    </div>
  );
};

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
        return "min-h-[200px] sm:min-h-[240px] lg:min-h-[272px]";
      case "188px":
        return "min-h-[150px] sm:min-h-[170px] lg:min-h-[188px]";
      default:
        return "";
    }
  };

  const minHeightClass = getMinHeightClass(minHeight);
  const containerStyle = minHeightClass ? {} : { minHeight };

  return (
    <div className="flex flex-col gap-2">
      {ReactRemoveScroll && (
        <ReactRemoveScroll>
          <label className="font-['Poppins'] font-medium text-[14px] sm:text-[16px] lg:text-[18px] text-white tracking-[0.72px] leading-[28px] sm:leading-[32px] lg:leading-[36px]">
            {label}
          </label>
        </ReactRemoveScroll>
      )}
      <div
        className={cn(
          "bg-neutral-dark-400 rounded-[12px] sm:rounded-[16px] lg:rounded-[20px]",
          "p-4 sm:p-6 lg:p-8 flex flex-col justify-between",
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
            "text-[14px] sm:text-[15px] lg:text-[16px] tracking-[0.64px]",
            "placeholder:text-white/60 resize-none flex-1 outline-none",
            "leading-[28px] sm:leading-[32px] lg:leading-[36px]"
          )}
        />
        {showMediaActions && mediaActions && <MediaActions {...mediaActions} />}
      </div>
    </div>
  );
};
