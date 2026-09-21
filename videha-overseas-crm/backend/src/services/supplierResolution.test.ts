import {
  matchSupplierAmongPriorCandidates,
  toSupplierMatchCandidate,
  type SupplierResolutionInput,
} from "./supplierResolution.service";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

function priorFrom(input: SupplierResolutionInput, rowKey: string) {
  return toSupplierMatchCandidate(input, rowKey);
}

function runCsvMatchingTests() {
  console.log("\n=== Supplier CSV duplicate matching (in-memory) ===");

  const acmeBase: SupplierResolutionInput = {
    supplierName: "Granite Works",
    companyName: "Acme Stone Suppliers",
    email: "buyer@acme-stone.com",
    phone: "+91 98765 43210",
  };

  const priorAcme = [priorFrom(acmeBase, "2")];

  // Exact duplicate row
  {
    const result = matchSupplierAmongPriorCandidates({ ...acmeBase }, priorAcme);
    assert(result.type === "match", `Expected exact duplicate match, got ${result.type}`);
    assert(result.type === "match" && result.matchedBy === "email", "Expected email match for exact duplicate");
    console.log("✓ exact duplicate row");
  }

  // Same supplier with missing phone
  {
    const result = matchSupplierAmongPriorCandidates(
      {
        supplierName: "Granite Works",
        companyName: "Acme Stone Suppliers",
        email: "buyer@acme-stone.com",
      },
      priorAcme,
    );
    assert(result.type === "match" && result.matchedBy === "email", "Expected email match when phone missing");
    console.log("✓ same supplier with missing phone");
  }

  // Same supplier with missing email
  {
    const result = matchSupplierAmongPriorCandidates(
      {
        supplierName: "Granite Works",
        companyName: "Acme Stone Suppliers",
        phone: "+91 98765 43210",
      },
      priorAcme,
    );
    assert(result.type === "match" && result.matchedBy === "phone", "Expected phone match when email missing");
    console.log("✓ same supplier with missing email");
  }

  // Different formatting / hyphens / case
  {
    const result = matchSupplierAmongPriorCandidates(
      {
        supplierName: "granite works",
        companyName: "Acme-Stone Suppliers",
        email: " Buyer@ACME-Stone.COM ",
      },
      priorAcme,
    );
    assert(result.type === "match", "Expected match with normalized formatting");
    console.log("✓ different formatting/hyphens/case");
  }

  // Same name but different company — must NOT match
  {
    const result = matchSupplierAmongPriorCandidates(
      {
        supplierName: "Granite Works",
        companyName: "Different Trading LLC",
        email: "other@different.com",
        phone: "+91 11111 22222",
      },
      priorAcme,
    );
    assert(result.type === "none", "Expected no match for same name under different company");
    console.log("✓ same name but different supplier/company");
  }

  // Ambiguous: shared email across two earlier rows
  {
    const sharedEmail = "shared@vendor.com";
    const prior = [
      priorFrom(
        {
          supplierName: "Contact A",
          companyName: "Vendor Alpha",
          email: sharedEmail,
        },
        "2",
      ),
      priorFrom(
        {
          supplierName: "Contact B",
          companyName: "Vendor Beta",
          email: sharedEmail,
        },
        "3",
      ),
    ];
    const result = matchSupplierAmongPriorCandidates({ email: sharedEmail }, prior);
    assert(result.type === "ambiguous", "Expected ambiguous match for shared email");
    console.log("✓ ambiguous matches");
  }

  // Duplicate appearing later in the CSV
  {
    const first: SupplierResolutionInput = {
      supplierName: "Marble Source",
      companyName: "Marble Source Pvt Ltd",
      email: "sales@marble-source.com",
    };
    const prior = [priorFrom(first, "5")];
    const later = matchSupplierAmongPriorCandidates(
      {
        supplierName: "Marble Source",
        companyName: "Marble Source Pvt Ltd",
      },
      prior,
    );
    assert(later.type === "match" && later.matchedBy === "company_and_name", "Expected later-row duplicate");
    console.log("✓ duplicate appearing later in CSV");
  }

  // Company + name match when contact fields differ / missing
  {
    const first: SupplierResolutionInput = {
      supplierName: "Limestone Depot",
      companyName: "Limestone Depot",
      phone: "+971 50 123 4567",
    };
    const prior = [priorFrom(first, "8")];
    const result = matchSupplierAmongPriorCandidates(
      {
        supplierName: "Limestone Depot",
        companyName: "Limestone Depot",
        email: "info@limestone-depot.com",
      },
      prior,
    );
    assert(
      result.type === "match" && result.matchedBy === "company_and_name",
      "Expected company+name match across partial contact fields",
    );
    console.log("✓ company + name match with partial contact fields");
  }
}

runCsvMatchingTests();
console.log("\nAll supplier CSV duplicate matching tests passed.");
