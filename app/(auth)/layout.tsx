export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-card focus:text-primary focus:rounded focus:shadow-lg focus:outline-none"
      >
        Vai al contenuto principale
      </a>
      <main id="main-content" className="w-full max-w-md p-8">
        {children}
      </main>
    </div>
  );
}
