import {
  Application,
  Certificate,
  Instrument,
  NotificationItem,
  QRStickerConfirmation,
  SupportedLanguage,
  UserProfile,
  VerificationObservation
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
  LANGUAGE: "ps36_demo_language",
  SEQ_APP: "ps36_demo_seq_app",
  SEQ_CERT: "ps36_demo_seq_cert",
  SEQ_NOTIF: "ps36_demo_seq_notif",
  SEQ_USER: "ps36_demo_seq_user",
  SEQ_INST: "ps36_demo_seq_inst",
  SEQ_STICKER: "ps36_demo_seq_sticker",
  INITIALIZED: "ps36_demo_initialized_v1"
};

// In-memory memory fallback if window / localStorage is not available (e.g. during SSR)
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

/**
 * Baseline creation ensuring Task 5 compliance:
 * - user-owner-1, user-lmo-1, user-gatc-1, user-admin-1
 * - W-104
 * - APP-26036-0148
 * - baseline notifications
 * - baseline application/instrument state
 * - NO certificate for APP-26036-0148 before a Pass event
 */
function createBaselineState() {
  const users: UserProfile[] = (initialUsers as UserProfile[]).map((u) => ({ ...u }));
  const activeUser: UserProfile = users[0]; // user-owner-1 (Rajesh Kumar)

  const instruments: Instrument[] = (initialInstruments as Instrument[]).map((i) => {
    if (i.id === "W-104") {
      return {
        ...i,
        currentStatus: "Expiring",
        activeApplicationId: "APP-26036-0148",
        activeCertificateId: undefined // No active certificate before Pass event
      };
    }
    return { ...i };
  });

  const applications: Application[] = (initialApplications as Application[]).map((a) => {
    if (a.id === "APP-26036-0148") {
      // Baseline before pass: Verification In Progress
      return {
        ...a,
        status: "Verification In Progress",
        certificateId: undefined, // No certificate before pass
        timeline: [
          { stepNumber: 1, label: "Draft", date: "08 Jun", isCompleted: true },
          { stepNumber: 2, label: "Submitted", date: "08 Jun", isCompleted: true },
          { stepNumber: 3, label: "Under Review", date: "09 Jun", isCompleted: true },
          { stepNumber: 4, label: "Scheduled", date: "10 Jun", isCompleted: true },
          { stepNumber: 5, label: "Verification In Progress", date: "12 Jun", isCompleted: true, isCurrent: true },
          { stepNumber: 6, label: "Result Submitted", date: "Upcoming", isCompleted: false },
          { stepNumber: 7, label: "Certificate Generated", date: "Upcoming", isCompleted: false },
          { stepNumber: 8, label: "Completed", date: "Upcoming", isCompleted: false }
        ],
        attachments: a.attachments ? a.attachments.map((att) => ({ ...att })) : []
      };
    }
    return {
      ...a,
      timeline: a.timeline.map((t) => ({ ...t })),
      attachments: a.attachments ? a.attachments.map((att) => ({ ...att })) : []
    };
  });

  // Filter out any certificate for APP-26036-0148 so NO certificate exists before Pass event
  const certificates: Certificate[] = (initialCertificates as Certificate[])
    .filter((c) => c.applicationId !== "APP-26036-0148")
    .map((c) => ({ ...c }));

  const notifications: NotificationItem[] = (initialNotifications as NotificationItem[]).map((n) => ({ ...n }));
  const verificationResults: VerificationObservation[] = (initialResults as VerificationObservation[]).map((r) => ({
    ...r,
    evidenceFiles: r.evidenceFiles.map((f) => ({ ...f }))
  }));

  return {
    users,
    activeUser,
    instruments,
    applications,
    certificates,
    notifications,
    verificationResults
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
   * Restores complete deterministic demo state as specified in Task 5
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
    setItem(STORAGE_KEYS.STICKER_CONFIRMATIONS, []);

    // Sequence counters for deterministic ID generation
    setItem(STORAGE_KEYS.SEQ_APP, 152);
    setItem(STORAGE_KEYS.SEQ_CERT, 982);
    setItem(STORAGE_KEYS.SEQ_NOTIF, 4);
    setItem(STORAGE_KEYS.SEQ_USER, 2);
    setItem(STORAGE_KEYS.SEQ_INST, 107);
    setItem(STORAGE_KEYS.SEQ_STICKER, 1);

    setItem(STORAGE_KEYS.INITIALIZED, true);
  },

  // --- Users ---
  getUsers(): UserProfile[] {
    this.ensureInitialized();
    return getItem<UserProfile[]>(STORAGE_KEYS.USERS, initialUsers as UserProfile[]);
  },
  saveUsers(users: UserProfile[]): void {
    setItem(STORAGE_KEYS.USERS, users);
  },
  getNextUserId(): string {
    const currentSeq = getItem<number>(STORAGE_KEYS.SEQ_USER, 2);
    const nextSeq = currentSeq + 1;
    setItem(STORAGE_KEYS.SEQ_USER, nextSeq);
    return `user-owner-${currentSeq}`;
  },
  getActiveUser(): UserProfile {
    this.ensureInitialized();
    const users = this.getUsers();
    return getItem<UserProfile>(STORAGE_KEYS.ACTIVE_USER, users[0] || initialUsers[0]);
  },
  saveActiveUser(user: UserProfile): void {
    setItem(STORAGE_KEYS.ACTIVE_USER, user);
  },

  // --- Instruments ---
  getInstruments(): Instrument[] {
    this.ensureInitialized();
    return getItem<Instrument[]>(STORAGE_KEYS.INSTRUMENTS, initialInstruments as Instrument[]);
  },
  saveInstruments(instruments: Instrument[]): void {
    setItem(STORAGE_KEYS.INSTRUMENTS, instruments);
  },
  getNextInstrumentId(): string {
    const currentSeq = getItem<number>(STORAGE_KEYS.SEQ_INST, 107);
    const nextSeq = currentSeq + 1;
    setItem(STORAGE_KEYS.SEQ_INST, nextSeq);
    return `W-${currentSeq}`;
  },

  // --- Applications ---
  getApplications(): Application[] {
    this.ensureInitialized();
    return getItem<Application[]>(STORAGE_KEYS.APPLICATIONS, initialApplications as Application[]);
  },
  saveApplications(applications: Application[]): void {
    setItem(STORAGE_KEYS.APPLICATIONS, applications);
  },
  getNextApplicationId(): string {
    const currentSeq = getItem<number>(STORAGE_KEYS.SEQ_APP, 152);
    const nextSeq = currentSeq + 1;
    setItem(STORAGE_KEYS.SEQ_APP, nextSeq);
    return `APP-26036-${String(currentSeq).padStart(4, "0")}`;
  },

  // --- Certificates ---
  getCertificates(): Certificate[] {
    this.ensureInitialized();
    return getItem<Certificate[]>(STORAGE_KEYS.CERTIFICATES, []);
  },
  saveCertificates(certificates: Certificate[]): void {
    setItem(STORAGE_KEYS.CERTIFICATES, certificates);
  },
  getNextCertificateId(): string {
    const currentSeq = getItem<number>(STORAGE_KEYS.SEQ_CERT, 982);
    const nextSeq = currentSeq + 1;
    setItem(STORAGE_KEYS.SEQ_CERT, nextSeq);
    return `CERT-2025-${String(currentSeq).padStart(5, "0")}`;
  },

  // --- Verification Results ---
  getVerificationResults(): VerificationObservation[] {
    this.ensureInitialized();
    return getItem<VerificationObservation[]>(STORAGE_KEYS.VERIFICATION_RESULTS, initialResults as VerificationObservation[]);
  },
  saveVerificationResults(results: VerificationObservation[]): void {
    setItem(STORAGE_KEYS.VERIFICATION_RESULTS, results);
  },

  // --- Notifications ---
  getNotifications(): NotificationItem[] {
    this.ensureInitialized();
    return getItem<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, initialNotifications as NotificationItem[]);
  },
  saveNotifications(notifications: NotificationItem[]): void {
    setItem(STORAGE_KEYS.NOTIFICATIONS, notifications);
  },
  getNextNotificationId(): string {
    const currentSeq = getItem<number>(STORAGE_KEYS.SEQ_NOTIF, 4);
    const nextSeq = currentSeq + 1;
    setItem(STORAGE_KEYS.SEQ_NOTIF, nextSeq);
    return `notif-${currentSeq}`;
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
  },
  getNextStickerConfirmationId(): string {
    const currentSeq = getItem<number>(STORAGE_KEYS.SEQ_STICKER, 1);
    const nextSeq = currentSeq + 1;
    setItem(STORAGE_KEYS.SEQ_STICKER, nextSeq);
    return `STK-2025-${String(currentSeq).padStart(3, "0")}`;
  }
};
