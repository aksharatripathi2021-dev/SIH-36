"use client";

import React, { useEffect, useState } from "react";
import { AppHeader } from "@/app/components/AppHeader";
import { MinistrySidebar } from "@/app/components/MinistrySidebar";
import { authService } from "@/services/authService";
import { UserProfile } from "@/types";
import { useTranslation } from "@/i18n";

export default function AdminUsersPage() {
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authService.getAllUsers().then((u) => {
      setUsers(u);
      setLoading(false);
    });
  }, []);

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.organization && u.organization.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex">
      <MinistrySidebar
        activeItem="users"
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <AppHeader
          title={t("nav.users")}
          breadcrumbs={[
            { label: t("nav.dashboard"), href: "/admin/dashboard" },
            { label: t("nav.users") }
          ]}
          avatarInitials="MA"
          notificationCount={5}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Institutional Directory
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Authorized officers, accredited testing laboratories, traders, and administrative personnel.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 shadow-2xs p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative w-full sm:w-72">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search user by name, email, or role"
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-300 focus:bg-white"
                />
              </div>

              <span className="text-xs text-slate-400 ml-auto">
                Showing {filtered.length} account{filtered.length !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="overflow-x-auto border border-slate-100 rounded-md">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-2.5 px-4">User</th>
                    <th className="py-2.5 px-4">Role</th>
                    <th className="py-2.5 px-4">Email</th>
                    <th className="py-2.5 px-4">Mobile</th>
                    <th className="py-2.5 px-4">Designation / Organization</th>
                    <th className="py-2.5 px-4">Zone</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-400 text-xs">
                        Loading directory…
                      </td>
                    </tr>
                  ) : filtered.length > 0 ? (
                    filtered.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-[#0D1B2A] text-white text-xs font-bold flex items-center justify-center shrink-0">
                              {u.avatarInitials}
                            </div>
                            <span className="font-semibold text-slate-900">{u.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              u.role === "ADMIN"
                                ? "bg-red-50 text-red-700 border border-red-200"
                                : u.role === "LMO"
                                ? "bg-blue-50 text-blue-700 border border-blue-200"
                                : u.role === "GATC"
                                ? "bg-cyan-50 text-cyan-700 border border-cyan-200"
                                : "bg-slate-100 text-slate-700 border border-slate-200"
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600">{u.email}</td>
                        <td className="py-3 px-4 text-slate-600">{u.mobile}</td>
                        <td className="py-3 px-4 text-slate-700">
                          {u.designation || u.organization || "—"}
                        </td>
                        <td className="py-3 px-4 text-slate-600">{u.zone || "National"}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-400 text-xs">
                        No users found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
