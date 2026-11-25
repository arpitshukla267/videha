import { createApp } from "./app";
import { connectDatabase } from "./db/connect";
import { backfillMissingRevisions, backfillLeadPipelineFields, backfillFollowUpsFromLeads, backfillNullClientRequestIds, syncRolePermissionDefaults, backfillUserDepartments, ensureCoreCrmRolesAndUsers } from "./db/backfillRevisions";
import { env } from "./config/env";
import { checkFollowUpReminders } from "./services/followupReminder.service";

async function main() {
  await connectDatabase();
  await backfillMissingRevisions();
  await backfillNullClientRequestIds();
  await syncRolePermissionDefaults();
  await backfillUserDepartments();
  await ensureCoreCrmRolesAndUsers();
  await backfillLeadPipelineFields();
  await backfillFollowUpsFromLeads();

  // Run initial follow-up reminder check and schedule periodic checks every 15 minutes
  checkFollowUpReminders().catch((err) => {
    console.error("[CRM] Initial follow-up reminder check failed:", err);
  });
  setInterval(() => {
    checkFollowUpReminders().catch((err) => {
      console.error("[CRM] Periodic follow-up reminder check failed:", err);
    });
  }, 15 * 60 * 1000);

  const app = createApp();
  app.listen(env.port, () => {
    console.log(`[CRM] API listening on http://localhost:${env.port}`);
  });
}

main().catch((err) => {
  console.error("[CRM] Failed to start:", err);
  process.exit(1);
});
