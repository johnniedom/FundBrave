import {
  VerifyEmail,
  ProfileDetails,
  SocialProfile,
  Goals,
  Welcome,
} from "../app/components/onboarding/steps";

export const ONBOARDING_STEPS = [
  {
    slug: "verify-email",
    title: "Verify your email",
    subtitle: "Enter verification code",
    // Icon: /* SVG Icon Component */,
    Component: VerifyEmail,
  },
  {
    slug: "profile-details",
    title: "Profile details",
    subtitle: "Provide profile information",
    // Icon: /* SVG Icon Component */,
    Component: ProfileDetails,
  },
  {
    slug: "social-profile",
    title: "Social profile",
    subtitle: "Let's know your social media handles",
    // Icon: /* SVG Icon Component */,
    Component: SocialProfile,
  },
  // ... and so on for 'goals' and 'welcome'
];
