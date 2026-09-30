"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { InstitutionalHeader } from "@/app/components/InstitutionalHeader";
import { registrationService, TraderRegistrationPayload } from "@/services/registrationService";
import { authService } from "@/services/authService";
import { useTranslation } from "@/i18n";

export default function RegisterPage() {
  const { t } = useTranslation();
  const router = useRouter();

  // Wizard steps: 1: Trader Details -> 2: Establishment Details -> 3: OTP Confirmation -> 4: Success
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form State
  const [formData, setFormData] = useState<TraderRegistrationPayload>({
    fullName: "",
    establishmentName: "",
    mobile: "",
    email: "",
    address: "",
    city: "New Delhi",
    district: "Delhi South",
    state: "Delhi",
    preferredLanguage: "English"
  });

  const [otpCode, setOtpCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setErrorMessage(null);
  };

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim()) {
      setErrorMessage("Please enter proprietor or responsible person full name.");
      return;
    }
    if (!formData.mobile.trim() || !/^\d{10}$/.test(formData.mobile.trim())) {
      setErrorMessage("Please enter a valid 10-digit mobile number.");
      return;
    }
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email.trim())) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }
    setErrorMessage(null);
    setStep(2);
  };

  const handleStep2Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.establishmentName.trim()) {
      setErrorMessage("Please enter your business or establishment name.");
      return;
    }
    if (!formData.address.trim()) {
      setErrorMessage("Please enter complete shop / business premises address.");
      return;
    }
    if (!formData.state.trim() || !formData.district.trim()) {
      setErrorMessage("Please select State and District jurisdiction.");
      return;
    }
    setErrorMessage(null);
    setStep(3);
  };

  const handleConfirmOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.trim().length < 4) {
      setErrorMessage("Please enter the 6-digit confirmation code (demo code: 123456).");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // 1. Create trader profile in persistent demo storage
      const newTrader = await registrationService.registerTrader(formData);

      // 2. Set active user in auth session
      await authService.setActiveUser(newTrader);

      setIsSubmitting(false);
      setStep(4);
    } catch (err: any) {
      setErrorMessage(err.message || "Registration failed. Please review inputs.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F6F8]">
      <InstitutionalHeader />

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-[580px] bg-white rounded-lg border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          {/* Header */}
          <div>
            <span className="text-[10px] font-bold text-[#801424] uppercase tracking-wider block">
              Legal Metrology Online Portal · PS36
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-1">
              {t("register.title")}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {t("register.subtitle")}
            </p>
          </div>

          {/* Stepper Progress Bar */}
          <div className="grid grid-cols-3 gap-2 pb-2 border-b border-slate-100 text-xs">
            <div className={`flex items-center gap-2 ${step >= 1 ? "text-[#801424] font-bold" : "text-slate-400"}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                step >= 1 ? "bg-[#801424] text-white" : "bg-slate-100 text-slate-500"
              }`}>
                1
              </span>
              <span>{t("register.stepProprietor")}</span>
            </div>
            <div className={`flex items-center gap-2 ${step >= 2 ? "text-[#801424] font-bold" : "text-slate-400"}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                step >= 2 ? "bg-[#801424] text-white" : "bg-slate-100 text-slate-500"
              }`}>
                2
              </span>
              <span>{t("register.stepEstablishment")}</span>
            </div>
            <div className={`flex items-center gap-2 ${step >= 3 ? "text-[#801424] font-bold" : "text-slate-400"}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                step >= 3 ? "bg-[#801424] text-white" : "bg-slate-100 text-slate-500"
              }`}>
                3
              </span>
              <span>{t("register.stepConfirm")}</span>
            </div>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded text-xs text-rose-800 flex items-start gap-2">
              <span className="font-bold">⚠️</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STEP 1: Personal Details */}
          {step === 1 && (
            <form onSubmit={handleStep1Submit} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {t("register.fullName")} *
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="e.g. Suresh Chand"
                  required
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-md text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#801424]/20 focus:border-[#801424]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {t("register.mobile")} *
                  </label>
                  <input
                    type="tel"
                    name="mobile"
                    maxLength={10}
                    value={formData.mobile}
                    onChange={handleChange}
                    placeholder="98XXXXXXXX"
                    required
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-md text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#801424]/20 focus:border-[#801424]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {t("register.email")} *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="suresh@retailmart.com"
                    required
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-md text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#801424]/20 focus:border-[#801424]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {t("register.preferredLanguage")}
                  </label>
                  <select
                    name="preferredLanguage"
                    value={formData.preferredLanguage}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-md text-slate-700 focus:bg-white focus:outline-none cursor-pointer"
                  >
                    <option value="English">English</option>
                    <option value="Hindi">हिन्दी (Hindi)</option>
                    <option value="Tamil">தமிழ் (Tamil)</option>
                    <option value="Marathi">मराठी (Marathi)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {t("register.identityDocRef")} <span className="text-[11px] font-normal text-slate-500">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    name="identityDocumentRef"
                    value={formData.identityDocumentRef || ""}
                    onChange={handleChange}
                    placeholder="e.g. ID reference number"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-md text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#801424]/20 focus:border-[#801424]"
                  />
                </div>
              </div>

              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded text-[11px] text-slate-600">
                <strong>Onboarding Note:</strong> Identity document references are optional and jurisdiction-dependent. Automated UIDAI / Aadhaar e-KYC is not performed in this prototype environment.
              </div>

              <div className="pt-3 flex items-center justify-between">
                <Link href="/login" className="text-slate-500 hover:text-slate-800 text-xs">
                  ← {t("common.back")}
                </Link>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#801424] hover:bg-[#6D0E1C] text-white font-semibold rounded-md shadow-xs transition-colors cursor-pointer"
                >
                  {t("register.nextEstablishment")}
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: Establishment Details */}
          {step === 2 && (
            <form onSubmit={handleStep2Submit} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {t("register.establishmentName")} *
                </label>
                <input
                  type="text"
                  name="establishmentName"
                  value={formData.establishmentName}
                  onChange={handleChange}
                  placeholder="e.g. Suresh Provision Store"
                  required
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-md text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#801424]/20 focus:border-[#801424]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {t("register.address")} *
                </label>
                <textarea
                  name="address"
                  rows={2}
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Shop No. 12, Main Market Road"
                  required
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-md text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#801424]/20 focus:border-[#801424]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{t("register.state")} *</label>
                  <select
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-slate-700 focus:bg-white cursor-pointer"
                  >
                    <option value="Delhi">Delhi</option>
                    <option value="Haryana">Haryana</option>
                    <option value="Uttar Pradesh">Uttar Pradesh</option>
                    <option value="Maharashtra">Maharashtra</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{t("register.district")} *</label>
                  <select
                    name="district"
                    value={formData.district}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-slate-700 focus:bg-white cursor-pointer"
                  >
                    <option value="Delhi South">Delhi South</option>
                    <option value="Delhi North">Delhi North</option>
                    <option value="Delhi Central">Delhi Central</option>
                    <option value="Delhi East">Delhi East</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{t("register.city")}</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="e.g. Saket"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-slate-900 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {t("register.taxIdentifier")} <span className="text-[11px] font-normal text-slate-500">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    name="taxIdentifier"
                    value={formData.taxIdentifier || ""}
                    onChange={handleChange}
                    placeholder="e.g. GSTIN / Trade Registration / Shop Act"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-md text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#801424]/20 focus:border-[#801424]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {t("register.supportingDoc")} <span className="text-[11px] font-normal text-slate-500">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    name="supportingDocumentNote"
                    value={formData.supportingDocumentNote || ""}
                    onChange={handleChange}
                    placeholder="e.g. Trade license or premises lease ref"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-md text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#801424]/20 focus:border-[#801424]"
                  />
                </div>
              </div>

              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded text-[11px] text-slate-600">
                <strong>Statutory Verification Notice:</strong> Business registration and tax identifiers are recorded for administrative profiling. External verification against GSTN or municipal Trade License databases is not performed in this frontend prototype.
              </div>

              <div className="pt-3 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-slate-500 hover:text-slate-800 text-xs cursor-pointer"
                >
                  ← {t("common.previous")}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#801424] hover:bg-[#6D0E1C] text-white font-semibold rounded-md shadow-xs transition-colors cursor-pointer"
                >
                  {t("register.nextOtp")}
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: OTP Simulation */}
          {step === 3 && (
            <form onSubmit={handleConfirmOtp} className="space-y-4 text-xs sm:text-sm">
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-md space-y-2">
                <p className="font-semibold text-slate-800">
                  {t("register.otpTitle")}
                </p>
                <p className="text-slate-600 text-xs">
                  {t("register.otpSubtitle")}
                </p>
                <p className="text-[11px] text-emerald-700 font-mono bg-emerald-50 p-2 rounded border border-emerald-200">
                  {t("register.otpHelper")}
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {t("register.enterOtp")} *
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  required
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-md text-slate-900 font-mono text-center tracking-widest text-lg font-bold focus:outline-none focus:ring-2 focus:ring-[#801424]/20 focus:border-[#801424]"
                />
              </div>

              <div className="pt-3 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="text-slate-500 hover:text-slate-800 text-xs cursor-pointer"
                >
                  {t("register.editDetails")}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-[#801424] hover:bg-[#6D0E1C] disabled:opacity-60 text-white font-semibold rounded-md shadow-xs transition-colors cursor-pointer"
                >
                  {isSubmitting ? t("common.loading") : t("register.completeRegistration")}
                </button>
              </div>
            </form>
          )}

          {/* STEP 4: Success Confirmation */}
          {step === 4 && (
            <div className="text-center py-6 space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto text-2xl">
                ✓
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                {t("register.successTitle")}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Welcome, <strong>{formData.fullName}</strong>. Your establishment <strong>{formData.establishmentName}</strong> is registered under Delhi South Zone.
              </p>

              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => router.push("/owner/dashboard")}
                  className="w-full sm:w-auto px-5 py-2.5 bg-[#801424] hover:bg-[#6D0E1C] text-white font-semibold text-xs sm:text-sm rounded-md shadow-xs transition-colors cursor-pointer"
                >
                  {t("register.goToPortal")}
                </button>
                <Link
                  href="/login"
                  className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs sm:text-sm rounded-md shadow-2xs transition-colors text-center"
                >
                  {t("auth.signIn")}
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="w-full py-4 px-6 border-t border-slate-200/60 bg-[#F5F6F8] text-center text-xs text-slate-500">
        <p className="font-medium text-slate-600">Department of Consumer Affairs, Government of India</p>
        <p className="mt-0.5 text-slate-400">National Metrology e-Mapan Services Portal</p>
      </footer>
    </div>
  );
}
