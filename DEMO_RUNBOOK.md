# SIH PS36 Legal Metrology — 4-Portal Interconnected Demonstration Runbook

## 1. Demonstration Overview
This system is an end-to-end, deterministic demonstration prototype for the SIH PS36 Legal Metrology verification and certification system.

Four distinct roles operate as synchronized views over **ONE shared application workflow**:
$$\text{TRADER (Submit)} \longrightarrow \text{ADMIN (Review \& Assign)} \longrightarrow \text{LMO (Field Verification)} \longrightarrow \text{GATC (Review \& Approve)} \longrightarrow \text{CERTIFICATE + QR (Public Verification)}$$

---

## 2. Deterministic Primary Demonstration Record
The entire primary demonstration sequence is built around one deterministic record:
- **Application ID**: `LM-2026-00124`
- **Trader**: Demo Trader (`trader.demo@example.com`)
- **Business**: Demo Weighing Solutions, Central Avenue, Nagpur, Maharashtra
- **Instrument**: Electronic Weighing Instrument (Model: `NWS-300`, Capacity: `300 kg`)
- **Instrument ID / Serial**: `EWI-DEMO-001`
- **Admin**: Demo Admin (`admin.demo@example.com`)
- **LMO Officer**: Demo LMO Officer (`lmo.demo@example.com`)
- **GATC Officer**: Demo GATC Officer (`gatc.demo@example.com`)
- **Generated Certificate ID**: `CERT-LM-2026-00124`

---

## 3. Demo Credentials & Portal Routes

| Role | Portal URL | Demo Email | Password | Quick Login Feature |
| :--- | :--- | :--- | :--- | :--- |
| **Trader / Owner** | `http://localhost:3000/owner/dashboard` | `trader.demo@example.com` | `Demo@123` | Click **[Use Demo Account]** on `/login` (Trader tab) |
| **Admin** | `http://localhost:3000/admin/applications` | `admin.demo@example.com` | `Demo@123` | Click **[Use Demo Account]** on `/login` (Admin tab) |
| **LMO Officer** | `http://localhost:3000/lmo/dashboard` | `lmo.demo@example.com` | `Demo@123` | Click **[Use Demo Account]** on `/login` (LMO tab) |
| **GATC Lab** | `http://localhost:3000/gatc/dashboard` | `gatc.demo@example.com` | `Demo@123` | Click **[Use Demo Account]** on `/login` (GATC tab) |
| **Public Verification**| `http://localhost:3000/verify/CERT-LM-2026-00124` | *No auth required* | *N/A* | Direct public access via URL or QR scan |

> [!TIP]
> Below each login form on `/login`, a clean **"Demo Login"** box is displayed with pre-filled credentials and a single **[Use Demo Account]** button for instant one-click authentication.

---

## 4. Multi-Tab Demonstration Setup (Recommended 4-Tab Layout)

Open four browser tabs side-by-side or sequentially:
- **TAB 1 — Trader**: `http://localhost:3000/login` $\to$ select "Instrument Owner" $\to$ click `[Use Demo Account]`.
- **TAB 2 — Admin**: `http://localhost:3000/login` $\to$ select "Ministry Admin" $\to$ click `[Use Demo Account]`.
- **TAB 3 — LMO**: `http://localhost:3000/login` $\to$ select "Legal Metrology Officer" $\to$ click `[Use Demo Account]`.
- **TAB 4 — GATC**: `http://localhost:3000/login` $\to$ select "GATC Lab Officer" $\to$ click `[Use Demo Account]`.

Cross-tab updates synchronize **automatically in real-time** across all open tabs using the browser `BroadcastChannel` with `localStorage` storage events fallback.

---

## 5. End-to-End Demonstration Sequence

