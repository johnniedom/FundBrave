"use client";

import React, { useState, useRef } from "react";
import { StepComponentProps } from "@/lib/onboarding-steps";
import { motion } from "motion/react";
import {
  User,
  Upload as UploadIcon,
  X,
  Loader2,
  Mail,
} from "lucide-react";
import { z } from "zod";
import { DatePicker } from "@/app/components/ui/date-picker";

// Zod validation schema
const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscores"
    ),
  email: z.string().email("Please enter a valid email address"),
  birthdate: z.string().min(1, "Please select your birthdate"),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
  avatar: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const ProfileDetails: React.FC<StepComponentProps> = ({ onNext, onBack }) => {
  const [formData, setFormData] = useState<ProfileFormData>({
    name: "",
    username: "",
    email: "",
    birthdate: "",
    bio: "",
    avatar: "",
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof ProfileFormData, string>>
  >({});
  const [isLoading, setIsLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [touchedFields, setTouchedFields] = useState<
    Set<keyof ProfileFormData>
  >(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name as keyof ProfileFormData]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleBlur = (field: keyof ProfileFormData) => {
    setTouchedFields((prev) => new Set(prev).add(field));

    // Validate single field on blur
    try {
      profileSchema.pick({ [field]: true }).parse({ [field]: formData[field] });
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    } catch (error) {
      if (error instanceof z.ZodError) {
        setErrors((prev) => ({
          ...prev,
          [field]: error.issues[0]?.message,
        }));
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!["image/png", "image/jpeg", "image/jpg"].includes(file.type)) {
      setErrors((prev) => ({
        ...prev,
        avatar: "Please upload PNG or JPEG format only",
      }));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        avatar: "File size must be less than 5MB",
      }));
      return;
    }

    // Check dimensions
    const img = new Image();
    img.onload = () => {
      if (img.width < 400 || img.height < 400) {
        setErrors((prev) => ({
          ...prev,
          avatar: "Image must be at least 400x400px",
        }));
      } else {
        const reader = new FileReader();
        reader.onloadend = () => {
          setAvatarPreview(reader.result as string);
          setFormData((prev) => ({ ...prev, avatar: reader.result as string }));
          setErrors((prev) => ({ ...prev, avatar: undefined }));
        };
        reader.readAsDataURL(file);
      }
    };
    img.src = URL.createObjectURL(file);
  };

  const removeAvatar = () => {
    setAvatarPreview(null);
    setFormData((prev) => ({ ...prev, avatar: "" }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getInitials = () => {
    if (!formData.name.trim()) return "?";
    const parts = formData.name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  };

  const handleSubmit = async () => {
    // Validate all fields
    try {
      profileSchema.parse(formData);
      setErrors({});

      // Simulate API call with loading state
      setIsLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setIsLoading(false);
      if (onNext) {
        onNext();
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Partial<Record<keyof ProfileFormData, string>> = {};
        error.issues.forEach((err: z.ZodIssue) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as keyof ProfileFormData] = err.message;
          }
        });
        setErrors(fieldErrors);

        // Mark all fields as touched
        setTouchedFields(
          new Set(Object.keys(formData) as Array<keyof ProfileFormData>)
        );
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col w-full max-w-[800px] px-4 overflow-y-auto">
      {/* Header */}
      <motion.div
        className="flex flex-col gap-1 mb-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h2 className="text-2xl font-semibold text-white tracking-wide">
          Profile Details
        </h2>
        <p className="text-[#b5b5b5] text-lg">
          Update your account&apos;s profile information
        </p>
      </motion.div>

      {/* Form Content */}
      <div className="flex flex-col gap-8 mb-10">
        {/* Avatar Upload Section */}
        <motion.div
          className="flex gap-7 items-start"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          {/* Avatar Circle */}
          <div className="relative w-[100px] h-[100px] rounded-full cursor-pointer bg-gradient-to-br from-purple-900/50 to-purple-800/30 flex items-center justify-center shrink-0 overflow-hidden overflow-x-hidden">
            {avatarPreview ? (
              <>
                <img
                  src={avatarPreview}
                  alt="Avatar preview"
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={removeAvatar}
                  type="reset"
                  className="absolute top-0 right-0 w-6 h-6 cursor-pointer bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </>
            ) : (
              <span className="text-4xl font-semibold text-purple-400/70 tracking-wider">
                {getInitials()}
              </span>
            )}
          </div>

          {/* Upload Section */}
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <p className="text-white text-lg font-medium tracking-wide">
                Upload image
              </p>
              <p className="text-[#b5b5b5] text-base">
                Min 400x400px, PNG or JPEG
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-10 py-4 bg-[rgba(69,12,240,0.1)] border border-[#450cf0] rounded-[20px] text-white font-semibold text-base tracking-wide backdrop-blur-md shadow-[0px_8px_30px_0px_rgba(29,5,82,0.35)] hover:bg-[rgba(69,12,240,0.15)] transition-colors flex items-center gap-2 justify-center"
            >
              <UploadIcon className="w-5 h-5" />
              Upload
            </button>
            {errors.avatar && (
              <p className="text-red-400 text-sm">{errors.avatar}</p>
            )}
          </div>
        </motion.div>

        {/* Name & Username Row */}
        <motion.div
          className="flex gap-5 w-full flex-col sm:flex-row"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          {/* Name Field */}
          <div className="flex flex-col gap-3 flex-1 max-w-[267px]">
            <label
              htmlFor="name"
              className="text-white text-lg font-medium tracking-wide"
            >
              Name
            </label>
            <div
              className={`h-[60px] bg-[#221a31] rounded-xl px-8 py-4 flex items-center gap-2 border ${
                errors.name && touchedFields.has("name")
                  ? "border-red-500"
                  : "border-transparent"
              } focus-within:border-purple-500 transition-colors`}
            >
              <User className="w-6 h-6 text-gray-400" />
              <input
                id="name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                onBlur={() => handleBlur("name")}
                placeholder="John Doe"
                className="flex-1 bg-transparent text-white text-base outline-none placeholder:text-gray-500 font-medium tracking-wide"
              />
            </div>
            {errors.name && touchedFields.has("name") && (
              <p className="text-red-400 text-sm">{errors.name}</p>
            )}

          </div>

          {/* Username Field */}
          <div className="flex flex-col gap-3 flex-1 max-w-[267px]">
            <label
              htmlFor="username"
              className="text-white text-lg font-medium tracking-wide"
            >
              Username
            </label>
            <div
              className={`h-[60px] bg-[#221a31] rounded-xl px-8 py-4 flex items-center gap-2 border ${
                errors.username && touchedFields.has("username")
                  ? "border-red-500"
                  : "border-transparent"
              } focus-within:border-purple-500 transition-colors`}
            >
              <User className="w-6 h-6 text-gray-400" />
              <input
                id="username"
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                onBlur={() => handleBlur("username")}
                placeholder="johndoe"
                className="flex-1 bg-transparent text-white text-base outline-none placeholder:text-gray-500 font-medium tracking-wide"
              />
            </div>
            {errors.username && touchedFields.has("username") && (
              <p className="text-red-400 text-sm">{errors.username}</p>
            )}
          </div>
        </motion.div>

        {/* Email Field */}
        <motion.div
          className="flex flex-col gap-3 w-full"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <label
            htmlFor="email"
            className="text-white text-lg font-medium tracking-wide"
          >
            Email
          </label>
          <div
            className={`h-[60px] bg-[#221a31] rounded-xl px-8 py-4 flex items-center gap-2 border ${
              errors.email && touchedFields.has("email")
                ? "border-red-500"
                : "border-transparent"
            } focus-within:border-purple-500 transition-colors`}
          >
            <Mail className="w-6 h-6 text-gray-400" />
            <input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              onBlur={() => handleBlur("email")}
              placeholder="johndoe@gmail.com"
              className="flex-1 bg-transparent text-white text-base outline-none placeholder:text-gray-500 font-medium tracking-wide"
            />
          </div>
          {errors.email && touchedFields.has("email") && (
            <p className="text-red-400 text-sm">{errors.email}</p>
          )}
        </motion.div>

        {/* Birthdate Field */}
        <motion.div
          className="flex flex-col gap-3 w-full"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <label
            htmlFor="birthdate"
            className="text-white text-lg font-medium tracking-wide"
          >
            Birthdate
          </label>
          <DatePicker
            value={formData.birthdate ? new Date(formData.birthdate) : undefined}
            onChange={(date) => {
              setFormData((prev) => ({
                ...prev,
                birthdate: date ? date.toISOString().split('T')[0] : "",
              }));
              if (errors.birthdate) {
                setErrors((prev) => ({ ...prev, birthdate: undefined }));
              }
              setTouchedFields((prev) => new Set(prev).add("birthdate"));
            }}
            placeholder="Pick a date"
            maxDate={new Date()}
          />
          {errors.birthdate && touchedFields.has("birthdate") && (
            <p className="text-red-400 text-sm">{errors.birthdate}</p>
          )}
        </motion.div>

        {/* Bio Field */}
        <motion.div
          className="flex flex-col gap-3 w-full"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <label
            htmlFor="bio"
            className="text-white text-lg font-medium tracking-wide"
          >
            Bio
          </label>
          <div
            className={`min-h-[161px] bg-[#221a31] rounded-xl px-8 py-4 border ${
              errors.bio && touchedFields.has("bio")
                ? "border-red-500"
                : "border-transparent"
            } focus-within:border-purple-500 transition-colors`}
          >
            <textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              onBlur={() => handleBlur("bio")}
              placeholder="Write here..."
              rows={5}
              className="w-full bg-transparent text-white text-base outline-none placeholder:text-gray-500 font-medium tracking-wide resize-none"
            />
          </div>
          <div className="flex justify-between">
            {errors.bio && touchedFields.has("bio") && (
              <p className="text-red-400 text-sm">{errors.bio}</p>
            )}
            <p className="text-[#b5b5b5] text-sm ml-auto">
              {formData.bio?.length || 0}/500
            </p>
          </div>
        </motion.div>
      </div>

      {/* Navigation Buttons */}
      <motion.div
        className="flex gap-4 items-center justify-center w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        {onBack && (
          <button
            onClick={onBack}
            disabled={isLoading}
            className="w-[265px] h-14 px-10 py-4 bg-[rgba(69,12,240,0.1)] border border-[#450cf0] rounded-[20px] text-white font-semibold text-base tracking-wide backdrop-blur-md shadow-[0px_8px_30px_0px_rgba(29,5,82,0.35)] hover:bg-[rgba(69,12,240,0.15)] transition-colors disabled:opacity-50"
          >
            Back
          </button>
        )}
        {onNext && (
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-[265px] h-14 px-8 py-4 rounded-[20px] text-white font-semibold text-lg tracking-wide shadow-[0px_3px_3px_0px_rgba(254,254,254,0.25)] transition-all hover:shadow-lg disabled:opacity-70 flex items-center justify-center gap-2"
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

export default ProfileDetails;
