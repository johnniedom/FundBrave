import { z } from "zod";
import type { PostFormErrors, CampaignUpdateFormErrors } from "../types/CreatePost.types";

// Zod schemas for validation
export const postFormSchema = z.object({
  category: z.string().min(1, "Category is required"),
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
});

export const campaignUpdateFormSchema = z.object({
  category: z.string().min(1, "Category is required"),
  campaign: z.string().min(1, "Campaign is required"),
  title: z.string().min(1, "Title is required"),
  update: z.string().min(1, "Update content is required"),
});

// Convert Zod errors to our error format
const convertZodErrors = (error: z.ZodError): Record<string, string> => {
  const errors: Record<string, string> = {};
  error.issues.forEach((issue) => {
    // Handle both nested paths and direct field names
    const fieldName =
      issue.path.length > 0 ? issue.path[issue.path.length - 1] : "unknown";
    errors[fieldName as string] = issue.message;
  });
  return errors;
};

// Validation functions
export const validatePostForm = (data: {
  category: string;
  title: string;
  content: string;
}): PostFormErrors => {
  try {
    postFormSchema.parse(data);
    return {};
  } catch (error) {
    if (error instanceof z.ZodError) {
      return convertZodErrors(error) as PostFormErrors;
    }
    return {};
  }
};

export const validateCampaignUpdateForm = (data: {
  category: string;
  campaign: string;
  title: string;
  update: string;
}): CampaignUpdateFormErrors => {
  try {
    campaignUpdateFormSchema.parse(data);
    return {};
  } catch (error) {
    if (error instanceof z.ZodError) {
      return convertZodErrors(error) as CampaignUpdateFormErrors;
    }
    return {};
  }
};

// Utility functions
export const isFormValid = (errors: PostFormErrors | CampaignUpdateFormErrors): boolean => {
  return Object.values(errors).every(error => error === undefined || error === '');
};

export const getFirstError = (
  errors: PostFormErrors | CampaignUpdateFormErrors
): string | null => {
  const errorValues = Object.values(errors).filter(Boolean);
  return errorValues.length > 0 ? errorValues[0] : null;
};