### STEP 1 — TRADER (Tab 1)
1. In Tab 1, navigate to **Applications** (`/owner/applications`) or open `LM-2026-00124` directly (`/owner/applications/LM-2026-00124`).
2. Notice the application is in **`DRAFT`** state.
3. Review the business details (**Demo Weighing Solutions**, Nagpur, Maharashtra) and device (**Electronic Weighing Instrument**, `EWI-DEMO-001`).
4. Click **"Submit Application for Verification →"**.
5. **Expected Outcome**:
   - Status transitions to **`SUBMITTED`**.
   - Notifications and audit trail event `APPLICATION_SUBMITTED` are recorded.
   - Central state broadcasts the change to all other tabs.

### STEP 2 — ADMIN (Tab 2)
1. Switch to Tab 2 (or open `/admin/applications`).
2. Application `LM-2026-00124` appears in the list with status **`SUBMITTED`**.
3. Click **"Review & Schedule →"** to open `/admin/applications/LM-2026-00124`.
4. Review trader, location, and device details.
5. In the **Schedule Inspection & Assign Officer** card:
   - Date & Time: `12 Jun 2025 at 10:00`
   - Select Officer: **Demo LMO Officer** (`Maharashtra Nagpur Zone`)
6. Click **"Assign Officer & Schedule Inspection"**.
7. **Expected Outcome**:
   - Status transitions to **`ASSIGNED`**.
   - Audit trail records `LMO_ASSIGNED`.
   - Banner confirms: *"Application scheduled for field verification with Demo LMO Officer."*

### STEP 3 — LMO OFFICER (Tab 3)
1. Switch to Tab 3 (or open `/lmo/dashboard`).
2. Under **Urgent Verification Queue**, application `LM-2026-00124` is displayed with status **`ASSIGNED`**.
3. Click **"Verify Application →"** to enter the field verification form (`/lmo/applications/LM-2026-00124/verify`).
4. Inspect observations:
   - Standard: `OIML R76-1`
   - Reference Weights: `20 kg / 50 kg / 100 kg`
   - Zero Error: `0.00 kg`, Repeatability: `+0.02%`, Eccentricity: `+0.01%`
   - Physical Condition: `Good`, Seals: `Intact`
   - MPE Rule Engine: Evaluates load points as **WITHIN_MPE** ($\le \pm 0.05\%$)
   - AI Advisory: **LOW RISK** (Clean calibration pattern)
5. Select Overall Result: **`Pass`**.
6. Click **"Submit Final Verification Decision"**.
7. **Expected Outcome**:
   - Status transitions to **`FIELD_VERIFIED`**.
   - Inspection report is logged into central storage and queued for GATC technical clearance.
   - Audit trail records `INSPECTION_SUBMITTED`.

### STEP 4 — GATC LAB OFFICER (Tab 4)
1. Switch to Tab 4 (or open `/gatc/dashboard` or `/gatc/assigned`).
2. Notice `LM-2026-00124` is listed under Assigned Applications / Calibration Queue with status **`FIELD_VERIFIED`**.
3. Click **"Review & Approve →"** to open `/gatc/applications/LM-2026-00124`.
4. Review LMO field observations, error measurements, and physical inspection checklist.
5. In the **GATC Laboratory Decision** card, add optional review notes and click:
   **"Approve & Issue Certificate"**.
6. **Expected Outcome**:
   - Status transitions to **`APPROVED`** $\to$ **`CERTIFICATE_ISSUED`**.
   - Digital certificate **`CERT-LM-2026-00124`** is deterministically generated.
   - Tamper-evident QR code is signed and activated for public verification.
   - Audit trail records `GATC_REVIEWED`, `APPLICATION_APPROVED`, and `CERTIFICATE_ISSUED`.

### STEP 5 — TRADER (Return to Tab 1)
1. Return to Tab 1 (`/owner/applications/LM-2026-00124`).
2. Without a manual code change, the page shows the updated state:
   - Status: **`CERTIFICATE_ISSUED`**.
   - Banner: **"Digital Verification Certificate #CERT-LM-2026-00124"**.
   - Action links: **"Verify Certificate Details (Public QR)"** and **"Direct /verify URL"**.
