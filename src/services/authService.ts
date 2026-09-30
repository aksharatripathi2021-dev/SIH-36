import { UserProfile, UserRole } from "../types";
import { storageService } from "./storageService";

export const DEMO_ACCOUNTS = {
  owner: {
    email: "trader.demo@example.com",
    password: "Demo@123",
    role: "OWNER" as UserRole,
    portalRoute: "/owner/dashboard",
    name: "Aryan",
    label: "Trader / Instrument Owner",
    badge: "Supermarket"
  },
  admin: {
    email: "admin.demo@example.com",
    password: "Demo@123",
    role: "ADMIN" as UserRole,
    portalRoute: "/admin/dashboard",
    name: "Demo Admin",
    label: "Admin / Ministry",
    badge: "Department Administrator"
  },
  lmo: {
    email: "lmo.demo@example.com",
    password: "Demo@123",
    role: "LMO" as UserRole,
    portalRoute: "/lmo/dashboard",
    name: "Demo LMO Officer",
    label: "LMO Officer",
    badge: "Field Inspection Division"
  },
  gatc: {
    email: "gatc.demo@example.com",
    password: "Demo@123",
    role: "GATC" as UserRole,
    portalRoute: "/gatc/dashboard",
    name: "Demo GATC Officer",
    label: "GATC Lab",
    badge: "Standards & Calibration Lab"
  }
};

export const authService = {
  /**
   * Retrieve all users in the system
   */
  async getAllUsers(): Promise<UserProfile[]> {
    return storageService.getUsers();
  },

  /**
   * Find a user by ID
   */
  async getUserById(id: string): Promise<UserProfile | null> {
    const users = storageService.getUsers();
    const user = users.find((u) => u.id === id);
    return user ? { ...user } : null;
  },

  /**
   * Find a user by role
   */
  async getUserByRole(role: UserRole): Promise<UserProfile | null> {
    const users = storageService.getUsers();
    // Prioritize demo user for that role
    const demoUser = users.find((u) => u.role === role && u.id.includes("demo"));
    if (demoUser) return { ...demoUser };

    const user = users.find((u) => u.role === role);
    return user ? { ...user } : null;
  },

  /**
   * Authenticate a user by role or identifier (persisted in demo storage)
   */
  async login(identifier: string, role?: UserRole): Promise<UserProfile> {
    const users = storageService.getUsers();
    const trimmedId = identifier.trim().toLowerCase();

    // 1. Exact match on email or mobile
    let matchedUser = users.find(
      (u) =>
        u.email.toLowerCase() === trimmedId ||
        u.mobile === identifier.trim()
    );

    // 2. Fallback to role matching
    if (!matchedUser && role) {
      matchedUser = users.find((u) => u.role === role && u.id.includes("demo")) ||
                    users.find((u) => u.role === role);
    }

    if (!matchedUser) {
      matchedUser = users[0];
    }

    storageService.saveActiveUser(matchedUser);
    return { ...matchedUser };
  },

  /**
   * Explicitly set the active user session
   */
  async setActiveUser(user: UserProfile): Promise<void> {
    storageService.saveActiveUser(user);
  },

  /**
   * Switch the active role during demo walkthrough
   */
  async switchRole(role: UserRole): Promise<UserProfile> {
    const users = storageService.getUsers();
    const matched = users.find((u) => u.role === role && u.id.includes("demo")) ||
                    users.find((u) => u.role === role) ||
                    users[0];
    storageService.saveActiveUser(matched);
    return { ...matched };
  },

  /**
   * Get the current active user in session
   */
  async getCurrentUser(): Promise<UserProfile> {
    return storageService.getActiveUser();
  },

  /**
   * Logout current session
   */
  async logout(): Promise<void> {
    const users = storageService.getUsers();
    storageService.saveActiveUser(users[0]);
  },

  /**
   * Reset in-memory / persisted state
   */
  async resetState(): Promise<void> {
    storageService.resetDemoState();
  }
};
