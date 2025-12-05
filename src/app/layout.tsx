import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Toast from "@/components/Toast";
import { SessionProvider } from "next-auth/react";
import LayoutWithSidebar from "@/components/LayoutWithSidebar";

const jakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin", "latin-ext", "vietnamese", "cyrillic-ext"],
});


export const metadata: Metadata = {
  title: "SureYummy - Restaurant System",
  description: "Restaurant management system with POS and kitchen display",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" data-theme="cozy-warm">
      <body
        className={`${jakartaSans.variable} antialiased`}
      >
        <SessionProvider>
          <Toast/>
          <LayoutWithSidebar>
            {children}
          </LayoutWithSidebar>
        </SessionProvider>
      </body>
    </html>
  );
}
