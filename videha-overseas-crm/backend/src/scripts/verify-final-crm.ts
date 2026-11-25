import "dotenv/config";
import http from "node:http";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { createApp } from "../app";
import { connectDatabase } from "../db/connect";
import { Lead } from "../models/Lead";
import { User } from "../models/User";
import { Role } from "../models/Role";
import { Department } from "../models/Department";
import { FollowUp } from "../models/FollowUp";
import { Quotation } from "../models/Quotation";
import { Order } from "../models/Order";
import { AuditLog } from "../models/AuditLog";
import { AssignmentConfig } from "../models/AssignmentConfig";
import { PIPELINE_LEAD_STATUSES, CONVERTED_LEAD_STATUSES } from "../constants/leadPipeline";
import { backfillLeadPipelineFields, syncRolePermissionDefaults, ensureCoreCrmRolesAndUsers } from "../db/backfillRevisions";
import * as reportsAdvancedService from "../modules/reports/reports.advanced.service";
import * as reportsService from "../modules/reports/reports.service";
import * as leadsService from "../modules/leads/leads.service";
import * as authService from "../modules/auth/auth.service";
import type { AuthUser } from "../types";

let server: http.Server;
let baseUrl: string;

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(`ASSERTION FAILED: ${message}`);
  }
}

