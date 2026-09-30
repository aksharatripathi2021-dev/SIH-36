# SIH PS36 Legal Metrology — 3-Minute Demonstration Runbook

## A. Demo Objective
Demonstrate the end-to-end Legal Metrology verification lifecycle under Ministry of Consumer Affairs guidelines:
$$\text{Legacy Paper Receipt} \longrightarrow \text{AI-Assisted Field Extraction} \longrightarrow \text{Trader Verification} \longrightarrow \text{Digital Application} \longrightarrow \text{LMO Field Verification} \longrightarrow \text{Dynamic MPE Rule Engine} \longrightarrow \text{AI Risk Advisory} \longrightarrow \text{Officer Authority Decision} \longrightarrow \text{Digital Verification Certificate} \longrightarrow \text{Public QR Verification} \longrightarrow \text{QR Sticker Confirmation} \longrightarrow \text{Digital Instrument Passport}$$

The system proves that AI tools accelerate data ingestion and provide decision-support risk heuristics without replacing statutory officer authority or violating data boundaries.

---

## B. Required Starting State
- **Storage State**: Reset to baseline seed state (no certificates issued yet for application `APP-26036-0148`; no pending sticker confirmations).
- **Active Dev Server**: `http://localhost:3000` running (`npm run dev`).
- **Browser Viewport**: Recommended $1920 \times 1080$ (Full HD) or $1366 \times 768$ desktop display.

---

## C. Demo Accounts
| Role | User ID | Name | Organization / Jurisdiction |
| :--- | :--- | :--- | :--- |
| **Trader / Device Owner** | `user-owner-1` | Rajesh Kumar | Bharat Mart Pvt Ltd (Karol Bagh, New Delhi) |
| **Legal Metrology Officer (LMO)** | `user-lmo-1` | Priya Sharma | Delhi South Zone (Senior Inspector) |

---

## D. Demo Reset Procedure
Before recording or presenting, execute the deterministic state reset via terminal:

```bash
# From repository root:
npx tsx -e "import { storageService } from './src/services/storageService'; storageService.resetDemoState(); console.log('Demo state successfully reset to baseline.');"
```

Or in browser console:
```javascript
// On any application page:
localStorage.clear();
location.reload();
```

---

## E. Target 3-Minute Scene-by-Scene Route Sequence

| Scene | Target Route | Role | Focus | Duration | Cumulative |
| :---: | :--- | :---: | :--- | :---: | :---: |
| **1** | `/owner/re-verify` | Trader | Problem / Offline Inspection Record | 10s | 0:10 |
| **2** | `/owner/re-verify` (Assistant Modal) | Trader | AI-Assisted Extraction & User Correction | 15s | 0:25 |
| **3** | `/owner/re-verify/W-104` | Trader | Pre-Populated Digital Application Submission | 10s | 0:35 |
| **4** | `/lmo/instruments/W-104` | LMO | Digital Instrument Passport & Historical Context | 15s | 0:50 |
| **5** | `/lmo/applications/APP-26036-0148/verify` | LMO | Verification Context & Observations Hierarchy | 25s | 1:15 |
| **6** | `/lmo/applications/APP-26036-0148/verify` | LMO | Prototype MPE Rule Evaluation (100 kg -> 100.02 kg) | 15s | 1:30 |
| **7** | `/lmo/applications/APP-26036-0148/verify` | LMO | Pattern-Based AI Advisory (LOW Risk Heuristic) | 15s | 1:45 |
| **8** | `/lmo/applications/APP-26036-0148/verify` | LMO | Final Verification Decision (Officer Authority) Pass | 10s | 1:55 |
| **9** | `/owner/certificates` | Trader | Digital Verification Certificate Repository | 15s | 2:10 |
| **10** | `/verify-certificate?id=CERT-2025-00981` | Public | Public QR Verification & Privacy Isolation | 10s | 2:20 |
| **11** | `/lmo/qr-confirmations` | Trader $\to$ LMO | Physical QR Sticker Evidence & Confirmation | 20s | 2:40 |
| **12** | `/lmo/instruments/W-104` | LMO / Trader | Complete Connected Digital Instrument Passport | 15s | 2:55 |
| **Total** | | | **Complete End-to-End Presentation** | **2m 55s** |

---

## F. Scene-by-Scene Script, Actions & Expected Results

### Scene 1: Problem / Legacy Record (~10s)
- **Route**: `http://localhost:3000/owner/re-verify`
- **Role**: Trader (`Rajesh Kumar`)
- **Action**:
  1. Click **"Reference Legacy Inspection Receipt"** button at the top of the re-verification page.
- **Narrative**: *"Millions of weighing scales across India have historical paper receipts with critical verification dates and serials that are tedious to transcribe manually."*
- **Visible Result**: The `AI-Assisted Legacy Inspection Receipt Assistant` modal opens, displaying the simulated offline paper certificate drawer.

