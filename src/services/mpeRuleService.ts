import {
  Instrument,
  MpeEvaluation,
  MpeEvaluationResult,
  MpeRule,
  MpeTestObservation
} from "../types";

/**
 * PROTOTYPE MPE (Maximum Permissible Error) Verification Rules
 *
 * NOTE: These are PROTOTYPE DEMONSTRATION RULES for hackathon & decision support.
 * They do not constitute universal statutory limits. Always confirm statutory
 * Legal Metrology specifications before real-world enforcement.
 */
export const PROTOTYPE_MPE_RULES: Record<string, MpeRule> = {
  "Electronic Scales": {
    ruleId: "RULE-SCALE-001",
    instrumentCategory: "Electronic Scales",
    ruleName: "Electronic Weighing (Prototype Demonstration)",
    unit: "kg",
    method: "RELATIVE_ERROR",
    mpeValue: 0.05, // ±0.05% relative error
    nominalRange: {
      min: 0.1,
      max: 1000
    },
    explanation:
      "Illustrative prototype tolerance used for demonstration of dynamic error evaluation.",
    disclaimer:
      "Prototype rule configuration — Confirm applicable statutory requirement before actual enforcement.",
    prototypeRule: true
  },
  "Flow Meters": {
    ruleId: "RULE-FLOW-001",
    instrumentCategory: "Flow Meters",
    ruleName: "Liquid Flow Meter (Prototype Demonstration)",
    unit: "L",
    method: "RELATIVE_ERROR",
    mpeValue: 0.3, // ±0.30% relative error
    nominalRange: {
      min: 1,
      max: 10000
    },
    explanation:
      "Illustrative prototype tolerance used for demonstration of dynamic error evaluation.",
    disclaimer:
      "Prototype rule configuration — Confirm applicable statutory requirement before actual enforcement.",
    prototypeRule: true
  },
  Weighbridges: {
    ruleId: "RULE-WEIGHBRIDGE-001",
    instrumentCategory: "Weighbridges",
    ruleName: "Heavy Vehicle Weighbridge (Prototype Demonstration)",
    unit: "kg",
    method: "RELATIVE_ERROR",
    mpeValue: 0.1, // ±0.10% relative error
    nominalRange: {
      min: 500,
      max: 100000
    },
    explanation:
      "Illustrative prototype tolerance used for demonstration of dynamic error evaluation.",
    disclaimer:
      "Prototype rule configuration — Confirm applicable statutory requirement before actual enforcement.",
    prototypeRule: true
  }
};

export interface DemoScenario {
  id: string;
  name: string;
  description: string;
  expectedResult: MpeEvaluationResult;
  testObservations: {
    id: string;
    testPointLabel: string;
    nominalValue: number;
    observedValue: number;
    unit: string;
  }[];
}

