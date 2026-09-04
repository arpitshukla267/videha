import bcrypt from "bcryptjs";
import { connectDatabase } from "./db/connect";
import { Role } from "./models/Role";
import { Department } from "./models/Department";
import { User } from "./models/User";
import { Lead } from "./models/Lead";
import { Order } from "./models/Order";
import { OrderStatusHistory } from "./models/OrderStatusHistory";
import { ROLE_PERMISSIONS, ALL_PERMISSION_CODES } from "./constants/permissions";
import type { OrderStatus } from "./models/Order";

const ROLE_META: Record<
  string,
  { displayName: string; description: string }
> = {
  SUPER_ADMIN: {
    displayName: "Super Admin",
    description: "Full administrative access across the entire Videha Overseas CRM system.",
  },
  ADMIN: {
    displayName: "Administrator",
    description: "Manage CRM operations, team members, leads, tasks, orders, and reports.",
  },
  MANAGER: {
    displayName: "Manager",
    description: "Oversee assigned sales and operational teams, delegate leads, and monitor tasks.",
  },
  SALES_MEMBER: {
    displayName: "Sales Member",
    description: "Manage client leads, qualify product interests, schedule follow-ups, and update tasks.",
  },
  OPERATIONS: {
    displayName: "Operations Specialist",
    description: "Handle logistics, cargo shipping, order milestones, and operational dispatch.",
  },
};