3. Click either link or visit `/owner/certificates` to see the certificate repository.

### STEP 6 — PUBLIC CERTIFICATE & QR VERIFICATION
1. Open the public verification route:
   - Direct route: `http://localhost:3000/verify/CERT-LM-2026-00124`
   - Search route: `http://localhost:3000/verify-certificate?id=CERT-LM-2026-00124`
2. **Visible Public Information**:
   - Certificate ID: `CERT-LM-2026-00124`
   - Verification Status: **`VALID`** (Authentic Statutory Record)
   - Business Name: `Demo Weighing Solutions`
   - Instrument Description: `Electronic Weighing Instrument`
   - Instrument ID / Serial: `EWI-DEMO-001`
   - Application ID: `LM-2026-00124`
   - Verification Date: `12 Jun 2025`
   - Valid Until: `11 Jun 2026`
   - Issuing Authority: `Legal Metrology Division, Department of Consumer Affairs`
   - Scannable QR code linking directly to the verification endpoint.
   - PDF Download and Print QR Sticker controls.
3. **Privacy Isolation Verification**:
   - Notice that internal officer passwords, authentication tokens, internal logs, and private developer internals are strictly excluded from the public verification payload.

---

## 6. How Application State Changes (State Machine)

```
[DRAFT]
   │  Trader submits
   ▼
[SUBMITTED]
   │  Admin reviews
   ▼
[ADMIN_REVIEW]
   │  Admin assigns LMO & schedules
   ▼
[ASSIGNED]
   │  LMO begins inspection
   ▼
[FIELD_VERIFICATION]
   │  LMO submits report (Pass)
   ▼
[FIELD_VERIFIED]
   │  GATC reviews technical data
   ▼
[GATC_REVIEW]
   │  GATC approves
   ▼
[APPROVED]
   │  System generates cert & QR
   ▼
[CERTIFICATE_ISSUED]
```

---

## 7. How to Reset Demo Data
To restore the prototype back to its initial baseline:
1. **Via UI**: In any authenticated portal header, click the **"🔄 Reset Demo"** button on the top navigation bar. Confirm the prompt to restore initial state and reload.
2. **Via Browser Console**:
   ```javascript
   localStorage.clear();
   location.reload();
   ```
3. **What is Restored**:
   - `LM-2026-00124` reverts to `DRAFT` status.
   - `EWI-DEMO-001` reverts to `Expiring` status.
   - All certificates for `LM-2026-00124` are wiped.
   - Demo user accounts, initial notifications, and baseline audit events are reseeded.

---

## 8. Verification of Registration State / District Fix
1. Open `http://localhost:3000/register`.
2. Scroll to the **State & District Selection** section.
3. Test **Maharashtra**:
   - Select `Maharashtra` in the State dropdown.
   - Verify that the District dropdown displays **Nagpur, Mumbai City, Mumbai Suburban, Pune, Nashik, Thane, Aurangabad, etc.**
   - Confirm **Delhi regions DO NOT appear**.
4. Test **Delhi**:
   - Select `Delhi`.
   - Verify that New Delhi, Central Delhi, North Delhi, South Delhi, etc. appear.
5. Test other states: **Karnataka** (Bengaluru), **Gujarat** (Ahmedabad), **Tamil Nadu** (Chennai), **Telangana** (Hyderabad). All 28 States and 8 UTs are fully populated.

---

## 9. Troubleshooting & FAQ
- **Q: Changes made in Tab 1 do not show in Tab 2?**
  - **A**: Ensure both tabs are open under the same origin (`http://localhost:3000`). If browser privacy settings block `BroadcastChannel`, simply refresh Tab 2; state is backed by `localStorage` and persists across reloads.
- **Q: How to test on mobile viewport?**
  - **A**: Press `F12` and toggle device toolbar (iPhone/Pixel/iPad). All responsive cards, tables with horizontal overflow, collapsable sidebars, and QR displays retain mobile responsiveness.