export const mpeRuleService = {
  /**
   * Explicitly maps diverse instrument category strings to prototype rule categories.
   * Does NOT silently classify an unsupported instrument.
   */
  mapInstrumentCategory(rawCategory: string | undefined | null): string | null {
    if (!rawCategory) return null;
    const cat = rawCategory.trim().toLowerCase();

    if (
      cat === "platform scale" ||
      cat === "counter scale" ||
      cat === "digital measuring balance" ||
      cat === "carat balance" ||
      cat === "electronic scales" ||
      cat === "electronic scale" ||
      cat === "weighing instrument" ||
      cat.includes("weighing scale")
    ) {
      return "Electronic Scales";
    }

    if (
      cat === "flow meters" ||
      cat === "flow meter" ||
      cat === "liquid flow meter" ||
      cat === "fuel dispenser" ||
      cat.includes("flow meter")
    ) {
      return "Flow Meters";
    }

    if (
      cat === "weighbridges" ||
      cat === "weighbridge" ||
      cat === "heavy vehicle scale" ||
      cat === "truck scale" ||
      cat.includes("weighbridge")
    ) {
      return "Weighbridges";
    }

    // Unsupported category (e.g. "Measuring tape", etc.)
    return null;
  },

  /**
   * Look up the applicable prototype MPE rule for a given instrument
   */
  getRuleForInstrument(instrument: Instrument | null | undefined): MpeRule | null {
    if (!instrument || !instrument.category) return null;
    const mappedCategory = this.mapInstrumentCategory(instrument.category);
    if (!mappedCategory) return null;
    return PROTOTYPE_MPE_RULES[mappedCategory] || null;
  },

  /**
   * Deterministic Absolute Error Calculation:
   * absoluteError = observedValue - nominalValue
   */
  calculateAbsoluteError(nominalValue: number, observedValue: number): number | null {
    if (
      typeof nominalValue !== "number" ||
      typeof observedValue !== "number" ||
      isNaN(nominalValue) ||
      isNaN(observedValue) ||
      !isFinite(nominalValue) ||
      !isFinite(observedValue)
    ) {
      return null;
    }
    const err = observedValue - nominalValue;
    return Math.round(err * 10000) / 10000;
  },

  /**
   * Deterministic Relative Error Calculation:
   * relativeError = ((observedValue - nominalValue) / nominalValue) * 100
   * Handles division by zero safely.
   */
  calculateRelativeError(nominalValue: number, observedValue: number): number | null {
    if (
      typeof nominalValue !== "number" ||
      typeof observedValue !== "number" ||
      isNaN(nominalValue) ||
      isNaN(observedValue) ||
      !isFinite(nominalValue) ||
      !isFinite(observedValue) ||
      nominalValue === 0
    ) {
      return null;
    }
    const rel = ((observedValue - nominalValue) / nominalValue) * 100;
    return Math.round(rel * 10000) / 10000;
  },

  /**
   * Evaluates a single observation against a prototype rule.
   * Handles edge cases, missing data, zero division, and unit compatibility.
   */
  evaluateObservation(params: {
    nominalValue: number;
    observedValue: number;
    unit?: string;
    rule?: MpeRule | null;
  }): MpeEvaluation {
    const { nominalValue, observedValue, unit, rule } = params;

    // 1. Missing Rule / Unsupported Category
    if (!rule) {
      return {
        ruleId: "UNSUPPORTED_CATEGORY",
        nominalValue: isNaN(nominalValue) ? 0 : nominalValue,
        observedValue: isNaN(observedValue) ? 0 : observedValue,
        unit: unit || "",
        allowedMpe: 0,
        result: "INSUFFICIENT_DATA",
        explanation: "No prototype MPE rule available for this instrument category. Officer review required.",
        isPrototypeRule: true
      };
    }

    const currentUnit = (unit || rule.unit).trim();

    // 2. Unit Compatibility Check (do not silently convert or accept mismatched units)
    if (unit && rule.unit) {
      const uNorm = unit.trim().toLowerCase();
      const rNorm = rule.unit.trim().toLowerCase();
      const isMass = (uNorm === "kg" || uNorm === "g") && (rNorm === "kg" || rNorm === "g");
      const isVolume = (uNorm === "l" || uNorm === "litre" || uNorm === "liters") && (rNorm === "l" || rNorm === "litre");

      if (uNorm !== rNorm && !isMass && !isVolume) {
        return {
          ruleId: rule.ruleId,
          nominalValue: isNaN(nominalValue) ? 0 : nominalValue,
          observedValue: isNaN(observedValue) ? 0 : observedValue,
          unit: currentUnit,
          allowedMpe: rule.mpeValue,
          result: "INSUFFICIENT_DATA",
          explanation: `Unit mismatch: expected '${rule.unit}', got '${unit}'. Ambiguous or unsupported unit.`,
          isPrototypeRule: true
        };
      }
    }

    // 3. Numeric Validity Check
    const absError = this.calculateAbsoluteError(nominalValue, observedValue);
    if (absError === null) {
      return {
        ruleId: rule.ruleId,
        nominalValue: isNaN(nominalValue) ? 0 : nominalValue,
        observedValue: isNaN(observedValue) ? 0 : observedValue,
        unit: currentUnit,
        allowedMpe: rule.mpeValue,
        result: "INSUFFICIENT_DATA",
        explanation: "Required numeric values missing, NaN, or non-finite.",
        isPrototypeRule: true
      };
    }

    // 4. Zero Nominal Check for Relative Error
    if (rule.method === "RELATIVE_ERROR" && nominalValue === 0) {
      return {
        ruleId: rule.ruleId,
        nominalValue: 0,
        observedValue,
        unit: currentUnit,
        absoluteError: absError,
        allowedMpe: rule.mpeValue,
        result: "INSUFFICIENT_DATA",
        explanation: "Nominal reference value cannot be zero for relative error calculation.",
        isPrototypeRule: true
      };
    }

    const relError = this.calculateRelativeError(nominalValue, observedValue);

    // 5. Compare with MPE Limit
    let errorMagnitude = 0;
    let unitLabel = "";

    if (rule.method === "RELATIVE_ERROR") {
      errorMagnitude = Math.abs(relError ?? 0);
      unitLabel = "%";
    } else {
      errorMagnitude = Math.abs(absError);
      unitLabel = ` ${rule.unit}`;
    }

    // Floating point tolerance threshold (1e-7) so exact boundary values evaluate safely
    const EPSILON = 1e-7;
    const isWithin = errorMagnitude <= rule.mpeValue + EPSILON;
    const result: MpeEvaluationResult = isWithin ? "WITHIN_MPE" : "EXCEEDS_MPE";

    const sign = (rule.method === "RELATIVE_ERROR" ? (relError ?? 0) : absError) >= 0 ? "+" : "";
    const errorFormatted =
      rule.method === "RELATIVE_ERROR"
        ? `${sign}${(relError ?? 0).toFixed(4)}%`
        : `${sign}${absError.toFixed(4)} ${rule.unit}`;

    const explanation = isWithin
      ? `Calculated error ${errorFormatted} (magnitude ${errorMagnitude.toFixed(4)}${unitLabel}) is within prototype MPE limit (±${rule.mpeValue}${unitLabel}).`
      : `Calculated error ${errorFormatted} (magnitude ${errorMagnitude.toFixed(4)}${unitLabel}) exceeds prototype MPE limit (±${rule.mpeValue}${unitLabel}).`;

    return {
      ruleId: rule.ruleId,
      nominalValue,
      observedValue,
      unit: currentUnit,
      absoluteError: absError,
      relativeErrorPercent: relError ?? undefined,
      allowedMpe: rule.mpeValue,
      result,
      explanation,
      isPrototypeRule: true
    };
  },

  /**
   * Evaluate a collection of observations and determine overall compliance
   */
  evaluateMultipleObservations(
    observations: {
      id: string;
      testPointLabel: string;
      nominalValue: number;
      observedValue: number;
      unit: string;
    }[],
    rule: MpeRule | null
  ): {
    evaluatedObservations: MpeTestObservation[];
    overallStatus: MpeEvaluationResult;
    withinCount: number;
    exceededCount: number;
    insufficientCount: number;
    triggeringObservationLabels: string[];
  } {
    const evaluatedObservations: MpeTestObservation[] = observations.map((obs) => {
      const evaluation = this.evaluateObservation({
        nominalValue: obs.nominalValue,
        observedValue: obs.observedValue,
        unit: obs.unit,
        rule
      });
      return {
        ...obs,
        evaluation
      };
    });

    let withinCount = 0;
    let exceededCount = 0;
    let insufficientCount = 0;
    const triggeringObservationLabels: string[] = [];

    for (const obs of evaluatedObservations) {
      if (obs.evaluation?.result === "EXCEEDS_MPE") {
        exceededCount++;
        triggeringObservationLabels.push(obs.testPointLabel);
      } else if (obs.evaluation?.result === "WITHIN_MPE") {
        withinCount++;
      } else {
        insufficientCount++;
      }
    }

    let overallStatus: MpeEvaluationResult = "WITHIN_MPE";
    if (exceededCount > 0) {
      overallStatus = "EXCEEDS_MPE";
    } else if (insufficientCount > 0) {
      overallStatus = "INSUFFICIENT_DATA";
    }

    return {
      evaluatedObservations,
      overallStatus,
      withinCount,
      exceededCount,
      insufficientCount,
      triggeringObservationLabels
    };
  },

  /**
   * Human-readable rule description
   */
  getRuleDescription(rule: MpeRule | null): string {
    if (!rule) {
      return "No prototype MPE rule applicable for this instrument. Manual officer verification required.";
    }
    const unitText = rule.method === "RELATIVE_ERROR" ? "%" : ` ${rule.unit}`;
    return `${rule.ruleName}: Illustrative prototype tolerance limit is ±${rule.mpeValue}${unitText}. ${rule.explanation}`;
  },

  /**
   * Seeded demonstration scenarios for testing & hackathon showcase
   */
  getDemoScenarios(rule: MpeRule | null): DemoScenario[] {
    const unit = rule?.unit || "kg";

    if (rule?.instrumentCategory === "Flow Meters") {
      return [
        {
          id: "scenario-a",
          name: "Scenario A: Clearly Within MPE (+0.10%)",
          description: "Nominal delivery 50 L, observed reading 50.05 L (+0.10% error vs ±0.30% limit).",
          expectedResult: "WITHIN_MPE",
          testObservations: [
            { id: "obs-1", testPointLabel: "Low Delivery Rate (10 L)", nominalValue: 10, observedValue: 10.01, unit: "L" },
            { id: "obs-2", testPointLabel: "Nominal Flow Rate (50 L)", nominalValue: 50, observedValue: 50.05, unit: "L" },
            { id: "obs-3", testPointLabel: "High Delivery Rate (100 L)", nominalValue: 100, observedValue: 100.10, unit: "L" }
          ]
        },
        {
          id: "scenario-b",
          name: "Scenario B: Exact Boundary (+0.30%)",
          description: "Nominal delivery 100 L, observed reading 100.30 L (+0.30% error matches ±0.30% limit).",
          expectedResult: "WITHIN_MPE",
          testObservations: [
            { id: "obs-1", testPointLabel: "Low Delivery Rate (10 L)", nominalValue: 10, observedValue: 10.02, unit: "L" },
            { id: "obs-2", testPointLabel: "Nominal Flow Rate (50 L)", nominalValue: 50, observedValue: 50.15, unit: "L" },
            { id: "obs-3", testPointLabel: "Boundary Test Point (100 L)", nominalValue: 100, observedValue: 100.30, unit: "L" }
          ]
        },
        {
          id: "scenario-c",
          name: "Scenario C: Exceeds MPE (+0.55%)",
          description: "Nominal delivery 100 L, observed reading 100.55 L (+0.55% error exceeds ±0.30% limit).",
          expectedResult: "EXCEEDS_MPE",
          testObservations: [
            { id: "obs-1", testPointLabel: "Low Delivery Rate (10 L)", nominalValue: 10, observedValue: 10.02, unit: "L" },
            { id: "obs-2", testPointLabel: "Nominal Flow Rate (50 L)", nominalValue: 50, observedValue: 50.10, unit: "L" },
            { id: "obs-3", testPointLabel: "Exceeded Test Point (100 L)", nominalValue: 100, observedValue: 100.55, unit: "L" }
          ]
        },
        {
          id: "scenario-d",
          name: "Scenario D: Missing / Invalid Input",
          description: "Invalid nominal value (0 or NaN) triggers insufficient data warning.",
          expectedResult: "INSUFFICIENT_DATA",
          testObservations: [
            { id: "obs-1", testPointLabel: "Zero Nominal Point", nominalValue: 0, observedValue: 10, unit: "L" },
            { id: "obs-2", testPointLabel: "Unfilled Point", nominalValue: 50, observedValue: NaN, unit: "L" }
          ]
        }
      ];
    }

    if (rule?.instrumentCategory === "Weighbridges") {
      return [
        {
          id: "scenario-a",
          name: "Scenario A: Clearly Within MPE (+0.04%)",
          description: "Reference load 20,000 kg, observed reading 20,008 kg (+0.04% error vs ±0.10% limit).",
          expectedResult: "WITHIN_MPE",
          testObservations: [
            { id: "obs-1", testPointLabel: "Quarter Load (5,000 kg)", nominalValue: 5000, observedValue: 5001, unit: "kg" },
            { id: "obs-2", testPointLabel: "Half Load (10,000 kg)", nominalValue: 10000, observedValue: 10003, unit: "kg" },
            { id: "obs-3", testPointLabel: "Full Test Load (20,000 kg)", nominalValue: 20000, observedValue: 20008, unit: "kg" }
          ]
        },
        {
          id: "scenario-b",
          name: "Scenario B: Exact Boundary (+0.10%)",
          description: "Reference load 20,000 kg, observed reading 20,020 kg (+0.10% error matches ±0.10% limit).",
          expectedResult: "WITHIN_MPE",
          testObservations: [
            { id: "obs-1", testPointLabel: "Quarter Load (5,000 kg)", nominalValue: 5000, observedValue: 5003, unit: "kg" },
            { id: "obs-2", testPointLabel: "Half Load (10,000 kg)", nominalValue: 10000, observedValue: 10007, unit: "kg" },
            { id: "obs-3", testPointLabel: "Boundary Point (20,000 kg)", nominalValue: 20000, observedValue: 20020, unit: "kg" }
          ]
        },
        {
          id: "scenario-c",
          name: "Scenario C: Exceeds MPE (+0.25%)",
          description: "Reference load 20,000 kg, observed reading 20,050 kg (+0.25% error exceeds ±0.10% limit).",
          expectedResult: "EXCEEDS_MPE",
          testObservations: [
            { id: "obs-1", testPointLabel: "Quarter Load (5,000 kg)", nominalValue: 5000, observedValue: 5002, unit: "kg" },
            { id: "obs-2", testPointLabel: "Half Load (10,000 kg)", nominalValue: 10000, observedValue: 10005, unit: "kg" },
            { id: "obs-3", testPointLabel: "Exceeded Point (20,000 kg)", nominalValue: 20000, observedValue: 20050, unit: "kg" }
          ]
        },
        {
          id: "scenario-d",
          name: "Scenario D: Missing / Invalid Input",
          description: "Missing input triggering insufficient data.",
          expectedResult: "INSUFFICIENT_DATA",
          testObservations: [
            { id: "obs-1", testPointLabel: "Invalid Load", nominalValue: 0, observedValue: 5000, unit: "kg" }
          ]
        }
      ];
    }

    // Default: Electronic Scales (Platform scale, Counter scale, etc.)
    return [
      {
        id: "scenario-a",
        name: "Scenario A: Clearly Within MPE (+0.02%)",
        description: "Test point 100 kg, observed reading 100.02 kg (+0.02% error vs ±0.05% limit). All points compliant.",
        expectedResult: "WITHIN_MPE",
        testObservations: [
          { id: "obs-1", testPointLabel: "Load Point 1 (20 kg)", nominalValue: 20, observedValue: 20.00, unit: "kg" },
          { id: "obs-2", testPointLabel: "Load Point 2 (50 kg)", nominalValue: 50, observedValue: 50.01, unit: "kg" },
          { id: "obs-3", testPointLabel: "Load Point 3 (100 kg)", nominalValue: 100, observedValue: 100.02, unit: "kg" }
        ]
      },
      {
        id: "scenario-b",
        name: "Scenario B: Exact Boundary (+0.05%)",
        description: "Test point 100 kg, observed reading 100.05 kg (+0.05% error matches exact ±0.05% limit). Compliant at boundary.",
        expectedResult: "WITHIN_MPE",
        testObservations: [
          { id: "obs-1", testPointLabel: "Load Point 1 (20 kg)", nominalValue: 20, observedValue: 20.00, unit: "kg" },
          { id: "obs-2", testPointLabel: "Load Point 2 (50 kg)", nominalValue: 50, observedValue: 50.02, unit: "kg" },
          { id: "obs-3", testPointLabel: "Exact Boundary Point (100 kg)", nominalValue: 100, observedValue: 100.05, unit: "kg" }
        ]
      },
      {
        id: "scenario-c",
        name: "Scenario C: Exceeds MPE (+0.12%)",
        description: "Test point 100 kg, observed reading 100.12 kg (+0.12% error exceeds ±0.05% limit). Triggers MPE Hard Stop.",
        expectedResult: "EXCEEDS_MPE",
        testObservations: [
          { id: "obs-1", testPointLabel: "Load Point 1 (20 kg)", nominalValue: 20, observedValue: 20.00, unit: "kg" },
          { id: "obs-2", testPointLabel: "Load Point 2 (50 kg)", nominalValue: 50, observedValue: 50.02, unit: "kg" },
          { id: "obs-3", testPointLabel: "Exceeded Point (100 kg)", nominalValue: 100, observedValue: 100.12, unit: "kg" }
        ]
      },
      {
        id: "scenario-d",
        name: "Scenario D: Missing / Invalid Input",
        description: "Missing or zero nominal value triggers insufficient data indication.",
        expectedResult: "INSUFFICIENT_DATA",
        testObservations: [
          { id: "obs-1", testPointLabel: "Valid Point (20 kg)", nominalValue: 20, observedValue: 20.00, unit: "kg" },
          { id: "obs-2", testPointLabel: "Zero Nominal Point", nominalValue: 0, observedValue: 50, unit: "kg" },
          { id: "obs-3", testPointLabel: "Unfilled Point", nominalValue: 100, observedValue: NaN, unit: "kg" }
        ]
      }
    ];
  }
};