async function seed() {
  await connectDatabase();
  console.log("[Seed] Connected. Upserting roles, departments, users...");

  const roleDocs: Record<string, InstanceType<typeof Role>> = {};
  for (const [name, meta] of Object.entries(ROLE_META)) {
    const permissions =
      name === "SUPER_ADMIN" || name === "ADMIN"
        ? [...ALL_PERMISSION_CODES]
        : ROLE_PERMISSIONS[name] || [];

    const role = await Role.findOneAndUpdate(
      { name },
      {
        name,
        displayName: meta.displayName,
        description: meta.description,
        permissions,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    roleDocs[name] = role!;
    console.log(`[Seed] Role ${name}`);
  }

  const departments = [
    { name: "Sales", description: "International trade & sales desks" },
    { name: "Operations", description: "Order fulfillment and processing" },
    { name: "Logistics", description: "Freight, shipping and cargo" },
    { name: "Management", description: "Executive leadership and CRM administration" },
  ];

  const deptDocs: Record<string, InstanceType<typeof Department>> = {};
  for (const d of departments) {
    const doc = await Department.findOneAndUpdate(
      { name: d.name },
      { ...d, status: "active" },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    deptDocs[d.name] = doc!;
    console.log(`[Seed] Department ${d.name}`);
  }

  const adminHash = await bcrypt.hash("admin123", 10);
  const salesHash = await bcrypt.hash("sales123", 10);
  const opsHash = await bcrypt.hash("ops123", 10);

  const users = [
    {
      name: "Devendra Videha",
      email: "superadmin@videhaoverseas.com",
      passwordHash: adminHash,
      roleName: "SUPER_ADMIN" as const,
      department: "Management",
      phone: "+91 98100 23456",
      designation: "Founder",
    },
    {
      name: "Ananya Sharma",
      email: "admin@videhaoverseas.com",
      passwordHash: adminHash,
      roleName: "ADMIN" as const,
      department: "Management",
      phone: "+91 98230 45678",
      designation: "CRM Administrator",
    },
    {
      name: "Rajesh Nair",
      email: "manager@videhaoverseas.com",
      passwordHash: adminHash,
      roleName: "MANAGER" as const,
      department: "Sales",
      phone: "+91 98311 98765",
      designation: "Sales Manager",
    },
    {
      name: "Rahul Sharma",
      email: "rahul.sharma@videhaoverseas.com",
      passwordHash: salesHash,
      roleName: "SALES_MEMBER" as const,
      department: "Sales",
      phone: "+91 98450 11223",
      designation: "Sales Executive",
    },
    {
      name: "Priya Patel",
      email: "priya.patel@videhaoverseas.com",
      passwordHash: salesHash,
      roleName: "SALES_MEMBER" as const,
      department: "Sales",
      phone: "+91 98980 55443",
      designation: "Sales Executive",
    },
    {
      name: "Vikram Singh",
      email: "vikram.singh@videhaoverseas.com",
      passwordHash: opsHash,
      roleName: "OPERATIONS" as const,
      department: "Logistics",
      phone: "+91 97110 33221",
      designation: "Logistics Specialist",
    },
  ];

  const userDocs: Record<string, InstanceType<typeof User>> = {};
  for (const u of users) {
    const role = roleDocs[u.roleName];
    const dept = deptDocs[u.department];
    const doc = await User.findOneAndUpdate(
      { email: u.email },
      {
        name: u.name,
        email: u.email,
        passwordHash: u.passwordHash,
        roleId: role._id,
        roleName: u.roleName,
        departmentId: dept?._id || null,
        status: "active",
        phone: u.phone,
        designation: u.designation,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    userDocs[u.email] = doc!;
    console.log(`[Seed] User ${u.email}`);
  }

  const sampleLeadExists = await Lead.findOne({ leadCode: "VO-LEAD-1001" });
  if (!sampleLeadExists) {
    const creator = userDocs["manager@videhaoverseas.com"];
    const assignee = userDocs["rahul.sharma@videhaoverseas.com"];
    await Lead.create({
      leadCode: "VO-LEAD-1001",
      name: "Tariq Al-Mansoor",
      company: "Al-Mansoor General Trading LLC",
      phoneNumber: "+971 50 123 4567",
      whatsAppNumber: "+971 50 123 4567",
      email: "tariq@almansoortrading.ae",
      country: "United Arab Emirates",
      source: "Trade Fair",
      productInterest: "Organic Turmeric & Green Cardamom (A-Grade Bulk)",
      status: "Interested",
      priority: "High",
      assignedToId: assignee?._id || null,
      departmentId: deptDocs.Sales?._id || null,
      nextFollowUp: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      notes: "Met at Gulfood Dubai. Interested in FCL shipment with lab certification.",
      createdById: creator?._id || assignee!._id,
      archived: false,
    });
    console.log("[Seed] Sample lead VO-LEAD-1001 created");
  } else {
    console.log("[Seed] Sample lead already exists, skipping");
  }

  const opsUser = userDocs["vikram.singh@videhaoverseas.com"];
  const adminUser = userDocs["admin@videhaoverseas.com"];
  const creatorId = opsUser?._id || adminUser?._id;

  if (creatorId) {
    const sampleOrders: Array<{
      orderCode: string;
      customerName: string;
      company: string;
      phone: string;
      email: string;
      country: string;
      products: string;
      quantity: string;
      orderValue: number;
      status: OrderStatus;
      expectedDelivery: Date;
      destinationPort: string;
      shippingCarrier: string;
      trackingNumber: string;
      notes: string;
      history: Array<{ status: OrderStatus; notes: string; daysAgo: number }>;
    }> = [
      {
        orderCode: "VO-2026-0182",
        customerName: "David Chen",
        company: "Pacific Rim Commodities Corp",
        phone: "+1 415 555 0199",
        email: "dchen@pacificrimcommodities.com",
        country: "United States",
        products: "Assam Orthodox Golden Flowery Pekoe Black Tea (50 MT Vacuum Pack)",
        quantity: "50 Metric Tons",
        orderValue: 245000,
        status: "In Transit",
        expectedDelivery: new Date(Date.now() + 14 * 86400000),
        destinationPort: "Port of Oakland, CA, USA",
        shippingCarrier: "Mediterranean Shipping Company (MSC)",
        trackingNumber: "MSCU8944120",
        notes: "Vessel MSC Rosa loaded at JNPT.",
        history: [
          { status: "Order Confirmed", notes: "PO signed · 30% deposit confirmed", daysAgo: 28 },
          { status: "Processing", notes: "Assam warehouse allocation confirmed", daysAgo: 25 },
          { status: "Production", notes: "Blending and grading completed", daysAgo: 22 },
          { status: "Packed", notes: "Vacuum foil packaging applied", daysAgo: 18 },
          { status: "Shipped", notes: "Loaded at JNPT Mumbai", daysAgo: 12 },
          { status: "In Transit", notes: "En-route to Oakland", daysAgo: 9 },
        ],
      },
      {
        orderCode: "VO-2026-0183",
        customerName: "Sheikh Abdullah",
        company: "Al-Madina Hospitality Group",
        phone: "+971 4 332 9900",
        email: "orders@almadinahospitality.com",
        country: "United Arab Emirates",
        products: "Handmade Antique Brass Tableware, Chafing Dishes & Water Goblets",
        quantity: "1,200 Sets",
        orderValue: 88500,
        status: "Packed",
        expectedDelivery: new Date(Date.now() + 10 * 86400000),
        destinationPort: "Jebel Ali Port, Dubai",
        shippingCarrier: "Maersk Line",
        trackingNumber: "MAEU7612093",
        notes: "Pallet packaging complete.",
        history: [
          { status: "Order Confirmed", notes: "Hospitality tender accepted", daysAgo: 20 },
          { status: "Processing", notes: "Workshop booked in Moradabad", daysAgo: 17 },
          { status: "Production", notes: "Antique finish underway", daysAgo: 12 },
          { status: "Packed", notes: "Awaiting terminal gate", daysAgo: 4 },
        ],
      },
      {
        orderCode: "VO-2026-0184",
        customerName: "Johan Lindqvist",
        company: "Nordic Organic Superfoods AB",
        phone: "+46 8 123 4567",
        email: "johan@nordicsuperfoods.se",
        country: "Sweden",
        products: "Organic Raw Deseeded Tamarind & Dry Ginger Slices",
        quantity: "25 Metric Tons",
        orderValue: 64200,
        status: "Production",
        expectedDelivery: new Date(Date.now() + 24 * 86400000),
        destinationPort: "Port of Gothenburg, Sweden",
        shippingCarrier: "Hapag-Lloyd",
        trackingNumber: "HLCU9018273",
        notes: "Dehydration underway.",
        history: [
          { status: "Order Confirmed", notes: "EU organic cert agreed", daysAgo: 12 },
          { status: "Processing", notes: "Tamil Nadu co-op sourcing locked", daysAgo: 9 },
          { status: "Production", notes: "Dehydration and sorting in progress", daysAgo: 3 },
        ],
      },
      {
        orderCode: "VO-2026-0180",
        customerName: "Hans Zimmer",
        company: "Bavaria Spice Wholesale",
        phone: "+49 89 2345 6789",
        email: "zimmer@bavariaspice.de",
        country: "Germany",
        products: "Tellicherry Black Pepper (TGSEB Grade) - 40 MT",
        quantity: "40 Metric Tons",
        orderValue: 198000,
        status: "Delivered",
        expectedDelivery: new Date(Date.now() - 8 * 86400000),
        destinationPort: "Port of Hamburg, Germany",
        shippingCarrier: "CMA CGM",
        trackingNumber: "CMAU3819201",
        notes: "Delivered and paid.",
        history: [
          { status: "Order Confirmed", notes: "Contract closed with LC", daysAgo: 45 },
          { status: "Processing", notes: "Estate lot reserved", daysAgo: 40 },
          { status: "Production", notes: "Steam sterilisation complete", daysAgo: 35 },
          { status: "Packed", notes: "Food-grade bags sealed", daysAgo: 30 },
          { status: "Shipped", notes: "Departed Cochin port", daysAgo: 24 },
          { status: "In Transit", notes: "Transhipment via Rotterdam", daysAgo: 18 },
          { status: "Delivered", notes: "POD signed · balance cleared", daysAgo: 8 },
        ],
      },
    ];

    for (const sample of sampleOrders) {
      let order = await Order.findOne({ orderCode: sample.orderCode });
      if (!order) {
        order = await Order.create({
          orderCode: sample.orderCode,
          customerName: sample.customerName,
          company: sample.company,
          phone: sample.phone,
          email: sample.email,
          country: sample.country,
          products: sample.products,
          quantity: sample.quantity,
          orderValue: sample.orderValue,
          currency: "INR",
          assignedToId: opsUser?._id || null,
          status: sample.status,
          expectedDelivery: sample.expectedDelivery,
          notes: sample.notes,
          destinationPort: sample.destinationPort,
          shippingCarrier: sample.shippingCarrier,
          trackingNumber: sample.trackingNumber,
          createdById: creatorId,
        });
        console.log(`[Seed] Order ${sample.orderCode} created`);
      } else {
        console.log(`[Seed] Order ${sample.orderCode} already exists`);
      }

      const existingHistory = await OrderStatusHistory.countDocuments({ orderId: order._id });
      if (existingHistory === 0) {
        let prev: OrderStatus | null = null;
        for (const h of sample.history) {
          await OrderStatusHistory.create({
            orderId: order._id,
            previousStatus: prev,
            newStatus: h.status,
            changedById: creatorId,
            changedByName: opsUser?.name || "Operations",
            notes: h.notes,
            createdAt: new Date(Date.now() - h.daysAgo * 86400000),
          });
          prev = h.status;
        }
        console.log(`[Seed] History seeded for ${sample.orderCode}`);
      }
    }
  }

  console.log("\n[Seed] Done.");
  console.log("  superadmin@videhaoverseas.com / admin123");
  console.log("  admin@videhaoverseas.com / admin123");
  console.log("  manager@videhaoverseas.com / admin123");
  console.log("  rahul.sharma@videhaoverseas.com / sales123");
  console.log("  priya.patel@videhaoverseas.com / sales123");
  console.log("  vikram.singh@videhaoverseas.com / ops123");
  process.exit(0);
}

seed().catch((err) => {
  console.error("[Seed] Failed:", err);
  process.exit(1);
});
