import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "react-hot-toast";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Fine Portal – Penalty Management System",
  description: "Manage employee penalties, track payments, and send notifications.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${geist.className} bg-[#0D1117] text-white antialiased`}>
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "#1C2128",
                color: "#E6EDF3",
                border: "1px solid #30363D",
              },
              success: { iconTheme: { primary: "#3BF5C4", secondary: "#0D1117" } },
              error: { iconTheme: { primary: "#F85149", secondary: "#0D1117" } },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
