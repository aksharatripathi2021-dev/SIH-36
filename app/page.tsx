import React from "react";
import { InstitutionalHeader } from "./components/InstitutionalHeader";
import { ServiceLoginForm } from "./components/ServiceLoginForm";

export const metadata = {
  title: "Service Login | Legal Metrology Online Verification System",
  description: "Sign in to access the Legal Metrology Online Verification System - Department of Consumer Affairs, Government of India",
};

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F5F6F8]">
      {/* Institutional Top Header */}
      <InstitutionalHeader />

      {/* Main Login Card Area */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 sm:py-12 md:py-16">
        <ServiceLoginForm />
      </main>

      {/* Footer matching Page 6 */}
      <footer className="w-full py-6 px-4 text-center text-xs text-slate-500 border-t border-slate-200/60 bg-[#F5F6F8]">
        <p className="font-medium text-slate-600">Department of Consumer Affairs, Government of India</p>
        <p className="mt-1 text-slate-400">Website maintained by National Informatics Centre</p>
      </footer>
    </div>
  );
}
