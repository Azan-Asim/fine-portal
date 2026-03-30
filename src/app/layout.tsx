import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "react-hot-toast";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Devsinn Team Management Portal",
  description: "Manage employee penalties, track payments, and send notifications.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning className={`${geist.className} antialiased`}>
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "#ffffff",
                color: "#14314d",
                border: "1px solid #d3e4f5",
              },
              success: { iconTheme: { primary: "#21c9d3", secondary: "#ffffff" } },
              error: { iconTheme: { primary: "#F85149", secondary: "#ffffff" } },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
