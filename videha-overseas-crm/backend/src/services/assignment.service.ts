import { Types } from "mongoose";
import { AssignmentConfig, type IAssignmentConfig, type AssignmentMode } from "../models/AssignmentConfig";
import { User } from "../models/User";
import { assertObjectId, optionalObjectId } from "../utils/objectId";

export interface AssignmentResult {
  assignedToId: Types.ObjectId | null;
  assignmentDetails: {
    assignedAt: Date;
    assignedBy: "round_robin" | "country" | "product" | "manual" | "none";
    assignedRule: string;
  };
}

export async function getOrCreateAssignmentConfig(): Promise<IAssignmentConfig> {
  let config = await AssignmentConfig.findOne();
  if (!config) {
    // Default to active sales members or users
    const salesUsers = await User.find({
      status: "active",
      roleName: { $in: ["SALES_MEMBER", "MANAGER", "ADMIN"] },
    }).select("_id");

    config = await AssignmentConfig.create({
      enabled: true,
      defaultMode: "rules",
      roundRobinUserIds: salesUsers.map((u) => u._id),
      roundRobinLastIndex: -1,
      countryRules: [],
      productRules: [],
      fallbackUserId: salesUsers.length > 0 ? salesUsers[0]._id : null,
    });
  }
  return config;
}

export async function updateAssignmentConfig(updates: {
  enabled?: boolean;
  defaultMode?: AssignmentMode;
  roundRobinUserIds?: string[];
  countryRules?: Array<{ country: string; userId: string }>;
  productRules?: Array<{ product: string; userId: string }>;
  fallbackUserId?: string | null;
}) {
  const config = await getOrCreateAssignmentConfig();

  if (updates.enabled !== undefined) config.enabled = Boolean(updates.enabled);
  if (updates.defaultMode !== undefined) config.defaultMode = updates.defaultMode;

  if (updates.roundRobinUserIds !== undefined) {
    config.roundRobinUserIds = updates.roundRobinUserIds.map((id) => {
      assertObjectId(id, "round robin user id");
      return new Types.ObjectId(id);
    });
  }

  if (updates.countryRules !== undefined) {
    config.countryRules = updates.countryRules.map((r) => {
      assertObjectId(r.userId, "country rule user id");
      return {
        country: r.country.trim(),
        userId: new Types.ObjectId(r.userId),
      };
    });
  }

  if (updates.productRules !== undefined) {
    config.productRules = updates.productRules.map((r) => {
      assertObjectId(r.userId, "product rule user id");
      return {
        product: r.product.trim(),
        userId: new Types.ObjectId(r.userId),
      };
    });
  }

  if (updates.fallbackUserId !== undefined) {
    const parsed = optionalObjectId(updates.fallbackUserId);
    config.fallbackUserId = parsed ? new Types.ObjectId(parsed) : null;
  }

  await config.save();
  return config.populate([
    { path: "roundRobinUserIds", select: "name email roleName" },
    { path: "countryRules.userId", select: "name email roleName" },
    { path: "productRules.userId", select: "name email roleName" },
    { path: "fallbackUserId", select: "name email roleName" },
  ]);
}

/**
 * Determine automatic assignment for a lead based on Country, Product, or Round Robin.
 */
export async function determineLeadAssignment(leadData: {
  country?: string;
  product?: string;
  productInterest?: string;
}): Promise<AssignmentResult> {
  const now = new Date();
  const config = await getOrCreateAssignmentConfig();

  if (!config.enabled) {
    return {
      assignedToId: null,
      assignmentDetails: {
        assignedAt: now,
        assignedBy: "none",
        assignedRule: "Automatic assignment disabled",
      },
    };
  }

  const country = leadData.country?.trim().toLowerCase() || "";
  const productText = `${leadData.product || ""} ${leadData.productInterest || ""}`.trim().toLowerCase();

  // 1. Country-based assignment
  if (config.defaultMode === "country" || config.defaultMode === "rules") {
    if (country && config.countryRules.length > 0) {
      for (const rule of config.countryRules) {
        const ruleCountry = rule.country.trim().toLowerCase();
        if (country === ruleCountry || country.includes(ruleCountry) || ruleCountry.includes(country)) {
          // Verify user is active
          const activeUser = await User.findOne({ _id: rule.userId, status: "active" }).select("_id");
          if (activeUser) {
            return {
              assignedToId: activeUser._id,
              assignmentDetails: {
                assignedAt: now,
                assignedBy: "country",
                assignedRule: `Country rule: ${rule.country}`,
              },
            };
          }
        }
      }
    }
    if (config.defaultMode === "country") {
      // If mode is strictly country and no rule matched, check fallback
      if (config.fallbackUserId) {
        return {
          assignedToId: config.fallbackUserId,
          assignmentDetails: {
            assignedAt: now,
            assignedBy: "country",
            assignedRule: "Country fallback",
          },
        };
      }
    }
  }

  // 2. Product-based assignment
  if (config.defaultMode === "product" || config.defaultMode === "rules") {
    if (productText && config.productRules.length > 0) {
      for (const rule of config.productRules) {
        const ruleProduct = rule.product.trim().toLowerCase();
        if (productText.includes(ruleProduct) || ruleProduct.includes(productText)) {
          const activeUser = await User.findOne({ _id: rule.userId, status: "active" }).select("_id");
          if (activeUser) {
            return {
              assignedToId: activeUser._id,
              assignmentDetails: {
                assignedAt: now,
                assignedBy: "product",
                assignedRule: `Product rule: ${rule.product}`,
              },
            };
          }
        }
      }
    }
    if (config.defaultMode === "product") {
      if (config.fallbackUserId) {
        return {
          assignedToId: config.fallbackUserId,
          assignmentDetails: {
            assignedAt: now,
            assignedBy: "product",
            assignedRule: "Product fallback",
          },
        };
      }
    }
  }

  // 3. Round Robin assignment
  let userPool = config.roundRobinUserIds;
  if (!userPool || userPool.length === 0) {
    const defaultSales = await User.find({
      status: "active",
      roleName: { $in: ["SALES_MEMBER", "MANAGER", "ADMIN"] },
    })
      .select("_id")
      .sort({ createdAt: 1 });
    userPool = defaultSales.map((u) => u._id);
  }

  if (userPool.length > 0) {
    const nextIndex = (config.roundRobinLastIndex + 1) % userPool.length;
    const selectedUserId = userPool[nextIndex];

    config.roundRobinLastIndex = nextIndex;
    await config.save();

    return {
      assignedToId: selectedUserId,
      assignmentDetails: {
        assignedAt: now,
        assignedBy: "round_robin",
        assignedRule: `Round Robin (#${nextIndex + 1} of ${userPool.length})`,
      },
    };
  }

  return {
    assignedToId: config.fallbackUserId || null,
    assignmentDetails: {
      assignedAt: now,
      assignedBy: "none",
      assignedRule: "No eligible assignee found",
    },
  };
}
