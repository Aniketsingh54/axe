import type { Metadata } from "next";
import "./globals.css";
import { ClerkProvider } from '@clerk/nextjs';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Axe - AI Workflow Builder",
  description: "Build and run AI workflows with a visual node-based editor",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
