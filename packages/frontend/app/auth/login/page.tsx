"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import * as z from "zod";
import { motion } from "motion/react";
import { loginSchema } from "../../../lib/validation.utils";
import { useAuth } from "../../components/ui/hooks/useAuth";

// Import reusable components
// Import reusable components
import AuthLogo from "../../components/auth/AuthLogo";
import AuthHeader from "../../components/auth/AuthHeader";
import SocialLoginButtons from "../../components/auth/SocialLoginButtons";
import AuthDivider from "../../components/auth/AuthDivider";
import ServerError from "../../components/auth/ServerError";
import FormInput from "../../components/auth/FormInput";
import LoadingButton from "../../components/auth/LoadingButton";
type LoginFormValues = z.infer<typeof loginSchema>;

interface LoginPageProps {
  onToggle: () => void;
}


export default function LoginPage({ onToggle }: LoginPageProps) {
  const router = useRouter();
  const { refreshUser } = useAuth();

  // Form state
  const [formData, setFormData] = useState<LoginFormValues>({
    username: "",
    password: "",
    keepLoggedIn: false,
  });

  // Loading and error states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [isOAuthLoading, setIsOAuthLoading] = useState({
    google: false,
    twitter: false,
  });

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Clear field error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // Validate form data
  const validateForm = (): boolean => {
    try {
      loginSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  };

  // Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");

    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.errors) {
          // Handle validation errors from backend
          const backendErrors: Record<string, string> = {};
          data.errors.forEach((err: any) => {
            backendErrors[err.field] = err.message;
          });
          setErrors(backendErrors);
        } else {
          setServerError(data.message || "Login failed");
        }
        return;
      }

      // Success - redirect to dashboard
      await refreshUser();

      router.push("/leaderboard");
    } catch (error) {
      setServerError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Google OAuth handler
  const handleGoogleLogin = async () => {
    setIsOAuthLoading({ ...isOAuthLoading, google: true });
    try {
      const result = await signIn("google", {
        callbackUrl: "/leaderboard",
        redirect: false,
      });

      if (result?.error) {
        setServerError("Google sign in failed. Please try again.");
      } else if (result?.url) {
        router.push(result.url);
      }
    } catch (error) {
      setServerError("Google sign in failed. Please try again.");
    } finally {
      setIsOAuthLoading({ ...isOAuthLoading, google: false });
    }
  };

  // Twitter OAuth handler
  const handleXLogin = async () => {
    setIsOAuthLoading({ ...isOAuthLoading, twitter: true });
    try {
      const result = await signIn("twitter", {
        callbackUrl: "/leaderboard",
        redirect: false,
      });

      if (result?.error) {
        setServerError("Twitter sign in failed. Please try again.");
      } else if (result?.url) {
        router.push(result.url);
      }
    } catch (error) {
      setServerError("Twitter sign in failed. Please try again.");
    } finally {
      setIsOAuthLoading({ ...isOAuthLoading, twitter: false });
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-2">
      <motion.div
        className="w-full max-w-2xl rounded-2xl p-4 backdrop-blur-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <AuthLogo />

        <AuthHeader
          title="Welcome back!"
          subtitle="Login with your details to get started"
        />

        <SocialLoginButtons
          onGoogleLogin={handleGoogleLogin}
          onXLogin={handleXLogin}
          isGoogleLoading={isOAuthLoading.google}
          isXLoading={isOAuthLoading.twitter}
        />

        <AuthDivider text="Or Login with" />

        <ServerError error={serverError} />

        <motion.form
          onSubmit={handleSubmit}
          className="space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <FormInput
            id="username"
            name="username"
            type="text"
            label="Username or Email"
            placeholder="@johndoe or email@example.com"
            value={formData.username}
            onChange={handleInputChange}
            error={errors.username}
            delay={0.9}
          />

          <FormInput
            id="password"
            name="password"
            type="password"
            label="Password"
            placeholder="Enter your password"
            value={formData.password}
            onChange={handleInputChange}
            error={errors.password}
            delay={1.0}
          />

          {/* Checkbox and Forgot Password */}
          <motion.div
            className="flex items-center justify-between"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1, duration: 0.4 }}
          >
            <motion.label
              className="flex items-center gap-2 flex-2"
              whileHover={{ scale: 1.05 }}
            >
              <input
                type="checkbox"
                name="keepLoggedIn"
                checked={formData.keepLoggedIn}
                onChange={handleInputChange}
                className="custom-checkbox"
              />
              <span className="text-white">Keep me logged in</span>
            </motion.label>
            <motion.div whileHover={{ scale: 1.05 }}>
              <Link
                href="/forgot-password"
                className="text-purple-400 transition-colors hover:text-purple-300"
              >
                Forgot Password?
              </Link>
            </motion.div>
          </motion.div>

          <LoadingButton
            type="submit"
            isLoading={isSubmitting}
            disabled={
              isSubmitting || isOAuthLoading.google || isOAuthLoading.twitter
            }
            loadingText="Logging in..."
            delay={1.2}
          >
            Login
          </LoadingButton>
        </motion.form>

        {/* Sign Up Link */}
        <motion.div
          className="mt-6 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3, duration: 0.4 }}
        >
          <span className="text-gray-300">Don't have an account? </span>
          <motion.div className="inline-block" whileHover={{ scale: 1.05 }}>
            <Link
              href="/sign-up"
              className="text-purple-400 transition-colors hover:text-purple-300"
            >
              Sign Up
            </Link>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}
