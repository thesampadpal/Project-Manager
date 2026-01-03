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
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
