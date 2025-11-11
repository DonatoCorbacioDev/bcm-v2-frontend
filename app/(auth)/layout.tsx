/**
 * Authentication layout
 * Wraps login, register, and password reset pages
 * Centers the content and provides consistent styling
 */
export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-6">{children}</div>
    </div>
  );
}