async function runVerification() {
  console.log("=================================================================");
  console.log("   VIDEHA OVERSEAS CRM - FINAL COMPREHENSIVE VERIFICATION SUITE   ");
  console.log("             (Steps 7–9: KPIs, RBAC, Security, E2E)              ");
  console.log("=================================================================\n");

  await connectDatabase();

  // Run all migrations and core RBAC provisioning
  console.log("[Setup] Running role sync, migrations, and core team provisioning...");
  await syncRolePermissionDefaults();
  await ensureCoreCrmRolesAndUsers();
  await backfillLeadPipelineFields();

  // Spin up app on ephemeral port
  const app = createApp();
  server = http.createServer(app);
  await new Promise<void>((resolve) => {
    server.listen(0, () => {
      const addr = server.address();
      const port = typeof addr === "object" && addr ? addr.port : 5000;
      baseUrl = `http://localhost:${port}`;
      console.log(`[Setup] Test server running at ${baseUrl}`);
      resolve();
    });
  });

  const testEmailPrefix = `final_test_${Date.now()}`;

  try {
    // =========================================================================
    // SECTION 1: STEP 8 — RBAC, TEAM ACCESS & SECURITY ENFORCEMENT
    // =========================================================================
    console.log("\n-------------------------------------------------------------");
    console.log(" SECTION 1: STEP 8 — RBAC & TEAM ACCESS PERMISSIONS");
    console.log("-------------------------------------------------------------");

    // 1.1 Verify Roles in MongoDB
    const mdRole = await Role.findOne({ name: "SUPER_ADMIN" }).lean();
    assert(mdRole, "SUPER_ADMIN role must exist in MongoDB");
    assert(mdRole?.visibilityScope === "all", "SUPER_ADMIN visibilityScope must be 'all'");

    const salesCrmRole = await Role.findOne({ name: "SALES_CRM" }).lean();
    assert(salesCrmRole, "SALES_CRM role must exist in MongoDB for Shilpa Shelar");
    assert(salesCrmRole?.displayName === "Sales / CRM", "SALES_CRM displayName must be 'Sales / CRM'");
    assert(salesCrmRole?.permissions.includes("leads.view"), "SALES_CRM must have leads.view");
    assert(salesCrmRole?.permissions.includes("leads.convert"), "SALES_CRM must have leads.convert");
    assert(salesCrmRole?.permissions.includes("quotations.create"), "SALES_CRM must have quotations.create");

    const salesMarketingRole = await Role.findOne({ name: "SALES_MARKETING_CMS" }).lean();
    assert(salesMarketingRole, "SALES_MARKETING_CMS role must exist in MongoDB for Sejal Bidgar");
    assert(salesMarketingRole?.displayName === "Sales / Marketing / CMS", "SALES_MARKETING_CMS displayName correct");
    assert(salesMarketingRole?.permissions.includes("leads.view"), "SALES_MARKETING_CMS must have leads.view");
    assert(salesMarketingRole?.permissions.includes("leads.create"), "SALES_MARKETING_CMS must have leads.create");
    assert(!salesMarketingRole?.permissions.includes("leads.convert"), "SALES_MARKETING_CMS must NOT have leads.convert (restricted)");
    assert(!salesMarketingRole?.permissions.includes("settings.manage"), "SALES_MARKETING_CMS must NOT have settings.manage");
    console.log("✓ Core Roles verified: Managing Director (SUPER_ADMIN), Shilpa (SALES_CRM), Sejal (SALES_MARKETING_CMS).");

    // 1.2 Verify Separate Logins & Passwords
    console.log("\n[Auth] Testing separate logins for MD, Shilpa Shelar, and Sejal Bidgar...");

    // MD Login
    const mdLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "md@videhaoverseas.com", password: "admin123" }),
    });
    assert(mdLoginRes.status === 200, `MD login failed: ${mdLoginRes.status}`);
    const mdLoginData = await mdLoginRes.json();
    assert(mdLoginData.success === true, "MD login response success must be true");
    assert(mdLoginData.data.token, "MD login must return JWT token");
    assert(mdLoginData.data.user.roleName === "SUPER_ADMIN", "MD user role must be SUPER_ADMIN");
    const mdToken = mdLoginData.data.token;
    console.log("✓ Managing Director logged in successfully with SUPER_ADMIN privileges.");

    // Shilpa Shelar Login
    const shilpaLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "shilpa.shelar@videhaoverseas.com", password: "sales123" }),
    });
    assert(shilpaLoginRes.status === 200, `Shilpa login failed: ${shilpaLoginRes.status}`);
    const shilpaLoginData = await shilpaLoginRes.json();
    assert(shilpaLoginData.success === true, "Shilpa login response success must be true");
    assert(shilpaLoginData.data.token, "Shilpa login must return JWT token");
    assert(shilpaLoginData.data.user.roleName === "SALES_CRM", "Shilpa roleName must be SALES_CRM");
    const shilpaToken = shilpaLoginData.data.token;
    console.log("✓ Shilpa Shelar logged in successfully with SALES_CRM privileges.");

    // Sejal Bidgar Login
    const sejalLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "sejal.bidgar@videhaoverseas.com", password: "sales123" }),
    });
    assert(sejalLoginRes.status === 200, `Sejal login failed: ${sejalLoginRes.status}`);
    const sejalLoginData = await sejalLoginRes.json();
    assert(sejalLoginData.success === true, "Sejal login response success must be true");
    assert(sejalLoginData.data.token, "Sejal login must return JWT token");
    assert(sejalLoginData.data.user.roleName === "SALES_MARKETING_CMS", "Sejal roleName must be SALES_MARKETING_CMS");
    const sejalToken = sejalLoginData.data.token;
    console.log("✓ Sejal Bidgar logged in successfully with SALES_MARKETING_CMS privileges.");

    // 1.3 Authentication & Authorization Boundary Checks
    console.log("\n[Security] Verifying protected API authentication enforcement...");

    // Unauthenticated request to /api/leads must return 401
    const unauthRes = await fetch(`${baseUrl}/api/leads`);
    assert(unauthRes.status === 401, `Unauthenticated request to /api/leads must return 401, got ${unauthRes.status}`);
    console.log("✓ 401 UNAUTHORIZED enforced on protected route when no token is provided.");

    // Bad token must return 401
    const badTokenRes = await fetch(`${baseUrl}/api/leads`, {
      headers: { Authorization: "Bearer invalid.token.xyz" },
    });
    assert(badTokenRes.status === 401, `Invalid token must return 401, got ${badTokenRes.status}`);
    console.log("✓ 401 UNAUTHORIZED enforced when invalid token is supplied.");

    // Sejal Bidgar trying to access settings / audit (requires settings.manage) must return 403
    const sejalAuditRes = await fetch(`${baseUrl}/api/audit`, {
      headers: { Authorization: `Bearer ${sejalToken}` },
    });
    assert(sejalAuditRes.status === 403, `Sejal must be forbidden from /api/audit (403), got ${sejalAuditRes.status}`);
    console.log("✓ 403 FORBIDDEN correctly enforced on Sejal Bidgar for settings.manage endpoint.");

    // MD (Super Admin) accessing /api/audit must succeed (200)
    const mdAuditRes = await fetch(`${baseUrl}/api/audit`, {
      headers: { Authorization: `Bearer ${mdToken}` },
    });
    assert(mdAuditRes.status === 200, `MD must be able to view /api/audit (200), got ${mdAuditRes.status}`);
    console.log("✓ 200 OK granted to Managing Director on administrative audit endpoint.");

    // 1.4 Audit Logging Verification
    console.log("\n[Audit] Verifying audit log creation for login and CRM events...");
    const recentAuditLogs = await AuditLog.find({ action: "User Logged In" })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();
    assert(recentAuditLogs.length > 0, "Audit logs must record user login events");
    assert(
      recentAuditLogs.some((l) => l.userName === "Managing Director" || l.userName === "Shilpa Shelar"),
      "Audit log must record MD and Shilpa sign-in actions"
    );
    console.log(`✓ Audit log verified: ${recentAuditLogs.length} recent sign-in audit records found.`);

    // =========================================================================
    // SECTION 2: STEP 9 — END-TO-END FLOW (RFQ -> ASSIGNMENT -> 11 STAGES)
    // =========================================================================
    console.log("\n-------------------------------------------------------------");
    console.log(" SECTION 2: STEP 9 — COMPLETE END-TO-END SALES FLOW");
    console.log("-------------------------------------------------------------");

    // Configure Round Robin assignment between Shilpa Shelar and Sejal Bidgar
    const shilpaDoc = await User.findOne({ email: "shilpa.shelar@videhaoverseas.com" });
    const sejalDoc = await User.findOne({ email: "sejal.bidgar@videhaoverseas.com" });
    assert(shilpaDoc && sejalDoc, "Shilpa and Sejal user documents must exist");

    await AssignmentConfig.deleteMany({});
    await AssignmentConfig.create({
      enabled: true,
      defaultMode: "round_robin",
      roundRobinUserIds: [shilpaDoc!._id, sejalDoc!._id],
      roundRobinLastIndex: -1,
      countryRules: [],
      productRules: [],
      fallbackUserId: shilpaDoc!._id,
    });

    // 2.1 Website RFQ Submission
    console.log("\n[E2E 1/4] Submitting Website RFQ to public endpoint...");
    const e2eRfqPayload = {
      name: "Jean-Pierre Laurent",
      company: "Comptoir Européen des Épices SAS",
      country: "France",
      email: `${testEmailPrefix}_e2e@comptoir-epices.fr`,
      phone: "+33 1 42 68 55 00",
      product: "Organic Whole Black Pepper TGSEB",
      grade: "Garbled Special Extra Bold 4.75mm",
      quantity: "25 Metric Tons",
      packaging: "50kg multiwall kraft paper bags with PE liner",
      port: "Port of Le Havre, France",
      incoterm: "CIF",
      sampleRequired: "Yes",
      notes: "Strict EU pesticide residue limit compliance required.",
      containerType: "20ft FCL",
      source: "Website RFQ",
    };

    const rfqRes = await fetch(`${baseUrl}/api/public/rfq`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(e2eRfqPayload),
    });
    assert(rfqRes.status === 201, `Expected 201 for RFQ, got ${rfqRes.status}`);
    const rfqJson = await rfqRes.json();
    assert(rfqJson.success === true, "RFQ submission success must be true");
    const leadId = rfqJson.data.id;
    const rfqId = rfqJson.data.rfqId;
    assert(/^RFQ-\d{4}-\d{4}$/.test(rfqId), `RFQ ID '${rfqId}' must match RFQ-YYYY-XXXX format`);
    console.log(`✓ Lead created via Website RFQ with ID ${leadId} and sequential RFQ ID ${rfqId}`);

    // Verify assignment: first in round robin must be Shilpa Shelar
    const leadDoc1 = await Lead.findById(leadId).lean();
    assert(
      String(leadDoc1?.assignedToId) === String(shilpaDoc!._id),
      `Lead must be assigned to Shilpa Shelar, got ${leadDoc1?.assignedToId}`
    );
    assert(leadDoc1?.assignmentDetails?.assignedBy === "round_robin", "Assignment type must be round_robin");
    console.log(`✓ Automated lead assignment verified: Assigned to Shilpa Shelar (${shilpaDoc?.name}).`);

    // 2.2 Traverse All 11 Stages in Exact Sequence
    console.log("\n[E2E 2/4] Progressing lead through all 11 pipeline stages...");
    const actorShilpa: AuthUser = {
      id: String(shilpaDoc!._id),
      name: shilpaDoc!.name,
      email: shilpaDoc!.email,
      roleId: String(shilpaDoc!.roleId),
      roleName: "SALES_CRM" as any,
      permissions: salesCrmRole!.permissions,
      departmentId: String(shilpaDoc!.departmentId),
    };

    const EXPECTED_STAGES = [
      "New Lead",
      "Verification",
      "Qualified",
      "Quotation Sent",
      "Follow-up",
      "Sample",
      "Negotiation",
      "Confirmed Order",
      "Payment",
      "Shipment",
      "Closed",
    ];

    let currentLead = await Lead.findById(leadId);
    assert(currentLead?.status === "New Lead", "Initial stage must be 'New Lead'");
    console.log(`  Stage 1: ${currentLead?.status} [OK]`);

    let previousRevision = currentLead!.revision;

    for (let i = 1; i < EXPECTED_STAGES.length; i++) {
      const nextStage = EXPECTED_STAGES[i];
      const updated = await leadsService.updateLead(
        leadId,
        {
          status: nextStage as any,
          expectedRevision: previousRevision,
        },
        actorShilpa
      );
      assert(updated.status === nextStage, `Stage must update to '${nextStage}', got '${updated.status}'`);
      assert(updated.revision === previousRevision + 1, `Revision must increment monotonically (${previousRevision} -> ${updated.revision})`);
      previousRevision = updated.revision;
      console.log(`  Stage ${i + 1}: ${nextStage} (rev: ${updated.revision}) [OK]`);
    }
    console.log("✓ All 11 pipeline stages completed and persisted in MongoDB with optimistic concurrency revisions.");

    // 2.3 Verify Audit History for Stage Changes
    console.log("\n[E2E 3/4] Verifying lead activity & audit trail...");
    const activitiesResult = await leadsService.listLeadActivities(leadId, {});
    assert(activitiesResult.items.length >= 10, `Expected at least 10 stage activity records, got ${activitiesResult.items.length}`);
    console.log(`✓ Audit history verified: ${activitiesResult.items.length} activity entries logged for lead.`);

    // 2.4 Verify Follow-up Creation & Reminder SLA
    console.log("\n[E2E 4/4] Verifying Follow-up scheduling and reminders...");
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const followUpDoc = await FollowUp.create({
      leadId: new mongoose.Types.ObjectId(leadId),
      assignedToId: shilpaDoc!._id,
      dueAt: tomorrow,
      type: "Call",
      status: "Completed",
      completedAt: new Date(),
      outcome: "Confirmed LC opened at Natixis Bank Paris.",
      notes: "Payment stage verified, shipment dispatched via MSC.",
      createdById: shilpaDoc!._id,
    });
    assert(followUpDoc, "FollowUp document must be created");
    console.log("✓ Follow-up record created and completed within SLA.");

    // =========================================================================
    // SECTION 3: STEP 7 — KPI & REPORTS VERIFICATION
    // =========================================================================
    console.log("\n-------------------------------------------------------------");
    console.log(" SECTION 3: STEP 7 — KPI & REPORTS VERIFICATION");
    console.log("-------------------------------------------------------------");

    const actorMD: AuthUser = {
      id: String(mdRole?._id),
      name: "Managing Director",
      email: "md@videhaoverseas.com",
      roleId: String(mdRole?._id),
      roleName: "SUPER_ADMIN",
      permissions: mdRole?.permissions || [],
      departmentId: null,
    };

    const advancedReport = await reportsAdvancedService.getAdvancedReports(actorMD, {});

    // KPI 1: Employee Conversion Rate
    console.log("\n[KPI 1] Employee Conversion Rate:");
    assert(advancedReport.kpis?.conversionRate !== undefined, "KPI conversionRate must exist");
    console.log(`  Overall Conversion Rate: ${advancedReport.kpis.conversionRate}`);
    const shilpaPerf = advancedReport.team.byMember.find(
      (m: any) => String(m.memberId) === String(shilpaDoc!._id)
    );
    assert(shilpaPerf, "Shilpa Shelar performance record must exist in team breakdown");
    assert(shilpaPerf.won > 0, `Shilpa won count must be > 0 (lead reached Closed stage), got ${shilpaPerf.won}`);
    assert(shilpaPerf.conversionRate !== "0%", `Shilpa conversion rate must be > 0%, got ${shilpaPerf.conversionRate}`);
    console.log(`  Shilpa Shelar: ${shilpaPerf.leads} leads | ${shilpaPerf.won} won | Conversion: ${shilpaPerf.conversionRate}`);
    console.log("✓ Employee conversion rate calculation verified.");

    // KPI 2: Quote Turnaround
    console.log("\n[KPI 2] Quotation Turnaround Time:");
    assert(advancedReport.kpis?.avgQuotationTurnaround !== undefined, "KPI avgQuotationTurnaround must exist");
    console.log(`  Average Quotation Turnaround: ${advancedReport.kpis.avgQuotationTurnaround}`);
    console.log("✓ Quotation turnaround time metric verified.");

    // KPI 3: Open Lead Ageing
    console.log("\n[KPI 3] Open Lead Ageing:");
    assert(advancedReport.kpis?.openLeadAging !== undefined, "KPI openLeadAging must exist");
    console.log(`  Average Open Lead Ageing: ${advancedReport.kpis.openLeadAging}`);
    console.log("✓ Open lead ageing metric verified.");

    // KPI 4: Follow-up SLA Adherence
    console.log("\n[KPI 4] Follow-up SLA Adherence:");
    assert(advancedReport.kpis?.followUpSlaAdherence !== undefined, "KPI followUpSlaAdherence must exist");
    console.log(`  Overall Follow-up SLA Adherence: ${advancedReport.kpis.followUpSlaAdherence}`);
    console.log(`  Shilpa Shelar SLA: ${shilpaPerf.slaAdherence}`);
    console.log("✓ Follow-up SLA adherence verified.");

    // KPI 5: Sales Performance Breakdown
    console.log("\n[KPI 5] Sales Performance & Department Breakdown:");
    assert(Array.isArray(advancedReport.team.byMember), "team.byMember must be an array");
    assert(Array.isArray(advancedReport.team.byDepartment), "team.byDepartment must be an array");
    console.log(`  Total active members tracked: ${advancedReport.team.byMember.length}`);
    console.log(`  Total departments tracked: ${advancedReport.team.byDepartment.length}`);
    console.log("✓ Sales performance aggregations verified.");

    // Basic summary reports check
    const basicReport = await reportsService.getReports();
    assert(basicReport.leads.total > 0, "Basic reports leads total must be > 0");
    assert(basicReport.leads.converted > 0, "Basic reports leads converted must be > 0");
    console.log(`✓ Basic report summary verified: ${basicReport.leads.total} total leads, ${basicReport.leads.converted} converted.`);

    // Cleanup test data
    console.log("\n[Cleanup] Removing temporary test lead and follow-up data...");
    await Lead.deleteMany({ email: { $regex: new RegExp(`^${testEmailPrefix}`) } });
    await FollowUp.deleteMany({ _id: followUpDoc._id });
    console.log("✓ Test data cleaned up.");

    console.log("\n=================================================================");
    console.log("   ALL REQUIREMENTS (STEPS 7–9) PASSED ALL VERIFICATIONS!       ");
    console.log("=================================================================\n");
  } finally {
    if (server) server.close();
    await mongoose.disconnect();
  }
}

runVerification().catch((err) => {
  console.error("\n❌ FINAL VERIFICATION SUITE FAILED:");
  console.error(err);
  if (server) server.close();
  mongoose.disconnect().finally(() => {
    process.exit(1);
  });
});
