import { Instrument, InstrumentStatus } from "../types";
import { storageService } from "./storageService";

export const instrumentService = {
  /**
   * Get all registered instruments
   */
  async getInstruments(): Promise<Instrument[]> {
    return storageService.getInstruments();
  },

  /**
   * Get a single instrument by its ID (e.g. "W-104")
   */
  async getInstrumentById(id: string): Promise<Instrument | null> {
    const list = storageService.getInstruments();
    const item = list.find((inst) => inst.id === id);
    return item ? { ...item } : null;
  },

  /**
   * Get instruments belonging to a specific owner
   */
  async getInstrumentsByOwner(ownerId: string): Promise<Instrument[]> {
    const list = storageService.getInstruments();
    return list
      .filter((inst) => inst.ownerId === ownerId)
      .map((inst) => ({ ...inst }));
  },

  /**
   * Get instruments approaching expiry (e.g. expiring in 30 days)
   */
  async getExpiringInstruments(ownerId?: string): Promise<Instrument[]> {
    const list = storageService.getInstruments();
    let expiring = list.filter((inst) => inst.currentStatus === "Expiring");
    if (ownerId) {
      expiring = expiring.filter((inst) => inst.ownerId === ownerId);
    }
    return expiring.map((inst) => ({ ...inst }));
  },

  /**
   * Mutate instrument status in demo storage (e.g. when re-verification is submitted)
   */
  async updateInstrumentStatus(id: string, status: InstrumentStatus): Promise<Instrument> {
    const list = storageService.getInstruments();
    const index = list.findIndex((inst) => inst.id === id);
    if (index === -1) {
      throw new Error(`Instrument with ID ${id} not found.`);
    }

    list[index] = {
      ...list[index],
      currentStatus: status
    };

    storageService.saveInstruments(list);
    return { ...list[index] };
  },

  /**
   * Register a new instrument under the authenticated Trader/Owner
   */
  async createInstrument(data: {
    name: string;
    category: string;
    manufacturer: string;
    model: string;
    serialNumber: string;
    capacity: string;
    yearOfManufacture?: number;
    verificationIntervalMonths?: number;
    location: string;
    ownerId: string;
    ownerName: string;
    establishmentName?: string;
  }): Promise<Instrument> {
    const list = storageService.getInstruments();

    // Check duplicate serial number within the same category/owner
    const existing = list.find(
      (i) =>
        i.serialNumber.trim().toUpperCase() === data.serialNumber.trim().toUpperCase() &&
        i.ownerId === data.ownerId
    );
    if (existing) {
      throw new Error(`An instrument with serial number ${data.serialNumber} is already registered to your account.`);
    }

    const nextId = storageService.getNextInstrumentId();
    const newInstrument: Instrument = {
      id: nextId,
      name: data.name.trim(),
      category: data.category,
      manufacturer: data.manufacturer.trim(),
      model: data.model.trim(),
      serialNumber: data.serialNumber.trim(),
      capacity: data.capacity.trim(),
      yearOfManufacture: data.yearOfManufacture || new Date().getFullYear(),
      verificationIntervalMonths: data.verificationIntervalMonths || 12,
      location: data.location.trim(),
      ownerId: data.ownerId,
      ownerName: data.ownerName,
      establishmentName: data.establishmentName || data.ownerName,
      currentStatus: "Pending",
      certificateExpiryDate: "Pending Initial Verification",
      daysUntilExpiry: 365
    };

    list.unshift(newInstrument);
    storageService.saveInstruments(list);
    return { ...newInstrument };
  },

  /**
   * Reset state back to original baseline
   */
  async resetState(): Promise<void> {
    storageService.resetDemoState();
  }
};
