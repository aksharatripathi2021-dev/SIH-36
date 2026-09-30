import { UserProfile } from "../types";
import { storageService } from "./storageService";

export interface TraderRegistrationPayload {
  fullName: string;
  establishmentName: string;
  mobile: string;
  email: string;
  address: string;
  city: string;
  district: string;
  state: string;
  preferredLanguage?: string;
  identityDocumentRef?: string;
  taxIdentifier?: string;
  supportingDocumentNote?: string;
}

export const registrationService = {
  /**
   * Validate trader registration fields
   */
  validateTraderRegistration(payload: TraderRegistrationPayload): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!payload.fullName?.trim()) {
      errors.push("Proprietor / Responsible Person Full Name is required.");
    }
    if (!payload.establishmentName?.trim()) {
      errors.push("Establishment / Business Name is required.");
    }
    if (!payload.mobile?.trim() || !/^\d{10}$/.test(payload.mobile.trim())) {
      errors.push("Valid 10-digit mobile number is required.");
    }
    if (!payload.email?.trim() || !/\S+@\S+\.\S+/.test(payload.email.trim())) {
      errors.push("Valid email address is required.");
    }
    if (!payload.address?.trim()) {
      errors.push("Establishment premises address is required.");
    }
    if (!payload.state?.trim()) {
      errors.push("State is required.");
    }
    if (!payload.district?.trim()) {
      errors.push("District is required.");
    }

    return {
      valid: errors.length === 0,
      errors
    };
  },

  /**
   * Register a new Trader/Owner in demo storage (with deterministic ID)
   */
  async registerTrader(payload: TraderRegistrationPayload): Promise<UserProfile> {
    const validation = this.validateTraderRegistration(payload);
    if (!validation.valid) {
      throw new Error(validation.errors.join(" "));
    }

    const users = storageService.getUsers();

    // Check duplicate mobile or email
    const existing = users.find(
      (u) =>
        u.mobile === payload.mobile.trim() ||
        u.email.toLowerCase() === payload.email.trim().toLowerCase()
    );
    if (existing) {
      throw new Error("An account with this mobile number or email already exists. Please sign in.");
    }

    const nextId = storageService.getNextUserId();
    const initials = payload.fullName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();

    const newUser: UserProfile = {
      id: nextId,
      name: payload.fullName.trim(),
      email: payload.email.trim().toLowerCase(),
      mobile: payload.mobile.trim(),
      role: "OWNER",
      avatarInitials: initials || "TR",
      organization: payload.establishmentName.trim(),
      address: payload.address.trim(),
      city: payload.city.trim() || "Delhi",
      district: payload.district.trim(),
      state: payload.state.trim(),
      preferredLanguage: payload.preferredLanguage || "English",
      status: "Active",
      identityDocumentRef: payload.identityDocumentRef?.trim() || undefined,
      taxIdentifier: payload.taxIdentifier?.trim() || undefined,
      supportingDocumentNote: payload.supportingDocumentNote?.trim() || undefined
    };

    users.push(newUser);
    storageService.saveUsers(users);
    return newUser;
  },

  /**
   * Get trader profile by userId
   */
  async getTraderProfile(userId: string): Promise<UserProfile | null> {
    const users = storageService.getUsers();
    const user = users.find((u) => u.id === userId && u.role === "OWNER");
    return user ? { ...user } : null;
  },

  /**
   * Update an existing trader profile
   */
  async updateTraderProfile(
    userId: string,
    updates: Partial<UserProfile>
  ): Promise<UserProfile> {
    const users = storageService.getUsers();
    const index = users.findIndex((u) => u.id === userId);
    if (index === -1) {
      throw new Error(`User with ID ${userId} not found.`);
    }

    const current = users[index];
    const updated: UserProfile = {
      ...current,
      ...updates,
      // Protect immutable fields
      id: current.id,
      role: "OWNER"
    };

    users[index] = updated;
    storageService.saveUsers(users);

    // If active user is updated, update active user session as well
    const active = storageService.getActiveUser();
    if (active.id === userId) {
      storageService.saveActiveUser(updated);
    }

    return { ...updated };
  }
};
