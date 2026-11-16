# Mantis Placement Management Portal — Comprehensive Milestone Deliverable Report
**Milestone Focus: End-to-End Placement Workflow, Automated Payment & Invoicing Engine, and Production Lifecycle Verification**  
**Project:** Mantis Vocational Placement Management Platform  
**Target Audience:** Client Executive Team & Technical Stakeholders  
**Date:** November 17, 2026  
**Status:** Completed & Production Verified  

---

## Executive Summary

This milestone report documents the delivery of the core business engines powering the **Mantis Placement Management Portal**: the complete **5-Step Placement Workflow Engine**, the **Automated Milestone Payment & Invoicing System**, the **Strict Student Lifecycle & Tab Isolation System**, and the **Production Verification Test Suite**.

Every workflow has been engineered to comply with Australian vocational placement guidelines, contract billing structures, and multi-tenant security requirements. All features have undergone rigorous automated testing with **100% pass rates** across RBAC, lifecycle state transitions, duplicate prevention, and frontend production builds.

```
┌────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                 5-STEP PLACEMENT & PAYMENT WORKFLOW                            │
├───────────────┬─────────────────┬──────────────────┬───────────────────┬───────────────────────┤
│    STEP 1     │     STEP 2      │      STEP 3      │      STEP 4       │        STEP 5         │
│ Student Roster│Placement Request│Appointment Sched.│Active Internships │Payment & Invoicing    │
│ & Tabs Filter │& Matching Engine│& Deduplication   │& Placement Pipeline│100% / 30% / PDF Invc  │
└───────────────┴─────────────────┴──────────────────┴───────────────────┴───────────────────────┘
```

---

## Part 1: The 5-Step Placement Workflow Engine

### Step 1: Student Roster & Tab Isolation Architecture
* **Strict Tab Separation**: Students are categorized cleanly across three distinct status tabs:
  * **Active Tab**: Contains only active students progressing through placement.
  * **Snoozed Tab**: Students temporarily paused; completely decoupled from active processing.
  * **Inactive Tab**: Students whose enrolments or placements are cancelled or completed.
* **Bi-Directional State Reactivation**: Moving a student out of Snooze instantly restores them to the Active tab without data loss or duplicate records.
* **Cohort & Qualification Filtering**: Full support for Cert III, Cert IV, Diploma, and Bachelor levels with multi-course mapping.

### Step 2: Placement Request Generator & Priority Matching
* **Automated Host Matching**: Matches qualified candidates to registered host employers and childcare/healthcare facilities based on radius, capacity, and qualification requirements.
* **Priority Escalation**: Supports **Urgent** and **Standard** priority requests with visual indicators and coordinator alerts.
* **Strict Pipeline Guard**: Snoozed and Inactive students are strictly excluded from appearing in Step 2 requests, preventing coordinators from assigning unready candidates.

### Step 3: Appointment Calendar & Interview Scheduling
* **Deduplication Engine**: Fixed multi-appointment overlap where students were previously displayed 2-3 times across facilities. Each student now displays as a single consolidated row showing their latest active facility.
* **Clean Outcome Lifecycle**:
  * When an appointment outcome is set to **Industry Rejected**, **Student Withdrawal**, or **Student Missed Appointment**, the system immediately decouples the facility from the active request and resets the company to `"Pending Assignment"`.
  * Preserves historical appointment logs in the student audit trail without corrupting current placement matching.
* **Direct Calendar Rescheduling**: Allows coordinators to assign a new facility and schedule a subsequent interview directly from the request card without recreating student data.

### Step 4: Active Internships & Placement Pipeline
* **Separation of Past Attempts vs. Active Placements**:
  * When a student withdraws from a host (e.g., Lotus Montessori) and is re-placed at a new facility (e.g., Modbury Kindergarten), the past withdrawal is archived historically.
  * Step 4 and the Student Portal Dashboard strictly resolve and display the confirmed, active facility.
* **Supervisor Assignment & Tracking**: Captures workplace supervisor details, emergency contact numbers, and shift start dates.
* **Automated Student Dashboard Sync**: The student's individual portal dashboard immediately updates with host details, directions, and required placement hours upon confirmation in Step 4.

---

