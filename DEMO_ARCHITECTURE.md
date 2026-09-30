# SIH PS36 Legal Metrology — System Architecture & Demonstration Data Layer

## 1. Architectural Philosophy
The SIH PS36 prototype demonstrates an integrated, end-to-end Legal Metrology verification system. 
Rather than creating separate mocked views or deploying an external cloud database for local jury evaluation, the system employs a **deterministic, reactive frontend state layer** backed by standard browser APIs.

This architecture ensures:
1. **Zero External Backend Dependency**: Works reliably offline or on localhost without Docker, network calls, or third-party cloud infrastructure.
2. **Deterministic Predictability**: Always begins in a known baseline state (`LM-2026-00124` in `DRAFT`), progresses sequentially, and resets cleanly on command.
3. **Cross-Portal Interconnectivity**: The four role dashboards (Trader, Admin, LMO, GATC) are distinct perspectives of **the exact same underlying data entity**.

---

## 2. Centralized Demo State Engine (`storageService.ts`)

The centralized data engine operates in `src/services/storageService.ts`. It acts as the single source of truth for:
- **Users**: Multi-role user accounts (`OWNER`, `ADMIN`, `LMO`, `GATC`).
- **Instruments**: Device inventory (`EWI-DEMO-001`, `W-104`).
- **Applications**: Lifecycle tracking for verification filings (`LM-2026-00124`).
- **Verification Observations**: Technical inspection records (error tolerance, zero error, standard weights).
- **Certificates**: Electronically generated certificates with cryptographic verification links.
- **Audit Trail**: Immutable chronological log of statutory actions.
- **Notifications**: System announcements and role-specific alerts.

### Persistence Mechanism
- Primary storage: `window.localStorage` with JSON serialization.
- SSR / Node.js fallback: In-memory `Map<string, string>` store preventing build-time rendering crashes.
- Automatic lazy initialization: If storage keys are empty, `ensureInitialized()` seeds the deterministic demo baseline.

---

## 3. Real-Time Cross-Tab Synchronization

To enable multi-tab demonstrations where a presenter operates:
- **Tab 1**: Trader
- **Tab 2**: Admin
- **Tab 3**: LMO Officer
- **Tab 4**: GATC Lab Officer

The system implements a dual-tier synchronization bus:

```
┌────────────────────────────────────────────────────────┐
│                   Browser Window                       │
├─────────────┬─────────────┬─────────────┬──────────────┤
│    Tab 1    │    Tab 2    │    Tab 3    │    Tab 4     │
│   (Trader)  │   (Admin)   │    (LMO)    │    (GATC)    │
└──────┬──────┴──────┬──────┴──────┬──────┴──────┬───────┘
       │             │             │             │
       ▼             ▼             ▼             ▼
┌────────────────────────────────────────────────────────┐
│   BroadcastChannel ('ps36_demo_channel') [Tier 1]       │
│   + window 'storage' Event Fallback      [Tier 2]       │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│           localStorage Centralized Demo Store          │
└────────────────────────────────────────────────────────┘
```

1. **Tier 1 (BroadcastChannel API)**: 
   When any mutation occurs (e.g., Trader submits, Admin assigns, LMO verifies, GATC approves), `emitCrossTabUpdate(entity)` posts a message to `BroadcastChannel("ps36_demo_channel")`. All other active browser tabs receive this event with near-zero latency (< 5ms) and automatically refresh their local view.
2. **Tier 2 (Storage Event Fallback)**:
   For browser contexts where `BroadcastChannel` is restricted, a ping key (`ps36_demo_sync_ping`) is written to `localStorage`, firing the standard browser `storage` event on listening tabs.
3. **Subscription Lifecycle**:
   React components subscribe via `storageService.subscribeToDemoUpdates(callback)` inside `useEffect`, automatically cleaning up listeners on unmount.

---

## 4. Role Isolation & Access Boundaries

The prototype defines strict boundaries between roles:

