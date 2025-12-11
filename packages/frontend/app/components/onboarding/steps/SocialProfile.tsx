"use client";

import React, { useState } from "react";
import { StepComponentProps } from "@/lib/onboarding-steps";
import { motion } from "motion/react";
import { Loader2 } from "lucide-react";
import { z } from "zod";

// Custom social icons as inline SVGs for exact design match
const LinkedInIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77Z" />
  </svg>
);

const XIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8 1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3Z" />
  </svg>
);

// Validation schema
const socialSchema = z.object({
  linkedin: z
    .string()
    .url("Please enter a valid URL")
    .regex(/linkedin\.com/i, "Please enter a valid LinkedIn URL")
    .optional()
    .or(z.literal("")),
  twitter: z
    .string()
    .url("Please enter a valid URL")
    .regex(/x\.com|twitter\.com/i, "Please enter a valid X/Twitter URL")
    .optional()
    .or(z.literal("")),
  instagram: z
    .string()
    .url("Please enter a valid URL")
    .regex(/instagram\.com/i, "Please enter a valid Instagram URL")
    .optional()
    .or(z.literal("")),
});

type SocialFormData = z.infer<typeof socialSchema>;

interface SocialField {
  id: keyof SocialFormData;
  label: string;
  placeholder: string;
  icon: React.ReactNode;
}

const SOCIAL_FIELDS: SocialField[] = [
  {
    id: "linkedin",
    label: "LinkedIn",
    placeholder: "https://linkedin.com/",
    icon: <LinkedInIcon className="w-5 h-5" />,
  },
  {
    id: "twitter",
    label: "X (formerly Twitter)",
    placeholder: "https://x.com/",
    icon: <XIcon className="w-5 h-5" />,
  },
  {
    id: "instagram",
    label: "Instagram",
    placeholder: "https://instagram.com/",
    icon: <InstagramIcon className="w-5 h-5" />,
  },
];

const SocialProfile: React.FC<StepComponentProps> = ({ onNext, onBack }) => {
  const [formData, setFormData] = useState<SocialFormData>({
    linkedin: "",
    twitter: "",
    instagram: "",
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof SocialFormData, string>>
  >({});
  const [isLoading, setIsLoading] = useState(false);
  const [touchedFields, setTouchedFields] = useState<Set<keyof SocialFormData>>(
    new Set()
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name as keyof SocialFormData]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleBlur = (field: keyof SocialFormData) => {
    setTouchedFields((prev) => new Set(prev).add(field));

    const value = formData[field];
    // Only validate if there's a value
    if (value && value.trim() !== "") {
      try {
        socialSchema.pick({ [field]: true }).parse({ [field]: value });
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      } catch (error) {
        if (error instanceof z.ZodError) {
          setErrors((prev) => ({
            ...prev,
            [field]: error.issues[0]?.message,
          }));
        }
      }
    } else {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async () => {
    // Validate all non-empty fields
    const fieldErrors: Partial<Record<keyof SocialFormData, string>> = {};
    let hasErrors = false;

    Object.entries(formData).forEach(([key, value]) => {
      if (value && value.trim() !== "") {
        try {
          socialSchema
            .pick({ [key]: true })
            .parse({ [key]: value });
        } catch (error) {
          if (error instanceof z.ZodError) {
            fieldErrors[key as keyof SocialFormData] = error.issues[0]?.message;
            hasErrors = true;
          }
        }
      }
    });

    if (hasErrors) {
      setErrors(fieldErrors);
      setTouchedFields(
        new Set(Object.keys(formData) as Array<keyof SocialFormData>)
      );
      return;
    }

    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);

    if (onNext) {
      onNext();
    }
  };

  return (
    <div className="flex flex-col w-full max-w-[554px] px-4 overflow-y-auto">
      {/* Header */}
      <motion.div
        className="flex flex-col gap-1 mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h2 className="text-2xl font-semibold text-white tracking-wide">
          Social Profiles
        </h2>
        <p className="text-[#b5b5b5] text-lg">
          Share your socials with other users
        </p>
      </motion.div>

      {/* Form Fields */}
      <div className="flex flex-col gap-6 mb-10">
        {SOCIAL_FIELDS.map((field, index) => (
          <motion.div
            key={field.id}
            className="flex flex-col gap-3 w-full"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + index * 0.1 }}
          >
            <label
              htmlFor={field.id}
              className="text-white text-lg font-medium tracking-wide"
            >
              {field.label}
            </label>
            <div
              className={`h-[60px] bg-[#221a31] rounded-xl px-6 py-4 flex items-center gap-3 border ${
                errors[field.id] && touchedFields.has(field.id)
                  ? "border-red-500"
                  : "border-transparent"
              } focus-within:border-purple-500 transition-colors`}
            >
              <span className="text-gray-400">{field.icon}</span>
              <input
                id={field.id}
                type="url"
                name={field.id}
                value={formData[field.id]}
                onChange={handleInputChange}
                onBlur={() => handleBlur(field.id)}
                placeholder={field.placeholder}
                className="flex-1 bg-transparent text-white text-base outline-none placeholder:text-[#6b6b6b] font-medium tracking-wide"
              />
            </div>
            {errors[field.id] && touchedFields.has(field.id) && (
              <motion.p
                className="text-red-400 text-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {errors[field.id]}
              </motion.p>
            )}
          </motion.div>
        ))}
      </div>

      {/* Navigation Buttons */}
      <motion.div
        className="flex gap-4 items-center justify-center w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        {onBack && (
          <button
            onClick={onBack}
            disabled={isLoading}
            className="w-[200px] h-14 px-10 py-4 bg-[rgba(69,12,240,0.1)] border border-[#450cf0] rounded-[20px] text-white font-semibold text-base tracking-wide backdrop-blur-md shadow-[0px_8px_30px_0px_rgba(29,5,82,0.35)] hover:bg-[rgba(69,12,240,0.15)] transition-colors disabled:opacity-50"
          >
            Back
          </button>
        )}
        {onNext && (
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-[200px] h-14 px-8 py-4 rounded-[20px] text-white font-semibold text-lg tracking-wide shadow-[0px_3px_3px_0px_rgba(254,254,254,0.25)] transition-all hover:shadow-lg disabled:opacity-70 flex items-center justify-center gap-2"
            style={{
              background: "linear-gradient(97deg, #450CF0 0%, #CD82FF 100%)",
            }}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              "Next"
            )}
          </button>
        )}
      </motion.div>
    </div>
  );
};

export default SocialProfile;
