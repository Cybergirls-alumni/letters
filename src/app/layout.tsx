import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ReportProblemButton from "@/components/ReportProblemButton";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CyberGirls | Recommendation Letter Requests",
  description: "Submit and track recommendation letter requests for CyberGirls alumni.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} min-h-full pb-14 bg-gray-50 dark:bg-slate-900 dark:text-slate-100 antialiased`}>
        {children}
        <ReportProblemButton />
      </body>
    </html>
  );
}