| Role | Permitted State Transitions | View Context |
| :--- | :--- | :--- |
| **Trader / Owner** | `DRAFT` $\to$ `SUBMITTED` | `/owner/*` (Inventory, Applications, Certificates) |
| **Ministry Admin** | `SUBMITTED` $\to$ `ADMIN_REVIEW` $\to$ `ASSIGNED` | `/admin/*` (Division Overview, Assignment, Scheduling) |
| **LMO Officer** | `ASSIGNED` $\to$ `FIELD_VERIFICATION` $\to$ `FIELD_VERIFIED` | `/lmo/*` (Inspection Checklist, MPE Evaluation, Evidence) |
| **GATC Lab** | `FIELD_VERIFIED` $\to$ `GATC_REVIEW` $\to$ `APPROVED` / `REJECTED` | `/gatc/*` (Technical Clearance, Lab Bays, Testing Archive) |
| **System Authority**| `APPROVED` $\to$ `CERTIFICATE_ISSUED` | Automated certificate generation upon GATC clearance |
| **Public User** | Read-Only Authenticity Verification | `/verify/*`, `/verify-certificate` (Unauthenticated) |

---

## 5. Application State Machine

The verification lifecycle follows an explicit 9-state pipeline:

$$\text{DRAFT} \longrightarrow \text{SUBMITTED} \longrightarrow \text{ADMIN\_REVIEW} \longrightarrow \text{ASSIGNED} \longrightarrow \text{FIELD\_VERIFICATION} \longrightarrow \text{FIELD\_VERIFIED} \longrightarrow \text{GATC\_REVIEW} \longrightarrow \text{APPROVED} \longrightarrow \text{CERTIFICATE\_ISSUED}$$

- **State Guards**: Non-permitted roles cannot arbitrarily trigger illegal transitions (e.g. Trader cannot approve certificates; LMO cannot re-assign officers).
- **Timeline Synchronization**: Each state transition updates the visual timeline tracker with completion timestamps and active highlights.
- **Audit Logging**: Every transition appends an immutable `AuditEvent` recording `timestamp`, `role`, `actor`, and human-readable justification.

---

## 6. Deterministic Certificate & QR Generation

When GATC issues final approval for `LM-2026-00124`:
1. **Deterministic Certificate Generation (`certificateService.ts`)**:
   - Certificate ID: `CERT-LM-2026-00124`
   - Linked to: Application `LM-2026-00124`, Trader `Demo Weighing Solutions`, Instrument `EWI-DEMO-001`.
   - Issue Date: `12 Jun 2025`, Validity: 1 statutory year (`11 Jun 2026`).
2. **QR Code Engine (`qrService.ts`)**:
   - Encodes absolute or origin-relative verification URL:
     `/verify-certificate?id=CERT-LM-2026-00124`
   - High error-correction level (`Level H`) ensures scannability even on low-quality displays or printouts.
   - Generates vector SVG and high-resolution PNG for 80mm shop sticker printing.
3. **Public Verification (`/verify/[id]` & `/verify-certificate`)**:
   - Independent of user login or session cookies.
   - Displays official metrological assurance under Section 24 of the Legal Metrology Act, 2009.
   - **Privacy Boundary**: Excludes all internal tokens, passwords, officer phone numbers, and system diagnostics.

---

## 7. Limitations Compared with Production Backend

While this prototype provides a realistic, high-fidelity demonstration, key distinctions from an enterprise production backend include:

| Prototype Characteristic | Production Implementation Equivalent |
| :--- | :--- |
| **Browser `localStorage`** | Relational / Document Database (PostgreSQL / MongoDB) with ACID transactions |
| **`BroadcastChannel` Sync** | WebSockets / Server-Sent Events (SSE) via Message Broker (RabbitMQ / Kafka) |
| **Client-Side Certificate Generation** | Asymmetric Cryptographic Signing (PKI / X.509 Hardware Security Module) |
| **Session In-Memory Auth** | JWT / OAuth2 with PKCE, RBAC middleware, and government single sign-on (Parichay / DigiLocker) |
| **Mock Receipt OCR** | Production OCR / Multimodal Vision Model (Tesseract / Cloud Vision API) |
| **Local Audit Store** | Tamper-proof append-only ledger or blockchain-anchored audit logs |
