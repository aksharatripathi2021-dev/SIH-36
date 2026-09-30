import {
  Application,
  Certificate,
  Instrument,
  NotificationItem,
  QRStickerConfirmation,
  SupportedLanguage,
  UserProfile,
  VerificationObservation,
  AuditEvent,
  TimelineStep
} from "../types";
import initialUsers from "../data/mock/users.json";
import initialInstruments from "../data/mock/instruments.json";
import initialApplications from "../data/mock/applications.json";
import initialCertificates from "../data/mock/certificates.json";
import initialNotifications from "../data/mock/notifications.json";
import initialResults from "../data/mock/verificationResults.json";

const STORAGE_KEYS = {
  USERS: "ps36_demo_users",
  ACTIVE_USER: "ps36_demo_active_user",
  INSTRUMENTS: "ps36_demo_instruments",
  APPLICATIONS: "ps36_demo_applications",
  CERTIFICATES: "ps36_demo_certificates",
  NOTIFICATIONS: "ps36_demo_notifications",
  VERIFICATION_RESULTS: "ps36_demo_verification_results",
  STICKER_CONFIRMATIONS: "ps36_demo_sticker_confirmations",
  AUDIT_EVENTS: "ps36_demo_audit_events",
  LANGUAGE: "ps36_demo_language",
  SEQ_APP: "ps36_demo_seq_app",
  SEQ_CERT: "ps36_demo_seq_cert",
  SEQ_NOTIF: "ps36_demo_seq_notif",
  SEQ_USER: "ps36_demo_seq_user",
  SEQ_INST: "ps36_demo_seq_inst",
  SEQ_STICKER: "ps36_demo_seq_sticker",
  SYNC_PING: "ps36_demo_sync_ping",
  INITIALIZED: "ps36_demo_initialized_v5"
};

// In-memory fallback if window / localStorage is not available (e.g. during SSR)
const memoryStore = new Map<string, string>();

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function getItem<T>(key: string, defaultValue: T): T {
  try {
    if (isBrowser()) {
      const stored = window.localStorage.getItem(key);
      if (stored !== null) {
        return JSON.parse(stored) as T;
      }
    } else {
      const mem = memoryStore.get(key);
      if (mem !== undefined) {
        return JSON.parse(mem) as T;
      }
    }
  } catch (err) {
    console.warn(`[storageService] Error reading key "${key}":`, err);
  }
  return defaultValue;
}

function setItem<T>(key: string, value: T): void {
  try {
    const serialized = JSON.stringify(value);
    if (isBrowser()) {
      window.localStorage.setItem(key, serialized);
    } else {
      memoryStore.set(key, serialized);
    }
  } catch (err) {
    console.warn(`[storageService] Error writing key "${key}":`, err);
  }
}

// Global broadcast channel instance for cross-tab messaging
let demoBroadcastChannel: BroadcastChannel | null = null;
if (typeof window !== "undefined" && typeof window.BroadcastChannel !== "undefined") {
  try {
    demoBroadcastChannel = new BroadcastChannel("ps36_demo_channel");
  } catch (e) {
    console.warn("[storageService] BroadcastChannel not supported, falling back to storage events.");
  }
}

function emitCrossTabUpdate(entity: string): void {
  if (!isBrowser()) return;

  const payload = {
    type: "PS36_DEMO_SYNC",
    entity,
    timestamp: Date.now()
  };

  // 1. BroadcastChannel (immediate)
  if (demoBroadcastChannel) {
    try {
      demoBroadcastChannel.postMessage(payload);
    } catch (e) {
      // ignore
    }
  }

  // 2. Storage event fallback (survives tab boundary)
  try {
    window.localStorage.setItem(STORAGE_KEYS.SYNC_PING, JSON.stringify(payload));
  } catch (e) {
    // ignore
  }
}

/**
 * Baseline creation ensuring:
 * - Deterministic primary demo application LM-2026-00124 (Aryan, Supermarket, Nagpur)
 * - Deterministic primary instrument EWI-DEMO-001 (Electronic Weighing Instrument)
 * - Deterministic 4 role demo accounts: trader.demo@example.com, admin.demo@example.com, lmo.demo@example.com, gatc.demo@example.com
 * - Backward compatibility with existing user-owner-1, W-104, APP-26036-0148
 */