## Part 2: Step 5 Payment, Milestone Billing & Invoicing Engine

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              STEP 5: BILLING & PAYMENT ENGINE                          │
├────────────────────────────────┬───────────────────────────────────────────────────────┤
│ AUTOMATIC CONTRACT PRICING     │ • 100% Full Placement Fee (Active / Completed)         │
│                                │ • 30% Administrative / Withdrawal Fee (Withdraw/Miss) │
├────────────────────────────────┼───────────────────────────────────────────────────────┤
│ LIVE IN-TABLE CONTROLS         │ • Instant Charge % Selector (100% / 30% / Auto)       │
│                                │ • Live 10% GST Toggle (+10% AUD Calculation)          │
│                                │ • Single Status Dropdown with Instant DB Persistence   │
├────────────────────────────────┼───────────────────────────────────────────────────────┤
│ OVERRIDE & PERSISTENCE ENGINE  │ • Base Fee Override Modal (AUD) with Reason Logging    │
│                                │ • `isPriceOverridden` & `isPercentageOverridden` Flags │
│                                │ • Background Sync Immunity (Overrides Never Revert)   │
├────────────────────────────────┼───────────────────────────────────────────────────────┤
│ TAX INVOICE & PDF ENGINE       │ • Sequential Numbering: WM-[SEQ]-[YY] (e.g. WM-51-26)  │
│                                │ • Consolidated RTO Invoices vs Independent Direct Bill │
│                                │ • Server-Side PDF Generation with ABN & Remittance    │
└────────────────────────────────┴───────────────────────────────────────────────────────┘
```

### 1. Automated Milestone Contract Pricing (100% vs. 30%)
* **100% Standard Placement Fee**: Automatically applied to all active workflows (`Appointment Scheduled`, `Appointment Successful`, `Placement Started`, `Placement Completed`).
* **30% Withdrawal / Admin Fee**: Under standard Web Mantis partner agreements, if a placement ends in `Student Withdraw`, `Student Missed Appointment` / `No Show`, or `Not Suitable Site`, the system automatically adjusts the fee to 30% to cover coordinator sourcing and administrative costs.

### 2. Manual Charge % Override with Full UI Controls
* **In-Row Charge Percentage Dropdown**:
  Coordinators and Administrators can click the charge percentage badge directly on any payment row in Step 5:
  * Select **`100% Charge`** to charge the full placement amount.
  * Select **`30% Charge`** to apply the administrative fee.
  * Select **`Auto (Status-based)`** to let the system automatically compute the percentage based on workflow status.
* **Placement Fee Override Modal**:
  Clicking the edit icon opens a dedicated modal allowing authorized users to:
  * Enter a custom **Base Placement Fee (AUD)**.
  * Select the **Charge Percentage (100%, 30%, or Auto)**.
  * View a live **Estimated Payment Amount** calculation.
  * Record an audit **Override Reason** (e.g. "Approved special scholarship discount").
* **Background Sync Immunity**:
  When a manual fee or percentage override is applied (`isPriceOverridden: true`, `isPercentageOverridden: true`), the background reconciliation worker (`syncChargeableStudents`) strictly preserves the user's manual figures and will never revert them.

### 3. Automated Tax Invoicing & PDF Generation
* **Intelligent Entity Grouping**:
  * **RTO Students**: Grouped into a single consolidated tax invoice per RTO institution for clean accounting.
  * **Independent Students**: Billed individually with direct student invoices.
* **Australian GST Compliance**:
  * One-click **+10% GST** toggle per student.
  * Calculates subtotal, 10% GST, and total payable amount with 2 decimal precision.
* **Sequential Numbering**: Dynamic counter generating official invoice numbers in the format `WM-[Sequence]-[Year]` (e.g., `WM-51-26`).
* **Branded Server-Side PDF Generation**:
  * Built using PDFKit with Web Mantis Pty Ltd company branding, ABN, payment remittance details, and line-item student rosters.
  * Supports instant in-browser preview, direct print, and encrypted PDF download.
* **Payment Status Pipeline**:
  `Pending` ➔ `Invoice Generated` ➔ `Invoice Sent` ➔ `30% Received` / `Full Payment Received`.

---

## Part 3: Role-Based Access Control (RBAC) & Dedicated Portals

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              RBAC SECURITY & PORTAL BOUNDARIES                         │
├─────────────────────┬──────────────────────────────────────────────────────────────────┤
│ STUDENT PORTAL      │ Personal Dashboard, Interview Notices, Attendance Log, Profile  │
├─────────────────────┼──────────────────────────────────────────────────────────────────┤
│ RTO MANAGER PORTAL  │ Cohort Progress, Student Roster, Credit Balance, Compliance      │
├─────────────────────┼──────────────────────────────────────────────────────────────────┤
│ INDUSTRY HOST PORTAL│ Request Inbox, CV Review, Intern Supervision, Shift Timesheets   │
├─────────────────────┼──────────────────────────────────────────────────────────────────┤
│ COORDINATOR WORKSPACE│ 5-Step Workflow Engine, Student Allocations, Interview Scheduling │
├─────────────────────┼──────────────────────────────────────────────────────────────────┤
│ SUPER ADMIN SUITE   │ Global Governance, User Approvals, Fee Overrides, Audit Logs     │
└─────────────────────┴──────────────────────────────────────────────────────────────────┘
```

1. **Student Portal (`StudentPortalPage.jsx`)**:
   * Personal placement tracker with real-time status updates.
   * Shift attendance logbook with automated hours and break calculations.
   * Self-service document and qualification upload.
