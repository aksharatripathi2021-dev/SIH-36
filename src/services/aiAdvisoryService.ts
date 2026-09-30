/**
 * AI-Assisted Verification Advisory Service
 * Prototype deterministic heuristic analysis engine for Legal Metrology Officers.
 *
 * IMPORTANT ARCHITECTURAL BOUNDARY:
 * - This service uses transparent, deterministic heuristics.
 * - It does NOT call an external LLM, cloud ML, or trained probabilistic model.
 * - It does NOT decide Pass/Fail, issue certificates, or alter verification workflows.
 * - The final verification decision remains strictly with the authorized LMO.
 */

import {
  AiAdvisoryAssessment,
  RiskFactor,
  RiskFactorType,
  RiskLevel
} from "../types";
import { instrumentPassportService, VerificationCycle } from "./instrumentPassportService";
import { applicationService } from "./applicationService";
import { verificationService } from "./verificationService";
import { authService } from "./authService";

// ============================================================
// CENTRALIZED PROTOTYPE ADVISORY CONFIGURATION
// ============================================================

export const PROTOTYPE_ADVISORY_CONFIG = {
  // Prototype heuristic weighting per detected factor
  weights: {
    DRIFT: 1,
    NON_LINEARITY: 2,
    IDENTICAL_READINGS: 2,
    ERROR_TREND: 1
  } as Record<RiskFactorType, number>,

  // Thresholds for composite risk classification
  // 0 - 1 points = LOW
  // 2 - 3 points = MEDIUM
  // 4+ points    = HIGH
  compositeThresholds: {
    mediumMin: 2,
    highMin: 4
  },

  // Prototype pattern analysis thresholds
  thresholds: {
    // Minimum delta in relative error to qualify as meaningful drift (|Δ| >= 0.03%)
    driftDeltaPercent: 0.03,

    // Minimum load step non-linearity deviation (|Δe_j - Δe_k| >= 0.04%)
    nonLinearityDeviationPercent: 0.04,

    // Minimum data point requirements
    minHistoricalForDrift: 2,
    minPointsForNonLinearity: 3,
    minPointsForIdenticalReadings: 3,
    minPointsForErrorTrend: 3
  },

  isPrototypeHeuristic: true as const
};

export interface TestObservationInput {
  id?: string;
  testPointLabel?: string;
  nominalValue: number;
  observedValue: number;
  unit: string;
}

export interface HistoricalVerificationRecord {
  date: string;
  cycleNumber?: number;
  nominalValue?: number;
  observedValue?: number;
  relativeErrorPercent: number;
}

export interface DemoAdvisoryScenario {
  id: string;
  name: string;
  description: string;
  expectedRisk: RiskLevel;
  observations: TestObservationInput[];
  historicalVerifications?: HistoricalVerificationRecord[];
}