### Scene 2: AI-Assisted Review & Correction (~15s)
- **Route**: Modal inside `/owner/re-verify`
- **Role**: Trader
- **Action**:
  1. Select **"Demo Receipt 001 — Delhi Legal Metrology Verification Receipt (2024)"**.
  2. Point out extracted fields: Serial `ES215-88421` (High Confidence, AI Suggested).
  3. Edit **Capacity** field from `300 kg` to `320 kg`.
  4. Note that badge changes to `USER_VERIFIED` (emerald badge).
  5. Click **"Confirm & Continue with Selected Instrument"**.
- **Narrative**: *"Our prototype extracts structured fields with confidence scores. The trader retains full agency to correct errors, clearly marked as User Verified, mapping directly to instrument W-104."*
- **Visible Result**: Modal closes; system routes to the pre-filled re-verification application form.

### Scene 3: Digital Application Submission (~10s)
- **Route**: `http://localhost:3000/owner/re-verify/W-104`
- **Role**: Trader
- **Action**:
  1. Show that instrument details (`Platform Weighing Scale W-104`, Serial `ES215-88421`, Capacity `320 kg`) are pre-populated.
  2. Click **"Submit Re-Verification Application"**.
- **Narrative**: *"The digital application is automatically populated from verified historical records, saving time and eliminating manual re-entry errors."*
- **Visible Result**: Application state advances to `Submitted` / `Verification In Progress` (Application `APP-26036-0148`).

### Scene 4: Digital Instrument Passport (~15s)
- **Route**: `http://localhost:3000/lmo/instruments/W-104`
- **Role**: LMO (`Priya Sharma`)
- **Action**:
  1. Show the first screenful: Identity header, verification metrics (1 past verification cycle), and immutable timeline.
- **Narrative**: *"Before field inspection, the Legal Metrology Officer opens the Digital Instrument Passport to inspect past verification cycles, previous errors, and device lifecycle history."*
- **Visible Result**: Passport displays instrument identity, Essae DS-215 model, and Cycle 1 verification summary.

### Scene 5: LMO Verification Workflow Context (~25s)
- **Route**: `http://localhost:3000/lmo/applications/APP-26036-0148/verify`
- **Role**: LMO
- **Action**:
  1. Scroll through the established verification workflow reading order:
     - Card 1: Instrument Summary (`W-104`)
     - Card 2: Verification Details (Test Standard `OIML R76-1`, Reference Weights)
     - Card 3: Dynamic MPE Rule Engine (Decision Support)
- **Narrative**: *"During field inspection, observations are entered into the verification workflow. The reading order guides the officer systematically from instrument context to test observations."*
- **Visible Result**: Structured cards display verification details, reference weights, and observation table.

### Scene 6: Prototype MPE Evaluation (~15s)
- **Route**: Same page (`verify`), Card 3
- **Role**: LMO
- **Action**:
  1. Point out test observation load point 3:
     - Nominal: `100 kg`, Observed: `100.02 kg`, Relative Error: `+0.02%`.
     - Prototype Rule threshold: `±0.05%`.
     - Badge: `✓ WITHIN MPE`.
- **Narrative**: *"The dynamic MPE engine instantly computes absolute and relative errors against configurable prototype demonstration rules, confirming error is within tolerance."*
- **Visible Result**: Dynamic MPE table shows green `WITHIN_MPE` status badges.

### Scene 7: Pattern-Based AI Advisory (~15s)
- **Route**: Same page (`verify`), scroll to Card 4
- **Role**: LMO
- **Action**:
  1. Inspect the **AI Advisory & Risk Analysis** card:
     - Point out **Prototype Risk Heuristic: LOW RISK** (No significant advisory pattern detected).
     - Highlight factor analysis: Linear error distribution across load points, error drift within acceptable threshold relative to historical cycles.
     - Note the neutral demo presets if demonstrating contrasting scenarios.
- **Narrative**: *"The AI Advisory evaluates historical drift and multi-point non-linearity to highlight suspicious patterns such as repeated identical readings. It functions purely as a decision-support heuristic, indicating LOW risk with no significant advisory pattern detected."*
- **Visible Result**: Emerald `LOW RISK` badge, expandable factor list, disclaimer: *"Prototype advisory — review by authorized LMO required"*.

### Scene 8: Final LMO Decision (Officer Authority) (~10s)
- **Route**: Same page (`verify`), scroll to Card 5
- **Role**: LMO
- **Action**:
  1. Show Card 5: **Final Verification Decision (Officer Authority)**.
  2. Select radio: **Pass — Verification Approved**.
  3. Enter optional officer remarks: *"Verified compliant with test weights."*
  4. Click fixed bottom button: **"Submit verification result"**.
