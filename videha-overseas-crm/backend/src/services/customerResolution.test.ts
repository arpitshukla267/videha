import mongoose, { Types } from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { Company } from "../models/Company";
import { Customer } from "../models/Customer";
import {
  dryRunResolveCustomer,
  resolveOrCreateCustomerForOrder,
  normalizeComparableName,
} from "./customerResolution.service";
import { nextCompanyCode, nextCustomerCode } from "../utils/codes";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

async function runTests() {
  console.log("Connecting to MongoDB for regression testing...");
  await mongoose.connect(process.env.MONGODB_URI as string);

  try {
    // ----------------------------------------------------
    // Test Unit: Normalization function
    // ----------------------------------------------------
    console.log("\n=== Unit: Normalization Tests ===");
    const name1 = normalizeComparableName("Al-Mansoor General Trading LLC");
    const name2 = normalizeComparableName("Al Mansoor General Trading LLC");
    const name3 = normalizeComparableName("Al–Mansoor General Trading L.L.C.");
    if (name1 !== name2 || name2 !== name3) {
      throw new Error(`Normalization failure: ${name1} vs ${name2} vs ${name3}`);
    }
    console.log("✓ Normalization handles hyphens, en-dashes, and punctuation identically:", name1);

    // ----------------------------------------------------
    // Test 1 & 2: Real DB regression tests with VO-CU-103
    // ----------------------------------------------------
    console.log("\n=== Regression Test 1 & 2: Tariq Al-Mansoor Resolution ===");

    // Test 1: "Al-Mansoor General Trading LLC" + "Tariq Al-Mansoor"
    const r1 = await dryRunResolveCustomer({
      customerName: "Tariq Al-Mansoor",
      company: "Al-Mansoor General Trading LLC",
    });
    console.log('Result 1 ("Al-Mansoor General Trading LLC" + "Tariq Al-Mansoor"):', r1);
    if (r1.type !== "existing" || r1.customerCode !== "VO-CU-103") {
      throw new Error(`Expected existing customer VO-CU-103, got ${JSON.stringify(r1)}`);
    }
    console.log("✓ Test 1 passed: Matches existing customer VO-CU-103");

    // Test 2: "Al Mansoor General Trading LLC" + "Tariq Al-Mansoor" (No hyphen in company)
    const r2 = await dryRunResolveCustomer({
      customerName: "Tariq Al-Mansoor",
      company: "Al Mansoor General Trading LLC",
    });
    console.log('Result 2 ("Al Mansoor General Trading LLC" + "Tariq Al-Mansoor"):', r2);
    if (r2.type !== "existing" || r2.customerCode !== "VO-CU-103") {
      throw new Error(`Expected existing customer VO-CU-103, got ${JSON.stringify(r2)}`);
    }
    console.log("✓ Test 2 passed: Resolves to same existing customer VO-CU-103");

    // Test 2b: "Al Mansoor General Trading LLC" + "Tariq Al Mansoor" (No hyphen in both)
    const r2b = await dryRunResolveCustomer({
      customerName: "Tariq Al Mansoor",
      company: "Al Mansoor General Trading LLC",
    });
    console.log('Result 2b ("Al Mansoor General Trading LLC" + "Tariq Al Mansoor"):', r2b);
    if (r2b.type !== "existing" || r2b.customerCode !== "VO-CU-103") {
      throw new Error(`Expected existing customer VO-CU-103, got ${JSON.stringify(r2b)}`);
    }
    console.log("✓ Test 2b passed: Resolves to same existing customer VO-CU-103");

    // ----------------------------------------------------
    // Test 3: Same name + different company → NOT a match
    // ----------------------------------------------------
    console.log("\n=== Regression Test 3: Same name + different company ===");
    const r3 = await dryRunResolveCustomer({
      customerName: "Tariq Al-Mansoor",
      company: "Completely Different Enterprise FZCO",
    });
    console.log("Result 3:", r3);
    if (r3.type === "existing") {
      throw new Error(`Expected new customer, got existing customer ${r3.customerCode}`);
    }
    if (r3.type !== "new") {
      throw new Error(`Expected new customer, got ${JSON.stringify(r3)}`);
    }
    console.log("✓ Test 3 passed: Same name under different company is NOT a match (returns new)");

    // ----------------------------------------------------
    // Test 4: Same company + same name with multiple customers → ambiguous
    // ----------------------------------------------------
    console.log("\n=== Regression Test 4: Multiple customers with same name under company ===");
    const testActorId = new Types.ObjectId();
    const tempCompCode = await nextCompanyCode();
    const tempComp = await Company.create({
      companyCode: tempCompCode,
      name: "Ambiguity Test Company Ltd",
      legalName: "Ambiguity Test Company Ltd",
      country: "United Arab Emirates",
      createdById: testActorId,
    });

    const c1Code = await nextCustomerCode();
    await Customer.create({
      customerCode: c1Code,
      companyId: tempComp._id,
      name: "Suresh-Kumar",
      email: "suresh1@ambiguity-test.com",
      createdById: testActorId,
    });

    const c2Code = await nextCustomerCode();
    await Customer.create({
      customerCode: c2Code,
      companyId: tempComp._id,
      name: "Suresh Kumar",
      email: "suresh2@ambiguity-test.com",
      createdById: testActorId,
    });

    // Test dryRun on this ambiguous company
    const r4DryRun = await dryRunResolveCustomer({
      customerName: "Suresh Kumar",
      company: "Ambiguity Test Company Ltd",
    });
    console.log("Result 4 (dryRun):", r4DryRun);
    if (r4DryRun.type !== "ambiguous") {
      throw new Error(`Expected ambiguous result, got ${JSON.stringify(r4DryRun)}`);
    }

    // Test execute on this ambiguous company
    let caughtError: any = null;
    try {
      await resolveOrCreateCustomerForOrder(
        {
          customerName: "Suresh Kumar",
          company: "Ambiguity Test Company Ltd",
        },
        String(testActorId),
      );
    } catch (err: any) {
      caughtError = err;
    }
    if (!caughtError || caughtError.code !== "AMBIGUOUS_CUSTOMER_MATCH") {
      throw new Error(`Expected AMBIGUOUS_CUSTOMER_MATCH error, got ${caughtError}`);
    }
    console.log("✓ Test 4 passed: Multi-customer collision returns AMBIGUOUS_CUSTOMER_MATCH");

    // Clean up temporary test data
    await Customer.deleteMany({ companyId: tempComp._id });
    await Company.deleteOne({ _id: tempComp._id });

    // ----------------------------------------------------
    // Test 5: Same name alone without company → NOT a match
    // ----------------------------------------------------
    console.log("\n=== Regression Test 5: Name alone without company ===");
    const r5DryRun = await dryRunResolveCustomer({
      customerName: "Tariq Al-Mansoor",
      company: "",
    });
    console.log("Result 5 (dryRun):", r5DryRun);
    if (r5DryRun.type !== "error") {
      throw new Error(`Expected error for missing company, got ${JSON.stringify(r5DryRun)}`);
    }

    let caughtNoCompanyErr: any = null;
    try {
      await resolveOrCreateCustomerForOrder(
        {
          customerName: "Tariq Al-Mansoor",
          company: "",
        },
        String(testActorId),
      );
    } catch (err: any) {
      caughtNoCompanyErr = err;
    }
    if (!caughtNoCompanyErr || (caughtNoCompanyErr.statusCode !== 400 && caughtNoCompanyErr.status !== 400)) {
      throw new Error(`Expected 400 error for missing company, got ${caughtNoCompanyErr}`);
    }
    console.log("✓ Test 5 passed: Never matches by customer name alone without company");

    console.log("\n=================================");
    console.log("ALL 5 REGRESSION TESTS PASSED! ✓");
    console.log("=================================\n");
  } finally {
    await mongoose.disconnect();
  }
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
