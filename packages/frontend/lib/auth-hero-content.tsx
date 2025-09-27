import { ReactNode } from "react";

export interface AuthHeroItem {
  key: "signup" | "login";
  title: string;
  subtitle: string;
  svg: ReactNode;
}

export const AuthHeroContent: AuthHeroItem[] = [
  {
    key: "signup",
    title: "Raise Funds Without Limits",
    subtitle:
      "Launch campaigns freely and get support directly, no middlemen, no bias, no limits.",
    svg: (
      <svg
        width="100"
        height="100"
        viewBox="0 0 24 24"
        fill="none"
        className="text-white"
      >
        <path
          d="M12 2L2 7L12 12L22 7L12 2Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M2 17L12 22L22 17"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M2 12L12 17L22 12"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    key: "login",
    title: "Share Real-Time Updates",
    subtitle:
      "Keep your supporters in the loop with real-time progress, milestones, and impact stories.",
    svg: (
      <svg
        width="100"
        height="100"
        viewBox="0 0 24 24"
        fill="none"
        className="text-white"
      >
        <path
          d="M16 12H8M12 8V16"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
];
