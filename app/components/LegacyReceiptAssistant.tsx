"use client";

import React, { useState, useEffect } from "react";
import { useTranslation } from "@/i18n";
import {
  LegacyReceiptExtraction,
  LegacyReceiptField,
  LegacyReceiptFieldKey,
  Instrument,
  UserProfile,
  InstrumentMatchResult
} from "@/types";
import { legacyReceiptService, DemoReceiptDescriptor } from "@/services/legacyReceiptService";

interface LegacyReceiptAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  onApply?: (
    fields: Record<string, string>,
    matchedInstrument?: Instrument | null,
    fullExtraction?: LegacyReceiptExtraction
  ) => void;
  currentUser?: UserProfile | null;
  mode?: "trader-entry" | "lmo-reference";
}

export function LegacyReceiptAssistant({
  isOpen,
  onClose,
  onApply,
  currentUser,
  mode = "trader-entry"
}: LegacyReceiptAssistantProps) {
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState<"demo" | "upload">("demo");
  const [demoReceipts, setDemoReceipts] = useState<DemoReceiptDescriptor[]>([]);
  const [selectedDemoId, setSelectedDemoId] = useState<string>("DEMO-RECEIPT-001");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [currentExtraction, setCurrentExtraction] = useState<LegacyReceiptExtraction | null>(null);
  const [matchResult, setMatchResult] = useState<InstrumentMatchResult | null>(null);
  const [selectedMatchedInstrument, setSelectedMatchedInstrument] = useState<Instrument | null>(null);

  // Field editing state
  const [editingKey, setEditingKey] = useState<LegacyReceiptFieldKey | null>(null);
  const [editTempValue, setEditTempValue] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      loadDemoData();
    }
  }, [isOpen]);

  const loadDemoData = async () => {
    const demos = legacyReceiptService.getDemoReceipts();
    setDemoReceipts(demos);
    // Initialize with first demo receipt
    await handleExtractDemo("DEMO-RECEIPT-001");
  };

  const handleExtractDemo = async (demoId: string) => {
    setSelectedDemoId(demoId);
    setUploadedFile(null);
    setUploadError(null);
    setEditingKey(null);

    const extraction = await legacyReceiptService.extractFromDemo(demoId, currentUser || undefined);
    setCurrentExtraction(extraction);

    // Run instrument matching if serial number is present
    const serialField = extraction.fields.find((f) => f.key === "serialNumber");
    const serial = serialField?.finalValue || serialField?.suggestedValue || "";
    const match = await legacyReceiptService.matchInstrument(serial, currentUser?.id);
    setMatchResult(match);
    setSelectedMatchedInstrument(match.matchedInstrument || null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(jpe?g|png|webp|pdf)$/i)) {
      setUploadError("Unsupported format. Please select an image (JPG, PNG, WebP) or PDF receipt.");
      return;
    }

    // Validate size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("File size exceeds 10MB limit. Please upload a smaller document.");
      return;
    }

    setUploadedFile(file);
    setEditingKey(null);

    const extraction = await legacyReceiptService.extractFromUpload(file, currentUser || undefined);
    setCurrentExtraction(extraction);

    const serialField = extraction.fields.find((f) => f.key === "serialNumber");
    const serial = serialField?.finalValue || serialField?.suggestedValue || "";
    const match = await legacyReceiptService.matchInstrument(serial, currentUser?.id);
    setMatchResult(match);
    setSelectedMatchedInstrument(match.matchedInstrument || null);
  };

  const handleStartEdit = (field: LegacyReceiptField) => {
    setEditingKey(field.key);
    setEditTempValue(field.finalValue || field.suggestedValue || "");
  };

  const handleSaveEdit = (key: LegacyReceiptFieldKey) => {
    if (!currentExtraction) return;
    const updated = legacyReceiptService.updateField(currentExtraction, key, editTempValue);
    setCurrentExtraction(updated);
    setEditingKey(null);
  };

  const handleMarkVerified = (key: LegacyReceiptFieldKey) => {
    if (!currentExtraction) return;
    const field = currentExtraction.fields.find((f) => f.key === key);
    const val = field?.finalValue || field?.suggestedValue || "";
    const updated = legacyReceiptService.updateField(currentExtraction, key, val);
    setCurrentExtraction(updated);
    setEditingKey(null);
  };

  const handleClearField = (key: LegacyReceiptFieldKey) => {
    if (!currentExtraction) return;
    const updated = legacyReceiptService.clearField(currentExtraction, key);
    setCurrentExtraction(updated);
    setEditingKey(null);
  };

  const handleConfirmAndApply = () => {
    if (!currentExtraction) return;

    // Build key-value map from reviewed extraction fields
    const values: Record<string, string> = {};
    currentExtraction.fields.forEach((f) => {
      const val = f.finalValue || f.suggestedValue || "";
      if (val) {
        values[f.key] = val;
      }
    });

    if (onApply) {
      onApply(values, selectedMatchedInstrument, currentExtraction);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="receipt-assistant-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
    >
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-5xl my-6 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-[#801424] text-white flex items-center justify-center font-bold text-sm shadow-xs">
              ⚡
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="receipt-assistant-title" className="text-base font-bold text-slate-900">
                  {t("receipt.assistantTitle")}
                </h3>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                  Prototype Demo
                </span>
                {mode === "lmo-reference" && (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-300">
                    LMO Reference Mode
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {t("receipt.assistantSubtitle")}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="w-8 h-8 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Prototype Safety Notice */}
        <div className="bg-amber-50 border-b border-amber-200 px-5 py-2.5 flex items-start gap-2.5 text-xs text-amber-900 shrink-0">
          <span className="text-amber-600 font-bold shrink-0 mt-0.5">⚠️</span>
          <div>
            <span className="font-semibold">{t("receipt.disclaimer")}</span>{" "}
            <span className="text-amber-800">
              Assisted extraction is a data-entry prototype. AI suggestions are NOT final legal or verification decisions.
            </span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Top Controls: Demo Receipt vs Upload Document */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-4">
            <div className="flex items-center gap-4 border-b border-slate-200 pb-3">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("demo");
                  handleExtractDemo(selectedDemoId);
                }}
                className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "demo"
                    ? "bg-[#801424] text-white shadow-xs"
                    : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                <span>📋</span>
                <span>{t("receipt.useDemoReceipt")}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("upload")}
                className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "upload"
                    ? "bg-[#801424] text-white shadow-xs"
                    : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                <span>📤</span>
                <span>{t("receipt.uploadReceipt")}</span>
              </button>
            </div>

            {activeTab === "demo" ? (
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <label htmlFor="demo-select" className="text-xs font-medium text-slate-700 whitespace-nowrap">
                  {t("receipt.selectDemo")}:
                </label>
                <select
                  id="demo-select"
                  value={selectedDemoId}
                  onChange={(e) => handleExtractDemo(e.target.value)}
                  className="w-full sm:w-auto px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#801424] cursor-pointer"
                >
                  <option value="DEMO-RECEIPT-001">
                    DEMO-RECEIPT-001 — Electronic Scale (High confidence, verified trader)
                  </option>
                  <option value="DEMO-RECEIPT-002">
                    DEMO-RECEIPT-002 — Flow Meter (Missing/uncertain fields demo)
                  </option>
                  <option value="DEMO-RECEIPT-003">
                    DEMO-RECEIPT-003 — Weighbridge (Mixed confidence, historical stamp)
                  </option>
                </select>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-700">
                  {t("receipt.dropzone")}
                </label>
                <div className="border border-dashed border-slate-300 rounded-lg p-4 bg-white text-center hover:bg-slate-50 transition-colors">
                  <input
                    type="file"
                    id="receipt-file-input"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    onChange={handleFileUpload}
                    className="text-xs text-slate-600 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-[#801424] file:text-white hover:file:bg-[#6D0E1C] cursor-pointer"
                  />
                  {uploadedFile && (
                    <p className="text-xs text-emerald-600 font-semibold mt-2">
                      ✓ Selected: {uploadedFile.name} ({(uploadedFile.size / 1024).toFixed(1)} KB)
                    </p>
                  )}
                </div>
                {uploadError && (
                  <p className="text-xs text-rose-600 font-medium">{uploadError}</p>
                )}
                <p className="text-[11px] text-slate-500 italic">
                  {t("receipt.demoNotice")}
                </p>
              </div>
            )}
          </div>

          {/* Document Preview & Extraction Status */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Source Document Preview Box */}
            <div className="lg:col-span-4 bg-slate-900 text-slate-100 rounded-lg p-4 font-mono text-xs flex flex-col justify-between shadow-xs border border-slate-800">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400">
                    {t("receipt.receiptPreview")}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                    {currentExtraction?.sourceType.toUpperCase()}
                  </span>
                </div>

                {activeTab === "demo" ? (
                  <div className="space-y-2 bg-slate-800/80 p-3 rounded border border-slate-700 text-[11px] leading-relaxed">
                    <p className="font-bold text-center text-slate-200 border-b border-slate-700 pb-1">
                      LEGAL METROLOGY DEPT
                    </p>
                    <p className="text-slate-400">
                      MEMO REF: <span className="text-slate-200 font-semibold">{currentExtraction?.id}</span>
                    </p>
                    <p className="text-slate-400">
                      FILE: <span className="text-slate-200">{currentExtraction?.sourceFileName}</span>
                    </p>
                    <p className="text-slate-400">
                      EXTRACTED AT: <span className="text-slate-200">{currentExtraction?.extractedAt}</span>
                    </p>
                    <div className="pt-2 border-t border-slate-700 space-y-1">
                      <p className="text-slate-400">
                        ESTABLISHMENT:{" "}
                        <span className="text-amber-300 font-semibold">
                          {currentExtraction?.fields.find((f) => f.key === "establishmentName")?.suggestedValue || "—"}
                        </span>
                      </p>
                      <p className="text-slate-400">
                        SERIAL:{" "}
                        <span className="text-emerald-300 font-semibold">
                          {currentExtraction?.fields.find((f) => f.key === "serialNumber")?.suggestedValue || "—"}
                        </span>
                      </p>
                      <p className="text-slate-400">
                        PREV VERIFICATION:{" "}
                        <span className="text-slate-300">
                          {currentExtraction?.fields.find((f) => f.key === "previousVerificationDate")?.suggestedValue || "—"}
                        </span>
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 bg-slate-800/80 p-4 rounded border border-slate-700 text-center">
                    <span className="text-3xl block mb-1">📄</span>
                    <p className="text-xs font-semibold text-slate-200 truncate">
                      {uploadedFile ? uploadedFile.name : "Custom Receipt Document"}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {uploadedFile ? `${(uploadedFile.size / 1024).toFixed(1)} KB` : "No file uploaded"}
                    </p>
                    <p className="text-[11px] text-amber-300/90 pt-2 border-t border-slate-700 mt-2">
                      Prototype Mode: Standard extraction structure initialized. Please verify all fields manually.
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-700 flex items-center justify-between text-[11px] text-slate-400">
                <span>Confidence engine:</span>
                <span className="text-emerald-400 font-semibold">Deterministic V1</span>
              </div>
            </div>

            {/* Instrument Matching Result Card */}
            <div className="lg:col-span-8 space-y-4">
              {matchResult && (
                <div
                  className={`rounded-lg p-3.5 border flex items-start gap-3 ${
                    matchResult.status === "MATCH_FOUND"
                      ? "bg-emerald-50/80 border-emerald-300 text-emerald-900"
                      : matchResult.status === "MULTIPLE_MATCHES"
                      ? "bg-amber-50/80 border-amber-300 text-amber-900"
                      : "bg-slate-50 border-slate-300 text-slate-800"
                  }`}
                >
                  <span className="text-base shrink-0 mt-0.5">
                    {matchResult.status === "MATCH_FOUND"
                      ? "✓"
                      : matchResult.status === "MULTIPLE_MATCHES"
                      ? "⚠️"
                      : "ℹ️"}
                  </span>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs uppercase tracking-wider">
                        {matchResult.status === "MATCH_FOUND" && t("receipt.matchFound")}
                        {matchResult.status === "MATCH_NOT_FOUND" && t("receipt.matchNotFound")}
                        {matchResult.status === "MULTIPLE_MATCHES" && t("receipt.multipleMatches")}
                        {matchResult.status === "INSUFFICIENT_INFO" && t("receipt.insufficientInfo")}
                      </span>
                    </div>
                    <p className="text-xs">{matchResult.message}</p>

                    {matchResult.matchedInstrument && (
                      <div className="mt-2 bg-white/90 p-2.5 rounded border border-emerald-200 text-xs text-slate-800 flex items-center justify-between">
                        <div>
                          <span className="font-bold text-emerald-800">{matchResult.matchedInstrument.id}</span> —{" "}
                          <span>{matchResult.matchedInstrument.name}</span> (Serial:{" "}
                          <span className="font-mono">{matchResult.matchedInstrument.serialNumber}</span>)
                        </div>
                        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                          Linked
                        </span>
                      </div>
                    )}

                    {matchResult.candidates && matchResult.candidates.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <span className="text-[11px] font-semibold text-slate-700">
                          {t("receipt.selectInstrument")}:
                        </span>
                        <div className="space-y-1">
                          {matchResult.candidates.map((c: Instrument) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => setSelectedMatchedInstrument(c)}
                              className={`w-full text-left p-2 rounded text-xs flex items-center justify-between border transition-colors ${
                                selectedMatchedInstrument?.id === c.id
                                  ? "bg-amber-100 border-amber-400 font-semibold"
                                  : "bg-white border-slate-200 hover:bg-slate-50"
                              }`}
                            >
                              <span>
                                {c.id} — {c.name} ({c.serialNumber})
                              </span>
                              {selectedMatchedInstrument?.id === c.id && (
                                <span className="text-amber-800 text-[11px]">Selected ✓</span>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Extracted Fields Table */}
              <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-2xs">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    {t("receipt.extractedInformation")}
                  </h4>
                  <span className="text-[11px] text-slate-500">
                    {currentExtraction?.fields.length || 0} fields identified
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-600 font-semibold">
                        <th className="py-2.5 px-3">Field</th>
                        <th className="py-2.5 px-3">Extracted / Verified Value</th>
                        <th className="py-2.5 px-3">{t("receipt.confidence")}</th>
                        <th className="py-2.5 px-3">State</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {currentExtraction?.fields.map((field) => {
                        const isEditing = editingKey === field.key;
                        const displayValue = field.finalValue ?? field.suggestedValue ?? "";

                        return (
                          <tr
                            key={field.key}
                            className={`hover:bg-slate-50/50 transition-colors ${
                              field.confidence === "LOW" && field.sourceState !== "USER_VERIFIED"
                                ? "bg-amber-50/30"
                                : ""
                            }`}
                          >
                            {/* Field Name */}
                            <td className="py-2 px-3 font-medium text-slate-800 align-top whitespace-nowrap">
                              {field.label}
                            </td>

                            {/* Value (Display or Edit) */}
                            <td className="py-2 px-3 text-slate-900 align-top">
                              {isEditing ? (
                                <div className="flex items-center gap-1.5 max-w-sm">
                                  <input
                                    type="text"
                                    value={editTempValue}
                                    onChange={(e) => setEditTempValue(e.target.value)}
                                    className="w-full px-2 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-[#801424] bg-white"
                                    autoFocus
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleSaveEdit(field.key)}
                                    className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-semibold cursor-pointer shrink-0"
                                  >
                                    Save
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingKey(null)}
                                    className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-[11px] cursor-pointer shrink-0"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : displayValue ? (
                                <span
                                  className={`font-medium ${
                                    field.sourceState === "USER_VERIFIED"
                                      ? "text-emerald-800"
                                      : "text-slate-800"
                                  }`}
                                >
                                  {displayValue}
                                </span>
                              ) : (
                                <span className="text-slate-400 italic">Not available</span>
                              )}
                            </td>

                            {/* Confidence Badge */}
                            <td className="py-2 px-3 align-top whitespace-nowrap">
                              {field.confidence === "HIGH" && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  <span>●</span>
                                  <span>{t("receipt.high")}</span>
                                </span>
                              )}
                              {field.confidence === "MEDIUM" && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                                  <span>▲</span>
                                  <span>{t("receipt.medium")}</span>
                                </span>
                              )}
                              {field.confidence === "LOW" && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-100 text-rose-800 border border-rose-200">
                                  <span>!</span>
                                  <span>{t("receipt.low")}</span>
                                </span>
                              )}
                            </td>

                            {/* Source State Badge */}
                            <td className="py-2 px-3 align-top whitespace-nowrap">
                              {field.sourceState === "USER_VERIFIED" && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  {t("receipt.userVerified")} ✓
                                </span>
                              )}
                              {field.sourceState === "AI_SUGGESTED" && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                  {t("receipt.aiSuggested")}
                                </span>
                              )}
                              {field.sourceState === "NOT_FOUND" && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                                  {t("receipt.notFound")}
                                </span>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="py-2 px-3 align-top text-right whitespace-nowrap">
                              {!isEditing && (
                                <div className="flex items-center justify-end gap-1.5">
                                  {field.sourceState !== "USER_VERIFIED" && displayValue && (
                                    <button
                                      type="button"
                                      onClick={() => handleMarkVerified(field.key)}
                                      className="text-[11px] text-emerald-700 hover:text-emerald-900 font-semibold hover:underline cursor-pointer"
                                    >
                                      {t("receipt.markVerified")}
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleStartEdit(field)}
                                    className="text-[11px] text-blue-700 hover:text-blue-900 font-semibold hover:underline cursor-pointer"
                                  >
                                    {t("receipt.editValue")}
                                  </button>
                                  {displayValue && (
                                    <button
                                      type="button"
                                      onClick={() => handleClearField(field.key)}
                                      className="text-[11px] text-slate-400 hover:text-rose-600 cursor-pointer"
                                    >
                                      {t("receipt.clearValue")}
                                    </button>
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <span>ℹ️</span>
            <span>{t("receipt.reviewExtractedInfo")}</span>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Close
            </button>

            {mode === "trader-entry" && (
              <button
                type="button"
                onClick={handleConfirmAndApply}
                className="px-5 py-2 bg-[#801424] hover:bg-[#6D0E1C] active:bg-[#580D18] text-white text-xs font-semibold rounded-md shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span>{t("receipt.confirmAndContinue")}</span>
                <span>→</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