function createBaselineState() {
  const users: UserProfile[] = [
    {
      id: "user-owner-demo",
      name: "Aryan",
      email: "trader.demo@example.com",
      mobile: "9820011223",
      role: "OWNER",
      avatarInitials: "AR",
      organization: "Supermarket",
      address: "YCC Wanadongri, Nagpur",
      city: "Nagpur",
      district: "Nagpur",
      state: "Maharashtra",
      status: "Active"
    },
    {
      id: "user-admin-demo",
      name: "Demo Admin",
      email: "admin.demo@example.com",
      mobile: "9800000001",
      role: "ADMIN",
      avatarInitials: "DA",
      designation: "Legal Metrology Administrator",
      organization: "Department of Consumer Affairs, Government of India",
      status: "Active"
    },
    {
      id: "user-lmo-demo",
      name: "Demo LMO Officer",
      email: "lmo.demo@example.com",
      mobile: "9810012345",
      role: "LMO",
      avatarInitials: "DL",
      designation: "Legal Metrology Officer",
      zone: "Maharashtra Nagpur Zone",
      organization: "Nagpur Legal Metrology Inspection Division",
      status: "Active"
    },
    {
      id: "user-gatc-demo",
      name: "Demo GATC Officer",
      email: "gatc.demo@example.com",
      mobile: "9811122233",
      role: "GATC",
      avatarInitials: "DG",
      designation: "Senior Verification Scientist",
      organization: "GATC Standards & Calibration Testing Center",
      zone: "Maharashtra Nagpur Zone",
      status: "Active"
    },
    // Retain initial legacy mock users
    ...(initialUsers as UserProfile[]).map((u) => ({ ...u }))
  ];

  const activeUser: UserProfile = users[0]; // Default active: Demo Trader

  const instruments: Instrument[] = [
    {
      id: "EWI-DEMO-001",
      name: "Electronic Weighing Instrument",
      category: "Electronic Scales",
      manufacturer: "National Weigh Systems",
      model: "NWS-300",
      serialNumber: "EWI-DEMO-001",
      capacity: "300 kg",
      yearOfManufacture: 2024,
      location: "Supermarket, YCC Wanadongri, Nagpur",
      ownerId: "user-owner-demo",
      ownerName: "Aryan",
      establishmentName: "Supermarket",
      currentStatus: "Expiring",
      certificateExpiryDate: "2025-06-30",
      daysUntilExpiry: 15,
      activeApplicationId: "LM-2026-00124",
      activeCertificateId: undefined
    },
    ...(initialInstruments as Instrument[]).map((i) => {
      if (i.id === "W-104") {
        return {
          ...i,
          currentStatus: "Expiring" as const,
          activeApplicationId: "APP-26036-0148",
          activeCertificateId: undefined
        };
      }
      return { ...i };
    })
  ];

  const applications: Application[] = [
    {
      id: "LM-2026-00124",
      instrumentId: "EWI-DEMO-001",
      instrumentName: "Electronic Weighing Instrument",
      instrumentCategory: "Electronic Scales",
      ownerId: "user-owner-demo",
      ownerName: "Aryan",
      ownerContact: "9820011223",
      status: "DRAFT",
      priority: "High",
      zone: "Maharashtra Nagpur Zone",
      location: "Supermarket, YCC Wanadongri, Nagpur",
      scheduledDateTime: undefined,
      assignedOfficer: undefined,
      assignedLab: undefined,
      submittedDate: "12 Jun 2025",
      lastUpdated: "12 Jun 2025",
      certificateId: undefined,
      timeline: [
        { stepNumber: 1, label: "DRAFT", date: "12 Jun", isCompleted: true, isCurrent: true },
        { stepNumber: 2, label: "SUBMITTED", date: "Upcoming", isCompleted: false },
        { stepNumber: 3, label: "ADMIN_REVIEW", date: "Upcoming", isCompleted: false },
        { stepNumber: 4, label: "ASSIGNED", date: "Upcoming", isCompleted: false },
        { stepNumber: 5, label: "FIELD_VERIFICATION", date: "Upcoming", isCompleted: false },
        { stepNumber: 6, label: "FIELD_VERIFIED", date: "Upcoming", isCompleted: false },
        { stepNumber: 7, label: "GATC_REVIEW", date: "Upcoming", isCompleted: false },
        { stepNumber: 8, label: "APPROVED", date: "Upcoming", isCompleted: false },
        { stepNumber: 9, label: "CERTIFICATE_ISSUED", date: "Upcoming", isCompleted: false }
      ],
      attachments: [
        {
          id: "att-demo-1",
          title: "GST & Shop Act Registration.pdf",
          fileSize: "1.1 MB",
          fileType: "pdf",
          downloadUrl: "#"
        },
        {
          id: "att-demo-2",
          title: "Previous Calibration & Purchase Invoice.pdf",
          fileSize: "850 KB",
          fileType: "pdf",
          downloadUrl: "#"
        }
      ]
    },
    ...(initialApplications as Application[]).map((a) => {
      if (a.id === "APP-26036-0148") {
        return {
          ...a,
          status: "Verification In Progress" as const,
          certificateId: undefined,
          timeline: [
            { stepNumber: 1, label: "Draft", date: "08 Jun", isCompleted: true },
            { stepNumber: 2, label: "Submitted", date: "08 Jun", isCompleted: true },
            { stepNumber: 3, label: "Under Review", date: "09 Jun", isCompleted: true },
            { stepNumber: 4, label: "Scheduled", date: "10 Jun", isCompleted: true },
            { stepNumber: 5, label: "Verification In Progress", date: "12 Jun", isCompleted: true, isCurrent: true },
            { stepNumber: 6, label: "Result Submitted", date: "Upcoming", isCompleted: false },
            { stepNumber: 7, label: "Certificate Generated", date: "Upcoming", isCompleted: false },
            { stepNumber: 8, label: "Completed", date: "Upcoming", isCompleted: false }
          ] as TimelineStep[],
          attachments: a.attachments ? a.attachments.map((att) => ({ ...att })) : []
        };
      }
      return {
        ...a,
        timeline: a.timeline.map((t) => ({ ...t })),
        attachments: a.attachments ? a.attachments.map((att) => ({ ...att })) : []
      };
    })
  ];

  // No certificate for LM-2026-00124 or APP-26036-0148 before approval
  const certificates: Certificate[] = (initialCertificates as Certificate[])
    .filter((c) => c.applicationId !== "APP-26036-0148" && c.applicationId !== "LM-2026-00124")
    .map((c) => ({ ...c }));

  const notifications: NotificationItem[] = [
    {
      id: "notif-demo-1",
      title: "Welcome to e-Tarazu Portal",
      message: "Your primary demonstration instrument (EWI-DEMO-001) is ready for verification submission.",
      date: "Today",
      read: false,
      type: "info",
      link: "/owner/re-verify/EWI-DEMO-001"
    },
    ...(initialNotifications as NotificationItem[]).map((n) => ({ ...n }))
  ];

  const verificationResults: VerificationObservation[] = (initialResults as VerificationObservation[]).map((r) => ({
    ...r,
    evidenceFiles: r.evidenceFiles.map((f) => ({ ...f }))
  }));

  const auditEvents: AuditEvent[] = [
    {
      id: "audit-001",
      applicationId: "LM-2026-00124",
      timestamp: "12 Jun 2025, 09:00 IST",
      role: "OWNER",
      actor: "Aryan",
      eventType: "APPLICATION_SUBMITTED",
      details: "Draft application initialized for Electronic Weighing Instrument (EWI-DEMO-001)."
    }
  ];

  return {
    users,
    activeUser,
    instruments,
    applications,
    certificates,
    notifications,
    verificationResults,
    auditEvents
  };
}

