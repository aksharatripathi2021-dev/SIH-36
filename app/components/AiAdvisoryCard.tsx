"use client";

import React, { useState } from "react";
import { AiAdvisoryAssessment, RiskFactor, RiskLevel } from "@/types";
import { useTranslation } from "@/i18n";
import { PROTOTYPE_ADVISORY_CONFIG } from "@/services/aiAdvisoryService";

interface Props {
  assessment: AiAdvisoryAssessment;
  onSelectScenario?: (scenarioId: string) => void;
  selectedScenarioId?: string;
  className?: string;
}

export function AiAdvisoryCard({
  assessment,
  onSelectScenario,
  selectedScenarioId,
  className = ""
}: Props) {
  const { t } = useTranslation();
  // State for expanded factor accordion details (default expanded for detected factors)
  const [expandedFactors, setExpandedFactors] = useState<Record<string, boolean>>({
    DRIFT: true,
    NON_LINEARITY: true,
    IDENTICAL_READINGS: true,
    ERROR_TREND: true
  });

  const toggleFactor = (type: string) => {
    setExpandedFactors((prev) => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  // Helper for risk badge styling & text
  const getRiskBadge = () => {
    // When insufficient data exists, do not visually communicate "LOW RISK"
    if (assessment.insufficientData || assessment.assessmentStatus === "INSUFFICIENT_DATA") {
      return {
        bg: "bg-amber-50 text-amber-950 border-amber-300",
        dot: "bg-amber-500",
        label: t("advisory.inconclusive"),
        icon: "ℹ️"
      };
    }

    switch (assessment.riskLevel) {
      case "HIGH":
        return {
          bg: "bg-rose-100 text-rose-900 border-rose-300",
          dot: "bg-rose-600",
          label: t("advisory.highRisk"),
          icon: "⚠️"
        };
      case "MEDIUM":
        return {
          bg: "bg-amber-100 text-amber-900 border-amber-300",
          dot: "bg-amber-600",
          label: t("advisory.mediumRisk"),
          icon: "⚡"
        };
      case "LOW":
      default:
        return {
          bg: "bg-emerald-100 text-emerald-900 border-emerald-300",
          dot: "bg-emerald-600",
          label: t("advisory.lowRisk"),
          icon: "✓"
        };
    }
  };

  const riskBadge = getRiskBadge();

  return (
    <div
      className={`bg-white rounded-lg border border-slate-200 p-5 shadow-2xs space-y-4 ${className}`}
      data-testid="ai-advisory-card"
    >
      {/* ── Top Header with Title, Badge, and Prototype Indicator ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-lg">🤖</span>
            <h4 className="text-sm font-bold text-slate-900">
              {t("advisory.title")}
            </h4>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-sky-50 text-sky-800 border border-sky-200">
              {t("advisory.decisionSupport")}
            </span>
            <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
              {t("advisory.heuristic")}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            {t("advisory.subtitle")} — Cross-observation pattern and historical drift analysis.
          </p>
        </div>

        {/* Composite Risk Indicator */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs font-semibold text-slate-600 hidden md:inline">
            {t("advisory.compositeRisk")}:
          </span>
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-2xs ${riskBadge.bg}`}
            role="status"
            aria-label={`Composite risk level: ${riskBadge.label}`}
          >
            <span className={`w-2 h-2 rounded-full ${riskBadge.dot} animate-pulse`} />
            <span>{riskBadge.icon}</span>
            <span className="tracking-wide uppercase">{riskBadge.label}</span>
          </div>
        </div>
      </div>

      {/* ── Demo Scenario Switcher (Interactive for LMO) ── */}
      {onSelectScenario && (
        <div className="bg-slate-50 border border-slate-200 rounded-md p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
            <span>🧪</span>
            <span>{t("advisory.demoScenarios")}:</span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { id: "scenario-a-low", label: "Scenario A: Low", risk: "LOW" },
              { id: "scenario-b-medium", label: "Scenario B: Medium", risk: "MEDIUM" },
              { id: "scenario-c-high", label: "Scenario C: High", risk: "HIGH" },
              { id: "scenario-d-insufficient", label: "Scenario D: Insufficient Data", risk: "INSUFFICIENT" }
            ].map((sc) => {
              const isSelected = selectedScenarioId === sc.id;
              return (
                <button
                  key={sc.id}
                  type="button"
                  onClick={() => onSelectScenario(sc.id)}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded transition-colors cursor-pointer border ${
                    isSelected
                      ? "bg-slate-800 text-white border-slate-800 shadow-2xs"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {sc.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Summary & Metrics Strip ── */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-md p-3.5 space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="text-slate-800 font-medium leading-relaxed">
            <span className="font-bold text-slate-900">{t("advisory.explanation")}: </span>
            {assessment.summary}
          </div>
          <div className="flex items-center gap-3 shrink-0 text-[11px] text-slate-500 font-mono">
            <span>
              {t("advisory.pointsAnalyzed")}: <strong>{assessment.observationsAnalyzed}</strong>
            </span>
            <span>•</span>
            <span>
              {t("advisory.cyclesAnalyzed")}:{" "}
              <strong>{assessment.historicalVerificationsAnalyzed}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* ── Detected Factors & Transparent Heuristics List ── */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs text-slate-700 font-semibold px-0.5">
          <span>Pattern Analysis Factors (Prototype Weighting)</span>
          <span className="text-[11px] text-slate-400 font-normal">Click factor to view supporting evidence</span>
        </div>

        <div className="grid grid-cols-1 gap-2.5">
          {assessment.factors.map((factor: RiskFactor) => {
            const isExpanded = !!expandedFactors[factor.type];
            const weight = PROTOTYPE_ADVISORY_CONFIG.weights[factor.type] || 1;
            const factorKeyMap: Record<string, string> = {
              DRIFT: "advisory.drift",
              NON_LINEARITY: "advisory.nonLinearity",
              IDENTICAL_READINGS: "advisory.identicalReadings",
              ERROR_TREND: "advisory.errorTrend"
            };
            const factorTitle = t(factorKeyMap[factor.type] || factor.title);
            const isUnassessable =
              !factor.detected &&
              (factor.explanation.toLowerCase().includes("insufficient") ||
                factor.explanation.toLowerCase().includes("unavailable"));

            return (
              <div
                key={factor.type}
                className={`border rounded-md transition-colors ${
                  factor.detected
                    ? "border-amber-300 bg-amber-50/40"
                    : "border-slate-200 bg-white"
                }`}
              >
                {/* Accordion Header */}
                <button
                  type="button"
                  onClick={() => toggleFactor(factor.type)}
                  className="w-full px-3.5 py-2.5 flex items-center justify-between gap-3 text-left cursor-pointer hover:bg-slate-50/70 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-400"
                  aria-expanded={isExpanded}
                  aria-controls={`factor-evidence-${factor.type}`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm">
                      {factor.detected ? "⚡" : isUnassessable ? "ℹ" : "✓"}
                    </span>
                    <div className="truncate">
                      <span className="text-xs font-bold text-slate-900 block truncate">
                        {factorTitle}
                      </span>
                      <span className="text-[11px] text-slate-500 block truncate">
                        {factor.explanation}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                        factor.detected
                          ? "bg-amber-100 text-amber-900 border-amber-300 font-semibold"
                          : "bg-slate-100 text-slate-600 border-slate-200"
                      }`}
                    >
                      Weight: {factor.detected ? `+${weight}` : "0"} pt
                    </span>

                    {factor.detected ? (
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-200 text-amber-900 border border-amber-400">
                        {t("advisory.patternDetected")}
                      </span>
                    ) : isUnassessable ? (
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
                        {t("advisory.insufficientData")}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        {t("advisory.noPatternDetected")}
                      </span>
                    )}

                    <span className="text-slate-400 text-xs font-mono ml-1">
                      {isExpanded ? "▲" : "▼"}
                    </span>
                  </div>
                </button>

                {/* Expandable Evidence Details */}
                {isExpanded && (
                  <div
                    id={`factor-evidence-${factor.type}`}
                    className="px-3.5 pb-3 pt-1 border-t border-slate-100 space-y-1.5 text-xs"
                  >
                    <div className="text-[11px] font-semibold text-slate-600">
                      {t("advisory.supportingEvidence")}:
                    </div>
                    {factor.evidence && factor.evidence.length > 0 ? (
                      <ul className="space-y-1 pl-4 list-disc text-slate-700 font-mono text-[11px]">
                        {factor.evidence.map((line, idx) => (
                          <li key={idx} className="leading-relaxed">
                            {line}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-slate-400 text-[11px] italic">
                        No specific observation evidence recorded.
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Required Prototype Advisory Disclaimer ── */}
      <div className="bg-amber-50/60 border border-amber-200 rounded-md p-3 text-xs text-amber-950 flex items-start gap-2.5">
        <span className="text-sm shrink-0 mt-0.5">ℹ️</span>
        <div className="space-y-0.5">
          <strong className="block font-semibold">
            {t("advisory.disclaimer")}
          </strong>
          <p className="text-[11px] text-amber-900 leading-relaxed">
            This AI-assisted advisory operates on prototype deterministic heuristics and historical
            passport records. It does not decide Pass or Fail, nor replace statutory inspection. Final
            statutory verification authority remains strictly with the authorized Legal Metrology Officer.
          </p>
        </div>
      </div>
    </div>
  );
}
