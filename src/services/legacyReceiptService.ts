import {
  Instrument,
  InstrumentMatchResult,
  InstrumentMatchStatus,
  LegacyReceiptExtraction,
  LegacyReceiptField,
  LegacyReceiptFieldKey,
  UserProfile
} from "../types";
import { instrumentService } from "./instrumentService";

export interface DemoReceiptDescriptor {
  id: string;
  title: string;
  category: string;
  date: string;
  serialNumber: string;
  summary: string;
  simulatedDocument: {
    authority: string;
    receiptNo: string;
    date: string;
    trader: string;
    address: string;
    deviceDetails: string;
    capacity: string;
    sealStatus: string;
    result: string;
    officerSignature: string;
  };
}

export const DEMO_RECEIPTS: DemoReceiptDescriptor[] = [
  {
    id: "DEMO-RECEIPT-001",
    title: "Delhi Legal Metrology Verification Receipt (2024)",
    category: "Electronic Scales",
    date: "12 Jun 2024",
    serialNumber: "ES215-88421",
    summary: "Electronic platform weighing scale with full historical certificate and serial match.",
    simulatedDocument: {
      authority: "Government of NCT of Delhi • Department of Legal Metrology",
      receiptNo: "DEL-LM-2024-88421",
      date: "12/06/2024",
      trader: "Bharat Mart Pvt Ltd",
      address: "18 Ajmal Khan Road, Karol Bagh, New Delhi",
      deviceDetails: "Essae Platform Scale Model DS-215 (Serial: ES215-88421)",
      capacity: "300 kg (Class III)",
      sealStatus: "Lead seal intact • Stamped with year 24 mark",
      result: "Verified and stamped under Legal Metrology Act",
      officerSignature: "Inspector Legal Metrology, Delhi South"
    }
  },
  {
    id: "DEMO-RECEIPT-002",
    title: "Industrial Flow Meter Inspection Slip (2023)",
    category: "Flow Meters",
    date: "18 Nov 2023",
    serialNumber: "FM-NEW-771",
    summary: "New flow meter instrument not currently registered in owner profile.",
    simulatedDocument: {
      authority: "Office of the Controller of Legal Metrology • Verification Unit",
      receiptNo: "OFFLINE-INSP-2023-991",
      date: "18/11/2023",
      trader: "FreshKart Logistics Depot",
      address: "Plot 42, Okhla Industrial Area Phase III, New Delhi",
      deviceDetails: "Tokyo Keiki Flow Meter FM-X200 (Serial: FM-NEW-771)",
      capacity: "500 L/min",
      sealStatus: "Wire seal intact",
      result: "Annual routine check recorded offline",
      officerSignature: "Assistant Controller (Inspection)"
    }
  },
  {
    id: "DEMO-RECEIPT-003",
    title: "Commercial Counter Scale Inspection Memo (2024)",
    category: "Counter scale",
    date: "02 Jun 2024",
    serialNumber: "AV30-10928",
    summary: "Retail counter scale with faint reading needing user review.",
    simulatedDocument: {
      authority: "Department of Consumer Affairs • Legal Metrology Division",
      receiptNo: "REC-2024-C20-098",
      date: "02/06/2024",
      trader: "Bharat Mart Pvt Ltd",
      address: "18 Ajmal Khan Road, New Delhi",
      deviceDetails: "Avery India Counter Scale Model AV-30 (Serial: AV30-10928)",
      capacity: "30 kg",
      sealStatus: "Sticker present, lead seal verified",
      result: "Satisfactory compliance with standard test weights",
      officerSignature: "LMO Zone 2"
    }
  }
];