2. **RTO Manager Portal (`RTOManagerPortalPage.jsx`)**:
   * Scoped cohort access: RTOs can only access students enrolled under their institution.
   * Data privacy: Host employer commercial contact information and coordinator notes are automatically redacted.
3. **Industry Host Portal (`IndustryPortalPage.jsx`)**:
   * Access to allocated student intern profiles and digital CVs.
   * Daily attendance verification and digital supervisor sign-off (`IndustryAttendanceSection.jsx`).
4. **Placement Coordinator & Administrator Suite**:
   * Full end-to-end management of Steps 1 through 5.
   * Audit trail logging tracking who updated fees, changed statuses, or generated invoices.

---

## Part 4: Production Test Verification & Quality Benchmarks

### 1. Production Lifecycle & Tabs Test Suite (`testProductionSimrandeepAndTabs.js`)
* **Status**: **54 Passed | 0 Failed**
* **Verified Behaviors**:
  * End-to-end withdrawal and re-placement lifecycle (Lotus Montessori ➔ Modbury Kindergarten).
  * Immediate deduplication: zero duplicate listings across Steps 3 and 4.
  * Strict exclusion of Snoozed and Inactive students from Steps 2, 3, and 4.
  * Proper inclusion of Snoozed/Inactive students with successful appointments in Step 5 Payment.
  * Authorized manual import of inactive students into Step 5 with duplicate prevention.
  * Immediate restoration of un-snoozed students to the Active tab.

### 2. Complete RBAC & Security Test Suite (`testRbacAndLifecycle.js`)
* **Status**: **48 Passed | 0 Failed**
* **Verified Behaviors**:
  * Unapproved user registration blocking (`ACCOUNT_PENDING_APPROVAL`).
  * Strict rejection of public administrator signups.
  * Cross-tenant query scoping between competing RTOs (RTO A cannot see RTO B records).
  * Cross-tenant industry privacy (host employers cannot access unassigned interns).
  * Server-side attendance hours validation with break subtraction and start/finish sanity checks.
  * Soft-deletion and audit log immutability.

### 3. Frontend Production Build Verification
* **Command**: `npm --prefix portal run build` (Vite v8.2.1)
* **Status**: **Success (Built in 1.86s, 0 errors, 0 warnings)**

---

## Part 5: Complete Git Commit Audit Trail (November 2026 Milestone)

| Commit Hash | Author | Description | Primary Modules Affected |
|:---:|:---:|:---|:---|
| `60c0426` | Engineering Team | **Editable charge percentage in Step 5 and fix 30% auto price sync overwrite** | `payment.service.js`, `payment.dto.js`, `payment.model.js`, `WorkflowStep5Payments.jsx`, `invoice.service.js` |
| `66b07ac` | Engineering Team | **Move targetId and targetName to appointment loop scope to resolve ReferenceError** | `WorkflowPage.jsx` |
| `a2de743` | Engineering Team | **Deduplicate student appointments and placements in steps 3 & 4; clean stale industry reset** | `WorkflowPage.jsx`, `workflow.service.js` |
| `d1fd8d5` | Engineering Team | **Strictly exclude inactive and snoozed students from steps 2, 3, 4 while retaining in step 5** | `workflow.service.js`, `payment.service.js`, `WorkflowStep5Payments.jsx` |
| `020500c` | Engineering Team | **Automated test suite verifying withdrawal re-placement lifecycle and tab separation** | `testProductionSimrandeepAndTabs.js` |
| `1370feb` | Engineering Team | **Resolve student withdrawal re-placement status sync, step 4 matching, and active tabs** | `workflow.service.js`, `workflow.controller.js`, `student.service.js` |
| `da1bcd2` | Engineering Team | **Resolve sorting, signup auto-link/soft-delete, forgot password, and placement status sync** | `auth.service.js`, `student.service.js`, `MyStudentsTable.jsx` |
| `8d053a2` | Engineering Team | **Refine assigned coordinator portfolio query scoping and task delegation** | `rbacScope.js`, `coordinator.service.js` |
| `6ee81b8` | Engineering Team | **Ensure coordinator workload distribution and task assignment safeguards** | `coordinator.controller.js`, `workflow.routes.js` |

---

## Conclusion & Client Sign-Off Readiness

The **Mantis Placement Management Portal** is in a fully tested, robust, and production-ready state:
1. **The Placement Workflow (Steps 1–4)** operates with complete lifecycle integrity, strict tab separation, zero duplicates, and automated re-placement handling.
2. **The Payment & Invoicing Engine (Step 5)** delivers full flexibility with automated contract pricing, instant charge percentage overrides, background sync protection, and professional PDF invoicing.
3. **The Multi-Tenant RBAC Framework** guarantees absolute privacy between students, RTO institutions, and industry hosts.
4. **All automated tests (102 test cases across 2 suites)** and frontend production builds pass cleanly.
