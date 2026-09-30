import {
  MinistryDashboardMetrics,
  LmoDashboardMetrics,
  OwnerDashboardMetrics,
  GatcWorkspaceMetrics
} from "../types";
import initialMetrics from "../data/mock/dashboardMetrics.json";
import { instrumentService } from "./instrumentService";
import { applicationService } from "./applicationService";

// In-memory dashboard metrics state
let metricsState = JSON.parse(JSON.stringify(initialMetrics));

export const dashboardService = {
  /**
   * Get high-level ministry monitoring dashboard metrics
   */
  async getMinistryMetrics(): Promise<MinistryDashboardMetrics> {
    const instruments = await instrumentService.getInstruments();
    const apps = await applicationService.getApplications();
    const certificates = await (await import("./certificateService")).certificateService.getAllCertificates();
    const expiring = await instrumentService.getExpiringInstruments();

    const registeredInstruments = instruments.length > 0 ? instruments.length : metricsState.ministry.registeredInstruments;
    const activeApplications = apps.filter((a) => a.status !== "Completed").length || metricsState.ministry.activeApplications;
    const validCertificates = certificates.filter((c) => c.status === "VALID").length || metricsState.ministry.validCertificates;
    const expiringIn30Days = expiring.length || metricsState.ministry.expiringIn30Days;

    return {
      ...metricsState.ministry,
      registeredInstruments,
      activeApplications,
      validCertificates,
      expiringIn30Days
    };
  },

  /**
   * Get LMO officer dashboard metrics
   */
  async getLmoMetrics(officerId?: string): Promise<LmoDashboardMetrics> {
    // Dynamic calculation from application service state
    const apps = await applicationService.getApplications({ officerId });
    const pendingReview = apps.filter((a) => a.status === "Under Review" || a.status === "Submitted").length;
    const inProgress = apps.filter((a) => a.status === "Verification In Progress").length;

    return {
      ...metricsState.lmo,
      pendingReviewCount: pendingReview || metricsState.lmo.pendingReviewCount,
      verificationInProgressCount: inProgress || metricsState.lmo.verificationInProgressCount
    };
  },

  /**
   * Get Owner dashboard metrics (4 counters + alert)
   */
  async getOwnerMetrics(ownerId: string = "user-owner-1"): Promise<OwnerDashboardMetrics> {
    const instruments = await instrumentService.getInstrumentsByOwner(ownerId);
    const expiring = await instrumentService.getExpiringInstruments(ownerId);
    const apps = await applicationService.getApplications({ ownerId });

    const totalInstruments = instruments.length || metricsState.owner.totalInstruments;
    const verifiedCount = instruments.filter((i) => i.currentStatus === "Verified").length;
    const pendingCount = apps.filter((a) => a.status !== "Completed").length || metricsState.owner.pendingCount;
    const expiringCount = expiring.length || metricsState.owner.expiringCount;

    return {
      totalInstruments,
      verifiedCount,
      pendingCount,
      expiringCount,
      alertInstrumentId: expiring[0]?.id || metricsState.owner.alertInstrumentId,
      alertMessage: expiring[0]
        ? `${expiring[0].name} expires in ${expiring[0].daysUntilExpiry} days`
        : metricsState.owner.alertMessage
    };
  },

  /**
   * Get GATC laboratory testing center metrics
   */
  async getGatcMetrics(labId?: string): Promise<GatcWorkspaceMetrics> {
    return JSON.parse(JSON.stringify(metricsState.gatc));
  },

  /**
   * Reset in-memory state back to original mock JSON
   */
  async resetState(): Promise<void> {
    metricsState = JSON.parse(JSON.stringify(initialMetrics));
  }
};
