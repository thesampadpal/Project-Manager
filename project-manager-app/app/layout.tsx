import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Project Manager",
  description: "Kanban board project management app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-[#0a0908] min-h-screen flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-7xl h-[calc(100vh-2rem)] md:h-[calc(100vh-4rem)] bg-bg rounded-2xl border border-border shadow-2xl overflow-hidden">
          {children}
        </div>
      </body>
    </html>
  );
}