export const aiAdvisoryService = {
  /**
   * Deterministic drift analysis
   * Evaluates whether measurement error shows a consistent directional shift
   * across at least 2 comparable historical verifications plus the current observation.
   */
  detectDrift(
    currentRelativeError: number | null,
    historicalRecords: HistoricalVerificationRecord[]
  ): RiskFactor {
    const minRequired = PROTOTYPE_ADVISORY_CONFIG.thresholds.minHistoricalForDrift;

    if (
      currentRelativeError === null ||
      !historicalRecords ||
      historicalRecords.length < minRequired
    ) {
      return {
        type: "DRIFT",
        severity: "LOW",
        detected: false,
        title: "Measurement Drift",
        explanation:
          "Historical comparison unavailable. Minimum 2 comparable historical verifications required for drift analysis.",
        evidence: [
          `Comparable historical records available: ${historicalRecords?.length || 0} (minimum required: ${minRequired}). Pattern could not be assessed from available data.`
        ]
      };
    }

    // Historical errors chronologically
    const errorsSeries = historicalRecords.map((r) => r.relativeErrorPercent);
    const prevError = errorsSeries[errorsSeries.length - 1];
    const driftDelta = currentRelativeError - prevError;

    // Check directional consistency across history
    let isConsistentDirection = true;
    if (errorsSeries.length >= 2) {
      const historicalDelta = errorsSeries[errorsSeries.length - 1] - errorsSeries[errorsSeries.length - 2];
      // Check if both deltas have the same sign (both non-negative or both non-positive)
      if (
        (historicalDelta > 0 && driftDelta < -0.005) ||
        (historicalDelta < 0 && driftDelta > 0.005)
      ) {
        isConsistentDirection = false;
      }
    }

    const exceedsThreshold =
      Math.abs(driftDelta) >= PROTOTYPE_ADVISORY_CONFIG.thresholds.driftDeltaPercent;

    if (exceedsThreshold && isConsistentDirection) {
      const signDelta = driftDelta >= 0 ? "+" : "";
      const directionText = driftDelta > 0 ? "increasing error trend" : "negative-side drift";
      const evidence = historicalRecords.map(
        (h, idx) =>
          `Cycle ${h.cycleNumber || idx + 1} (${h.date}): ${h.relativeErrorPercent >= 0 ? "+" : ""}${h.relativeErrorPercent.toFixed(3)}%`
      );
      evidence.push(
        `Current: ${currentRelativeError >= 0 ? "+" : ""}${currentRelativeError.toFixed(3)}% (drift delta: ${signDelta}${driftDelta.toFixed(3)}% across cycles)`
      );

      return {
        type: "DRIFT",
        severity: "LOW", // 1 point weight in prototype configuration
        detected: true,
        title: "Measurement Drift",
        explanation: `Measurement error shows a directional change across comparable historical verifications (${directionText}).`,
        evidence
      };
    }

    return {
      type: "DRIFT",
      severity: "LOW",
      detected: false,
      title: "Measurement Drift",
      explanation: "No significant drift pattern detected across comparable historical verifications.",
      evidence: [
        `Historical baseline: ${prevError >= 0 ? "+" : ""}${prevError.toFixed(3)}%`,
        `Current: ${currentRelativeError >= 0 ? "+" : ""}${currentRelativeError.toFixed(3)}%`,
        `Drift delta: ${driftDelta >= 0 ? "+" : ""}${driftDelta.toFixed(3)}% (${!exceedsThreshold ? `below prototype threshold of ±${PROTOTYPE_ADVISORY_CONFIG.thresholds.driftDeltaPercent}%` : "directional movement inconsistent with historical cycles"})`
      ]
    };
  },

  /**
   * Deterministic non-linearity analysis
   * Compares the error pattern at different nominal loads across the current verification set.
   * Requires at least 3 distinct nominal load points.
   */
  detectNonLinearity(observations: TestObservationInput[]): RiskFactor {
    const validObs = observations.filter(
      (o) => !isNaN(o.nominalValue) && !isNaN(o.observedValue) && o.nominalValue > 0
    );

    // Group by distinct nominal values
    const distinctNominals = Array.from(new Set(validObs.map((o) => o.nominalValue))).sort(
      (a, b) => a - b
    );

    if (distinctNominals.length < PROTOTYPE_ADVISORY_CONFIG.thresholds.minPointsForNonLinearity) {
      return {
        type: "NON_LINEARITY",
        severity: "LOW",
        detected: false,
        title: "Non-Linearity",
        explanation: "Insufficient distinct test points for this analysis (at least 3 distinct nominal loads required). Pattern could not be assessed from available data.",
        evidence: [
          `Distinct load points provided: ${distinctNominals.length} (minimum required: ${PROTOTYPE_ADVISORY_CONFIG.thresholds.minPointsForNonLinearity}). Pattern could not be assessed from available data.`
        ]
      };
    }

    // Sort observations by nominal load
    const sortedObs = distinctNominals.map((nom) => {
      const match = validObs.find((o) => o.nominalValue === nom)!;
      const relError = ((match.observedValue - match.nominalValue) / match.nominalValue) * 100;
      return {
        label: match.testPointLabel || `${nom} ${match.unit}`,
        nominal: nom,
        observed: match.observedValue,
        unit: match.unit,
        relativeError: relError
      };
    });

    // Calculate step-to-step error jumps between adjacent load points
    const stepDeltas: number[] = [];
    for (let i = 1; i < sortedObs.length; i++) {
      stepDeltas.push(sortedObs[i].relativeError - sortedObs[i - 1].relativeError);
    }

    // Check for abrupt slope deviation between adjacent intervals
    let abruptJumpDetected = false;
    let maxJumpDiff = 0;
    let triggeringSteps = "";

    for (let i = 1; i < stepDeltas.length; i++) {
      const jumpDiff = Math.abs(stepDeltas[i] - stepDeltas[i - 1]);
      if (jumpDiff > maxJumpDiff) {
        maxJumpDiff = jumpDiff;
      }
      if (jumpDiff >= PROTOTYPE_ADVISORY_CONFIG.thresholds.nonLinearityDeviationPercent) {
        abruptJumpDetected = true;
        triggeringSteps = `Step ${i} (Δ: ${stepDeltas[i - 1].toFixed(3)}%) vs Step ${i + 1} (Δ: ${stepDeltas[i].toFixed(3)}%)`;
      }
    }

    const evidence = sortedObs.map(
      (o) =>
        `${o.nominal} ${o.unit} → observed: ${o.observed} ${o.unit} (error: ${o.relativeError >= 0 ? "+" : ""}${o.relativeError.toFixed(3)}%)`
    );

    if (abruptJumpDetected) {
      evidence.push(
        `Abrupt step deviation: ${maxJumpDiff.toFixed(3)}% (prototype threshold: ${PROTOTYPE_ADVISORY_CONFIG.thresholds.nonLinearityDeviationPercent}%)`
      );
      if (triggeringSteps) evidence.push(triggeringSteps);

      return {
        type: "NON_LINEARITY",
        severity: "MEDIUM", // 2 points weight in prototype configuration
        detected: true,
        title: "Non-Linearity",
        explanation: "Error pattern deviates abruptly across load verification points.",
        evidence
      };
    }

    evidence.push(
      `Max step deviation: ${maxJumpDiff.toFixed(3)}% (within linear boundary: <${PROTOTYPE_ADVISORY_CONFIG.thresholds.nonLinearityDeviationPercent}%)`
    );

    return {
      type: "NON_LINEARITY",
      severity: "LOW",
      detected: false,
      title: "Non-Linearity",
      explanation: "No significant non-linearity pattern detected across verification points.",
      evidence
    };
  },

  /**
   * Deterministic identical / repeated reading detection
   * Flags cases where multiple test observations that represent distinct nominal
   * measurement points produce exactly identical observed readings.
   */
  detectIdenticalReadings(observations: TestObservationInput[]): RiskFactor {
    const validObs = observations.filter(
      (o) => !isNaN(o.nominalValue) && !isNaN(o.observedValue)
    );

    // Group by distinct nominal values
    const distinctNominals = Array.from(new Set(validObs.map((o) => o.nominalValue)));

    if (distinctNominals.length < PROTOTYPE_ADVISORY_CONFIG.thresholds.minPointsForIdenticalReadings) {
      return {
        type: "IDENTICAL_READINGS",
        severity: "LOW",
        detected: false,
        title: "Identical Readings",
        explanation: "Insufficient distinct test points for this analysis (minimum 3 distinct points required). Pattern could not be assessed from available data.",
        evidence: [
          `Distinct nominal points: ${distinctNominals.length} (minimum required: ${PROTOTYPE_ADVISORY_CONFIG.thresholds.minPointsForIdenticalReadings}). Pattern could not be assessed from available data.`
        ]
      };
    }

    // Map observed values to count of distinct nominals that produced that reading
    const observedMap: Record<number, number[]> = {};
    for (const obs of validObs) {
      if (!observedMap[obs.observedValue]) {
        observedMap[obs.observedValue] = [];
      }
      if (!observedMap[obs.observedValue].includes(obs.nominalValue)) {
        observedMap[obs.observedValue].push(obs.nominalValue);
      }
    }

    let repeatedIdenticalReading: number | null = null;
    let repeatedNominals: number[] = [];

    for (const [obsValStr, nominals] of Object.entries(observedMap)) {
      if (nominals.length >= 3) {
        repeatedIdenticalReading = parseFloat(obsValStr);
        repeatedNominals = nominals;
        break;
      }
    }

    if (repeatedIdenticalReading !== null) {
      const evidence = repeatedNominals.map(
        (nom) => `Nominal: ${nom} → Observed: ${repeatedIdenticalReading}`
      );
      evidence.push(
        `3 or more distinct nominal points produced identical observed value (${repeatedIdenticalReading}).`
      );

      return {
        type: "IDENTICAL_READINGS",
        severity: "MEDIUM", // 2 points weight in prototype configuration
        detected: true,
        title: "Identical Readings",
        explanation: "Repeated identical readings detected across distinct test points — review recommended.",
        evidence
      };
    }

    return {
      type: "IDENTICAL_READINGS",
      severity: "LOW",
      detected: false,
      title: "Identical Readings",
      explanation: "No suspicious repeated identical readings detected across distinct test points.",
      evidence: [
        `All ${validObs.length} distinct test points produced independent observed readings.`
      ]
    };
  },

  /**
   * Deterministic error trend detection
   * Evaluates whether error magnitude grows monotonically with nominal load.
   */
  detectErrorTrend(observations: TestObservationInput[]): RiskFactor {
    const validObs = observations.filter(
      (o) => !isNaN(o.nominalValue) && !isNaN(o.observedValue) && o.nominalValue > 0
    );

    const distinctNominals = Array.from(new Set(validObs.map((o) => o.nominalValue))).sort(
      (a, b) => a - b
    );

    if (distinctNominals.length < PROTOTYPE_ADVISORY_CONFIG.thresholds.minPointsForErrorTrend) {
      return {
        type: "ERROR_TREND",
        severity: "LOW",
        detected: false,
        title: "Error Trend",
        explanation: "Insufficient test points for this analysis (minimum 3 ordered points required). Pattern could not be assessed from available data.",
        evidence: [
          `Ordered points provided: ${distinctNominals.length} (minimum required: ${PROTOTYPE_ADVISORY_CONFIG.thresholds.minPointsForErrorTrend}). Pattern could not be assessed from available data.`
        ]
      };
    }

    const sortedObs = distinctNominals.map((nom) => {
      const match = validObs.find((o) => o.nominalValue === nom)!;
      const relError = ((match.observedValue - match.nominalValue) / match.nominalValue) * 100;
      return {
        nominal: nom,
        unit: match.unit,
        relativeError: relError,
        absErrorMagnitude: Math.abs(relError)
      };
    });

    let strictlyMonotonic = true;
    for (let i = 1; i < sortedObs.length; i++) {
      // Must increase with at least 0.005% step to be significant
      if (sortedObs[i].absErrorMagnitude <= sortedObs[i - 1].absErrorMagnitude + 0.005) {
        strictlyMonotonic = false;
        break;
      }
    }

    const evidence = sortedObs.map(
      (o) =>
        `${o.nominal} ${o.unit} → error magnitude: ${o.absErrorMagnitude.toFixed(3)}% (${o.relativeError >= 0 ? "+" : ""}${o.relativeError.toFixed(3)}%)`
    );

    if (strictlyMonotonic) {
      evidence.push("Error magnitude increases consistently across ascending nominal loads.");

      return {
        type: "ERROR_TREND",
        severity: "LOW", // 1 point weight in prototype configuration
        detected: true,
        title: "Error Trend",
        explanation: "Error magnitude increases monotonically with nominal load across test points.",
        evidence
      };
    }

    return {
      type: "ERROR_TREND",
      severity: "LOW",
      detected: false,
      title: "Error Trend",
      explanation: "No significant monotonic error growth detected across test points.",
      evidence
    };
  },

  /**
   * Primary entry point: deterministic advisory assessment
   * Does NOT rely on Date.now() or clock. Purely reproducible from inputs.
   */
  analyzeObservations(
    instrumentId: string,
    observations: TestObservationInput[],
    historicalRecords?: HistoricalVerificationRecord[],
    generatedAt?: string
  ): AiAdvisoryAssessment {
    const validObs = observations.filter(
      (o) => !isNaN(o.nominalValue) && !isNaN(o.observedValue)
    );

    // Calculate current representative relative error from the highest load test point
    let currentRelativeError: number | null = null;
    if (validObs.length > 0) {
      // Sort by nominal descending to take primary top-load error
      const topObs = [...validObs].sort((a, b) => b.nominalValue - a.nominalValue)[0];
      if (topObs.nominalValue > 0) {
        currentRelativeError =
          ((topObs.observedValue - topObs.nominalValue) / topObs.nominalValue) * 100;
      }
    }

    // 1. Run all 4 deterministic factor detectors
    const driftFactor = this.detectDrift(currentRelativeError, historicalRecords || []);
    const nonLinearityFactor = this.detectNonLinearity(observations);
    const identicalFactor = this.detectIdenticalReadings(observations);
    const errorTrendFactor = this.detectErrorTrend(observations);

    const factors: RiskFactor[] = [
      driftFactor,
      nonLinearityFactor,
      identicalFactor,
      errorTrendFactor
    ];

    // 2. Calculate composite score
    let compositeScore = 0;
    factors.forEach((f) => {
      if (f.detected) {
        compositeScore += PROTOTYPE_ADVISORY_CONFIG.weights[f.type] || 0;
      }
    });

    // 3. Classify composite risk level
    let riskLevel: RiskLevel = "LOW";
    if (compositeScore >= PROTOTYPE_ADVISORY_CONFIG.compositeThresholds.highMin) {
      riskLevel = "HIGH";
    } else if (compositeScore >= PROTOTYPE_ADVISORY_CONFIG.compositeThresholds.mediumMin) {
      riskLevel = "MEDIUM";
    }

    // 4. Determine insufficient data status and explanatory summary
    const isInsufficient =
      validObs.length < 2 && (!historicalRecords || historicalRecords.length === 0);

    let summary: string;
    if (isInsufficient) {
      summary = "Insufficient data for meaningful pattern analysis.";
    } else if (riskLevel === "HIGH") {
      summary = "Multiple advisory patterns detected. Detailed LMO review is recommended.";
    } else if (riskLevel === "MEDIUM") {
      summary = "One or more patterns warrant additional LMO review.";
    } else {
      summary = "No significant advisory pattern detected in the available data.";
    }

    return {
      instrumentId,
      generatedAt: generatedAt || "2025-06-12T10:00:00Z", // Deterministic prototype timestamp if not supplied
      riskLevel,
      assessmentStatus: isInsufficient ? "INSUFFICIENT_DATA" : "ASSESSED",
      insufficientData: isInsufficient,
      factors,
      observationsAnalyzed: validObs.length,
      historicalVerificationsAnalyzed: historicalRecords?.length || 0,
      summary,
      isPrototypeHeuristic: true
    };
  },

  /**
   * Retrieve historical verification cycles from canonical Digital Instrument Passport
   * and evaluate advisory for an application.
   */
  async getAdvisoryForApplication(
    applicationId: string,
    currentObservations?: TestObservationInput[]
  ): Promise<AiAdvisoryAssessment> {
    const app = await applicationService.getApplicationById(applicationId);
    const instrumentId = app?.instrumentId || "W-104";

    // 1. Fetch historical verification observations from Passport cycles
    const user = await authService.getCurrentUser();
    const passportRes = await instrumentPassportService.getInstrumentPassport(instrumentId, user);
    const historicalRecords: HistoricalVerificationRecord[] = [];

    if (passportRes.success && passportRes.passport) {
      const cycles: VerificationCycle[] = passportRes.passport.cycles || [];
      cycles.forEach((cycle: VerificationCycle, idx: number) => {
        // Do not include the active cycle in historical comparison
        if (cycle.application?.id !== applicationId && cycle.verification) {
          const v = cycle.verification;
          // Extract percentage error from observedErrorDisplay or repeatabilityError
          const raw = v.observedErrorDisplay || v.repeatabilityError || "0.02%";
          const clean = parseFloat(raw.replace("%", "").replace("+", ""));
          if (!isNaN(clean)) {
            historicalRecords.push({
              date: cycle.date || "Past cycle",
              cycleNumber: cycle.cycleNumber || idx + 1,
              relativeErrorPercent: clean
            });
          }
        }
      });
    }

    // 2. Fetch current observation set if not passed
    let activeObservations: TestObservationInput[] = currentObservations || [];
    if (activeObservations.length === 0) {
      const currentObsRecord = await verificationService.getVerificationObservation(applicationId);
      if (currentObsRecord?.mpeEvaluations && currentObsRecord.mpeEvaluations.length > 0) {
        activeObservations = currentObsRecord.mpeEvaluations.map((ev, i) => ({
          id: `obs-saved-${i + 1}`,
          testPointLabel: `Test Point ${i + 1} (${ev.nominalValue} ${ev.unit})`,
          nominalValue: ev.nominalValue,
          observedValue: ev.observedValue,
          unit: ev.unit
        }));
      } else {
        // Default baseline observation points
        activeObservations = [
          { nominalValue: 20, observedValue: 20.0, unit: "kg", testPointLabel: "Load Point 1 (20 kg)" },
          { nominalValue: 50, observedValue: 50.01, unit: "kg", testPointLabel: "Load Point 2 (50 kg)" },
          { nominalValue: 100, observedValue: 100.02, unit: "kg", testPointLabel: "Load Point 3 (100 kg)" }
        ];
      }
    }

    return this.analyzeObservations(instrumentId, activeObservations, historicalRecords);
  },

  /**
   * Deterministic Demonstration Scenarios
   * For interactive LMO demonstration of LOW, MEDIUM, HIGH, and INSUFFICIENT DATA outcomes.
   */
  getDemoScenarios(): DemoAdvisoryScenario[] {
    return [
      {
        id: "scenario-a-low",
        name: "Scenario A — Low Risk",
        description: "Stable readings, balanced linear profile, and no suspicious drift.",
        expectedRisk: "LOW",
        observations: [
          { nominalValue: 20, observedValue: 20.0, unit: "kg", testPointLabel: "Point 1 (20 kg)" },
          { nominalValue: 50, observedValue: 50.01, unit: "kg", testPointLabel: "Point 2 (50 kg)" },
          { nominalValue: 100, observedValue: 100.02, unit: "kg", testPointLabel: "Point 3 (100 kg)" }
        ],
        historicalVerifications: [
          { date: "10 Jun 2023", cycleNumber: 1, relativeErrorPercent: 0.018 },
          { date: "15 Jun 2024", cycleNumber: 2, relativeErrorPercent: 0.019 }
        ]
      },
      {
        id: "scenario-b-medium",
        name: "Scenario B — Medium Risk",
        description: "Non-linearity detected: abrupt deviation between mid-load and high-load test points.",
        expectedRisk: "MEDIUM",
        observations: [
          { nominalValue: 20, observedValue: 20.01, unit: "kg", testPointLabel: "Point 1 (20 kg)" },
          { nominalValue: 50, observedValue: 50.01, unit: "kg", testPointLabel: "Point 2 (50 kg)" },
          { nominalValue: 100, observedValue: 100.09, unit: "kg", testPointLabel: "Point 3 (100 kg)" }
        ],
        historicalVerifications: [
          { date: "10 Jun 2023", cycleNumber: 1, relativeErrorPercent: 0.075 },
          { date: "15 Jun 2024", cycleNumber: 2, relativeErrorPercent: 0.080 }
        ]
      },
      {
        id: "scenario-c-high",
        name: "Scenario C — High Risk",
        description: "Multiple patterns detected: repeated identical readings across distinct loads and non-linearity.",
        expectedRisk: "HIGH",
        observations: [
          { nominalValue: 20, observedValue: 19.98, unit: "kg", testPointLabel: "Point 1 (20 kg)" },
          { nominalValue: 50, observedValue: 19.98, unit: "kg", testPointLabel: "Point 2 (50 kg)" },
          { nominalValue: 100, observedValue: 19.98, unit: "kg", testPointLabel: "Point 3 (100 kg)" }
        ],
        historicalVerifications: [
          { date: "10 Jun 2023", cycleNumber: 1, relativeErrorPercent: 0.01 },
          { date: "15 Jun 2024", cycleNumber: 2, relativeErrorPercent: 0.02 }
        ]
      },
      {
        id: "scenario-d-insufficient",
        name: "Scenario D — Insufficient Data",
        description: "Only single point provided, historical passport comparison unavailable.",
        expectedRisk: "LOW",
        observations: [
          { nominalValue: 20, observedValue: 20.0, unit: "kg", testPointLabel: "Point 1 (20 kg)" }
        ],
        historicalVerifications: []
      }
    ];
  }
};
