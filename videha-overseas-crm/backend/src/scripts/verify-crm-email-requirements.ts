import "dotenv/config";
import http from "node:http";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { createApp } from "../app";
import { connectDatabase } from "../db/connect";
import { Lead } from "../models/Lead";
import { User } from "../models/User";
import { Role } from "../models/Role";
import { Task } from "../models/Task";
import { FollowUp } from "../models/FollowUp";
import { EmailReminderLog } from "../models/EmailReminderLog";
import { backfillNullClientRequestIds } from "../db/backfillRevisions";
import {
  getSentReminderEmails,
  clearSentReminderEmails,
  getLatestReminderEmailFor,
} from "../services/emailReminder.service";
import { checkFollowUpReminders } from "../services/followupReminder.service";

let server: http.Server;
let baseUrl: string;

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(`ASSERTION FAILED: ${message}`);
  }
}

async function runVerification() {
  console.log("=================================================================");
  console.log("   VIDEHA OVERSEAS CRM - TASK/FOLLOW-UP EMAIL REMINDERS &        ");
  console.log("              LOGIN EMAIL MANAGEMENT VERIFICATION                ");
  console.log("=================================================================\n");

  await connectDatabase();
  await backfillNullClientRequestIds();

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

  const timestamp = Date.now();
  const originalUserEmail = `verify.sales.${timestamp}@videhaoverseas.com`;
  const updatedUserEmail = `verify.sales.new.${timestamp}@videhaoverseas.com`;
  const testPassword = "Password123!";

  let testUserId: string = "";
  let testLeadId: string = "";
  let testTaskId: string = "";
  let testFollowUpId: string = "";
  let testTaskId2: string = "";
  let authToken: string = "";

  const results: Record<string, boolean> = {
    taskDueTodayReminderEmail: false,
    followUpDueTodayReminderEmail: false,
    emailFormatAndFieldsCorrect: false,
    changeLoginEmailInCrm: false,
    loginWithNewEmail: false,
    oldEmailRejected: false,
    newReminderSentToNewEmail: false,
    rolesPermissionsDataPreserved: false,
    existingCrmDataIntact: false,
  };

  try {
    // 0. Setup: Create test user, role check, and test lead
    console.log("[Setup] Creating test team member and test lead...");
    const salesRole = await Role.findOne({ name: "SALES_CRM" });
    assert(salesRole, "SALES_CRM role must exist");

    const passwordHash = await bcrypt.hash(testPassword, 10);
    const testUser = await User.create({
      name: `Test Agent ${timestamp}`,
      email: originalUserEmail,
      passwordHash,
      roleId: salesRole!._id,
      roleName: "SALES_CRM",
      status: "active",
      phone: "+91 98765 43210",
      designation: "International Trade Executive",
    });
    testUserId = String(testUser._id);

    const testLead = await Lead.create({
      leadCode: `TEST-LEAD-${timestamp}`,
      name: "Acme Buyer",
      company: "Acme Global Imports",
      email: "buyer@acmeglobal.com",
      phoneNumber: "+1 555 123 4567",
      whatsAppNumber: "+1 555 123 4567",
      country: "United States",
      source: "Manual",
      productInterest: "Spices & Agro",
      status: "Qualified",
      priority: "High",
      assignedToId: testUser._id,
    });
    testLeadId = String(testLead._id);

    // Login as the test user to get JWT token
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: originalUserEmail, password: testPassword }),
    });
    assert(loginRes.status === 200, `Initial login failed: ${loginRes.status}`);
    const loginData = await loginRes.json();
    authToken = loginData.data.token;
    assert(authToken, "Login must return JWT token");
    console.log(`✓ Test user authenticated (${originalUserEmail}).\n`);

    // Clear ledger before test
    clearSentReminderEmails();

    // =========================================================================
    // STEP 1: Assign a task with today's due date → assigned user receives reminder email
    // =========================================================================
    console.log("-----------------------------------------------------------------");
    console.log(" VERIFICATION 1: Assign Task Due Today -> Reminder Email");
    console.log("-----------------------------------------------------------------");

    const todayDate = new Date();
    const taskRes = await fetch(`${baseUrl}/api/tasks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        title: "Send Spice Sample Catalog",
        description: "Send organic turmeric and cumin specifications to client.",
        assignedToId: testUserId,
        relatedLeadId: testLeadId,
        priority: "High",
        dueDate: todayDate.toISOString(),
      }),
    });
    assert(taskRes.status === 200 || taskRes.status === 201, `Create task failed: ${taskRes.status}`);
    const taskData = await taskRes.json();
    testTaskId = taskData.data.id;

    // Wait brief moment for async email dispatch
    await new Promise((r) => setTimeout(r, 200));

    const taskEmail = getLatestReminderEmailFor(originalUserEmail);
    assert(taskEmail, `No reminder email sent to ${originalUserEmail} for task due today`);
    assert(taskEmail?.itemType === "Task", "Sent email itemType must be 'Task'");
    assert(taskEmail?.to === originalUserEmail.toLowerCase(), "Sent email recipient must match user's login email");
    console.log(`✓ Reminder email received by ${taskEmail?.to} for task "${taskEmail?.title}"`);
    results.taskDueTodayReminderEmail = true;

    // =========================================================================
    // STEP 2: Assign a follow-up with today's due date → assigned user receives reminder email
    // =========================================================================
    console.log("\n-----------------------------------------------------------------");
    console.log(" VERIFICATION 2: Assign Follow-up Due Today -> Reminder Email");
    console.log("-----------------------------------------------------------------");

    const fuRes = await fetch(`${baseUrl}/api/follow-ups`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        leadId: testLeadId,
        assignedToId: testUserId,
        dueAt: todayDate.toISOString(),
        type: "Call",
        notes: "Call Acme purchasing director to review FOB terms",
      }),
    });
    assert(fuRes.status === 200 || fuRes.status === 201, `Create follow-up failed: ${fuRes.status}`);
    const fuData = await fuRes.json();
    testFollowUpId = fuData.data.id;

    await new Promise((r) => setTimeout(r, 200));

    const allEmails = getSentReminderEmails();
    const fuEmail = allEmails.find((e) => e.itemType === "Follow-up" && e.to === originalUserEmail.toLowerCase());
    assert(fuEmail, `No reminder email sent to ${originalUserEmail} for follow-up due today`);
    console.log(`✓ Reminder email received by ${fuEmail?.to} for follow-up "${fuEmail?.title}"`);
    results.followUpDueTodayReminderEmail = true;

    // =========================================================================
    // STEP 3: Email format and fields verification
    // =========================================================================
    console.log("\n-----------------------------------------------------------------");
    console.log(" VERIFICATION 3: Email Format, Placeholders & Content");
    console.log("-----------------------------------------------------------------");

    // Inspect taskEmail format:
    // Subject: Reminder: Task/Follow-up Due Today – {Lead/Customer Name}
    console.log(`Task Email Subject: "${taskEmail?.subject}"`);
    assert(
      taskEmail?.subject.includes("Reminder:") &&
      taskEmail?.subject.includes("Due Today") &&
      taskEmail?.subject.includes("Acme Global Imports"),
      `Task email subject format incorrect: ${taskEmail?.subject}`,
    );

    // Body content checks
    console.log(`Task Email Body:\n${taskEmail?.text}\n`);
    assert(taskEmail?.text.includes(`Hello ${testUser.name},`), "Email body must contain Hello {User Name}");
    assert(taskEmail?.text.includes("This is a reminder that the following Task is due today:"), "Email body must state item is due today");
    assert(taskEmail?.text.includes("**Task/Follow-up:** Send Spice Sample Catalog"), "Email body must have **Task/Follow-up:** {Title}");
    assert(taskEmail?.text.includes("**Lead/Customer:** Acme Global Imports"), "Email body must have **Lead/Customer:** {Lead/Customer Name}");
    assert(taskEmail?.text.includes("**Due Date:**"), "Email body must have **Due Date:**");
    assert(taskEmail?.text.includes("Videha Overseas CRM"), "Email body must identify Videha Overseas CRM");

    // Follow-up email content checks
    console.log(`Follow-up Email Subject: "${fuEmail?.subject}"`);
    assert(
      fuEmail?.subject.includes("Reminder:") &&
      fuEmail?.subject.includes("Due Today") &&
      fuEmail?.subject.includes("Acme Global Imports"),
      `Follow-up email subject format incorrect: ${fuEmail?.subject}`,
    );
    assert(fuEmail?.text.includes("Call Follow-up"), "Follow-up email body must contain follow-up title");
    assert(fuEmail?.text.includes("Acme Global Imports"), "Follow-up email body must contain lead company name");

    console.log("✓ All email fields (Title, Lead/Customer, Due Date, Due Today notice, CRM signature) verified.");
    results.emailFormatAndFieldsCorrect = true;

    // =========================================================================
    // STEP 4: Change user's login email inside CRM
    // =========================================================================
    console.log("\n-----------------------------------------------------------------");
    console.log(" VERIFICATION 4: Change User's Login Email Inside CRM");
    console.log("-----------------------------------------------------------------");

    const changeEmailRes = await fetch(`${baseUrl}/api/auth/change-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        newEmail: updatedUserEmail,
        currentPassword: testPassword,
      }),
    });
    assert(changeEmailRes.status === 200, `Change email failed: ${changeEmailRes.status}`);
    const changeEmailData = await changeEmailRes.json();
    assert(changeEmailData.success === true, "Change email success must be true");
    assert(changeEmailData.data.user.email === updatedUserEmail.toLowerCase(), "Updated user email returned");
    console.log(`✓ Email changed inside CRM from ${originalUserEmail} -> ${updatedUserEmail}`);
    results.changeLoginEmailInCrm = true;

    // =========================================================================
    // STEP 5: Log out and verify user can log in using NEW email
    // =========================================================================
    console.log("\n-----------------------------------------------------------------");
    console.log(" VERIFICATION 5: Login with NEW Email");
    console.log("-----------------------------------------------------------------");

    // Simulate logout
    await fetch(`${baseUrl}/api/auth/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${authToken}` },
    });

    const newLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: updatedUserEmail, password: testPassword }),
    });
    assert(newLoginRes.status === 200, `Login with new email failed: ${newLoginRes.status}`);
    const newLoginData = await newLoginRes.json();
    assert(newLoginData.success === true, "Login with new email must succeed");
    assert(newLoginData.data.user.email === updatedUserEmail.toLowerCase(), "Logged-in user email must match new email");
    const newAuthToken = newLoginData.data.token;
    assert(newAuthToken, "New login must return valid JWT token");
    console.log(`✓ Successfully logged in with new email: ${updatedUserEmail}`);
    results.loginWithNewEmail = true;

    // =========================================================================
    // STEP 6: Verify old email no longer works as the login email
    // =========================================================================
    console.log("\n-----------------------------------------------------------------");
    console.log(" VERIFICATION 6: Verify OLD Email No Longer Works");
    console.log("-----------------------------------------------------------------");

    const oldLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: originalUserEmail, password: testPassword }),
    });
    assert(oldLoginRes.status === 401, `Old email login must fail with 401, got ${oldLoginRes.status}`);
    console.log(`✓ Old email (${originalUserEmail}) successfully rejected with 401 Unauthorized.`);
    results.oldEmailRejected = true;

    // =========================================================================
    // STEP 7: Assign/create new due-today task → reminder goes to NEW email
    // =========================================================================
    console.log("\n-----------------------------------------------------------------");
    console.log(" VERIFICATION 7: Due-Today Task Reminder Goes to NEW Email");
    console.log("-----------------------------------------------------------------");

    clearSentReminderEmails();

    const task2Res = await fetch(`${baseUrl}/api/tasks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${newAuthToken}`,
      },
      body: JSON.stringify({
        title: "Confirm Vessel Booking for Acme Order",
        description: "Verify BL draft and shipping schedule.",
        assignedToId: testUserId,
        relatedLeadId: testLeadId,
        priority: "Urgent",
        dueDate: new Date().toISOString(),
      }),
    });
    if (!task2Res.ok) {
      const errBody = await task2Res.text();
      assert(false, `Create task 2 failed: ${task2Res.status} - ${errBody}`);
    }
    const task2Data = await task2Res.json();
    testTaskId2 = task2Data.data.id;

    await new Promise((r) => setTimeout(r, 200));

    // Check sent emails:
    const newEmailReminder = getLatestReminderEmailFor(updatedUserEmail);
    assert(newEmailReminder, `Reminder email was NOT sent to new email ${updatedUserEmail}`);
    assert(newEmailReminder?.to === updatedUserEmail.toLowerCase(), `Recipient must be ${updatedUserEmail}`);
    assert(newEmailReminder?.title === "Confirm Vessel Booking for Acme Order", "Task title matches");

    // Also verify NO email was sent to old email
    const oldEmailReminder = getLatestReminderEmailFor(originalUserEmail);
    assert(!oldEmailReminder, "Old email must NEVER receive new reminder emails!");
    console.log(`✓ New reminder email sent exclusively to NEW email: ${newEmailReminder?.to}`);
    results.newReminderSentToNewEmail = true;

    // =========================================================================
    // STEP 8: Existing role/permissions and CRM data remain unchanged
    // =========================================================================
    console.log("\n-----------------------------------------------------------------");
    console.log(" VERIFICATION 8: Preserve Role, Permissions & CRM History");
    console.log("-----------------------------------------------------------------");

    const refreshedUser = await User.findById(testUserId).populate("roleId");
    assert(refreshedUser, "User record must still exist (not deleted or recreated)");
    assert(String(refreshedUser?._id) === testUserId, "User _id must be exactly preserved (same account)");
    assert(refreshedUser?.roleName === "SALES_CRM", "User roleName must remain SALES_CRM");
    assert(String(refreshedUser?.roleId._id) === String(salesRole!._id), "User roleId must remain unchanged");

    // Check lead assignment preserved
    const leadCheck = await Lead.findById(testLeadId);
    assert(String(leadCheck?.assignedToId) === testUserId, "Lead assignment must be preserved");

    // Check task assignment preserved
    const taskCheck = await Task.findById(testTaskId);
    assert(String(taskCheck?.assignedToId) === testUserId, "Task assignment must be preserved");

    // Check follow-up assignment preserved
    const fuCheck = await FollowUp.findById(testFollowUpId);
    assert(String(fuCheck?.assignedToId) === testUserId, "Follow-up assignment must be preserved");

    console.log("✓ User account preserved (same _id, role, permissions, lead, task, and follow-up links).");
    results.rolesPermissionsDataPreserved = true;

    // Check existing system users: Super Admin, Shilpa, Sejal
    const superAdmin = await User.findOne({ email: "superadmin@videhaoverseas.com" });
    assert(superAdmin, "Super Admin user must remain intact");
    const shilpa = await User.findOne({ email: "shilpasachin31@gmail.com" });
    assert(shilpa, "Shilpa Shelar user must remain intact");
    const sejal = await User.findOne({ email: "sejalbidgar@gmail.com" });
    assert(sejal, "Sejal Bidgar user must remain intact");
    console.log("✓ All existing core CRM users remain intact.");
    results.existingCrmDataIntact = true;

  } finally {
    // Cleanup temporary test records created by this verification run
    console.log("\n[Cleanup] Cleaning up temporary test records...");
    if (testUserId) {
      await User.deleteOne({ _id: testUserId });
      await Task.deleteMany({ assignedToId: testUserId });
      await FollowUp.deleteMany({ assignedToId: testUserId });
    }
    if (testLeadId) {
      await Lead.deleteOne({ _id: testLeadId });
    }
    if (testTaskId) await Task.deleteOne({ _id: testTaskId });
    if (testTaskId2) await Task.deleteOne({ _id: testTaskId2 });
    if (testFollowUpId) await FollowUp.deleteOne({ _id: testFollowUpId });
    await EmailReminderLog.deleteMany({
      to: { $in: [originalUserEmail.toLowerCase(), updatedUserEmail.toLowerCase()] },
    });

    server.close();
    console.log("[Cleanup] Done.");
  }

  // Print Summary
  console.log("\n=================================================================");
  console.log("                   VERIFICATION SUMMARY                          ");
  console.log("=================================================================");
  let allPass = true;
  for (const [key, pass] of Object.entries(results)) {
    console.log(`  ${pass ? "PASS" : "FAIL"}: ${key}`);
    if (!pass) allPass = false;
  }
  console.log("=================================================================");
  console.log(`OVERALL RESULT: ${allPass ? "PASS" : "FAIL"}\n`);

  if (!allPass) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runVerification().catch((err) => {
  console.error("\nFATAL ERROR DURING VERIFICATION:", err);
  if (server) server.close();
  process.exit(1);
});
