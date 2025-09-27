export const metadata = {
  title: "Onboarding - FundBrave",
  description: "Complete your onboarding process",
};

export default function onboardingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold dark:text-white text-gray-900">
            FundBrave
          </h1>
        </div>
        {children}
      </div>
    </div>
  );
}