export const legacyReceiptService = {
  /**
   * Return the list of demo receipts available for deterministic testing
   */
  getDemoReceipts(): DemoReceiptDescriptor[] {
    return DEMO_RECEIPTS;
  },

  /**
   * Match an extracted serial number against registered instruments.
   * If ownerId is provided, matches are restricted to that owner's repository.
   */
  async matchInstrument(
    serialNumber?: string,
    ownerId?: string
  ): Promise<InstrumentMatchResult> {
    if (!serialNumber || !serialNumber.trim()) {
      return {
        status: "INSUFFICIENT_INFO",
        matchedInstruments: [],
        message: "Insufficient serial number information to perform automated matching."
      };
    }

    const trimmed = serialNumber.trim().toUpperCase();
    const all = await instrumentService.getInstruments();
    const candidates = ownerId ? all.filter((i) => i.ownerId === ownerId) : all;

    const matches = candidates.filter(
      (i) => i.serialNumber.trim().toUpperCase() === trimmed
    );

    if (matches.length === 1) {
      return {
        status: "MATCH_FOUND",
        matchedInstruments: matches,
        matchedInstrument: matches[0],
        matchedId: matches[0].id,
        message: `Exact match identified: ${matches[0].id} (${matches[0].name}).`
      };
    } else if (matches.length > 1) {
      return {
        status: "MULTIPLE_MATCHES",
        matchedInstruments: matches,
        candidates: matches,
        message: `Multiple candidate instruments found matching serial "${serialNumber}". Please select the appropriate instrument.`
      };
    } else {
      return {
        status: "MATCH_NOT_FOUND",
        matchedInstruments: [],
        message: `No registered instrument in profile matches serial "${serialNumber}". You can register this device as a new instrument.`
      };
    }
  },

  /**
   * Update a field's value and transition its source state to USER_VERIFIED
   */
  updateField(
    extraction: LegacyReceiptExtraction,
    key: LegacyReceiptFieldKey,
    newValue: string
  ): LegacyReceiptExtraction {
    return {
      ...extraction,
      fields: extraction.fields.map((f) => {
        if (f.key === key) {
          return {
            ...f,
            finalValue: newValue,
            sourceState: "USER_VERIFIED"
          };
        }
        return f;
      })
    };
  },

  /**
   * Clear a field's value and set its state to NOT_FOUND
   */
  clearField(
    extraction: LegacyReceiptExtraction,
    key: LegacyReceiptFieldKey
  ): LegacyReceiptExtraction {
    return {
      ...extraction,
      fields: extraction.fields.map((f) => {
        if (f.key === key) {
          return {
            ...f,
            finalValue: "",
            suggestedValue: "",
            sourceState: "NOT_FOUND"
          };
        }
        return f;
      })
    };
  },

  /**
   * Run deterministic extraction from a selected demo receipt.
   */
  async extractFromDemo(
    demoId: string,
    currentUser?: UserProfile
  ): Promise<LegacyReceiptExtraction> {
    const descriptor = DEMO_RECEIPTS.find((d) => d.id === demoId) || DEMO_RECEIPTS[0];

    let fields: LegacyReceiptField[] = [];

    if (descriptor.id === "DEMO-RECEIPT-001") {
      fields = [
        {
          key: "ownerName",
          label: "Owner / Business Name",
          suggestedValue: "Bharat Mart Pvt Ltd",
          finalValue: "Bharat Mart Pvt Ltd",
          confidence: "HIGH",
          sourceState: "AI_SUGGESTED",
          editable: true
        },
        {
          key: "establishmentName",
          label: "Establishment Name",
          suggestedValue: "Bharat Mart",
          finalValue: "Bharat Mart",
          confidence: "HIGH",
          sourceState: "AI_SUGGESTED",
          editable: true
        },
        {
          key: "address",
          label: "Establishment Address",
          suggestedValue: "18 Ajmal Khan Road, Karol Bagh, New Delhi",
          finalValue: "18 Ajmal Khan Road, Karol Bagh, New Delhi",
          confidence: "HIGH",
          sourceState: "AI_SUGGESTED",
          editable: true
        },
        {
          key: "instrumentType",
          label: "Instrument Category",
          suggestedValue: "Platform scale",
          finalValue: "Platform scale",
          confidence: "HIGH",
          sourceState: "AI_SUGGESTED",
          editable: true
        },
        {
          key: "instrumentName",
          label: "Instrument Name",
          suggestedValue: "Platform Weighing Scale W-104",
          finalValue: "Platform Weighing Scale W-104",
          confidence: "HIGH",
          sourceState: "AI_SUGGESTED",
          editable: true
        },
        {
          key: "model",
          label: "Model / Manufacturer",
          suggestedValue: "Essae DS-215",
          finalValue: "Essae DS-215",
          confidence: "HIGH",
          sourceState: "AI_SUGGESTED",
          editable: true
        },
        {
          key: "serialNumber",
          label: "Serial Number",
          suggestedValue: "ES215-88421",
          finalValue: "ES215-88421",
          confidence: "HIGH",
          sourceState: "AI_SUGGESTED",
          editable: true
        },
        {
          key: "capacity",
          label: "Capacity",
          suggestedValue: "300 kg",
          finalValue: "300 kg",
          confidence: "HIGH",
          sourceState: "AI_SUGGESTED",
          editable: true
        },
        {
          key: "accuracyClass",
          label: "Accuracy Class",
          suggestedValue: "Class III",
          finalValue: "Class III",
          confidence: "MEDIUM",
          sourceState: "AI_SUGGESTED",
          editable: true
        },
        {
          key: "previousVerificationDate",
          label: "Previous Verification Date",
          suggestedValue: "12 Jun 2024",
          finalValue: "12 Jun 2024",
          confidence: "HIGH",
          sourceState: "AI_SUGGESTED",
          editable: true
        },
        {
          key: "previousCertificateNumber",
          label: "Previous Certificate Number",
          suggestedValue: "CERT-2024-W104",
          finalValue: "CERT-2024-W104",
          confidence: "HIGH",
          sourceState: "AI_SUGGESTED",
          editable: true
        },
        {
          key: "observedReading",
          label: "Observed Reference Reading",
          suggestedValue: "299.98 kg at 300 kg load",
          finalValue: "299.98 kg at 300 kg load",
          confidence: "MEDIUM",
          sourceState: "AI_SUGGESTED",
          editable: true
        },
        {
          key: "remarks",
          label: "Receipt Remarks / Stamp Notes",
          suggestedValue: "Sticker displayed. Seal intact. Satisfactory verification under Rule 14.",
          finalValue: "Sticker displayed. Seal intact. Satisfactory verification under Rule 14.",
          confidence: "HIGH",
          sourceState: "AI_SUGGESTED",
          editable: true
        }
      ];
    } else if (descriptor.id === "DEMO-RECEIPT-002") {
      fields = [
        {
          key: "ownerName",
          label: "Owner / Business Name",
          suggestedValue: "FreshKart Retail Logistics",
          finalValue: "FreshKart Retail Logistics",
          confidence: "HIGH",
          sourceState: "AI_SUGGESTED",
          editable: true
        },
        {
          key: "establishmentName",
          label: "Establishment Name",
          suggestedValue: "FreshKart Depot",
          finalValue: "FreshKart Depot",
          confidence: "MEDIUM",
          sourceState: "AI_SUGGESTED",
          editable: true
        },
        {
          key: "address",
          label: "Establishment Address",
          suggestedValue: "Plot 42, Okhla Industrial Area Phase III, New Delhi",
          finalValue: "Plot 42, Okhla Industrial Area Phase III, New Delhi",
          confidence: "HIGH",
          sourceState: "AI_SUGGESTED",
          editable: true
        },
        {
          key: "instrumentType",
          label: "Instrument Category",
          suggestedValue: "Flow Meters",
          finalValue: "Flow Meters",
          confidence: "HIGH",
          sourceState: "AI_SUGGESTED",
          editable: true
        },
        {
          key: "instrumentName",
          label: "Instrument Name",
          suggestedValue: "Industrial Flow Meter FM-X",
          finalValue: "Industrial Flow Meter FM-X",
          confidence: "MEDIUM",
          sourceState: "AI_SUGGESTED",
          editable: true
        },
        {
          key: "model",
          label: "Model / Manufacturer",
          suggestedValue: "Tokyo Keiki FM-X200",
          finalValue: "Tokyo Keiki FM-X200",
          confidence: "HIGH",
          sourceState: "AI_SUGGESTED",
          editable: true
        },
        {
          key: "serialNumber",
          label: "Serial Number",
          suggestedValue: "FM-NEW-771",
          finalValue: "FM-NEW-771",
          confidence: "HIGH",
          sourceState: "AI_SUGGESTED",
          editable: true
        },
        {
          key: "capacity",
          label: "Capacity",
          suggestedValue: "500 L/min",
          finalValue: "500 L/min",
          confidence: "HIGH",
          sourceState: "AI_SUGGESTED",
          editable: true
        },
        {
          key: "accuracyClass",
          label: "Accuracy Class",
          suggestedValue: "",
          finalValue: "",
          confidence: "LOW",
          sourceState: "NOT_FOUND",
          editable: true
        },
        {
          key: "previousVerificationDate",
          label: "Previous Verification Date",
          suggestedValue: "18 Nov 2023",
          finalValue: "18 Nov 2023",
          confidence: "MEDIUM",
          sourceState: "AI_SUGGESTED",
          editable: true
        },
        {
          key: "previousCertificateNumber",
          label: "Previous Certificate Number",
          suggestedValue: "OFFLINE-INSP-2023-991",
          finalValue: "OFFLINE-INSP-2023-991",
          confidence: "LOW",
          sourceState: "AI_SUGGESTED",
          editable: true
        },
        {
          key: "remarks",
          label: "Receipt Remarks / Stamp Notes",
          suggestedValue: "Annual routine check recorded offline.",
          finalValue: "Annual routine check recorded offline.",
          confidence: "HIGH",
          sourceState: "AI_SUGGESTED",
          editable: true
        }
      ];
    } else {
      // DEMO-RECEIPT-003
      fields = [
        {
          key: "ownerName",
          label: "Owner / Business Name",
          suggestedValue: "Bharat Mart Pvt Ltd",
          finalValue: "Bharat Mart Pvt Ltd",
          confidence: "HIGH",
          sourceState: "AI_SUGGESTED",
          editable: true
        },
        {
          key: "establishmentName",
          label: "Establishment Name",
          suggestedValue: "Bharat Mart",
          finalValue: "Bharat Mart",
          confidence: "HIGH",
          sourceState: "AI_SUGGESTED",
          editable: true
        },
        {
          key: "address",
          label: "Establishment Address",
          suggestedValue: "18 Ajmal Khan Road, New Delhi",
          finalValue: "18 Ajmal Khan Road, New Delhi",
          confidence: "HIGH",
          sourceState: "AI_SUGGESTED",
          editable: true
        },
        {
          key: "instrumentType",
          label: "Instrument Category",
          suggestedValue: "Counter scale",
          finalValue: "Counter scale",
          confidence: "HIGH",
          sourceState: "AI_SUGGESTED",
          editable: true
        },
        {
          key: "instrumentName",
          label: "Instrument Name",
          suggestedValue: "Retail Counter Scale C-20",
          finalValue: "Retail Counter Scale C-20",
          confidence: "HIGH",
          sourceState: "AI_SUGGESTED",
          editable: true
        },
        {
          key: "model",
          label: "Model / Manufacturer",
          suggestedValue: "Avery India AV-30",
          finalValue: "Avery India AV-30",
          confidence: "HIGH",
          sourceState: "AI_SUGGESTED",
          editable: true
        },
        {
          key: "serialNumber",
          label: "Serial Number",
          suggestedValue: "AV30-10928",
          finalValue: "AV30-10928",
          confidence: "HIGH",
          sourceState: "AI_SUGGESTED",
          editable: true
        },
        {
          key: "capacity",
          label: "Capacity",
          suggestedValue: "30 kg",
          finalValue: "30 kg",
          confidence: "HIGH",
          sourceState: "AI_SUGGESTED",
          editable: true
        },
        {
          key: "accuracyClass",
          label: "Accuracy Class",
          suggestedValue: "Class III",
          finalValue: "Class III",
          confidence: "MEDIUM",
          sourceState: "AI_SUGGESTED",
          editable: true
        },
        {
          key: "previousVerificationDate",
          label: "Previous Verification Date",
          suggestedValue: "02 Jun 2024",
          finalValue: "02 Jun 2024",
          confidence: "HIGH",
          sourceState: "AI_SUGGESTED",
          editable: true
        },
        {
          key: "previousCertificateNumber",
          label: "Previous Certificate Number",
          suggestedValue: "REC-2024-C20-098",
          finalValue: "REC-2024-C20-098",
          confidence: "MEDIUM",
          sourceState: "AI_SUGGESTED",
          editable: true
        },
        {
          key: "observedReading",
          label: "Observed Reference Reading",
          suggestedValue: "30.01 kg (faint ink)",
          finalValue: "30.01 kg (faint ink)",
          confidence: "LOW",
          sourceState: "AI_SUGGESTED",
          editable: true
        },
        {
          key: "remarks",
          label: "Receipt Remarks / Stamp Notes",
          suggestedValue: "Verified on premise. Satisfactory compliance.",
          finalValue: "Verified on premise. Satisfactory compliance.",
          confidence: "HIGH",
          sourceState: "AI_SUGGESTED",
          editable: true
        }
      ];
    }

    // Attempt matching serial number
    const snField = fields.find((f) => f.key === "serialNumber");
    const match = await this.matchInstrument(
      snField?.finalValue,
      currentUser?.role === "OWNER" ? currentUser.id : undefined
    );

    return {
      id: `EXT-${descriptor.id}`,
      sourceFileName: `${descriptor.id}.pdf`,
      sourceType: "demo",
      extractedAt: "12 Jun 2025, 11:30 AM",
      extractionStatus: fields.some((f) => f.confidence === "LOW") ? "REVIEW_REQUIRED" : "READY",
      fields,
      matchedInstrumentId: match.matchedId,
      instrumentMatchStatus: match.status,
      matchedInstruments: match.matchedInstruments
    };
  },

  /**
   * Deterministic upload handler.
   * If the file matches a demo name, maps to that demo; otherwise provides a structured manual review template.
   */
  async extractFromUpload(
    file: { name: string; size: number; type: string },
    currentUser?: UserProfile
  ): Promise<LegacyReceiptExtraction> {
    if (file.size > 10 * 1024 * 1024) {
      throw new Error("File exceeds maximum allowed size (10 MB).");
    }

    const lower = file.name.toLowerCase();
    if (lower.includes("002") || lower.includes("flow")) {
      return this.extractFromDemo("DEMO-RECEIPT-002", currentUser);
    } else if (lower.includes("003") || lower.includes("counter")) {
      return this.extractFromDemo("DEMO-RECEIPT-003", currentUser);
    } else if (lower.includes("001") || lower.includes("w104") || lower.includes("w-104")) {
      return this.extractFromDemo("DEMO-RECEIPT-001", currentUser);
    }

    // Generic upload fallback: provides editable template with clear status
    const fields: LegacyReceiptField[] = [
      {
        key: "ownerName",
        label: "Owner / Business Name",
        suggestedValue: currentUser?.organization || currentUser?.name || "",
        finalValue: currentUser?.organization || currentUser?.name || "",
        confidence: "MEDIUM",
        sourceState: "AI_SUGGESTED",
        editable: true
      },
      {
        key: "instrumentType",
        label: "Instrument Category",
        suggestedValue: "Electronic Scales",
        finalValue: "Electronic Scales",
        confidence: "LOW",
        sourceState: "AI_SUGGESTED",
        editable: true
      },
      {
        key: "serialNumber",
        label: "Serial Number",
        suggestedValue: "",
        finalValue: "",
        confidence: "LOW",
        sourceState: "NOT_FOUND",
        editable: true
      },
      {
        key: "capacity",
        label: "Capacity",
        suggestedValue: "",
        finalValue: "",
        confidence: "LOW",
        sourceState: "NOT_FOUND",
        editable: true
      },
      {
        key: "previousVerificationDate",
        label: "Previous Verification Date",
        suggestedValue: "",
        finalValue: "",
        confidence: "LOW",
        sourceState: "NOT_FOUND",
        editable: true
      },
      {
        key: "previousCertificateNumber",
        label: "Previous Certificate Number",
        suggestedValue: "",
        finalValue: "",
        confidence: "LOW",
        sourceState: "NOT_FOUND",
        editable: true
      },
      {
        key: "remarks",
        label: "Receipt Remarks / Stamp Notes",
        suggestedValue: `Extracted from uploaded document "${file.name}"`,
        finalValue: `Extracted from uploaded document "${file.name}"`,
        confidence: "LOW",
        sourceState: "AI_SUGGESTED",
        editable: true
      }
    ];

    return {
      id: `EXT-UPLOAD-${Date.now()}`,
      sourceFileName: file.name,
      sourceType: file.type.includes("pdf") ? "document" : "image",
      extractedAt: "Just now",
      extractionStatus: "REVIEW_REQUIRED",
      fields,
      instrumentMatchStatus: "INSUFFICIENT_INFO",
      matchedInstruments: []
    };
  }
};
