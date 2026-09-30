import { UserProfile, UserRole } from "../types";
import { storageService } from "./storageService";

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
    const user = users.find((u) => u.role === role);
    return user ? { ...user } : null;
  },

  /**
   * Authenticate a user by role or identifier (persisted in demo storage)
   */
  async login(identifier: string, role?: UserRole): Promise<UserProfile> {
    const users = storageService.getUsers();
    let matchedUser = users.find(
      (u) =>
        u.email.toLowerCase() === identifier.trim().toLowerCase() ||
        u.mobile === identifier.trim()
    );

    if (!matchedUser && role) {
      matchedUser = users.find((u) => u.role === role);
    }

    if (!matchedUser) {
      // Fallback to role-specific user or first user
      matchedUser = users.find((u) => u.role === (role || "OWNER")) || users[0];
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
    const matched = users.find((u) => u.role === role) || users[0];
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
