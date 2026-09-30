"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AppHeader } from "@/app/components/AppHeader";
import { LmoSidebar } from "@/app/components/LmoSidebar";
import { applicationService } from "@/services/applicationService";
import { verificationService } from "@/services/verificationService";
import { authService } from "@/services/authService";
import { instrumentService } from "@/services/instrumentService";
import { mpeRuleService, DemoScenario } from "@/services/mpeRuleService";
import { aiAdvisoryService } from "@/services/aiAdvisoryService";
import { instrumentPassportService } from "@/services/instrumentPassportService";
import { useTranslation } from "@/src/i18n/i18nService";
import {
  Application,
  VerificationObservation,
  VerificationOutcome,
  InstrumentCondition,
  UserProfile,
  Instrument,
  MpeRule,
  MpeTestObservation,
  AiAdvisoryAssessment
} from "@/types";
import { LegacyReceiptAssistant } from "@/app/components/LegacyReceiptAssistant";
import { AiAdvisoryCard } from "@/app/components/AiAdvisoryCard";

export default function FieldVerificationPage() {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const applicationId = (params?.id as string) || "APP-26036-0148";

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [application, setApplication] = useState<Application | null>(null);
  const [instrument, setInstrument] = useState<Instrument | null>(null);
  const [activeRule, setActiveRule] = useState<MpeRule | null>(null);
  const [showReceiptAssistant, setShowReceiptAssistant] = useState(false);

  // Form Fields matching Page 3
  const [testStandard, setTestStandard] = useState("OIML R76-1");
  const [referenceWeights, setReferenceWeights] = useState("20 kg / 50 kg / 100 kg");
  const [zeroError, setZeroError] = useState("0.00 kg");
  const [repeatabilityError, setRepeatabilityError] = useState("0.02%");
  const [eccentricityError, setEccentricityError] = useState("0.01%");
  const [condition, setCondition] = useState<InstrumentCondition>("Good");
  const [sealIntact, setSealIntact] = useState(true);
  const [calibrationStickerPresent, setCalibrationStickerPresent] = useState(true);
  const [overallResult, setOverallResult] = useState<VerificationOutcome>("Pass");
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Prompt 8: Dynamic MPE Rule Engine Observations State
  const [observations, setObservations] = useState<
    {
      id: string;
      testPointLabel: string;
      nominalValue: number;
      observedValue: number;
      unit: string;
    }[]
  >([
    { id: "obs-1", testPointLabel: "Load Point 1 (20 kg)", nominalValue: 20, observedValue: 20.00, unit: "kg" },
    { id: "obs-2", testPointLabel: "Load Point 2 (50 kg)", nominalValue: 50, observedValue: 50.01, unit: "kg" },
    { id: "obs-3", testPointLabel: "Load Point 3 (100 kg)", nominalValue: 100, observedValue: 100.02, unit: "kg" }
  ]);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>("scenario-a");
  const [showHardStopModal, setShowHardStopModal] = useState(false);
  const [officerOverrideNotes, setOfficerOverrideNotes] = useState("");

  // Evaluated observations derived from active rule
  const evaluationSummary = useMemo(() => {
    return mpeRuleService.evaluateMultipleObservations(observations, activeRule);
  }, [observations, activeRule]);

  // Prompt 8: Seeded demo scenarios for quick switching
  const demoScenarios = useMemo(() => {
    return mpeRuleService.getDemoScenarios(activeRule);
  }, [activeRule]);

  // Prompt 9: AI Advisory State & Derived Assessment
  const [historicalVerifications, setHistoricalVerifications] = useState<any[]>([]);
  const [selectedAdvisoryScenarioId, setSelectedAdvisoryScenarioId] = useState<string>("scenario-a-low");

  const advisoryAssessment: AiAdvisoryAssessment = useMemo(() => {
    const instId = application?.instrumentId || instrument?.id || "W-104";
    return aiAdvisoryService.analyzeObservations(instId, observations, historicalVerifications);
  }, [application, instrument, observations, historicalVerifications]);

  useEffect(() => {
    loadData();
  }, [applicationId]);

  const loadData = async () => {
    const user = await authService.getCurrentUser();
    setCurrentUser(user);
    const app = await applicationService.getApplicationById(applicationId);
    if (app) {
      setApplication(app);
      if (
        app.status === "Result Submitted" ||
        app.status === "Certificate Generated" ||
        app.status === "Completed"
      ) {
        setSubmissionSuccess(true);
      }

      // Fetch Instrument & applicable MPE rule
      if (app.instrumentId) {
        const inst = await instrumentService.getInstrumentById(app.instrumentId);
        if (inst) {
          setInstrument(inst);
          const rule = mpeRuleService.getRuleForInstrument(inst);
          setActiveRule(rule);
        }
      }

      const obs = await verificationService.getVerificationObservation(app.id);
      if (obs) {
        setTestStandard(obs.testStandard);
        setReferenceWeights(obs.referenceWeights);
        setZeroError(obs.zeroError);
        setRepeatabilityError(obs.repeatabilityError);
        setEccentricityError(obs.eccentricityError);
        setCondition(obs.condition);
        setSealIntact(obs.sealIntact);
        setCalibrationStickerPresent(obs.calibrationStickerPresent);
        setOverallResult(obs.overallResult);

        // Restore saved MPE evaluations if available
        if (obs.mpeEvaluations && obs.mpeEvaluations.length > 0) {
          setObservations(
            obs.mpeEvaluations.map((ev, i) => ({
              id: `obs-saved-${i + 1}`,
              testPointLabel: `Test Point ${i + 1} (${ev.nominalValue} ${ev.unit})`,
              nominalValue: ev.nominalValue,
              observedValue: ev.observedValue,
              unit: ev.unit
            }))
          );
        }
      }

      // Prompt 9: Fetch historical verification cycles for AI advisory drift analysis
      if (app.instrumentId && user) {
        const passportRes = await instrumentPassportService.getInstrumentPassport(app.instrumentId, user);
        if (passportRes.success && passportRes.passport) {
          const records: any[] = [];
          passportRes.passport.cycles.forEach((cycle: any, idx: number) => {
            if (cycle.application?.id !== applicationId && cycle.verification) {
              const v = cycle.verification;
              const raw = v.observedErrorDisplay || v.repeatabilityError || "0.02%";
              const clean = parseFloat(raw.replace("%", "").replace("+", ""));
              if (!isNaN(clean)) {
                records.push({
                  date: cycle.date || "Past cycle",
                  cycleNumber: cycle.cycleNumber || idx + 1,
                  relativeErrorPercent: clean
                });
              }
            }
          });
          setHistoricalVerifications(records);
        }
      }
    }
  };

  const handleApplyScenario = (scenario: DemoScenario) => {
    setSelectedScenarioId(scenario.id);
    setObservations(scenario.testObservations);

    // Sync form displayed repeatability error with the primary test point
    const topObs = scenario.testObservations[scenario.testObservations.length - 1];
    if (topObs && activeRule) {
      const evalSingle = mpeRuleService.evaluateObservation({
        nominalValue: topObs.nominalValue,
        observedValue: topObs.observedValue,
        unit: topObs.unit,
        rule: activeRule
      });
      if (evalSingle.relativeErrorPercent !== undefined) {
        const sign = evalSingle.relativeErrorPercent >= 0 ? "+" : "";
        setRepeatabilityError(`${sign}${evalSingle.relativeErrorPercent.toFixed(2)}%`);
      }
    }
  };

  const handleSelectAdvisoryScenario = (scenarioId: string) => {
    setSelectedAdvisoryScenarioId(scenarioId);
    const demoScenarios = aiAdvisoryService.getDemoScenarios();
    const sc = demoScenarios.find((s) => s.id === scenarioId);
    if (sc) {
      setObservations(
        sc.observations.map((o, idx) => ({
          id: `obs-adv-${idx + 1}`,
          testPointLabel: o.testPointLabel || `Point ${idx + 1}`,
          nominalValue: o.nominalValue,
          observedValue: o.observedValue,
          unit: o.unit
        }))
      );
      if (sc.historicalVerifications !== undefined) {
        setHistoricalVerifications(sc.historicalVerifications);
      }
    }
  };

  const handleUpdateObservation = (
    id: string,
    field: "testPointLabel" | "nominalValue" | "observedValue",
    value: string | number
  ) => {
    setObservations((prev) =>
      prev.map((obs) => {
        if (obs.id !== id) return obs;
        return {
          ...obs,
          [field]: field === "testPointLabel" ? value : Number(value)
        };
      })
    );
  };

  const handleAddObservation = () => {
    const count = observations.length + 1;
    const unit = activeRule?.unit || "kg";
    setObservations((prev) => [
      ...prev,
      {
        id: `obs-${Date.now()}`,
        testPointLabel: `Load Test ${count} (${count * 25} ${unit})`,
        nominalValue: count * 25,
        observedValue: count * 25,
        unit
      }
    ]);
  };

  const handleRemoveObservation = (id: string) => {
    if (observations.length <= 1) return;
    setObservations((prev) => prev.filter((o) => o.id !== id));
  };

  const handleSaveDraft = async () => {
    await verificationService.saveDraftVerification(applicationId, {
      testStandard,
      referenceWeights,
      zeroError,
      repeatabilityError,
      eccentricityError,
      condition,
      sealIntact,
      calibrationStickerPresent,
      overallResult,
      mpeEvaluations: evaluationSummary.evaluatedObservations.map((o) => o.evaluation!).filter(Boolean),
      mpeRuleId: activeRule?.ruleId,
      mpeOverallStatus: evaluationSummary.overallStatus,
      aiAdvisory: advisoryAssessment
    });
    alert("Verification draft saved successfully in session.");
  };

  const handleNeedsCorrection = async () => {
    await verificationService.markNeedsCorrection(
      applicationId,
      officerOverrideNotes || "Requires re-calibration verification. Error tolerances out of permissible range."
    );
    alert("Application marked for correction.");
    router.push("/lmo/dashboard");
  };

  const executeSubmission = async (outcome: VerificationOutcome, notes?: string) => {
    setIsSubmitting(true);
    try {
      // Find top error for summary display
      const topErrorObs =
        evaluationSummary.evaluatedObservations.find((o) => o.evaluation?.result === "EXCEEDS_MPE") ||
        evaluationSummary.evaluatedObservations[evaluationSummary.evaluatedObservations.length - 1];

      const displayError =
        topErrorObs?.evaluation?.relativeErrorPercent !== undefined
          ? `${topErrorObs.evaluation.relativeErrorPercent >= 0 ? "+" : ""}${topErrorObs.evaluation.relativeErrorPercent.toFixed(2)}%`
          : "+0.02%";

      await verificationService.submitVerificationResult(applicationId, {
        instrumentId: application?.instrumentId || "W-104",
        verifierRole: "LMO",
        verifierId: currentUser?.id || "user-lmo-1",
        testStandard,
        referenceWeights,
        zeroError,
        repeatabilityError,
        eccentricityError,
        observedErrorDisplay: displayError,
        condition,
        sealIntact,
        calibrationStickerPresent,
        overallResult: outcome,
        nextAction: outcome === "Pass" ? "Certificate processing" : "Correction required",
        officerNotes:
          notes ||
          (outcome === "Fail"
            ? "Instrument inspection failed prototype Maximum Permissible Error tolerance. Re-calibration required."
            : undefined),
        mpeEvaluations: evaluationSummary.evaluatedObservations.map((o) => o.evaluation!).filter(Boolean),
        mpeRuleId: activeRule?.ruleId,
        mpeOverallStatus: evaluationSummary.overallStatus,
        aiAdvisory: advisoryAssessment
      });

      const updatedApp = await applicationService.getApplicationById(applicationId);
      if (updatedApp) {
        setApplication(updatedApp);
      }
      setSubmissionSuccess(true);
      setIsSubmitting(false);
      setShowHardStopModal(false);
    } catch (err) {
      console.error("Submission failed:", err);
      setIsSubmitting(false);
    }
  };

  const handleSubmitResult = async (e: React.FormEvent) => {
    e.preventDefault();

    // Access control: Trader/Owner accounts must not finalize verification results
    if (currentUser && currentUser.role === "OWNER") {
      alert("Access Denied: Trader/Owner accounts are not authorized to finalize verification outcomes.");
      return;
    }

    // Hard Stop Check:
    // If officer selected Pass, but one or more observations exceed prototype MPE,
    // trigger warning dialog requiring explicit acknowledgement rather than silent certification.
    if (overallResult === "Pass" && evaluationSummary.exceededCount > 0) {
      setShowHardStopModal(true);
      return;
    }

    await executeSubmission(overallResult);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col">
      <div className="flex flex-1">
        {/* Left Sidebar */}
        <LmoSidebar
          activeItem="pending"
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Main Content Viewport */}
        <div className="flex-1 flex flex-col min-w-0 pb-20">
          <AppHeader
            title="Field verification"
            breadcrumbs={[
              { label: "Home", href: "/lmo/dashboard" },
              { label: "Pending applications", href: "/lmo/dashboard" },
              { label: "Field verification" }
            ]}
            avatarInitials="PS"
            userName="Priya Sharma"
            notificationCount={2}
            onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          />

          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto space-y-6">
            {/* Top Context Bar / Metadata Banner */}
            <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-2xs">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
                <div className="flex items-center">
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {submissionSuccess ? "Result Submitted" : "Verification In Progress"}
                  </span>
                </div>
                <div className="sm:pl-3 pt-2 sm:pt-0">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Application</span>
                  <span className="font-bold text-slate-900">{application?.id || applicationId}</span>
                </div>
                <div className="sm:pl-3 pt-2 sm:pt-0">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Scheduled</span>
                  <span className="font-medium text-slate-800">12 Jun 2025 at 10:00</span>
                </div>
                <div className="sm:pl-3 pt-2 sm:pt-0">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Location</span>
                  <span className="font-medium text-slate-800 truncate block">
                    {application?.location || "Supermarket, YCC Wanadongri, Nagpur"}
                  </span>
                </div>
                <div className="sm:pl-3 pt-2 sm:pt-0">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Owner contact</span>
                  <span className="font-medium text-slate-800">On file</span>
                </div>
              </div>

              {application?.instrumentId && (
                <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <span className="text-slate-500">
                    Instrument: <strong className="text-slate-800">{application.instrumentName || application.instrumentId}</strong> ({application.instrumentId})
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setShowReceiptAssistant(true)}
                      className="text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-300 px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <span>📄</span>
                      <span>Reference Legacy Inspection Receipt</span>
                    </button>
                    <Link
                      href={`/lmo/instruments/${application.instrumentId}`}
                      className="text-sky-800 hover:underline font-semibold flex items-center gap-1"
                    >
                      <span>📖 View Digital Instrument Passport</span>
                      <span>↗</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Submission Success Dialog Banner */}
            {submissionSuccess && (
              <div className="bg-emerald-50 border border-emerald-300 rounded-lg p-5 shadow-xs space-y-3">
                <div className="flex items-center gap-2.5 text-emerald-900 font-bold text-sm">
                  <span className="text-lg">✅</span>
                  <span>Verification Result Submitted Successfully!</span>
                </div>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  Overall Result: <strong>{overallResult}</strong>. Application <strong>{applicationId}</strong> has progressed to <strong>Result Submitted</strong>. Digital Certificate <strong>CERT-2025-00981</strong> has been queued for issuance. Both the Owner Application Tracking timeline and LMO records have been synchronized.
                </p>
                <div className="flex items-center gap-3 pt-1">
                  <Link
                    href={`/owner/applications/${applicationId}`}
                    className="px-4 py-2 bg-[#801424] hover:bg-[#6D0E1C] text-white text-xs font-semibold rounded shadow-2xs transition-colors"
                  >
                    View in Owner Application Tracking →
                  </Link>
                  <Link
                    href="/verify-certificate?id=CERT-2025-00981"
                    className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold border border-slate-300 rounded shadow-2xs transition-colors"
                  >
                    Verify Certificate (CERT-2025-00981)
                  </Link>
                  <Link
                    href="/lmo/dashboard"
                    className="px-4 py-2 text-slate-600 hover:text-slate-900 text-xs font-medium"
                  >
                    Return to LMO Dashboard
                  </Link>
                </div>
              </div>
            )}

            {/* 2-Column Layout: Left Form & Right Application Progress */}
            <form onSubmit={handleSubmitResult} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Form: 2 cols on lg */}
              <div className="lg:col-span-2 space-y-6">
                {/* 1. INSTRUMENT SUMMARY Card */}
                <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-2xs space-y-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    INSTRUMENT SUMMARY
                  </span>
                  <h3 className="text-base font-bold text-slate-900">
                    {application?.instrumentName || instrument?.name || "Electronic Weighing Instrument"}
                  </h3>

                  <div className="grid grid-cols-3 gap-3 pt-2 text-xs border-t border-slate-100">
                    <div>
                      <span className="text-slate-500 block">Manufacturer / model</span>
                      <span className="font-semibold text-slate-800 mt-0.5 block">
                        {instrument?.manufacturer || "Essae"} {instrument?.model || "DS-215"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Serial number</span>
                      <span className="font-semibold text-slate-800 mt-0.5 block">
                        {instrument?.serialNumber || "ES215-88421"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Capacity</span>
                      <span className="font-semibold text-slate-800 mt-0.5 block">
                        {instrument?.capacity || "300 kg"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Verification details Card */}
                <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-2xs space-y-4">
                  <h4 className="text-sm font-bold text-slate-900">Verification details</h4>

                  <div className="space-y-4">
                    {/* Row 1: Test Standard & Reference Weights */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-0.5">
                          Test standard*
                        </label>
                        <span className="text-[10px] text-slate-400 block mb-1">
                          Applicable verification standard
                        </span>
                        <input
                          type="text"
                          required
                          value={testStandard}
                          onChange={(e) => setTestStandard(e.target.value)}
                          className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-md text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#801424]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-0.5">
                          Reference weights*
                        </label>
                        <span className="text-[10px] text-slate-400 block mb-1">
                          Weights used during inspection
                        </span>
                        <input
                          type="text"
                          required
                          value={referenceWeights}
                          onChange={(e) => setReferenceWeights(e.target.value)}
                          className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-md text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#801424]"
                        />
                      </div>
                    </div>

                    {/* Row 2: Zero error & Repeatability error */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Zero error*
                        </label>
                        <input
                          type="text"
                          required
                          value={zeroError}
                          onChange={(e) => setZeroError(e.target.value)}
                          className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-md text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#801424]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Repeatability error*
                        </label>
                        <input
                          type="text"
                          required
                          value={repeatabilityError}
                          onChange={(e) => setRepeatabilityError(e.target.value)}
                          className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-md text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#801424]"
                        />
                      </div>
                    </div>

                    {/* Row 3: Eccentricity error & Condition */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Eccentricity error*
                        </label>
                        <input
                          type="text"
                          required
                          value={eccentricityError}
                          onChange={(e) => setEccentricityError(e.target.value)}
                          className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-md text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#801424]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Condition*
                        </label>
                        <select
                          value={condition}
                          onChange={(e) => setCondition(e.target.value as InstrumentCondition)}
                          className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-md text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#801424] cursor-pointer"
                        >
                          <option value="Good">Good</option>
                          <option value="Fair">Fair</option>
                          <option value="Needs Maintenance">Needs Maintenance</option>
                          <option value="Damaged">Damaged</option>
                        </select>
                      </div>
                    </div>

                    {/* Row 4: Toggles (Seal Intact & Calibration Sticker Present) */}
                    <div className="flex flex-wrap items-center gap-6 pt-1">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <button
                          type="button"
                          onClick={() => setSealIntact(!sealIntact)}
                          className={`w-9 h-5 rounded-full transition-colors relative ${
                            sealIntact ? "bg-[#1E3A8A]" : "bg-slate-300"
                          }`}
                        >
                          <span
                            className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.75 transition-transform ${
                              sealIntact ? "left-4.5" : "left-0.75"
                            }`}
                          />
                        </button>
                        <span className="text-xs font-medium text-slate-700">Seal intact</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <button
                          type="button"
                          onClick={() => setCalibrationStickerPresent(!calibrationStickerPresent)}
                          className={`w-9 h-5 rounded-full transition-colors relative ${
                            calibrationStickerPresent ? "bg-[#1E3A8A]" : "bg-slate-300"
                          }`}
                        >
                          <span
                            className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.75 transition-transform ${
                              calibrationStickerPresent ? "left-4.5" : "left-0.75"
                            }`}
                          />
                        </button>
                        <span className="text-xs font-medium text-slate-700">
                          Calibration sticker present
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* 3. PROMPT 8: DYNAMIC MPE RULE ENGINE (DECISION SUPPORT) Card */}
                <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-2xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">⚖️</span>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          <span>{t("mpe.title")}</span>
                        </h4>
                        <p className="text-xs text-slate-500">{t("mpe.subtitle")}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 tracking-wide uppercase">
                        {t("mpe.prototypeRule")}
                      </span>
                    </div>
                  </div>

                  {/* Disclaimer / Prototype MPE Notice */}
                  <div className="bg-amber-50/70 border border-amber-200 rounded p-3 text-xs text-amber-900 flex items-start gap-2.5">
                    <span className="text-base shrink-0 mt-0.5">⚠️</span>
                    <div className="space-y-0.5">
                      <span className="font-semibold block">{t("mpe.prototypeNotice")}</span>
                      <span className="text-[11px] text-amber-800 block">
                        The calculated evaluation is decision-support for the Legal Metrology Officer. Final statutory outcome is explicitly decided and verified by the LMO.
                      </span>
                    </div>
                  </div>

                  {/* Applicable Prototype Rule Box */}
                  <div className="bg-slate-50 rounded border border-slate-200 p-3.5 space-y-2 text-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">
                          {t("mpe.applicableRule")}
                        </span>
                        <strong className="text-slate-900 text-xs sm:text-sm">
                          {activeRule ? activeRule.ruleName : t("mpe.unsupportedCategory")}
                        </strong>
                      </div>

                      {activeRule && (
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-slate-200 text-slate-800 rounded font-mono text-[11px]">
                            {activeRule.instrumentCategory}
                          </span>
                          <span className="px-2 py-0.5 bg-[#0D1B2A] text-white rounded font-bold text-[11px]">
                            {t("mpe.illustrativeThreshold")}: ±{activeRule.mpeValue}
                            {activeRule.method === "RELATIVE_ERROR" ? "%" : ` ${activeRule.unit}`}
                          </span>
                        </div>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-600 leading-relaxed border-t border-slate-200/60 pt-2">
                      {activeRule ? activeRule.explanation : "This instrument category is not mapped to an automated prototype MPE rule. Officer manual inspection standards apply."}
                    </p>
                  </div>

                  {/* Demonstration Scenario Quick Presets */}
                  {demoScenarios.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[11px] font-bold text-slate-600 block">
                        {t("mpe.scenarios")} (Deterministic Test Cases)
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {demoScenarios.map((scenario) => {
                          const isSelected = selectedScenarioId === scenario.id;
                          return (
                            <button
                              key={scenario.id}
                              type="button"
                              onClick={() => handleApplyScenario(scenario)}
                              className={`p-2 rounded text-left border text-xs transition-colors cursor-pointer flex flex-col justify-between ${
                                isSelected
                                  ? "bg-slate-900 text-white border-slate-900 shadow-2xs"
                                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                              }`}
                            >
                              <span className="font-semibold text-[11px] block">{scenario.name}</span>
                              <span
                                className={`text-[10px] mt-1 line-clamp-2 ${
                                  isSelected ? "text-slate-300" : "text-slate-500"
                                }`}
                              >
                                {scenario.description}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Multi-Observation Table */}
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">
                        Inspection Observations & Tolerance Calculation
                      </span>
                      <button
                        type="button"
                        onClick={handleAddObservation}
                        className="text-xs font-semibold text-[#801424] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>+</span>
                        <span>{t("mpe.addObservation")}</span>
                      </button>
                    </div>

                    <div className="overflow-x-auto border border-slate-200 rounded-md">
                      <table className="w-full text-left text-xs divide-y divide-slate-200">
                        <thead className="bg-slate-50 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                          <tr>
                            <th className="px-3 py-2">{t("mpe.testPoint")}</th>
                            <th className="px-3 py-2">{t("mpe.nominalValue")}</th>
                            <th className="px-3 py-2">{t("mpe.observedValue")}</th>
                            <th className="px-3 py-2">{t("mpe.calculatedError")}</th>
                            <th className="px-3 py-2">{t("mpe.ruleEvaluation")}</th>
                            <th className="px-2 py-2 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-100">
                          {observations.map((obs, idx) => {
                            const evalItem = evaluationSummary.evaluatedObservations.find((o) => o.id === obs.id)?.evaluation;
                            const isExceeded = evalItem?.result === "EXCEEDS_MPE";
                            const isWithin = evalItem?.result === "WITHIN_MPE";

                            return (
                              <tr
                                key={obs.id}
                                className={`transition-colors ${
                                  isExceeded ? "bg-rose-50/50" : isWithin ? "hover:bg-slate-50/50" : "bg-amber-50/30"
                                }`}
                              >
                                <td className="px-3 py-2.5">
                                  <input
                                    type="text"
                                    value={obs.testPointLabel}
                                    onChange={(e) => handleUpdateObservation(obs.id, "testPointLabel", e.target.value)}
                                    className="w-full px-2 py-1 text-xs bg-white border border-slate-200 rounded text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#801424]"
                                  />
                                </td>
                                <td className="px-3 py-2.5 whitespace-nowrap">
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="number"
                                      step="any"
                                      value={isNaN(obs.nominalValue) ? "" : obs.nominalValue}
                                      onChange={(e) => handleUpdateObservation(obs.id, "nominalValue", e.target.value)}
                                      className="w-20 px-2 py-1 text-xs bg-white border border-slate-200 rounded text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-[#801424]"
                                    />
                                    <span className="text-slate-500 text-[11px]">{obs.unit}</span>
                                  </div>
                                </td>
                                <td className="px-3 py-2.5 whitespace-nowrap">
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="number"
                                      step="any"
                                      value={isNaN(obs.observedValue) ? "" : obs.observedValue}
                                      onChange={(e) => handleUpdateObservation(obs.id, "observedValue", e.target.value)}
                                      className="w-20 px-2 py-1 text-xs bg-white border border-slate-200 rounded text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-[#801424]"
                                    />
                                    <span className="text-slate-500 text-[11px]">{obs.unit}</span>
                                  </div>
                                </td>
                                <td className="px-3 py-2.5 whitespace-nowrap">
                                  {evalItem && evalItem.result !== "INSUFFICIENT_DATA" ? (
                                    <div className="font-mono text-[11px]">
                                      <span className={isExceeded ? "text-rose-700 font-bold" : "text-emerald-800 font-semibold"}>
                                        {evalItem.relativeErrorPercent !== undefined
                                          ? `${evalItem.relativeErrorPercent >= 0 ? "+" : ""}${evalItem.relativeErrorPercent.toFixed(4)}%`
                                          : `${evalItem.absoluteError! >= 0 ? "+" : ""}${evalItem.absoluteError!.toFixed(4)} ${obs.unit}`}
                                      </span>
                                      <span className="text-slate-400 block text-[10px]">
                                        Δ: {evalItem.absoluteError! >= 0 ? "+" : ""}
                                        {evalItem.absoluteError!.toFixed(4)} {obs.unit}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-amber-700 font-mono text-[11px]">—</span>
                                  )}
                                </td>
                                <td className="px-3 py-2.5">
                                  {evalItem?.result === "WITHIN_MPE" && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                      <span>✓</span>
                                      <span>{t("mpe.withinMpe")}</span>
                                    </span>
                                  )}
                                  {evalItem?.result === "EXCEEDS_MPE" && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                                      <span>⚠️</span>
                                      <span>{t("mpe.exceedsMpe")}</span>
                                    </span>
                                  )}
                                  {evalItem?.result === "INSUFFICIENT_DATA" && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-100 text-amber-800 border border-amber-300">
                                      <span>ℹ</span>
                                      <span>{t("mpe.insufficientData")}</span>
                                    </span>
                                  )}
                                </td>
                                <td className="px-2 py-2.5 text-right whitespace-nowrap">
                                  {observations.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveObservation(obs.id)}
                                      className="text-slate-400 hover:text-rose-600 text-xs px-1"
                                      title={t("mpe.removeObservation")}
                                    >
                                      ✕
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Evaluation Summary & Hard-Stop Warning Banner */}
                  {evaluationSummary.overallStatus === "EXCEEDS_MPE" ? (
                    <div className="bg-rose-50 border border-rose-300 rounded-md p-4 space-y-2 text-xs">
                      <div className="flex items-center gap-2 text-rose-900 font-bold">
                        <span className="text-base">⚠️</span>
                        <span>{t("mpe.hardStopTitle")}</span>
                      </div>
                      <p className="text-rose-800 leading-relaxed">
                        {t("mpe.hardStopDesc")} Triggered by:{" "}
                        <strong>{evaluationSummary.triggeringObservationLabels.join(", ")}</strong>.
                      </p>

                      {overallResult === "Pass" && (
                        <div className="bg-white border border-rose-300 rounded p-2.5 mt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="text-rose-900 font-medium text-[11px]">
                            {t("mpe.conflictWarning")}
                          </div>
                          <button
                            type="button"
                            onClick={() => setOverallResult("Fail")}
                            className="px-3 py-1 bg-rose-700 hover:bg-rose-800 text-white rounded font-bold text-xs shrink-0 cursor-pointer"
                          >
                            Set Result to Fail (Needs Correction)
                          </button>
                        </div>
                      )}
                    </div>
                  ) : evaluationSummary.overallStatus === "WITHIN_MPE" ? (
                    <div className="bg-emerald-50 border border-emerald-300 rounded-md p-3.5 text-xs text-emerald-900 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-700 text-base font-bold">✓</span>
                        <div>
                          <strong className="block">{t("mpe.withinMpe")}</strong>
                          <span className="text-emerald-800 text-[11px]">
                            {t("mpe.allObservationsCompliant")} Tolerance limits verified.
                          </span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-900 border border-emerald-200">
                        {evaluationSummary.withinCount} / {observations.length} Compliant
                      </span>
                    </div>
                  ) : (
                    <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-xs text-amber-900 flex items-center gap-2">
                      <span>ℹ</span>
                      <span>{t("mpe.insufficientData")}: Enter valid numeric values for all observation rows.</span>
                    </div>
                  )}
                </div>

                {/* Prompt 9: AI-Assisted Verification Advisory Card */}
                {(!currentUser?.role || currentUser.role === "LMO" || currentUser.role === "GATC" || currentUser.role === "ADMIN") && (
                  <AiAdvisoryCard
                    assessment={advisoryAssessment}
                    onSelectScenario={handleSelectAdvisoryScenario}
                    selectedScenarioId={selectedAdvisoryScenarioId}
                  />
                )}

                {/* 4. Evidence Card */}
                <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-2xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Evidence</h4>
                      <p className="text-xs text-slate-500">Upload supporting photos or documents.</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => alert("Upload photo dialog")}
                        className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded text-xs font-medium text-slate-700 shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>📷</span>
                        <span>Upload photos</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => alert("Upload document dialog")}
                        className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded text-xs font-medium text-slate-700 shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>📄</span>
                        <span>Upload document</span>
                      </button>
                    </div>
                  </div>

                  {/* Dropzone */}
                  <div className="border border-dashed border-slate-300 rounded-lg p-6 bg-slate-50/50 flex flex-col items-center justify-center text-center">
                    <span className="text-2xl text-slate-400">☁️</span>
                    <p className="text-xs text-slate-600 font-medium mt-1">
                      Drop files here to upload
                    </p>
                  </div>

                  {/* 3 Uploaded Thumbnails */}
                  <div className="grid grid-cols-3 gap-3 pt-1">
                    {[
                      { name: "front-view.jpg" },
                      { name: "display-panel.jpg" },
                      { name: "seal-closeup.jpg" }
                    ].map((item) => (
                      <div
                        key={item.name}
                        className="border border-slate-200 rounded-md overflow-hidden bg-slate-100 flex flex-col items-center justify-between shadow-2xs"
                      >
                        <div className="w-full aspect-3/2 bg-slate-200 flex items-center justify-center text-slate-400 text-xs font-mono">
                          600 × 400
                        </div>
                        <div className="p-2 w-full text-center bg-white border-t border-slate-100">
                          <span className="text-[11px] font-mono text-slate-700 truncate block">
                            {item.name}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 5. Final Verification Decision (Officer Authority) Card */}
                <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-2xs space-y-4">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      OFFICER AUTHORITY
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 mt-0.5">Final Verification Decision (Officer Authority)</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      As the authorized Legal Metrology Officer, record your final verification outcome. This decision determines whether a Digital Verification Certificate is issued.
                    </p>
                  </div>

                  {/* Pass / Fail Outcome Radios */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <label
                      className={`relative flex flex-col p-3.5 rounded-lg border cursor-pointer transition-all ${
                        overallResult === "Pass"
                          ? "border-emerald-600 bg-emerald-50/40 ring-1 ring-emerald-600 shadow-2xs"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="radio"
                          name="overallResult"
                          value="Pass"
                          id="result-pass"
                          checked={overallResult === "Pass"}
                          onChange={() => setOverallResult("Pass")}
                          className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-slate-300"
                        />
                        <span className="text-xs font-bold text-emerald-900">
                          Pass — Verification Approved
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 mt-1.5 pl-6.5">
                        Instrument satisfies verification requirements. Approves issuance of Digital Verification Certificate.
                      </span>
                    </label>

                    <label
                      className={`relative flex flex-col p-3.5 rounded-lg border cursor-pointer transition-all ${
                        overallResult === "Fail"
                          ? "border-rose-600 bg-rose-50/40 ring-1 ring-rose-600 shadow-2xs"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="radio"
                          name="overallResult"
                          value="Fail"
                          id="result-fail"
                          checked={overallResult === "Fail"}
                          onChange={() => setOverallResult("Fail")}
                          className="w-4 h-4 text-rose-600 focus:ring-rose-500 border-slate-300"
                        />
                        <span className="text-xs font-bold text-rose-900">
                          Fail — Correction Required
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 mt-1.5 pl-6.5">
                        Instrument exceeds tolerance or has physical defects. Trader must service and re-apply.
                      </span>
                    </label>
                  </div>

                  {/* Prototype MPE Tolerance Notice if Pass selected with errors */}
                  {overallResult === "Pass" && evaluationSummary.exceededCount > 0 && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-900 flex items-start gap-2">
                      <span className="text-amber-600 text-sm mt-0.5">⚠️</span>
                      <div>
                        <strong className="font-semibold block">Prototype MPE notice:</strong>
                        <span>
                          {evaluationSummary.exceededCount} test load(s) exceed the prototype demonstration threshold. Submitting Pass will require officer confirmation and justification notes.
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Officer Remarks / Notes Textarea */}
                  <div className="pt-2">
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Officer justification for final decision
                    </label>
                    <textarea
                      rows={3}
                      value={officerOverrideNotes}
                      onChange={(e) => setOfficerOverrideNotes(e.target.value)}
                      placeholder="Enter verification remarks, seal numbers applied, or officer justification..."
                      className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-md text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#801424]"
                    />
                    <span className="text-[10px] text-slate-400 block mt-1">
                      Recorded in the audit trail and Digital Instrument Passport.
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Sidebar: Application Progress Tracker */}
              <div className="space-y-6">
                <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-2xs space-y-4 sticky top-20">
                  <h4 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                    Application progress
                  </h4>

                  <div className="space-y-4 text-xs">
                    {/* Step 1 */}
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-[#0D1B2A] text-white flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                        ✓
                      </div>
                      <div>
                        <span className="font-semibold text-slate-900 block leading-tight">
                          Application review complete
                        </span>
                        <span className="text-[11px] text-slate-400">09 Jun 2025</span>
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-[#0D1B2A] text-white flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                        ✓
                      </div>
                      <div>
                        <span className="font-semibold text-slate-900 block leading-tight">
                          Schedule confirmed
                        </span>
                        <span className="text-[11px] text-slate-400">10 Jun 2025</span>
                      </div>
                    </div>

                    {/* Step 3 */}
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0 mt-0.5 ${
                          submissionSuccess
                            ? "bg-[#0D1B2A] text-white"
                            : "bg-[#10B981] text-white font-bold shadow-2xs"
                        }`}
                      >
                        {submissionSuccess ? "✓" : "3"}
                      </div>
                      <div>
                        <span
                          className={`block leading-tight ${
                            submissionSuccess
                              ? "font-semibold text-slate-900"
                              : "font-bold text-emerald-800"
                          }`}
                        >
                          Field verification
                        </span>
                        <span
                          className={`text-[11px] ${
                            submissionSuccess ? "text-slate-400" : "text-emerald-600"
                          }`}
                        >
                          {submissionSuccess ? "Physical inspection complete" : "Active inspection"}
                        </span>
                      </div>
                    </div>

                    {/* Step 4 */}
                    <div
                      className={`flex items-start gap-3 ${
                        submissionSuccess ? "opacity-100" : "opacity-60"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0 mt-0.5 ${
                          submissionSuccess
                            ? "bg-[#10B981] text-white font-bold shadow-2xs"
                            : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {submissionSuccess ? "✓" : "4"}
                      </div>
                      <div>
                        <span
                          className={`block leading-tight ${
                            submissionSuccess
                              ? "font-bold text-emerald-800"
                              : "font-medium text-slate-700"
                          }`}
                        >
                          Result submission
                        </span>
                        <span
                          className={`text-[11px] ${
                            submissionSuccess ? "text-emerald-600 font-semibold" : "text-slate-400"
                          }`}
                        >
                          {submissionSuccess
                            ? `Result: ${overallResult}`
                            : "Pending submission"}
                        </span>
                      </div>
                    </div>

                    {/* Step 5 */}
                    <div
                      className={`flex items-start gap-3 ${
                        submissionSuccess ? "opacity-100" : "opacity-60"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0 mt-0.5 ${
                          submissionSuccess
                            ? "bg-[#0D1B2A] text-white font-bold shadow-2xs"
                            : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {submissionSuccess ? "✓" : "5"}
                      </div>
                      <div>
                        <span
                          className={`block leading-tight ${
                            submissionSuccess
                              ? "font-bold text-slate-900"
                              : "font-medium text-slate-700"
                          }`}
                        >
                          Digital certificate
                        </span>
                        <span
                          className={`text-[11px] ${
                            submissionSuccess ? "text-emerald-700 font-medium" : "text-slate-400"
                          }`}
                        >
                          {submissionSuccess ? "CERT-2025-00981 Generated" : "Post-approval"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </main>

          {/* Bottom Fixed Action Bar matching Page 3 */}
          <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200 px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between shadow-lg">
            <div className="text-xs text-slate-500 hidden sm:block">
              Signed in as: <strong className="text-slate-800">Priya Sharma (Legal Metrology Officer)</strong>
            </div>

            <div className="flex items-center gap-2.5 ml-auto">
              {submissionSuccess ? (
                <>
                  <Link
                    href={`/owner/applications/${applicationId}`}
                    className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-800 text-xs sm:text-sm font-medium border border-slate-300 rounded-md shadow-2xs transition-colors"
                  >
                    View in Owner Tracking →
                  </Link>

                  <Link
                    href="/lmo/dashboard"
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-medium rounded-md shadow-2xs transition-colors"
                  >
                    Back to LMO Dashboard
                  </Link>

                  <button
                    type="button"
                    disabled
                    className="px-5 py-2 bg-emerald-700 text-white text-xs sm:text-sm font-semibold rounded-md shadow-xs opacity-95 cursor-default flex items-center gap-1.5"
                  >
                    <span>✓</span>
                    <span>Result Submitted ({overallResult})</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-medium border border-slate-300 rounded-md shadow-2xs transition-colors cursor-pointer"
                  >
                    Save draft
                  </button>

                  <button
                    type="button"
                    onClick={handleNeedsCorrection}
                    className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-medium border border-slate-300 rounded-md shadow-2xs transition-colors cursor-pointer"
                  >
                    Mark needs correction
                  </button>

                  <button
                    type="button"
                    onClick={handleSubmitResult}
                    disabled={isSubmitting}
                    className="px-5 py-2 bg-[#801424] hover:bg-[#6D0E1C] active:bg-[#580D18] disabled:opacity-70 text-white text-xs sm:text-sm font-semibold rounded-md shadow-xs transition-colors cursor-pointer"
                  >
                    {isSubmitting ? "Submitting..." : "Submit verification result"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Hard Stop Confirmation Modal */}
      {showHardStopModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-lg w-full p-5 space-y-4">
            <div className="flex items-center gap-2.5 text-rose-800 font-bold text-sm">
              <span className="text-xl">⚠️</span>
              <span>{t("mpe.hardStopTitle")}</span>
            </div>

            <div className="text-xs text-slate-700 space-y-2">
              <p>
                The dynamic MPE rule engine evaluated that one or more test observations exceed the Maximum Permissible Error tolerance for this instrument:
              </p>
              <ul className="list-disc pl-5 font-semibold text-rose-900 space-y-1">
                {evaluationSummary.triggeringObservationLabels.map((lbl) => (
                  <li key={lbl}>{lbl}</li>
                ))}
              </ul>
              <p className="text-slate-600">
                Rule: <strong>{activeRule?.ruleName}</strong> (Limit: ±{activeRule?.mpeValue}%)
              </p>
              <div className="bg-rose-50 border border-rose-200 rounded p-2.5 text-rose-900 font-medium">
                The rule engine recommends marking this inspection as <strong>Fail (Needs Correction)</strong>. A Pass result will generate a digital verification certificate for an instrument with exceeded error tolerances.
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-700">
                Officer justification notes (optional)
              </label>
              <textarea
                rows={2}
                value={officerOverrideNotes}
                onChange={(e) => setOfficerOverrideNotes(e.target.value)}
                placeholder="Enter officer justification if departing from rule recommendation..."
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#801424]"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowHardStopModal(false)}
                className="w-full sm:w-auto px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded transition-colors"
              >
                Cancel & Review
              </button>
              <button
                type="button"
                onClick={() => executeSubmission("Fail", officerOverrideNotes)}
                className="w-full sm:w-auto px-3.5 py-1.5 bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold rounded shadow-2xs transition-colors"
              >
                Adopt Recommendation: Set Fail
              </button>
              <button
                type="button"
                onClick={() => executeSubmission("Pass", officerOverrideNotes)}
                className="w-full sm:w-auto px-3.5 py-1.5 bg-slate-900 hover:bg-black text-white text-xs font-semibold rounded shadow-2xs transition-colors"
              >
                Confirm Pass with Officer Authority
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Legacy Receipt Reference Modal */}
      <LegacyReceiptAssistant
        isOpen={showReceiptAssistant}
        onClose={() => setShowReceiptAssistant(false)}
        currentUser={currentUser}
        mode="lmo-reference"
      />
    </div>
  );
}
