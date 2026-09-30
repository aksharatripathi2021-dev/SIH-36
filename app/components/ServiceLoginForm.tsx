"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authService } from "@/services/authService";
import { UserRole } from "@/types";
import { useTranslation } from "@/i18n";

export type RoleType = "owner" | "lmo" | "gatc" | "admin";

interface RoleOption {
  id: RoleType;
  roleEnum: UserRole;
  labelKey: string;
  defaultIdentifier: string;
  badgeKey: string;
}

const ROLES: RoleOption[] = [
  { id: "owner", roleEnum: "OWNER", labelKey: "roles.owner", defaultIdentifier: "owner@bharatmart.com", badgeKey: "roles.ownerBadge" },
  { id: "lmo", roleEnum: "LMO", labelKey: "roles.lmo", defaultIdentifier: "lmo.delhisouth@gov.in", badgeKey: "roles.lmoBadge" },
  { id: "gatc", roleEnum: "GATC", labelKey: "roles.gatc", defaultIdentifier: "lab@gatc.gov.in", badgeKey: "roles.gatcBadge" },
  { id: "admin", roleEnum: "ADMIN", labelKey: "roles.admin", defaultIdentifier: "admin@consumeraffairs.nic.in", badgeKey: "roles.adminBadge" },
];

export function ServiceLoginForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<RoleType>("owner");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [captchaInput, setCaptchaInput] = useState("");
  const [captchaCode, setCaptchaCode] = useState("A 7 K 4 P");
  const [showPassword, setShowPassword] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const activeRoleObj = ROLES.find((r) => r.id === selectedRole) || ROLES[0];

  const handleRoleChange = async (roleId: RoleType) => {
    setSelectedRole(roleId);
    setStatusMessage(null);
    const roleOpt = ROLES.find((r) => r.id === roleId);
    if (roleOpt) {
      await authService.switchRole(roleOpt.roleEnum);
    }
  };

  const refreshCaptcha = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let newCode = "";
    for (let i = 0; i < 5; i++) {
      newCode += chars.charAt(Math.floor(Math.random() * chars.length)) + " ";
    }
    setCaptchaCode(newCode.trim());
    setCaptchaInput("");
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = await authService.login(identifier || activeRoleObj.defaultIdentifier, activeRoleObj.roleEnum);
    setStatusMessage(`Authenticated as ${user.name} (${user.role}) — redirecting…`);
    const routes: Record<RoleType, string> = {
      owner: "/owner/dashboard",
      lmo:   "/lmo/dashboard",
      gatc:  "/gatc/dashboard",
      admin: "/admin/dashboard",
    };
    setTimeout(() => router.push(routes[selectedRole]), 600);
  };

  return (
    <div className="w-full max-w-[560px] mx-auto bg-white rounded-lg border border-slate-200 shadow-sm p-6 sm:p-8">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          {t("auth.serviceLogin")}
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          {t("auth.signInSubtitle")}
        </p>
      </div>

      {/* Role Selection Tabs */}
      <div className="mb-6">
        <div
          role="tablist"
          aria-label="User Roles"
          className="grid grid-cols-2 sm:grid-cols-4 gap-1 p-1 bg-slate-100/90 rounded-md border border-slate-200/70"
        >
          {ROLES.map((role) => {
            const isSelected = selectedRole === role.id;
            return (
              <button
                key={role.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => handleRoleChange(role.id)}
                className={`py-2 px-2 text-xs font-medium rounded transition-all duration-150 text-center truncate cursor-pointer ${
                  isSelected
                    ? "bg-white text-slate-900 font-semibold shadow-xs border border-slate-200/90"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                }`}
                title={t(role.labelKey)}
              >
                {t(role.labelKey)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Login Form */}
      <form onSubmit={handleLoginSubmit} className="space-y-4">
        {/* Field 1: Registered mobile number / email */}
        <div>
          <label
            htmlFor="identifier"
            className="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5"
          >
            {t("auth.identifier")}
          </label>
          <input
            id="identifier"
            name="identifier"
            type="text"
            required
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder={activeRoleObj.defaultIdentifier}
            className="w-full px-3.5 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-md shadow-2xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#801424]/20 focus:border-[#801424] transition-colors"
          />
        </div>

        {/* Field 2: Password */}
        <div>
          <label
            htmlFor="password"
            className="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5"
          >
            {t("auth.password")}
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("auth.enterPassword")}
              className="w-full px-3.5 py-2 pr-10 text-sm text-slate-900 bg-white border border-slate-300 rounded-md shadow-2xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#801424]/20 focus:border-[#801424] transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              title={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Field 3: Verification code (Captcha) */}
        <div>
          <label
            htmlFor="captchaInput"
            className="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5"
          >
            {t("auth.captcha")}
          </label>
          <div className="flex items-center gap-3">
            {/* Styled Captcha Visual Display */}
            <div className="relative shrink-0 flex items-center justify-between border border-slate-300 rounded-md bg-slate-100/90 px-3.5 py-1.5 shadow-inner">
              <span className="font-mono text-base font-bold tracking-[0.25em] text-slate-800 select-none">
                {captchaCode}
              </span>
              <button
                type="button"
                onClick={refreshCaptcha}
                className="ml-2 text-slate-500 hover:text-slate-800 p-0.5 cursor-pointer"
                title={t("auth.refreshCaptcha")}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>

            {/* Captcha Input */}
            <div className="flex-1">
              <input
                id="captchaInput"
                name="captchaInput"
                type="text"
                required
                maxLength={6}
                value={captchaInput}
                onChange={(e) => setCaptchaInput(e.target.value.toUpperCase())}
                placeholder={t("auth.enterCaptcha")}
                className="w-full px-3.5 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-md shadow-2xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#801424]/20 focus:border-[#801424] uppercase tracking-wider transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Primary Sign In Button */}
        <div className="pt-2">
          <button
            type="submit"
            className="w-full py-2.5 px-4 bg-[#801424] hover:bg-[#6D0E1C] active:bg-[#580D18] text-white text-sm font-semibold rounded-md shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <span>{t("auth.signIn")}</span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>

        {/* Status Feedback Notice (if triggered) */}
        {statusMessage && (
          <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800 text-center font-medium">
            {statusMessage}
          </div>
        )}

        {/* Action Links */}
        <div className="flex items-center justify-between pt-2 text-xs sm:text-sm">
          {selectedRole === "owner" ? (
            <Link
              href="/register"
              className="text-[#801424] font-semibold hover:underline flex items-center gap-1"
            >
              <span>+ {t("auth.newTraderPrompt")} {t("auth.registerHere")}</span>
            </Link>
          ) : (
            <span className="text-slate-400 text-xs">Official Portal (Institutional Access)</span>
          )}

          <button
            type="button"
            onClick={() => alert("Password reset workflow will be enabled in prototype demo mode.")}
            className="text-slate-600 hover:text-slate-900 hover:underline cursor-pointer"
          >
            Forgot password
          </button>
        </div>
      </form>
    </div>
  );
}
