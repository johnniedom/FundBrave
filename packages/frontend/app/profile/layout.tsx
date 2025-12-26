/**
 * ProfileLayout - Layout wrapper for profile pages
 * Maintains consistent styling for the profile section
 */
export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-neutral-dark-500">
      <main>{children}</main>
    </div>
  );
}
