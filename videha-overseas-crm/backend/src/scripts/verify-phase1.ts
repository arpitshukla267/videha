import "dotenv/config";
import http from "node:http";
import mongoose from "mongoose";
import { createApp } from "../app";
import { connectDatabase } from "../db/connect";
import { Lead } from "../models/Lead";
import { User } from "../models/User";
import { Role } from "../models/Role";
import { AssignmentConfig } from "../models/AssignmentConfig";
import { PIPELINE_LEAD_STATUSES, LEGACY_STATUS_MIGRATION_MAP, isConvertedLeadStatus } from "../constants/leadPipeline";
import { backfillLeadPipelineFields } from "../db/backfillRevisions";
import * as leadsService from "../modules/leads/leads.service";
import * as assignmentService from "../services/assignment.service";
import type { AuthUser } from "../types";

let server: http.Server;
let baseUrl: string;

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(`ASSERTION FAILED: ${message}`);
  }
}

async function runTests() {
  console.log("=================================================================");
  console.log("       VIDEHA OVERSEAS CRM - PHASE 1 VERIFICATION SUITE         ");
  console.log("=================================================================\n");

  await connectDatabase();
  await AssignmentConfig.deleteMany({});

  // Run backfill migration first to verify existing data safety
  console.log("[Setup] Running backfill migration to ensure database is prepared...");
  await backfillLeadPipelineFields();

  // Spin up app on ephemeral port for real HTTP testing
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

  // Ensure an admin user exists for authenticated operations
  let admin = await User.findOne({ status: "active" });
  if (!admin) {
    let adminRole = await Role.findOne({ name: "ADMIN" });
    if (!adminRole) {
      adminRole = await Role.create({
        name: "ADMIN",
        displayName: "Administrator",
        description: "Full system administration",
        isSystem: true,
        visibilityScope: "all",
        permissions: ["leads.create", "leads.read", "leads.update", "leads.delete", "leads.manage"],
      });
    }
    admin = await User.create({
      name: "Phase 1 Admin",
      email: "phase1admin@videhaoverseas.com",
      passwordHash: "dummyhash",
      roleId: adminRole._id,
      roleName: adminRole.name,
      status: "active",
    });
  }

  // Create two dedicated sales test users for assignment verification
  let salesRole = await Role.findOne({ name: "SALES_MEMBER" });
  if (!salesRole) {
    salesRole = await Role.create({
      name: "SALES_MEMBER",
      displayName: "Sales Representative",
      description: "Sales representative",
      isSystem: true,
      visibilityScope: "all",
      permissions: ["leads.create", "leads.read", "leads.update"],
    });
  }

  let userA = await User.findOne({ email: "sales_rep_a@videha.example" });
  if (!userA) {
    userA = await User.create({
      name: "Sales Rep Alpha",
      email: "sales_rep_a@videha.example",
      passwordHash: "dummyhash",
      roleId: salesRole._id,
      roleName: salesRole.name,
      status: "active",
    });
  } else {
    userA.status = "active";
    await userA.save();
  }

  let userB = await User.findOne({ email: "sales_rep_b@videha.example" });
  if (!userB) {
    userB = await User.create({
      name: "Sales Rep Beta",
      email: "sales_rep_b@videha.example",
      passwordHash: "dummyhash",
      roleId: salesRole._id,
      roleName: salesRole.name,
      status: "active",
    });
  } else {
    userB.status = "active";
    await userB.save();
  }

  let userC = await User.findOne({ email: "sales_rep_c@videha.example" });
  if (!userC) {
    userC = await User.create({
      name: "Sales Rep Gamma (Specialist)",
      email: "sales_rep_c@videha.example",
      passwordHash: "dummyhash",
      roleId: salesRole._id,
      roleName: salesRole.name,
      status: "active",
    });
  } else {
    userC.status = "active";
    await userC.save();
  }

  const actor: AuthUser = {
    id: String(admin._id),
    name: admin.name,
    email: admin.email,
    roleId: String(admin.roleId),
    roleName: "Admin",
    permissions: ["leads.create", "leads.read", "leads.update", "leads.manage"],
    departmentId: admin.departmentId ? String(admin.departmentId) : null,
  };

  const testEmailPrefix = `rfq_test_${Date.now()}`;

  try {
    // -------------------------------------------------------------
    // TEST 1: Pipeline Stage Definitions (Strictly 11 Stages)
    // -------------------------------------------------------------
    console.log("\n--- TEST 1: Sales Pipeline Stage Configuration ---");
    const EXPECTED_11_STAGES = [
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

    assert(
      PIPELINE_LEAD_STATUSES.length === 11,
      `Expected exactly 11 stages, found ${PIPELINE_LEAD_STATUSES.length}: ${PIPELINE_LEAD_STATUSES.join(", ")}`
    );
    for (let i = 0; i < EXPECTED_11_STAGES.length; i++) {
      assert(
        PIPELINE_LEAD_STATUSES[i] === EXPECTED_11_STAGES[i],
        `Stage at index ${i} must be '${EXPECTED_11_STAGES[i]}', found '${PIPELINE_LEAD_STATUSES[i]}'`
      );
    }
    // Verify legacy statuses are NOT in the active stages list
    assert(!PIPELINE_LEAD_STATUSES.includes("New" as any), "Legacy status 'New' must not be in active pipeline stages");
    assert(!PIPELINE_LEAD_STATUSES.includes("Contacted" as any), "Legacy status 'Contacted' must not be in active pipeline stages");
    assert(!PIPELINE_LEAD_STATUSES.includes("Lost" as any), "Legacy status 'Lost' must not be in active pipeline stages");
    assert(!PIPELINE_LEAD_STATUSES.includes("Converted" as any), "Legacy status 'Converted' must not be in active pipeline stages");
    console.log("✓ Pipeline stages verified: exactly 11 stages configured in correct order.");

    // -------------------------------------------------------------
    // TEST 2: RFQ API Endpoint (POST /api/public/rfq)
    // -------------------------------------------------------------
    console.log("\n--- TEST 2: Public RFQ API & Field Storage ---");
    const rfqPayload = {
      name: "Sheikh Mansoor",
      company: "Al-Emirates Global Trading",
      country: "United Arab Emirates",
      email: `${testEmailPrefix}_1@alemirates.example`,
      phone: "+971 50 999 8888",
      product: "Basmati Rice 1121",
      grade: "Extra Long Grain Premium 8.35mm",
      quantity: "100 Metric Tons",
      packaging: "25kg BOPP Bags with master palletizing",
      port: "Jebel Ali Port, Dubai",
      incoterm: "CIF",
      sampleRequired: "Yes (Express courier required)",
      notes: "Urgent shipment needed before Ramadan.",
      containerType: "40ft FCL",
      source: "Website RFQ",
    };

    const res1 = await fetch(`${baseUrl}/api/public/rfq`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rfqPayload),
    });

    const res1Text = await res1.text();
    let res1Json: any;
    try {
      res1Json = JSON.parse(res1Text);
    } catch {
      res1Json = { raw: res1Text };
    }
    assert(res1.status === 201, `Expected status 201 from /api/public/rfq, got ${res1.status}: ${res1Text}`);
    assert(res1Json.success === true, "Expected success: true in RFQ response");
    assert(res1Json.data?.id, "Expected created lead ID in RFQ response");
    assert(res1Json.data?.rfqId, "Expected rfqId in RFQ response");

    const createdLead1 = await Lead.findById(res1Json.data.id).lean();
    assert(createdLead1, "Lead record must exist in MongoDB");
    assert(createdLead1?.rfqId === res1Json.data.rfqId, "Lead rfqId must match response rfqId");
    assert(/^RFQ-\d{4}-\d{4}$/.test(createdLead1!.rfqId!), `RFQ ID '${createdLead1?.rfqId}' must match RFQ-YYYY-XXXX`);
    assert(createdLead1?.name === rfqPayload.name, "Lead name must match payload");
    assert(createdLead1?.company === rfqPayload.company, "Lead company must match payload");
    assert(createdLead1?.country === rfqPayload.country, "Lead country must match payload");
    assert(createdLead1?.email === rfqPayload.email, "Lead email must match payload");
    assert(createdLead1?.phoneNumber === rfqPayload.phone, "Lead phone must match payload");
    assert(createdLead1?.product === rfqPayload.product, "Lead product must match payload");
    assert(createdLead1?.grade === rfqPayload.grade, "Lead grade must match payload");
    assert(createdLead1?.quantity === rfqPayload.quantity, "Lead quantity must match payload");
    assert(createdLead1?.packaging === rfqPayload.packaging, "Lead packaging must match payload");
    assert(createdLead1?.port === rfqPayload.port, "Lead port must match payload");
    assert(createdLead1?.incoterm === rfqPayload.incoterm, "Lead incoterm must match payload");
    assert(createdLead1?.sampleRequired === rfqPayload.sampleRequired, "Lead sampleRequired must match payload");
    assert(createdLead1?.containerType === "40ft FCL", "Lead containerType must be '40ft FCL'");
    assert(createdLead1?.source === "Website RFQ", "Lead source must be 'Website RFQ'");
    assert(createdLead1?.status === "New Lead", "New RFQ lead must default to 'New Lead' status");
    console.log(`✓ RFQ API successfully created lead with RFQ ID: ${createdLead1?.rfqId}`);
    console.log("✓ All RFQ specification fields verified in database.");

    // -------------------------------------------------------------
    // TEST 3: RFQ ID Sequential Uniqueness
    // -------------------------------------------------------------
    console.log("\n--- TEST 3: RFQ ID Generation & Sequential Uniqueness ---");
    const rfqPayload2 = {
      ...rfqPayload,
      email: `${testEmailPrefix}_2@alemirates.example`,
      company: "Al-Emirates Sub-division",
      containerType: "20ft FCL",
      source: "Product Page Direct",
    };

    const res2 = await fetch(`${baseUrl}/api/public/rfq`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rfqPayload2),
    });
    assert(res2.status === 201, `Expected status 201 for second RFQ, got ${res2.status}`);
    const res2Json = await res2.json();
    const createdLead2 = await Lead.findById(res2Json.data.id).lean();

    assert(createdLead2?.rfqId !== createdLead1?.rfqId, "Consecutive RFQ IDs must be distinct");
    const id1Num = parseInt(createdLead1!.rfqId!.split("-")[2], 10);
    const id2Num = parseInt(createdLead2!.rfqId!.split("-")[2], 10);
    assert(id2Num === id1Num + 1, `Consecutive RFQ IDs must be sequential (+1). Got ${id1Num} then ${id2Num}`);
    assert(createdLead2?.containerType === "20ft FCL", "Container type '20ft FCL' saved correctly");
    assert(createdLead2?.source === "Product Page Direct", "Lead source 'Product Page Direct' saved correctly");
    console.log(`✓ Sequential RFQ IDs verified: ${createdLead1?.rfqId} -> ${createdLead2?.rfqId}`);

    // -------------------------------------------------------------
    // TEST 4: Lead Sources (All Phase 1 sources supported)
    // -------------------------------------------------------------
    console.log("\n--- TEST 4: Lead Sources Compatibility ---");
    const sourcesToTest = ["WhatsApp", "Referral", "Country"];
    for (const src of sourcesToTest) {
      const res = await fetch(`${baseUrl}/api/public/rfq`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...rfqPayload,
          email: `${testEmailPrefix}_src_${src.toLowerCase()}@example.com`,
          source: src,
        }),
      });
      assert(res.status === 201, `Expected 201 for source ${src}`);
      const data = await res.json();
      const lead = await Lead.findById(data.data.id).lean();
      assert(lead?.source === src, `Expected lead source to be '${src}', got '${lead?.source}'`);
    }
    console.log("✓ All lead sources verified ('Website RFQ', 'Product Page Direct', 'WhatsApp', 'Referral', 'Country').");

    // -------------------------------------------------------------
    // TEST 5: Automatic Assignment - Round Robin
    // -------------------------------------------------------------
    console.log("\n--- TEST 5: Automatic Assignment - Round Robin ---");
    // Configure assignment config with round robin between userA and userB
    await AssignmentConfig.deleteMany({});
    const rrConfig = await AssignmentConfig.create({
      enabled: true,
      defaultMode: "round_robin",
      roundRobinUserIds: [userA._id, userB._id],
      roundRobinLastIndex: -1,
      countryRules: [],
      productRules: [],
      fallbackUserId: userA._id,
    });

    const leadRR1Res = await fetch(`${baseUrl}/api/public/rfq`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...rfqPayload,
        email: `${testEmailPrefix}_rr1@example.com`,
      }),
    });
    const leadRR1Json = await leadRR1Res.json();
    const leadRR1 = await Lead.findById(leadRR1Json.data.id).lean();
    assert(
      String(leadRR1?.assignedToId) === String(userA._id),
      `Lead RR1 must be assigned to User A (${userA.name}), got ${leadRR1?.assignedToId}`
    );
    assert(leadRR1?.assignmentDetails?.assignedBy === "round_robin", "Assignment details assignedBy must be 'round_robin'");

    const leadRR2Res = await fetch(`${baseUrl}/api/public/rfq`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...rfqPayload,
        email: `${testEmailPrefix}_rr2@example.com`,
      }),
    });
    const leadRR2Json = await leadRR2Res.json();
    const leadRR2 = await Lead.findById(leadRR2Json.data.id).lean();
    assert(
      String(leadRR2?.assignedToId) === String(userB._id),
      `Lead RR2 must be assigned to User B (${userB.name}), got ${leadRR2?.assignedToId}`
    );
    assert(leadRR2?.assignmentDetails?.assignedBy === "round_robin", "Assignment details assignedBy must be 'round_robin'");

    // Third lead should cycle back to userA
    const leadRR3Res = await fetch(`${baseUrl}/api/public/rfq`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...rfqPayload,
        email: `${testEmailPrefix}_rr3@example.com`,
      }),
    });
    const leadRR3Json = await leadRR3Res.json();
    const leadRR3 = await Lead.findById(leadRR3Json.data.id).lean();
    assert(
      String(leadRR3?.assignedToId) === String(userA._id),
      `Lead RR3 must cycle back to User A (${userA.name}), got ${leadRR3?.assignedToId}`
    );
    console.log("✓ Round robin automatic assignment successfully cycled across users (A -> B -> A).");

    // -------------------------------------------------------------
    // TEST 6: Automatic Assignment - Country Rule
    // -------------------------------------------------------------
    console.log("\n--- TEST 6: Automatic Assignment - Country Rule ---");
    // Add rule: leads from "Germany" go to userB
    await AssignmentConfig.findOneAndUpdate(
      {},
      {
        $set: {
          defaultMode: "country",
          countryRules: [{ country: "Germany", userId: userB._id }],
        },
      }
    );

    const leadCountryRes = await fetch(`${baseUrl}/api/public/rfq`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...rfqPayload,
        country: "Germany",
        email: `${testEmailPrefix}_germany@example.de`,
      }),
    });
    const leadCountryJson = await leadCountryRes.json();
    assert(leadCountryJson.success === true, `Failed country RFQ: ${JSON.stringify(leadCountryJson)}`);
    const leadCountry = await Lead.findById(leadCountryJson.data.id).lean();
    assert(
      String(leadCountry?.assignedToId) === String(userB._id),
      `Germany lead must be assigned to User B, got ${leadCountry?.assignedToId}`
    );
    assert(leadCountry?.assignmentDetails?.assignedBy === "country", "Assignment details assignedBy must be 'country'");
    console.log("✓ Country-based assignment rule successfully matched and assigned to designated user.");

    // -------------------------------------------------------------
    // TEST 7: Automatic Assignment - Product Rule
    // -------------------------------------------------------------
    console.log("\n--- TEST 7: Automatic Assignment - Product Rule ---");
    // Add rule: leads for product matching "Guar Gum" go to userC
    await AssignmentConfig.findOneAndUpdate(
      {},
      {
        $set: {
          defaultMode: "product",
          productRules: [{ product: "Guar Gum", userId: userC._id }],
        },
      }
    );

    const leadProductRes = await fetch(`${baseUrl}/api/public/rfq`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...rfqPayload,
        product: "Fast Hydration Guar Gum Powder 5000 CPS",
        email: `${testEmailPrefix}_guargum@example.com`,
      }),
    });
    const leadProductJson = await leadProductRes.json();
    assert(leadProductJson.success === true, `Failed product RFQ: ${JSON.stringify(leadProductJson)}`);
    const leadProduct = await Lead.findById(leadProductJson.data.id).lean();
    assert(
      String(leadProduct?.assignedToId) === String(userC._id),
      `Guar Gum lead must be assigned to User C (Specialist), got ${leadProduct?.assignedToId}`
    );
    assert(leadProduct?.assignmentDetails?.assignedBy === "product", "Assignment details assignedBy must be 'product'");
    console.log("✓ Product-based assignment rule successfully matched keyword and assigned to specialist.");

    // -------------------------------------------------------------
    // TEST 8: Manual Assignment & Manual Reassignment Tracking
    // -------------------------------------------------------------
    console.log("\n--- TEST 8: Manual Assignment and Reassignment Tracking ---");
    // Create a lead manually via leadsService with manual assignment to userA
    const manualLead = await leadsService.createLead(
      {
        name: "Manual Lead Buyer",
        company: "Direct Imports Corp",
        country: "United Kingdom",
        phone: "+44 20 7946 0958",
        email: `${testEmailPrefix}_manual@example.co.uk`,
        assignedToId: String(userA._id),
        product: "Moringa Powder",
        quantity: "5 MT",
        source: "Referral",
      },
      actor
    );

    const fetchedManualLead1 = await Lead.findById(manualLead.id).lean();
    assert(
      String(fetchedManualLead1?.assignedToId) === String(userA._id),
      "Manual lead must be assigned to User A"
    );
    assert(
      fetchedManualLead1?.assignmentDetails?.assignedBy === "manual",
      "Manual assignment method must be 'manual'"
    );

    // Now reassign to userC
    await leadsService.updateLead(
      manualLead.id,
      {
        assignedToId: String(userC._id),
      },
      actor
    );

    const fetchedManualLead2 = await Lead.findById(manualLead.id).lean();
    assert(
      String(fetchedManualLead2?.assignedToId) === String(userC._id),
      "Reassigned lead must be assigned to User C"
    );
    assert(
      String(fetchedManualLead2?.assignmentDetails?.previousAssigneeId) === String(userA._id),
      "previousAssigneeId must be User A"
    );
    assert(
      Boolean(fetchedManualLead2?.assignmentDetails?.reassignedAt),
      "reassignedAt timestamp must be recorded"
    );
    console.log("✓ Manual assignment and subsequent reassignment with audit history verified.");

    // -------------------------------------------------------------
    // TEST 9: Full Sales Pipeline Transition Flow (11 Stages in Sequence)
    // -------------------------------------------------------------
    console.log("\n--- TEST 9: Complete 11-Stage Pipeline Progression ---");
    // Create a fresh RFQ lead and transition it through every single stage
    const pipelineLeadDoc = await leadsService.createLead(
      {
        name: "Global Pipeline Test Client",
        company: "Trans-Continental Trading Ltd",
        country: "Singapore",
        phone: "+65 6789 0123",
        email: `${testEmailPrefix}_pipeline@singapore.example`,
        product: "Indian Long Pepper",
        quantity: "20 MT",
        source: "Website RFQ",
      },
      actor
    );

    let currentLead = await Lead.findById(pipelineLeadDoc.id);
    assert(currentLead?.status === "New Lead", "Initial stage must be 'New Lead'");
    console.log(`Step 1: ${currentLead?.status}`);

    for (let step = 1; step < EXPECTED_11_STAGES.length; step++) {
      const nextStage = EXPECTED_11_STAGES[step];
      await leadsService.updateLead(
        pipelineLeadDoc.id,
        { status: nextStage as any },
        actor
      );

      const updatedLead = await Lead.findById(pipelineLeadDoc.id).lean();
      assert(
        updatedLead?.status === nextStage,
        `Expected status to be '${nextStage}', but got '${updatedLead?.status}'`
      );
      console.log(`Step ${step + 1}: ${updatedLead?.status}`);
    }

    console.log("✓ Full sequential transition across all 11 stages completed and persisted in DB.");

    // -------------------------------------------------------------
    // TEST 10: Existing Lead Data Migration & Integrity Check
    // -------------------------------------------------------------
    console.log("\n--- TEST 10: Existing Lead Data Migration & Non-loss Check ---");
    // Create dummy leads with legacy statuses
    // Insert raw legacy leads using collection.insertOne to bypass Mongoose enum check
    const legacyLead1Id = new mongoose.Types.ObjectId();
    await Lead.collection.insertOne({
      _id: legacyLead1Id,
      leadCode: `VO-LEGACY-001-${Date.now()}`,
      name: "Legacy Buyer One",
      company: "Old Trade Inc",
      status: "New", // Legacy status
      source: "Direct Inquiry",
      country: "Canada",
      phoneNumber: "+1 416 555 0199",
      email: `${testEmailPrefix}_legacy1@example.ca`,
      priority: "Medium",
      archived: false,
      revision: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const legacyLead2Id = new mongoose.Types.ObjectId();
    await Lead.collection.insertOne({
      _id: legacyLead2Id,
      leadCode: `VO-LEGACY-002-${Date.now()}`,
      name: "Legacy Buyer Two",
      company: "Historic Imports Ltd",
      status: "Contacted", // Legacy status
      source: "Exhibition",
      country: "Australia",
      phoneNumber: "+61 2 9876 5432",
      email: `${testEmailPrefix}_legacy2@example.com.au`,
      priority: "Medium",
      archived: false,
      revision: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Run the backfill migration function
    await backfillLeadPipelineFields();

    const migratedLead1 = await Lead.findById(legacyLead1Id).lean();
    const migratedLead2 = await Lead.findById(legacyLead2Id).lean();

    assert(
      migratedLead1?.status === "New Lead",
      `Legacy 'New' must be safely migrated to 'New Lead', got '${migratedLead1?.status}'`
    );
    assert(
      migratedLead2?.status === "Verification",
      `Legacy 'Contacted' must be safely migrated to 'Verification', got '${migratedLead2?.status}'`
    );
    assert(migratedLead1?.company === "Old Trade Inc", "Lead company must remain untouched");
    assert(migratedLead2?.company === "Historic Imports Ltd", "Lead company must remain untouched");
    console.log("✓ Legacy statuses migrated safely with zero data loss or corruption.");

    // -------------------------------------------------------------
    // TEST 11: Lead Detail & Pipeline Query Serialization
    // -------------------------------------------------------------
    console.log("\n--- TEST 11: Lead Detail and List Serialization ---");
    const leadDetailRes = await leadsService.getLead(pipelineLeadDoc.id);
    const leadDetail = leadDetailRes.lead;
    assert(leadDetail.status === "Closed", `Lead detail must reflect final pipeline stage, got ${leadDetail.status}`);
    assert(leadDetail.rfqId !== undefined, "Serialized lead detail must contain rfqId");
    assert(leadDetail.product === "Indian Long Pepper", "Serialized lead detail must contain product");
    assert(leadDetail.quantity === "20 MT", "Serialized lead detail must contain quantity");

    const leadList = await leadsService.listLeads(
      { search: leadDetail.rfqId },
      actor
    );
    assert(
      leadList.items.some((i) => i.id === pipelineLeadDoc.id),
      "Searching by RFQ ID in list leads must find the lead"
    );
    console.log("✓ Lead detail and list view queries serialize all Phase 1 fields and search by RFQ ID.");

    // Cleanup test data
    console.log("\n[Cleanup] Removing temporary test leads...");
    await Lead.deleteMany({ email: { $regex: new RegExp(`^${testEmailPrefix}`) } });
    console.log("✓ Cleanup finished.");

    console.log("\n=================================================================");
    console.log("     ALL CRM PHASE 1 VERIFICATION TESTS PASSED SUCCESSFULLY!     ");
    console.log("=================================================================\n");
  } finally {
    if (server) {
      server.close();
    }
    await mongoose.disconnect();
  }
}

runTests().catch((err) => {
  console.error("\n❌ TEST SUITE FAILED WITH ERROR:");
  console.error(err);
  if (server) server.close();
  mongoose.disconnect().finally(() => {
    process.exit(1);
  });
});
