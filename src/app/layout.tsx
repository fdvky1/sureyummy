import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Toast from "@/components/Toast";
import Providers from "@/components/Providers";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import Modal from "@/components/Modal";

const jakartaSans = Plus_Jakarta_Sans({
  variable: "--font-jakarta-sans",
  subsets: ["latin"],
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
        className={`${jakartaSans.className} ${jakartaSans.variable} antialiased`}
      >
        <Providers>
          <Toast/>
          <Modal/>
          <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
              <Header />
              <main className="flex-1 overflow-auto">
                {children}
              </main>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