- **Narrative**: *"The AI does not decide compliance. Final verification authority rests strictly with the authorized Legal Metrology Officer. The officer approves Pass, generating the digital certificate."*
- **Visible Result**: Status banner confirms submission; Digital Certificate `CERT-2025-00981` is issued.

### Scene 9: Certificate Repository (~15s)
- **Route**: `http://localhost:3000/owner/certificates`
- **Role**: Trader
- **Action**:
  1. View the newly generated certificate card for `CERT-2025-00981`.
  2. Highlight Certificate ID, Valid Until date (`11 Jun 2026`), and QR verification badge.
- **Narrative**: *"The trader immediately receives a tamper-evident digital certificate with issuance metadata and a verification QR code."*
- **Visible Result**: Certificate card with `VALID` badge, download printable certificate button, and scan QR action.

### Scene 10: Public QR Verification (~10s)
- **Route**: `http://localhost:3000/verify-certificate?id=CERT-2025-00981`
- **Role**: Public Citizen / Consumer
- **Action**:
  1. Open public verification portal.
  2. Point out: Instrument, Trader Name, Validity Status (`VALID`), Dynamic QR code.
  3. Point out strict privacy: Zero internal LMO notes, zero AI risk data, zero private photos exposed.
- **Narrative**: *"Any consumer scanning the QR code on a shop scale can verify certificate validity in real-time without exposing internal inspection remarks or officer data."*
- **Visible Result**: Clean institutional certificate verification page.

### Scene 11: Physical QR Sticker Confirmation (~20s)
- **Route**: `http://localhost:3000/lmo/qr-confirmations`
- **Role**: Trader submits evidence $\to$ LMO reviews
- **Action**:
  1. Show pending QR sticker confirmation item for `W-104` / `CERT-2025-00981`.
  2. Review photo evidence showing physical placement on scale housing.
  3. Click **"Confirm Placement"**.
- **Narrative**: *"To bridge the digital certificate with the physical world, the trader affixes the official QR sticker and uploads photographic evidence, which the jurisdiction LMO reviews and confirms."*
- **Visible Result**: Item transitions to `CONFIRMED` with green badge.

### Scene 12: Updated Digital Instrument Passport (~15s)
- **Route**: `http://localhost:3000/lmo/instruments/W-104`
- **Role**: LMO / Trader
- **Action**:
  1. Refresh the Digital Instrument Passport.
  2. Show the connected lifecycle timeline:
     - Application Submitted
     - Physical Inspection Passed
     - Digital Certificate Generated (`CERT-2025-00981`)
     - QR Sticker Confirmed
- **Narrative**: *"The complete lifecycle is now immutably linked in the Digital Instrument Passport—creating end-to-end transparency, compliance history, and trust across Indian commerce."*
- **Visible Result**: Timeline displays all 4 connected milestones ending with `QR_STICKER_CONFIRMED`.

---

## G. Recovery Steps If a Click Is Missed
1. **Wrong Demo Receipt Selected**:
   - Click the "✕" close button on the assistant drawer and click "Reference Legacy Inspection Receipt" again.
2. **Accidentally Clicked "Mark Needs Correction" Instead of "Pass"**:
   - Re-open `/lmo/applications/APP-26036-0148/verify`, select "Pass — Verification Approved", and click "Submit verification result".
3. **Accidental Duplicate Submission**:
   - The backend service is strictly idempotent; re-submitting Pass will not create duplicate certificates.
4. **General State Corruption During Practice**:
   - Run the reset command (`storageService.resetDemoState()`) in terminal to return to initial baseline in under 1 second.

---

## H. Secondary Demonstration Features (For Q&A / Deep Dives)
The following secondary workflows are fully implemented and available if requested by judges:
- **Correction Workflow**: Fail verification $\to$ application marked *Needs Correction* $\to$ trader receives notification with officer remarks $\to$ fixes device and resubmits.
- **QR Sticker Rejection Cycle**: LMO clicks *Request Correction* with feedback (e.g., *"Photo is blurry"*) $\to$ trader re-uploads clear photo $\to$ confirmed.
- **Multilingual Support**: Switch header language toggle between English, Hindi (हिन्दी), Marathi (मराठी), Punjabi (ਪੰਜਾਬੀ), and Telugu (తెలుగు) on any page.
- **AI Advisory Boundary Scenarios**: Interactive presets to demonstrate Medium Risk (Scenario B), High Risk (Scenario C), and Insufficient Data (Scenario D).
- **Strict Jurisdiction Boundaries**: LMO from South Delhi is blocked from viewing North Delhi or Mumbai sticker reviews.
- **GATC / Central Standards Portal**: Laboratory reference scale calibration tracking (`/gatc/dashboard`).

---

## I. Final Post-Demo Reset Procedure
Always run before exiting:
```bash
npx tsx -e "import { storageService } from './src/services/storageService'; storageService.resetDemoState();"
```