export const storageService = {
  /**
   * Initializes demo storage from mock datasets if not yet populated
   */
  ensureInitialized(): void {
    const isInitialized = getItem<boolean>(STORAGE_KEYS.INITIALIZED, false);
    if (!isInitialized) {
      this.resetDemoState();
    }
  },

  /**
   * Restores complete deterministic demo state
   */
  resetDemoState(): void {
    const baseline = createBaselineState();

    setItem(STORAGE_KEYS.USERS, baseline.users);
    setItem(STORAGE_KEYS.ACTIVE_USER, baseline.activeUser);
    setItem(STORAGE_KEYS.INSTRUMENTS, baseline.instruments);
    setItem(STORAGE_KEYS.APPLICATIONS, baseline.applications);
    setItem(STORAGE_KEYS.CERTIFICATES, baseline.certificates);
    setItem(STORAGE_KEYS.NOTIFICATIONS, baseline.notifications);
    setItem(STORAGE_KEYS.VERIFICATION_RESULTS, baseline.verificationResults);
    setItem(STORAGE_KEYS.AUDIT_EVENTS, baseline.auditEvents);
    setItem(STORAGE_KEYS.STICKER_CONFIRMATIONS, []);

    // Sequence counters for deterministic ID generation
    setItem(STORAGE_KEYS.SEQ_APP, 153);
    setItem(STORAGE_KEYS.SEQ_CERT, 983);
    setItem(STORAGE_KEYS.SEQ_NOTIF, 5);
    setItem(STORAGE_KEYS.SEQ_USER, 5);
    setItem(STORAGE_KEYS.SEQ_INST, 108);
    setItem(STORAGE_KEYS.SEQ_STICKER, 1);

    setItem(STORAGE_KEYS.INITIALIZED, true);

    emitCrossTabUpdate("RESET");
  },

  // --- Cross-Tab Real-time Synchronization Subscription ---
  subscribeToDemoUpdates(callback: (payload?: any) => void): () => void {
    if (!isBrowser()) return () => {};

    const handleMessage = (event: MessageEvent) => {
      if (event?.data?.type === "PS36_DEMO_SYNC") {
        callback(event.data);
      }
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEYS.SYNC_PING && event.newValue) {
        try {
          callback(JSON.parse(event.newValue));
        } catch {
          callback();
        }
      }
    };

    if (demoBroadcastChannel) {
      demoBroadcastChannel.addEventListener("message", handleMessage);
    }
    window.addEventListener("storage", handleStorage);

    return () => {
      if (demoBroadcastChannel) {
        demoBroadcastChannel.removeEventListener("message", handleMessage);
      }
      window.removeEventListener("storage", handleStorage);
    };
  },

  notifyChange(entity: string): void {
    emitCrossTabUpdate(entity);
  },

  // --- Users ---
  getUsers(): UserProfile[] {
    this.ensureInitialized();
    return getItem<UserProfile[]>(STORAGE_KEYS.USERS, []);
  },
  saveUsers(users: UserProfile[]): void {
    setItem(STORAGE_KEYS.USERS, users);
    emitCrossTabUpdate("USERS");
  },
  getNextUserId(): string {
    const currentSeq = getItem<number>(STORAGE_KEYS.SEQ_USER, 5);
    const nextSeq = currentSeq + 1;
    setItem(STORAGE_KEYS.SEQ_USER, nextSeq);
    return `user-owner-${currentSeq}`;
  },
  getActiveUser(): UserProfile {
    this.ensureInitialized();
    const users = this.getUsers();
    return getItem<UserProfile>(STORAGE_KEYS.ACTIVE_USER, users[0]);
  },
  saveActiveUser(user: UserProfile): void {
    setItem(STORAGE_KEYS.ACTIVE_USER, user);
    emitCrossTabUpdate("ACTIVE_USER");
  },

  // --- Instruments ---
  getInstruments(): Instrument[] {
    this.ensureInitialized();
    return getItem<Instrument[]>(STORAGE_KEYS.INSTRUMENTS, []);
  },
  saveInstruments(instruments: Instrument[]): void {
    setItem(STORAGE_KEYS.INSTRUMENTS, instruments);
    emitCrossTabUpdate("INSTRUMENTS");
  },
  getNextInstrumentId(): string {
    const currentSeq = getItem<number>(STORAGE_KEYS.SEQ_INST, 108);
    const nextSeq = currentSeq + 1;
    setItem(STORAGE_KEYS.SEQ_INST, nextSeq);
    return `W-${currentSeq}`;
  },

  // --- Applications ---
  getApplications(): Application[] {
    this.ensureInitialized();
    return getItem<Application[]>(STORAGE_KEYS.APPLICATIONS, []);
  },
  saveApplications(applications: Application[]): void {
    setItem(STORAGE_KEYS.APPLICATIONS, applications);
    emitCrossTabUpdate("APPLICATIONS");
  },
  getNextApplicationId(): string {
    const currentSeq = getItem<number>(STORAGE_KEYS.SEQ_APP, 153);
    const nextSeq = currentSeq + 1;
    setItem(STORAGE_KEYS.SEQ_APP, nextSeq);
    return `LM-2026-${String(currentSeq).padStart(5, "0")}`;
  },

  // --- Certificates ---
  getCertificates(): Certificate[] {
    this.ensureInitialized();
    return getItem<Certificate[]>(STORAGE_KEYS.CERTIFICATES, []);
  },
  saveCertificates(certificates: Certificate[]): void {
    setItem(STORAGE_KEYS.CERTIFICATES, certificates);
    emitCrossTabUpdate("CERTIFICATES");
  },
  getNextCertificateId(): string {
    const currentSeq = getItem<number>(STORAGE_KEYS.SEQ_CERT, 983);
    const nextSeq = currentSeq + 1;
    setItem(STORAGE_KEYS.SEQ_CERT, nextSeq);
    return `CERT-LM-2026-${String(currentSeq).padStart(5, "0")}`;
  },

  // --- Verification Results ---
  getVerificationResults(): VerificationObservation[] {
    this.ensureInitialized();
    return getItem<VerificationObservation[]>(STORAGE_KEYS.VERIFICATION_RESULTS, []);
  },
  saveVerificationResults(results: VerificationObservation[]): void {
    setItem(STORAGE_KEYS.VERIFICATION_RESULTS, results);
    emitCrossTabUpdate("VERIFICATION_RESULTS");
  },

  // --- Notifications ---
  getNotifications(): NotificationItem[] {
    this.ensureInitialized();
    return getItem<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, []);
  },
  saveNotifications(notifications: NotificationItem[]): void {
    setItem(STORAGE_KEYS.NOTIFICATIONS, notifications);
    emitCrossTabUpdate("NOTIFICATIONS");
  },
  getNextNotificationId(): string {
    const currentSeq = getItem<number>(STORAGE_KEYS.SEQ_NOTIF, 5);
    const nextSeq = currentSeq + 1;
    setItem(STORAGE_KEYS.SEQ_NOTIF, nextSeq);
    return `notif-${currentSeq}`;
  },

  // --- Audit Trail ---
  getAuditEvents(applicationId?: string): AuditEvent[] {
    this.ensureInitialized();
    const list = getItem<AuditEvent[]>(STORAGE_KEYS.AUDIT_EVENTS, []);
    if (applicationId) {
      return list.filter((e) => e.applicationId === applicationId);
    }
    return list;
  },
  saveAuditEvents(events: AuditEvent[]): void {
    setItem(STORAGE_KEYS.AUDIT_EVENTS, events);
    emitCrossTabUpdate("AUDIT_EVENTS");
  },
  addAuditEvent(event: Omit<AuditEvent, "id" | "timestamp">): AuditEvent {
    const list = this.getAuditEvents();
    const newEvent: AuditEvent = {
      ...event,
      id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZoneName: "short"
      })
    };
    list.unshift(newEvent);
    this.saveAuditEvents(list);
    return newEvent;
  },

  // --- Language Preference ---
  getLanguage(): SupportedLanguage {
    return getItem<SupportedLanguage>(STORAGE_KEYS.LANGUAGE, "en");
  },
  saveLanguage(language: SupportedLanguage): void {
    setItem(STORAGE_KEYS.LANGUAGE, language);
  },

  // --- QR Sticker Confirmations ---
  getStickerConfirmations(): QRStickerConfirmation[] {
    this.ensureInitialized();
    return getItem<QRStickerConfirmation[]>(STORAGE_KEYS.STICKER_CONFIRMATIONS, []);
  },
  saveStickerConfirmations(items: QRStickerConfirmation[]): void {
    setItem(STORAGE_KEYS.STICKER_CONFIRMATIONS, items);
    emitCrossTabUpdate("STICKER_CONFIRMATIONS");
  },
  getNextStickerConfirmationId(): string {
    const currentSeq = getItem<number>(STORAGE_KEYS.SEQ_STICKER, 1);
    const nextSeq = currentSeq + 1;
    setItem(STORAGE_KEYS.SEQ_STICKER, nextSeq);
    return `STK-2025-${String(currentSeq).padStart(3, "0")}`;
  }
};
