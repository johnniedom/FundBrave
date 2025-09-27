"use client";
import React from "react";
import * as z from "zod";
import { signUpSchema } from "../../../lib/validation.utils";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";

// Import reusable components
import AuthLogo from "../../components/auth/AuthLogo";
import AuthHeader from "../../components/auth/AuthHeader";
import SocialLoginButtons from "../../components/auth/SocialLoginButtons";
import AuthDivider from "../../components/auth/AuthDivider";
import ServerError from "../../components/auth/ServerError";
import FormInput from "../../components/auth/FormInput";
import LoadingButton from "../../components/auth/LoadingButton";

type SignUpData = z.infer<typeof signUpSchema>;

interface LoginPageProps {
  onToggle: () => void;
}

export default function SignUpPage({ onToggle }: LoginPageProps) {
  const router = useRouter();
  const [formData, setFormData] = React.useState<SignUpData>({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    emailUpdate: false,
    termsAccepted: false,
  });
  const [errors, setErrors] = React.useState<Partial<SignUpData>>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [serverError, setServerError] = React.useState("");
  const [isOAuthLoading, setIsOAuthLoading] = React.useState({
    google: false,
    twitter: false,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Clear field error when user starts typing
    if (errors[name as keyof SignUpData]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = (): boolean => {
    try {
      signUpSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          const fieldName = err.path[0] as keyof SignUpData;
          if (
            fieldName === "confirmPassword" &&
            err.code === "custom" &&
            err.message.includes("match")
          ) {
            fieldErrors[fieldName] = "Passwords do not match";
          } else {
            fieldErrors[fieldName] = err.message;
          }
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  };

  const handleValidate = (e: React.FormEvent) => {
    if (!validateForm()) {
      setIsSubmitting(false);
      return;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setServerError("");

    if (!validateForm()) {
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.errors) {
          // Handle validation errors from backend
          const backendErrors: Record<string, string> = {};
          data.errors.forEach((err: any) => {
            backendErrors[err.field] = err.message;
          });
          setErrors(backendErrors);
        } else {
          setServerError(data.message || "An error occurred");
        }
        return;
      }

      // Success - redirect to dashboard or login
      router.push("/leaderboard");
    } catch (error) {
      setServerError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
      <div className="w-full max-w-2xl rounded-2xl p-4 backdrop-blur-md">
        <AuthLogo />

        <AuthHeader
          title="Join Our Referral Program"
          subtitle="Register with your details to get started"
        />

        <SocialLoginButtons
          onGoogleLogin={handleGoogleLogin}
          onXLogin={handleXLogin}
          isGoogleLoading={isOAuthLoading.google}
          isXLoading={isOAuthLoading.twitter}
        />

        <AuthDivider text="or Sign up with" />

        <ServerError error={serverError} />
        <motion.form
          className="w-full space-y-6"
          onSubmit={handleSubmit}
          onChange={handleValidate}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <FormInput
            id="username"
            name="username"
            type="text"
            label="Username"
            placeholder="@johndoe"
            value={formData.username}
            onChange={handleInputChange}
            error={errors.username}
            delay={0.9}
          />

          <FormInput
            id="email"
            name="email"
            type="email"
            label="Email"
            placeholder="johndoe@mail.com"
            value={formData.email}
            onChange={handleInputChange}
            error={errors.email}
            delay={1.1}
          />

          <FormInput
            id="password"
            name="password"
            type="password"
            label="Password"
            placeholder="Enter Password"
            value={formData.password}
            onChange={handleInputChange}
            error={errors.password}
            delay={1.1}
          />

          <FormInput
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            label="Confirm Password"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            error={errors.confirmPassword}
            delay={1.1}
          />

          {/* Mobile Forgot Password */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="mb-6 ml-auto block md:hidden"
          >
            <Link
              href="/forgot-password"
              className="justify-self-end text-purple-400 transition-colors hover:text-purple-300"
            >
              Forgot Password?
            </Link>
          </motion.div>

          {/* Checkbox and Forgot Password */}
          <motion.div
            className="grid-col-1 grid w-full items-center gap-2 md:grid-cols-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1, duration: 0.4 }}
          >
            <motion.label
              className="flex items-center gap-2"
              whileHover={{ scale: 1.02 }}
            >
              <motion.input
                type="checkbox"
                name="termsAccepted"
                id="termsAccepted"
                checked={formData.termsAccepted}
                onChange={handleInputChange}
                className="custom-checkbox"
              />
              <span className="text-white">
                I agree to terms and conditions
              </span>
            </motion.label>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="ml-auto hidden md:block"
            >
              <Link
                href="/forgot-password"
                className="justify-self-end text-purple-400 transition-colors hover:text-purple-300"
              >
                Forgot Password?
              </Link>
            </motion.div>

            <motion.label
              className="flex items-center gap-2"
              whileHover={{ scale: 1.02 }}
            >
              <motion.input
                type="checkbox"
                name="emailUpdate"
                id="emailUpdate"
                checked={formData.emailUpdate}
                onChange={handleInputChange}
                className="custom-checkbox"
              />
              <span className="text-white">
                I agree to receive email updates
              </span>
            </motion.label>
          </motion.div>

          <LoadingButton
            type="submit"
            isLoading={isSubmitting}
            disabled={isSubmitting}
            loadingText="Signing up..."
          >
            Join Referral Program
          </LoadingButton>
        </motion.form>

        {/* Sign In Link */}
        <motion.div
          className="mt-6 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3, duration: 0.4 }}
        >
          <span className="text-gray-300">Already have an account? </span>
          <motion.div className="inline-block" whileHover={{ scale: 1.05 }}>
            <Link
              href="/login"
              className="text-purple-400 transition-colors hover:text-purple-300"
            >
              {" "}
              Sign in
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
