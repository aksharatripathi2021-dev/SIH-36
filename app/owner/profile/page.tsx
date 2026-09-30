"use client";

import React, { useEffect, useState } from "react";
import { AppHeader } from "@/app/components/AppHeader";
import { OwnerSidebar } from "@/app/components/OwnerSidebar";
import { authService } from "@/services/authService";
import { registrationService } from "@/services/registrationService";
import { UserProfile } from "@/types";

export default function OwnerProfilePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    organization: "",
    mobile: "",
    email: "",
    address: "",
    city: "",
    district: "",
    state: "",
    preferredLanguage: "English"
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const active = await authService.getCurrentUser();
    setUser(active);
    setFormData({
      name: active.name || "",
      organization: active.organization || "",
      mobile: active.mobile || "",
      email: active.email || "",
      address: active.address || "",
      city: active.city || "New Delhi",
      district: active.district || "Delhi South",
      state: active.state || "Delhi",
      preferredLanguage: active.preferredLanguage || "English"
    });
    setLoading(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setSaveSuccess(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const updated = await registrationService.updateTraderProfile(user.id, {
        name: formData.name,
        organization: formData.organization,
        mobile: formData.mobile,
        email: formData.email,
        address: formData.address,
        city: formData.city,
        district: formData.district,
        state: formData.state,
        preferredLanguage: formData.preferredLanguage
      });

      setUser(updated);
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      alert("Failed to update profile: " + (err.message || "Unknown error"));
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex">
      <OwnerSidebar
        activeItem="profile"
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <AppHeader
          title="Trader Profile"
          breadcrumbs={[
            { label: "Home", href: "/owner/dashboard" },
            { label: "Profile" }
          ]}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-5xl w-full mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Business &amp; Trader Profile
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Official establishment details registered with Legal Metrology jurisdiction.
              </p>
            </div>

            {!isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-[#801424] hover:bg-[#6D0E1C] text-white text-xs sm:text-sm font-semibold rounded-md shadow-xs transition-colors cursor-pointer self-start sm:self-auto flex items-center gap-1.5"
              >
                <span>✏️</span>
                <span>Edit Profile</span>
              </button>
            )}
          </div>

          {/* Success Banner */}
          {saveSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md text-xs sm:text-sm text-emerald-800 font-medium flex items-center gap-2">
              <span>✓</span>
              <span>Profile details updated and saved successfully in demo session storage.</span>
            </div>
          )}

          {/* Profile Card */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-2xs p-5 sm:p-7 space-y-6">
            {/* Top Identity Row */}
            <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
              <div className="w-16 h-16 rounded-full bg-[#0D1B2A] text-white text-xl font-bold flex items-center justify-center shrink-0">
                {user?.avatarInitials || "TR"}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900">{user?.name || "Trader"}</h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase">
                    {user?.status || "Active"}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Establishment: <strong className="text-slate-800">{user?.organization || "Registered Enterprise"}</strong>
                </p>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                  Account ID: {user?.id} · Role: Trader / Instrument Owner
                </p>
              </div>
            </div>

            {/* Profile Form */}
            <form onSubmit={handleSave} className="space-y-5 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Proprietor / Responsible Person Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    disabled={!isEditing}
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-md text-slate-900 disabled:opacity-75 disabled:bg-slate-100"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Establishment / Business Name
                  </label>
                  <input
                    type="text"
                    name="organization"
                    disabled={!isEditing}
                    value={formData.organization}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-md text-slate-900 disabled:opacity-75 disabled:bg-slate-100"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Mobile Number
                  </label>
                  <input
                    type="text"
                    name="mobile"
                    disabled={!isEditing}
                    value={formData.mobile}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-md text-slate-900 disabled:opacity-75 disabled:bg-slate-100"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    disabled={!isEditing}
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-md text-slate-900 disabled:opacity-75 disabled:bg-slate-100"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Premises Address
                  </label>
                  <textarea
                    name="address"
                    rows={2}
                    disabled={!isEditing}
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-md text-slate-900 disabled:opacity-75 disabled:bg-slate-100"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">State</label>
                  <input
                    type="text"
                    name="state"
                    disabled={!isEditing}
                    value={formData.state}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-md text-slate-900 disabled:opacity-75 disabled:bg-slate-100"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">District</label>
                  <input
                    type="text"
                    name="district"
                    disabled={!isEditing}
                    value={formData.district}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-md text-slate-900 disabled:opacity-75 disabled:bg-slate-100"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">City / Locality</label>
                  <input
                    type="text"
                    name="city"
                    disabled={!isEditing}
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-md text-slate-900 disabled:opacity-75 disabled:bg-slate-100"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Preferred Language
                  </label>
                  <select
                    name="preferredLanguage"
                    disabled={!isEditing}
                    value={formData.preferredLanguage}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-md text-slate-700 disabled:opacity-75 disabled:bg-slate-100 cursor-pointer"
                  >
                    <option value="English">English</option>
                    <option value="Hindi">हिन्दी (Hindi)</option>
                    <option value="Tamil">தமிழ் (Tamil)</option>
                    <option value="Marathi">मराठी (Marathi)</option>
                  </select>
                </div>
              </div>

              {isEditing && (
                <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      loadProfile();
                    }}
                    className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-md text-xs sm:text-sm font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#801424] hover:bg-[#6D0E1C] text-white rounded-md text-xs sm:text-sm font-semibold shadow-xs cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              )}
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
