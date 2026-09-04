import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import {
  User,
  Role,
  Permission,
  Lead,
  LeadActivity,
  LeadNote,
  Task,
  Order,
  OrderStatusHistory,
  AuditLog,
  Notification,
  RoleName,
  TaskStatus,
  OrderStatus
} from '../types/index.js';

interface DatabaseSchema {
  permissions: Permission[];
  roles: Role[];
  users: User[];
  leads: Lead[];
  leadActivities: LeadActivity[];
  leadNotes: LeadNote[];
  tasks: Task[];
  orders: Order[];
  orderStatusHistory: OrderStatusHistory[];
  auditLogs: AuditLog[];
  notifications: Notification[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'videha_crm.json');

// Ensure data dir exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export class Database {
  private static instance: Database;
  private data: DatabaseSchema = {
    permissions: [],
    roles: [],
    users: [],
    leads: [],
    leadActivities: [],
    leadNotes: [],
    tasks: [],
    orders: [],
    orderStatusHistory: [],
    auditLogs: [],
    notifications: []
  };

  private constructor() {
    this.init();
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  private init() {
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        console.log('[DB] Loaded relational database from disk');
      } catch (err) {
        console.error('[DB] Failed reading disk DB, reseeding...', err);
        this.seedInitialData();
      }
    } else {
      console.log('[DB] No database file found, initializing seed data...');
      this.seedInitialData();
    }
  }

  private persist() {
    try {
      const tempFile = `${DB_FILE}.tmp`;
      fs.writeFileSync(tempFile, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tempFile, DB_FILE);
    } catch (err) {
      console.error('[DB] Error persisting data to disk:', err);
    }
  }

  // --- Seed Data Generator ---
  private seedInitialData() {
    // 1. Permissions
    const permissions: Permission[] = [
      { id: 'p1', code: 'users.view', name: 'View Users', category: 'users', description: 'Can view team members' },
      { id: 'p2', code: 'users.create', name: 'Create Users', category: 'users', description: 'Can add team members' },
      { id: 'p3', code: 'users.edit', name: 'Edit Users', category: 'users', description: 'Can edit member profiles and roles' },
      { id: 'p4', code: 'users.delete', name: 'Deactivate Users', category: 'users', description: 'Can deactivate team members' },

      { id: 'p5', code: 'leads.view', name: 'View Leads', category: 'leads', description: 'Can view lead records' },
      { id: 'p6', code: 'leads.create', name: 'Create Leads', category: 'leads', description: 'Can add new leads' },
      { id: 'p7', code: 'leads.edit', name: 'Edit Leads', category: 'leads', description: 'Can update lead information' },
      { id: 'p8', code: 'leads.delete', name: 'Delete Leads', category: 'leads', description: 'Can remove leads' },
      { id: 'p9', code: 'leads.assign', name: 'Assign Leads', category: 'leads', description: 'Can assign leads to members' },

      { id: 'p10', code: 'tasks.view', name: 'View Tasks', category: 'tasks', description: 'Can view task management lists' },
      { id: 'p11', code: 'tasks.create', name: 'Create Tasks', category: 'tasks', description: 'Can create new tasks' },
      { id: 'p12', code: 'tasks.edit', name: 'Edit Tasks', category: 'tasks', description: 'Can edit existing tasks' },
      { id: 'p13', code: 'tasks.assign', name: 'Assign Tasks', category: 'tasks', description: 'Can assign tasks to team members' },
      { id: 'p14', code: 'tasks.complete', name: 'Complete Tasks', category: 'tasks', description: 'Can mark tasks completed' },

      { id: 'p15', code: 'orders.view', name: 'View Orders', category: 'orders', description: 'Can view client orders' },
      { id: 'p16', code: 'orders.create', name: 'Create Orders', category: 'orders', description: 'Can create orders' },
      { id: 'p17', code: 'orders.edit', name: 'Edit Orders', category: 'orders', description: 'Can edit order parameters' },
      { id: 'p18', code: 'orders.update_status', name: 'Update Order Status', category: 'orders', description: 'Can transition order fulfillment states' },

      { id: 'p19', code: 'reports.view', name: 'View Reports', category: 'reports', description: 'Can access analytical reports' },
      { id: 'p20', code: 'settings.manage', name: 'Manage Settings', category: 'settings', description: 'Can manage CRM system settings' }
    ];

    // 2. Roles
    const roles: Role[] = [
      {
        id: 'r-super-admin',
        name: 'SUPER_ADMIN',
        displayName: 'Super Admin',
        description: 'Full administrative access across the entire Videha Overseas CRM system.',
        permissions: permissions.map(p => p.code)
      },
      {
        id: 'r-admin',
        name: 'ADMIN',
        displayName: 'Administrator',
        description: 'Manage CRM operations, team members, leads, tasks, orders, and reports.',
        permissions: [
          'users.view', 'users.create', 'users.edit', 'users.delete',
          'leads.view', 'leads.create', 'leads.edit', 'leads.delete', 'leads.assign',
          'tasks.view', 'tasks.create', 'tasks.edit', 'tasks.assign', 'tasks.complete',
          'orders.view', 'orders.create', 'orders.edit', 'orders.update_status',
          'reports.view', 'settings.manage'
        ]
      },
      {
        id: 'r-manager',
        name: 'MANAGER',
        displayName: 'Manager',
        description: 'Oversee assigned sales and operational teams, delegate leads, and monitor tasks.',
        permissions: [
          'users.view',
          'leads.view', 'leads.create', 'leads.edit', 'leads.assign',
          'tasks.view', 'tasks.create', 'tasks.edit', 'tasks.assign', 'tasks.complete',
          'orders.view',
          'reports.view'
        ]
      },
      {
        id: 'r-sales',
        name: 'SALES_MEMBER',
        displayName: 'Sales Member',
        description: 'Manage client leads, qualify product interests, schedule follow-ups, and update tasks.',
        permissions: [
          'leads.view', 'leads.create', 'leads.edit',
          'tasks.view', 'tasks.create', 'tasks.edit', 'tasks.complete'
        ]
      },
      {
        id: 'r-operations',
        name: 'OPERATIONS',
        displayName: 'Operations Specialist',
        description: 'Handle logistics, cargo shipping, order milestones, and operational dispatch.',
        permissions: [
          'orders.view', 'orders.create', 'orders.edit', 'orders.update_status',
          'tasks.view', 'tasks.create', 'tasks.edit', 'tasks.complete'
        ]
      }
    ];

    // 3. Initial Users with secure Bcrypt Hashing
    const defaultPasswordHash = bcrypt.hashSync('Admin@1234', 10);
    const salesPasswordHash = bcrypt.hashSync('Sales@1234', 10);
    const opsPasswordHash = bcrypt.hashSync('Ops@1234', 10);

    const users: User[] = [
      {
        id: 'u-1',
        name: 'Devendra Videha',
        email: 'superadmin@videhaoverseas.com',
        passwordHash: defaultPasswordHash,
        roleId: 'r-super-admin',
        roleName: 'SUPER_ADMIN',
        status: 'active',
        phone: '+91 98100 23456',
        department: 'Executive Leadership',
        createdAt: '2025-01-10T09:00:00.000Z',
        updatedAt: '2025-01-10T09:00:00.000Z'
      },
      {
        id: 'u-2',
        name: 'Ananya Sharma',
        email: 'admin@videhaoverseas.com',
        passwordHash: defaultPasswordHash,
        roleId: 'r-admin',
        roleName: 'ADMIN',
        status: 'active',
        phone: '+91 98230 45678',
        department: 'CRM Administration',
        createdAt: '2025-02-01T10:00:00.000Z',
        updatedAt: '2025-02-01T10:00:00.000Z'
      },
      {
        id: 'u-3',
        name: 'Rajesh Nair',
        email: 'manager@videhaoverseas.com',
        passwordHash: defaultPasswordHash,
        roleId: 'r-manager',
        roleName: 'MANAGER',
        status: 'active',
        phone: '+91 98311 98765',
        department: 'International Trade & Sales',
        createdAt: '2025-02-15T11:00:00.000Z',
        updatedAt: '2025-02-15T11:00:00.000Z'
      },
      {
        id: 'u-4',
        name: 'Rahul Sharma',
        email: 'rahul.sharma@videhaoverseas.com',
        passwordHash: salesPasswordHash,
        roleId: 'r-sales',
        roleName: 'SALES_MEMBER',
        status: 'active',
        phone: '+91 98450 11223',
        department: 'Middle East & Europe Desk',
        createdAt: '2025-03-01T09:30:00.000Z',
        updatedAt: '2025-03-01T09:30:00.000Z'
      },
      {
        id: 'u-5',
        name: 'Priya Patel',
        email: 'priya.patel@videhaoverseas.com',
        passwordHash: salesPasswordHash,
        roleId: 'r-sales',
        roleName: 'SALES_MEMBER',
        status: 'active',
        phone: '+91 98980 55443',
        department: 'North America & APAC Desk',
        createdAt: '2025-03-10T10:00:00.000Z',
        updatedAt: '2025-03-10T10:00:00.000Z'
      },
      {
        id: 'u-6',
        name: 'Vikram Singh',
        email: 'vikram.singh@videhaoverseas.com',
        passwordHash: opsPasswordHash,
        roleId: 'r-operations',
        roleName: 'OPERATIONS',
        status: 'active',
        phone: '+91 97110 33221',
        department: 'Logistics & Cargo Freight',
        createdAt: '2025-03-15T11:15:00.000Z',
        updatedAt: '2025-03-15T11:15:00.000Z'
      }
    ];

    // 4. Sample Leads for Videha Overseas (Export commodities: spices, rice, brassware, textiles, tea)
    const leads: Lead[] = [
      {
        id: 'l-101',
        leadCode: 'VO-LEAD-1001',
        name: 'Tariq Al-Mansoor',
        company: 'Al-Mansoor General Trading LLC',
        phoneNumber: '+971 50 123 4567',
        whatsAppNumber: '+971 50 123 4567',
        email: 'tariq@almansoortrading.ae',
        country: 'United Arab Emirates',
        city: 'Dubai',
        productInterest: 'Organic Turmeric & Green Cardamom (A-Grade Bulk)',
        leadSource: 'Trade Fair',
        leadCategory: 'Wholesale',
        leadStatus: 'Interested',
        priority: 'High',
        assignedMemberId: 'u-4', // Rahul Sharma
        createdDate: '2026-08-20T08:30:00.000Z',
        nextFollowUp: '2026-09-05T10:00:00.000Z',
        notes: 'Met at Gulfood Dubai. Interested in 5x 20ft FCL container shipment with lab certification for pesticide compliance.',
        createdById: 'u-3',
        updatedAt: '2026-08-28T14:20:00.000Z'
      },
      {
        id: 'l-102',
        leadCode: 'VO-LEAD-1002',
        name: 'Marcus Weber',
        company: 'Weber Bio-Handel GmbH',
        phoneNumber: '+49 170 8899221',
        whatsAppNumber: '+49 170 8899221',
        email: 'm.weber@weber-biohandel.de',
        country: 'Germany',
        city: 'Hamburg',
        productInterest: '1121 Traditional Steam Basmati Rice (500 MT)',
        leadSource: 'Website',
        leadCategory: 'Distributor',
        leadStatus: 'Follow-up',
        priority: 'Urgent',
        assignedMemberId: 'u-4', // Rahul Sharma
        createdDate: '2026-08-22T11:00:00.000Z',
        nextFollowUp: '2026-09-04T12:00:00.000Z', // Today
        notes: 'Requires SGS inspection report before issuing L/C. Pricing requested CIF Hamburg Port.',
        createdById: 'u-2',
        updatedAt: '2026-09-02T16:00:00.000Z'
      },
      {
        id: 'l-103',
        leadCode: 'VO-LEAD-1003',
        name: 'Elena Rostova',
        company: 'Eurasia Gourmet Imports',
        phoneNumber: '+44 20 7946 0912',
        whatsAppNumber: '+44 7700 900821',
        email: 'elena@eurasiagourmet.co.uk',
        country: 'United Kingdom',
        city: 'London',
        productInterest: 'Handcrafted Moradabad Brass Urns & Deco Planters',
        leadSource: 'Referral',
        leadCategory: 'Retail Chain',
        leadStatus: 'New',
        priority: 'Medium',
        assignedMemberId: null, // Unassigned! Perfect for Attention section
        createdDate: '2026-09-03T14:00:00.000Z',
        nextFollowUp: null,
        notes: 'Inquired through London showroom contact. Looking for premium artisan home decor packaging.',
        createdById: 'u-2',
        updatedAt: '2026-09-03T14:00:00.000Z'
      },
      {
        id: 'l-104',
        leadCode: 'VO-LEAD-1004',
        name: 'David Chen',
        company: 'Pacific Rim Commodities Corp',
        phoneNumber: '+1 415 555 0199',
        whatsAppNumber: '+1 415 555 0199',
        email: 'dchen@pacificrimcommodities.com',
        country: 'United States',
        city: 'San Francisco',
        productInterest: 'Certified Assam Orthodox Black Tea (BOP Grade)',
        leadSource: 'LinkedIn',
        leadCategory: 'Wholesale',
        leadStatus: 'Converted',
        priority: 'High',
        assignedMemberId: 'u-5', // Priya Patel
        createdDate: '2026-08-10T10:15:00.000Z',
        nextFollowUp: null,
        notes: 'Deal finalized. Converted into PO #VO-2026-0182 for immediate vessel booking.',
        createdById: 'u-5',
        updatedAt: '2026-08-25T11:00:00.000Z'
      },
      {
        id: 'l-105',
        leadCode: 'VO-LEAD-1005',
        name: 'Kenji Takahashi',
        company: 'Nippon Spice & Essence KK',
        phoneNumber: '+81 3 5555 0143',
        whatsAppNumber: '+81 90 1234 5678',
        email: 'k.takahashi@nipponspice.co.jp',
        country: 'Japan',
        city: 'Tokyo',
        productInterest: 'Makhana (Fox Nuts) Jumbo 6-Plus Grade',
        leadSource: 'Trade Fair',
        leadCategory: 'Distributor',
        leadStatus: 'Interested',
        priority: 'High',
        assignedMemberId: 'u-5', // Priya Patel
        createdDate: '2026-08-27T09:00:00.000Z',
        nextFollowUp: '2026-09-06T09:30:00.000Z',
        notes: 'Samples dispatched via DHL. High interest in private labeling packaging options.',
        createdById: 'u-3',
        updatedAt: '2026-08-30T10:00:00.000Z'
      },
      {
        id: 'l-106',
        leadCode: 'VO-LEAD-1006',
        name: 'Liam O’Connor',
        company: 'Celtic Wholesale Goods',
        phoneNumber: '+353 1 496 0123',
        whatsAppNumber: '+353 87 123 4567',
        email: 'liam@celticwholesale.ie',
        country: 'Ireland',
        city: 'Dublin',
        productInterest: 'Cotton Canvas Tote Bags & Jute Fabrics',
        leadSource: 'Direct Inquiry',
        leadCategory: 'Wholesale',
        leadStatus: 'Not Interested',
        priority: 'Low',
        assignedMemberId: 'u-4',
        createdDate: '2026-08-15T12:00:00.000Z',
        nextFollowUp: null,
        notes: 'Budget expectations were below minimum MOQ export cost.',
        createdById: 'u-4',
        updatedAt: '2026-08-20T15:00:00.000Z'
      },
      {
        id: 'l-107',
        leadCode: 'VO-LEAD-1007',
        name: 'Fatima Al-Zahra',
        company: 'Doha Imperial Foodstuff',
        phoneNumber: '+974 4411 2233',
        whatsAppNumber: '+974 5511 2233',
        email: 'purchasing@dohaimperial.qa',
        country: 'Qatar',
        city: 'Doha',
        productInterest: 'Sona Masoori Rice & Salem Turmeric Fingers',
        leadSource: 'Website',
        leadCategory: 'Institutional',
        leadStatus: 'New',
        priority: 'Medium',
        assignedMemberId: null, // Unassigned
        createdDate: '2026-09-03T16:45:00.000Z',
        nextFollowUp: null,
        notes: 'Requesting quotation for 2 x 40ft containers CIF Hamad Port.',
        createdById: 'u-2',
        updatedAt: '2026-09-03T16:45:00.000Z'
      }
    ];

    // 5. Lead Activities
    const leadActivities: LeadActivity[] = [
      {
        id: 'la-1',
        leadId: 'l-101',
        type: 'created',
        title: 'Lead Created',
        description: 'New inquiry registered from Gulfood Dubai trade exhibition.',
        performedById: 'u-3',
        performedByName: 'Rajesh Nair',
        createdAt: '2026-08-20T08:30:00.000Z'
      },
      {
        id: 'la-2',
        leadId: 'l-101',
        type: 'assigned',
        title: 'Lead Assigned',
        description: 'Assigned to Rahul Sharma for Middle East commodities negotiation.',
        performedById: 'u-3',
        performedByName: 'Rajesh Nair',
        createdAt: '2026-08-20T09:00:00.000Z'
      },
      {
        id: 'la-3',
        leadId: 'l-101',
        type: 'status_change',
        title: 'Status Updated to Interested',
        description: 'Client confirmed receipt of COA (Certificate of Analysis) and spec sheet.',
        performedById: 'u-4',
        performedByName: 'Rahul Sharma',
        createdAt: '2026-08-28T14:20:00.000Z'
      },
      {
        id: 'la-4',
        leadId: 'l-102',
        type: 'followup_scheduled',
        title: 'Follow-up Scheduled',
        description: 'Scheduled urgent call regarding SGS lab tolerance limits.',
        performedById: 'u-4',
        performedByName: 'Rahul Sharma',
        createdAt: '2026-09-02T16:00:00.000Z'
      },
      {
        id: 'la-5',
        leadId: 'l-104',
        type: 'status_change',
        title: 'Status Changed to Converted',
        description: 'Converted into active shipment contract VO-2026-0182.',
        performedById: 'u-5',
        performedByName: 'Priya Patel',
        createdAt: '2026-08-25T11:00:00.000Z'
      }
    ];

    const leadNotes: LeadNote[] = [
      {
        id: 'ln-1',
        leadId: 'l-101',
        content: 'Client requested export freight quotation including phytosanitary certificate and fumigation fees.',
        authorId: 'u-4',
        authorName: 'Rahul Sharma',
        createdAt: '2026-08-25T11:30:00.000Z'
      },
      {
        id: 'ln-2',
        leadId: 'l-102',
        content: 'Buyer is ready for 30% advance via T/T and 70% against Bill of Lading scan copy.',
        authorId: 'u-4',
        authorName: 'Rahul Sharma',
        createdAt: '2026-09-01T14:00:00.000Z'
      }
    ];

    // 6. Tasks with realistic OVERDUE items
    // Current time is 2026-09-04
    const tasks: Task[] = [
      {
        id: 't-201',
        taskCode: 'VO-TSK-201',
        taskTitle: 'Call Marcus Weber regarding SGS inspection report',
        description: 'Follow up with Weber Bio-Handel regarding European fumigation compliance and SGS certificate.',
        assignedToId: 'u-4', // Rahul Sharma
        assignedToName: 'Rahul Sharma',
        createdById: 'u-3', // Rajesh Nair
        createdByName: 'Rajesh Nair',
        relatedLeadId: 'l-102',
        relatedLeadName: 'Marcus Weber (Weber Bio-Handel GmbH)',
        relatedOrderId: null,
        priority: 'Urgent',
        status: 'Pending',
        dueDate: '2026-09-02T15:00:00.000Z', // 2 days overdue!
        createdDate: '2026-08-30T10:00:00.000Z',
        completedDate: null,
        updatedAt: '2026-08-30T10:00:00.000Z'
      },
      {
        id: 't-202',
        taskCode: 'VO-TSK-202',
        taskTitle: 'Verify customs clearance docs for UAE spices shipment',
        description: 'Coordinate with freight forwarder at Nhava Sheva port for export declaration papers.',
        assignedToId: 'u-6', // Vikram Singh
        assignedToName: 'Vikram Singh',
        createdById: 'u-2',
        createdByName: 'Ananya Sharma',
        relatedLeadId: null,
        relatedOrderId: 'ord-182',
        relatedOrderCode: 'VO-2026-0182',
        priority: 'High',
        status: 'In Progress',
        dueDate: '2026-09-01T17:00:00.000Z', // 3 days overdue!
        createdDate: '2026-08-28T09:00:00.000Z',
        completedDate: null,
        updatedAt: '2026-09-03T11:00:00.000Z'
      },
      {
        id: 't-203',
        taskCode: 'VO-TSK-203',
        taskTitle: 'Prepare CIF quotation for Al-Mansoor LLC',
        description: 'Calculate ocean freight rate per 20ft container from Mundra port to Jebel Ali port.',
        assignedToId: 'u-4', // Rahul Sharma
        assignedToName: 'Rahul Sharma',
        createdById: 'u-4',
        createdByName: 'Rahul Sharma',
        relatedLeadId: 'l-101',
        relatedLeadName: 'Tariq Al-Mansoor (Al-Mansoor General Trading LLC)',
        relatedOrderId: null,
        priority: 'High',
        status: 'Pending',
        dueDate: '2026-09-04T18:00:00.000Z', // Due today!
        createdDate: '2026-09-03T09:00:00.000Z',
        completedDate: null,
        updatedAt: '2026-09-03T09:00:00.000Z'
      },
      {
        id: 't-204',
        taskCode: 'VO-TSK-204',
        taskTitle: 'Send courier dispatch tracking for Japan samples',
        description: 'Send DHL Airway Bill tracking number to Kenji Takahashi for Fox Nut batches.',
        assignedToId: 'u-5', // Priya Patel
        assignedToName: 'Priya Patel',
        createdById: 'u-5',
        createdByName: 'Priya Patel',
        relatedLeadId: 'l-105',
        relatedLeadName: 'Kenji Takahashi (Nippon Spice & Essence KK)',
        relatedOrderId: null,
        priority: 'Medium',
        status: 'Completed',
        dueDate: '2026-09-03T12:00:00.000Z',
        createdDate: '2026-09-02T10:00:00.000Z',
        completedDate: '2026-09-03T11:30:00.000Z',
        updatedAt: '2026-09-03T11:30:00.000Z'
      },
      {
        id: 't-205',
        taskCode: 'VO-TSK-205',
        taskTitle: 'Inspect packaging batch for Moradabad Brassware order',
        description: 'Ensure double-wall corrugated export export cartons and moisture absorbent gel packets are placed.',
        assignedToId: 'u-6', // Vikram Singh
        assignedToName: 'Vikram Singh',
        createdById: 'u-3',
        createdByName: 'Rajesh Nair',
        relatedLeadId: null,
        relatedOrderId: 'ord-183',
        relatedOrderCode: 'VO-2026-0183',
        priority: 'Urgent',
        status: 'In Progress',
        dueDate: '2026-09-05T16:00:00.000Z',
        createdDate: '2026-09-03T14:00:00.000Z',
        completedDate: null,
        updatedAt: '2026-09-03T14:00:00.000Z'
      }
    ];

    // 7. Orders & Status History
    const orders: Order[] = [
      {
        id: 'ord-182',
        orderCode: 'VO-2026-0182',
        customerName: 'David Chen',
        company: 'Pacific Rim Commodities Corp',
        phone: '+1 415 555 0199',
        email: 'dchen@pacificrimcommodities.com',
        country: 'United States',
        products: 'Assam Orthodox Golden Flowery Pekoe Black Tea (50 MT Vacuum Pack)',
        quantity: '50 Metric Tons',
        orderValue: 245000,
        currency: 'USD',
        assignedMemberId: 'u-6', // Vikram Singh (Operations)
        assignedMemberName: 'Vikram Singh',
        orderStatus: 'In Transit',
        expectedDelivery: '2026-09-18T00:00:00.000Z',
        createdDate: '2026-08-15T10:00:00.000Z',
        notes: 'Vessel MSC Rosa loaded at JNPT Port. Sea Waybill issued. Cold storage temperature logged at 18 deg C.',
        destinationPort: 'Port of Oakland, CA, USA',
        shippingCarrier: 'Mediterranean Shipping Company (MSC)',
        trackingNumber: 'MSCU8944120',
        updatedAt: '2026-09-01T12:00:00.000Z'
      },
      {
        id: 'ord-183',
        orderCode: 'VO-2026-0183',
        customerName: 'Sheikh Abdullah',
        company: 'Al-Madina Hospitality Group',
        phone: '+971 4 332 9900',
        email: 'orders@almadinahospitality.com',
        country: 'United Arab Emirates',
        products: 'Handmade Antique Brass Tableware, Chafing Dishes & Water Goblets',
        quantity: '1,200 Sets',
        orderValue: 88500,
        currency: 'USD',
        assignedMemberId: 'u-6',
        assignedMemberName: 'Vikram Singh',
        orderStatus: 'Packed',
        expectedDelivery: '2026-09-14T00:00:00.000Z',
        createdDate: '2026-08-22T14:30:00.000Z',
        notes: 'Wooden pallet packaging completed with fumigation stamp. Awaiting final terminal gate opening.',
        destinationPort: 'Jebel Ali Port, Dubai',
        shippingCarrier: 'Maersk Line',
        trackingNumber: 'MAEU7612093',
        updatedAt: '2026-09-03T16:00:00.000Z'
      },
      {
        id: 'ord-184',
        orderCode: 'VO-2026-0184',
        customerName: 'Johan Lindqvist',
        company: 'Nordic Organic Superfoods AB',
        phone: '+46 8 123 4567',
        email: 'johan@nordicsuperfoods.se',
        country: 'Sweden',
        products: 'Organic Raw Deseeded Tamarind & Dry Ginger Slices',
        quantity: '25 Metric Tons',
        orderValue: 64200,
        currency: 'USD',
        assignedMemberId: 'u-6',
        assignedMemberName: 'Vikram Singh',
        orderStatus: 'Production',
        expectedDelivery: '2026-09-28T00:00:00.000Z',
        createdDate: '2026-08-30T09:15:00.000Z',
        notes: 'Sourcing batch from Tamil Nadu farmers cooperative. Dehydration and sorting underway.',
        destinationPort: 'Port of Gothenburg, Sweden',
        shippingCarrier: 'Hapag-Lloyd',
        trackingNumber: 'HLCU9018273',
        updatedAt: '2026-09-02T10:00:00.000Z'
      },
      {
        id: 'ord-180',
        orderCode: 'VO-2026-0180',
        customerName: 'Hans Zimmer',
        company: 'Bavaria Spice Wholesale',
        phone: '+49 89 2345 6789',
        email: 'zimmer@bavariaspice.de',
        country: 'Germany',
        products: 'Tellicherry Black Pepper (TGSEB Grade) - 40 MT',
        quantity: '40 Metric Tons',
        orderValue: 198000,
        currency: 'USD',
        assignedMemberId: 'u-6',
        assignedMemberName: 'Vikram Singh',
        orderStatus: 'Delivered',
        expectedDelivery: '2026-08-26T00:00:00.000Z',
        createdDate: '2026-07-15T11:00:00.000Z',
        notes: 'Delivery completed. Customer signed delivery note and full balance payment cleared.',
        destinationPort: 'Port of Hamburg, Germany',
        shippingCarrier: 'CMA CGM',
        trackingNumber: 'CMAU3819201',
        updatedAt: '2026-08-26T16:00:00.000Z'
      }
    ];

    const orderStatusHistory: OrderStatusHistory[] = [
      {
        id: 'osh-1',
        orderId: 'ord-182',
        previousStatus: null,
        newStatus: 'Order Confirmed',
        changedById: 'u-2',
        changedByName: 'Ananya Sharma',
        notes: 'Purchase order signed and 30% initial deposit confirmed.',
        timestamp: '2026-08-15T10:00:00.000Z'
      },
      {
        id: 'osh-2',
        orderId: 'ord-182',
        previousStatus: 'Order Confirmed',
        newStatus: 'Processing',
        changedById: 'u-6',
        changedByName: 'Vikram Singh',
        notes: 'Allocation confirmed from Assam warehouse.',
        timestamp: '2026-08-18T09:30:00.000Z'
      },
      {
        id: 'osh-3',
        orderId: 'ord-182',
        previousStatus: 'Processing',
        newStatus: 'Packed',
        changedById: 'u-6',
        changedByName: 'Vikram Singh',
        notes: 'High barrier aluminum foil vacuum lined packaging applied.',
        timestamp: '2026-08-24T14:00:00.000Z'
      },
      {
        id: 'osh-4',
        orderId: 'ord-182',
        previousStatus: 'Packed',
        newStatus: 'Shipped',
        changedById: 'u-6',
        changedByName: 'Vikram Singh',
        notes: 'Vessel loading completed at JNPT Mumbai.',
        timestamp: '2026-08-29T16:45:00.000Z'
      },
      {
        id: 'osh-5',
        orderId: 'ord-182',
        previousStatus: 'Shipped',
        newStatus: 'In Transit',
        changedById: 'u-6',
        changedByName: 'Vikram Singh',
        notes: 'Vessel cleared international waters en-route to Oakland.',
        timestamp: '2026-09-01T12:00:00.000Z'
      }
    ];

    // 8. Audit Logs
    const auditLogs: AuditLog[] = [
      {
        id: 'aud-1',
        userId: 'u-1',
        userName: 'Devendra Videha',
        userRole: 'SUPER_ADMIN',
        action: 'System Boot & Policy Initialization',
        entity: 'Setting',
        entityId: 'sys-01',
        details: 'Configured role access control matrices and export commodity workflows.',
        timestamp: '2026-08-01T08:00:00.000Z'
      },
      {
        id: 'aud-2',
        userId: 'u-2',
        userName: 'Ananya Sharma',
        userRole: 'ADMIN',
        action: 'Lead Created',
        entity: 'Lead',
        entityId: 'l-102',
        details: 'Created lead record for Marcus Weber (Weber Bio-Handel GmbH).',
        timestamp: '2026-08-22T11:00:00.000Z'
      },
      {
        id: 'aud-3',
        userId: 'u-3',
        userName: 'Rajesh Nair',
        userRole: 'MANAGER',
        action: 'Task Assigned',
        entity: 'Task',
        entityId: 't-201',
        details: 'Assigned inspection follow-up task to Rahul Sharma.',
        timestamp: '2026-08-30T10:00:00.000Z'
      },
      {
        id: 'aud-4',
        userId: 'u-6',
        userName: 'Vikram Singh',
        userRole: 'OPERATIONS',
        action: 'Order Status Changed',
        entity: 'Order',
        entityId: 'ord-182',
        details: 'Updated status to "In Transit" with MSC tracking reference MSCU8944120.',
        timestamp: '2026-09-01T12:00:00.000Z'
      }
    ];

    // 9. Notifications
    const notifications: Notification[] = [
      {
        id: 'notif-1',
        userId: 'u-4', // Rahul Sharma
        title: 'Task Overdue Notice',
        message: 'Task "Call Marcus Weber regarding SGS inspection report" is now 2 days overdue.',
        type: 'task_overdue',
        isRead: false,
        linkUrl: '/tasks',
        createdAt: '2026-09-03T09:00:00.000Z'
      },
      {
        id: 'notif-2',
        userId: 'u-4', // Rahul Sharma
        title: 'Follow-up Due Today',
        message: 'Lead follow-up scheduled today for Weber Bio-Handel GmbH.',
        type: 'lead_assigned',
        isRead: false,
        linkUrl: '/leads',
        createdAt: '2026-09-04T08:00:00.000Z'
      },
      {
        id: 'notif-3',
        userId: 'u-3', // Rajesh Nair (Manager)
        title: 'Unassigned Leads Alert',
        message: '2 high priority leads from UK and Qatar are currently unassigned.',
        type: 'system',
        isRead: false,
        linkUrl: '/leads',
        createdAt: '2026-09-04T07:30:00.000Z'
      }
    ];

    this.data = {
      permissions,
      roles,
      users,
      leads,
      leadActivities,
      leadNotes,
      tasks,
      orders,
      orderStatusHistory,
      auditLogs,
      notifications
    };

    this.persist();
  }

  // --- Helper Methods ---

  public computeTaskOverdue(task: Task): { isOverdue: boolean; overdueDays: number } {
    if (task.status === 'Completed' || task.status === 'Cancelled') {
      return { isOverdue: false, overdueDays: 0 };
    }
    const dueTime = new Date(task.dueDate).getTime();
    const now = Date.now();
    if (dueTime < now) {
      const diffDays = Math.max(1, Math.floor((now - dueTime) / (1000 * 60 * 60 * 24)));
      return { isOverdue: true, overdueDays: diffDays };
    }
    return { isOverdue: false, overdueDays: 0 };
  }

  // --- Permissions & Roles ---
  public getPermissions(): Permission[] {
    return this.data.permissions;
  }

  public getRoles(): Role[] {
    return this.data.roles;
  }

  public getRoleById(roleId: string): Role | undefined {
    return this.data.roles.find(r => r.id === roleId);
  }

  public getRoleByName(roleName: RoleName): Role | undefined {
    return this.data.roles.find(r => r.name === roleName);
  }

  public updateRolePermissions(roleId: string, permissions: string[]): Role | null {
    const role = this.data.roles.find(r => r.id === roleId);
    if (!role) return null;
    role.permissions = permissions;
    this.persist();
    return role;
  }

  // --- Users ---
  public getUsers(): User[] {
    return this.data.users.map(u => ({ ...u, passwordHash: '' })); // strip hashes
  }

  public findUserByEmail(email: string): User | undefined {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  public findUserById(id: string): User | undefined {
    return this.data.users.find(u => u.id === id);
  }

  public createUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): User {
    const newUser: User = {
      ...user,
      id: `u-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.data.users.push(newUser);
    this.persist();
    return { ...newUser, passwordHash: '' };
  }

  public updateUser(id: string, updates: Partial<User>): User | null {
    const index = this.data.users.findIndex(u => u.id === id);
    if (index === -1) return null;
    this.data.users[index] = {
      ...this.data.users[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.persist();
    return { ...this.data.users[index], passwordHash: '' };
  }

  // Workload statistics for team members
  public getUserWorkload(userId: string) {
    const userTasks = this.data.tasks.filter(t => t.assignedToId === userId);
    const activeTasks = userTasks.filter(t => t.status !== 'Completed' && t.status !== 'Cancelled').length;
    const overdueTasks = userTasks.filter(t => this.computeTaskOverdue(t).isOverdue).length;
    const leadsAssigned = this.data.leads.filter(l => l.assignedMemberId === userId).length;
    return { activeTasks, overdueTasks, leadsAssigned };
  }

  // --- Leads ---
  public getLeads(filters: {
    search?: string;
    status?: string;
    country?: string;
    priority?: string;
    assignedMemberId?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    let result = [...this.data.leads];

    // Enhance with assignedMemberName
    result = result.map(l => {
      const assigned = l.assignedMemberId ? this.findUserById(l.assignedMemberId) : null;
      return {
        ...l,
        assignedMemberName: assigned ? assigned.name : undefined
      };
    });

    if (filters.search) {
      const s = filters.search.toLowerCase();
      result = result.filter(
        l =>
          l.name.toLowerCase().includes(s) ||
          l.company.toLowerCase().includes(s) ||
          l.leadCode.toLowerCase().includes(s) ||
          l.phoneNumber.includes(s) ||
          l.email.toLowerCase().includes(s) ||
          l.productInterest.toLowerCase().includes(s)
      );
    }

    if (filters.status && filters.status !== 'all') {
      result = result.filter(l => l.leadStatus === filters.status);
    }

    if (filters.country && filters.country !== 'all') {
      result = result.filter(l => l.country.toLowerCase() === filters.country!.toLowerCase());
    }

    if (filters.priority && filters.priority !== 'all') {
      result = result.filter(l => l.priority === filters.priority);
    }

    if (filters.assignedMemberId && filters.assignedMemberId !== 'all') {
      if (filters.assignedMemberId === 'unassigned') {
        result = result.filter(l => !l.assignedMemberId);
      } else {
        result = result.filter(l => l.assignedMemberId === filters.assignedMemberId);
      }
    }

    // Sort
    const sortBy = filters.sortBy || 'createdDate';
    const sortOrder = filters.sortOrder === 'asc' ? 1 : -1;
    result.sort((a, b) => {
      const valA = (a as any)[sortBy] || '';
      const valB = (b as any)[sortBy] || '';
      if (valA < valB) return -1 * sortOrder;
      if (valA > valB) return 1 * sortOrder;
      return 0;
    });

    const total = result.length;
    const page = Math.max(1, filters.page || 1);
    const limit = Math.max(1, Math.min(100, filters.limit || 10));
    const startIndex = (page - 1) * limit;
    const items = result.slice(startIndex, startIndex + limit);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  public getLeadById(id: string): Lead | undefined {
    const lead = this.data.leads.find(l => l.id === id || l.leadCode === id);
    if (!lead) return undefined;
    const assigned = lead.assignedMemberId ? this.findUserById(lead.assignedMemberId) : null;
    return {
      ...lead,
      assignedMemberName: assigned ? assigned.name : undefined
    };
  }

  public createLead(leadData: Omit<Lead, 'id' | 'leadCode' | 'createdDate' | 'updatedAt'>, createdByUser: User): Lead {
    const nextNum = 1000 + this.data.leads.length + 1;
    const newLead: Lead = {
      ...leadData,
      id: `l-${Date.now()}`,
      leadCode: `VO-LEAD-${nextNum}`,
      createdDate: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.data.leads.unshift(newLead);

    // Record activity
    this.addLeadActivity({
      leadId: newLead.id,
      type: 'created',
      title: 'Lead Registered',
      description: `Lead registered for ${newLead.company} (${newLead.productInterest}).`,
      performedById: createdByUser.id,
      performedByName: createdByUser.name
    });

    this.persist();
    return newLead;
  }

  public updateLead(id: string, updates: Partial<Lead>, modifiedByUser: User): Lead | null {
    const index = this.data.leads.findIndex(l => l.id === id);
    if (index === -1) return null;
    const prev = this.data.leads[index];

    // Check status change
    if (updates.leadStatus && updates.leadStatus !== prev.leadStatus) {
      this.addLeadActivity({
        leadId: id,
        type: 'status_change',
        title: 'Status Updated',
        description: `Lead status updated from ${prev.leadStatus} to ${updates.leadStatus}.`,
        performedById: modifiedByUser.id,
        performedByName: modifiedByUser.name
      });
    }

    // Check assignment change
    if (updates.assignedMemberId !== undefined && updates.assignedMemberId !== prev.assignedMemberId) {
      const newAssignee = updates.assignedMemberId ? this.findUserById(updates.assignedMemberId) : null;
      this.addLeadActivity({
        leadId: id,
        type: 'assigned',
        title: 'Lead Reassigned',
        description: newAssignee
          ? `Lead assigned to ${newAssignee.name}.`
          : 'Lead assignment removed.',
        performedById: modifiedByUser.id,
        performedByName: modifiedByUser.name
      });

      if (newAssignee) {
        this.addNotification({
          userId: newAssignee.id,
          title: 'New Lead Assigned',
          message: `You were assigned lead ${prev.company} (${prev.name}).`,
          type: 'lead_assigned',
          linkUrl: `/leads`
        });
      }
    }

    // Check next follow-up
    if (updates.nextFollowUp && updates.nextFollowUp !== prev.nextFollowUp) {
      this.addLeadActivity({
        leadId: id,
        type: 'followup_scheduled',
        title: 'Follow-up Scheduled',
        description: `Next follow-up date set to ${new Date(updates.nextFollowUp).toLocaleDateString()}.`,
        performedById: modifiedByUser.id,
        performedByName: modifiedByUser.name
      });
    }

    this.data.leads[index] = {
      ...prev,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.persist();
    return this.getLeadById(id) || null;
  }

  public deleteLead(id: string): boolean {
    const index = this.data.leads.findIndex(l => l.id === id);
    if (index === -1) return false;
    this.data.leads.splice(index, 1);
    this.persist();
    return true;
  }

  // --- Lead Activities & Notes ---
  public getLeadActivities(leadId: string): LeadActivity[] {
    return this.data.leadActivities
      .filter(a => a.leadId === leadId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public addLeadActivity(activity: Omit<LeadActivity, 'id' | 'createdAt'>): LeadActivity {
    const newAct: LeadActivity = {
      ...activity,
      id: `la-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString()
    };
    this.data.leadActivities.unshift(newAct);
    this.persist();
    return newAct;
  }

  public getLeadNotes(leadId: string): LeadNote[] {
    return this.data.leadNotes
      .filter(n => n.leadId === leadId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public addLeadNote(leadId: string, content: string, user: User): LeadNote {
    const newNote: LeadNote = {
      id: `ln-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      leadId,
      content,
      authorId: user.id,
      authorName: user.name,
      createdAt: new Date().toISOString()
    };
    this.data.leadNotes.unshift(newNote);

    this.addLeadActivity({
      leadId,
      type: 'note_added',
      title: 'Note Added',
      description: content.length > 80 ? content.slice(0, 80) + '...' : content,
      performedById: user.id,
      performedByName: user.name
    });

    this.persist();
    return newNote;
  }

  // --- Tasks ---
  public getTasks(filters: {
    view?: 'my' | 'all' | 'pending' | 'in_progress' | 'completed' | 'overdue';
    currentUserId?: string;
    search?: string;
    assignedToId?: string;
    priority?: string;
  }): Task[] {
    let result = this.data.tasks.map(t => {
      const overdue = this.computeTaskOverdue(t);
      const assignee = this.findUserById(t.assignedToId);
      const creator = this.findUserById(t.createdById);
      return {
        ...t,
        assignedToName: assignee ? assignee.name : t.assignedToName,
        createdByName: creator ? creator.name : t.createdByName,
        isOverdue: overdue.isOverdue,
        overdueDays: overdue.overdueDays
      };
    });

    if (filters.view === 'my' && filters.currentUserId) {
      result = result.filter(t => t.assignedToId === filters.currentUserId);
    } else if (filters.view === 'pending') {
      result = result.filter(t => t.status === 'Pending');
    } else if (filters.view === 'in_progress') {
      result = result.filter(t => t.status === 'In Progress');
    } else if (filters.view === 'completed') {
      result = result.filter(t => t.status === 'Completed');
    } else if (filters.view === 'overdue') {
      result = result.filter(t => t.isOverdue);
    }

    if (filters.assignedToId && filters.assignedToId !== 'all') {
      result = result.filter(t => t.assignedToId === filters.assignedToId);
    }

    if (filters.priority && filters.priority !== 'all') {
      result = result.filter(t => t.priority === filters.priority);
    }

    if (filters.search) {
      const s = filters.search.toLowerCase();
      result = result.filter(
        t =>
          t.taskTitle.toLowerCase().includes(s) ||
          t.taskCode.toLowerCase().includes(s) ||
          (t.description && t.description.toLowerCase().includes(s)) ||
          (t.assignedToName && t.assignedToName.toLowerCase().includes(s))
      );
    }

    // Sort overdue first, then by dueDate asc
    result.sort((a, b) => {
      if (a.isOverdue && !b.isOverdue) return -1;
      if (!a.isOverdue && b.isOverdue) return 1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });

    return result;
  }

  public getTaskById(id: string): Task | undefined {
    const task = this.data.tasks.find(t => t.id === id || t.taskCode === id);
    if (!task) return undefined;
    const overdue = this.computeTaskOverdue(task);
    const assignee = this.findUserById(task.assignedToId);
    const creator = this.findUserById(task.createdById);
    return {
      ...task,
      assignedToName: assignee ? assignee.name : task.assignedToName,
      createdByName: creator ? creator.name : task.createdByName,
      isOverdue: overdue.isOverdue,
      overdueDays: overdue.overdueDays
    };
  }

  public createTask(
    taskData: Omit<Task, 'id' | 'taskCode' | 'createdDate' | 'completedDate' | 'updatedAt' | 'createdById' | 'createdByName'>,
    createdByUser: User
  ): Task {
    const nextNum = 200 + this.data.tasks.length + 1;
    const assignee = this.findUserById(taskData.assignedToId);
    const newTask: Task = {
      ...taskData,
      id: `t-${Date.now()}`,
      taskCode: `VO-TSK-${nextNum}`,
      assignedToName: assignee ? assignee.name : undefined,
      createdById: createdByUser.id,
      createdByName: createdByUser.name,
      createdDate: new Date().toISOString(),
      completedDate: taskData.status === 'Completed' ? new Date().toISOString() : null,
      updatedAt: new Date().toISOString()
    };

    this.data.tasks.unshift(newTask);

    // Notify assignee if not the creator
    if (assignee && assignee.id !== createdByUser.id) {
      this.addNotification({
        userId: assignee.id,
        title: 'New Task Assigned',
        message: `Task "${newTask.taskTitle}" assigned to you by ${createdByUser.name}.`,
        type: 'task_assigned',
        linkUrl: `/tasks`
      });
    }

    this.persist();
    return this.getTaskById(newTask.id)!;
  }

  public updateTask(id: string, updates: Partial<Task>, modifiedByUser: User): Task | null {
    const index = this.data.tasks.findIndex(t => t.id === id);
    if (index === -1) return null;
    const prev = this.data.tasks[index];

    let completedDate = prev.completedDate;
    if (updates.status === 'Completed' && prev.status !== 'Completed') {
      completedDate = new Date().toISOString();
    } else if (updates.status && updates.status !== 'Completed') {
      completedDate = null;
    }

    // Assignment notification
    if (updates.assignedToId && updates.assignedToId !== prev.assignedToId) {
      const newAssignee = this.findUserById(updates.assignedToId);
      if (newAssignee) {
        this.addNotification({
          userId: newAssignee.id,
          title: 'Task Assigned To You',
          message: `Task "${prev.taskTitle}" has been reassigned to you.`,
          type: 'task_assigned',
          linkUrl: '/tasks'
        });
      }
    }

    this.data.tasks[index] = {
      ...prev,
      ...updates,
      completedDate,
      updatedAt: new Date().toISOString()
    };

    this.persist();
    return this.getTaskById(id) || null;
  }

  public deleteTask(id: string): boolean {
    const index = this.data.tasks.findIndex(t => t.id === id);
    if (index === -1) return false;
    this.data.tasks.splice(index, 1);
    this.persist();
    return true;
  }

  // --- Orders & Status History ---
  public getOrders(filters: { search?: string; status?: string; country?: string; assignedMemberId?: string }): Order[] {
    let result = this.data.orders.map(o => {
      const assignee = this.findUserById(o.assignedMemberId);
      return {
        ...o,
        assignedMemberName: assignee ? assignee.name : o.assignedMemberName
      };
    });

    if (filters.status && filters.status !== 'all') {
      result = result.filter(o => o.orderStatus === filters.status);
    }
    if (filters.country && filters.country !== 'all') {
      result = result.filter(o => o.country.toLowerCase() === filters.country!.toLowerCase());
    }
    if (filters.assignedMemberId && filters.assignedMemberId !== 'all') {
      result = result.filter(o => o.assignedMemberId === filters.assignedMemberId);
    }
    if (filters.search) {
      const s = filters.search.toLowerCase();
      result = result.filter(
        o =>
          o.orderCode.toLowerCase().includes(s) ||
          o.customerName.toLowerCase().includes(s) ||
          o.company.toLowerCase().includes(s) ||
          o.products.toLowerCase().includes(s) ||
          (o.trackingNumber && o.trackingNumber.toLowerCase().includes(s))
      );
    }

    result.sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime());
    return result;
  }

  public getOrderById(id: string): Order | undefined {
    const order = this.data.orders.find(o => o.id === id || o.orderCode === id);
    if (!order) return undefined;
    const assignee = this.findUserById(order.assignedMemberId);
    return {
      ...order,
      assignedMemberName: assignee ? assignee.name : order.assignedMemberName
    };
  }

  public createOrder(orderData: Omit<Order, 'id' | 'orderCode' | 'createdDate' | 'updatedAt'>, createdByUser: User): Order {
    const nextNum = 180 + this.data.orders.length + 1;
    const newOrder: Order = {
      ...orderData,
      id: `ord-${nextNum}`,
      orderCode: `VO-2026-0${nextNum}`,
      createdDate: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.data.orders.unshift(newOrder);

    // Initial Status History
    this.data.orderStatusHistory.push({
      id: `osh-${Date.now()}`,
      orderId: newOrder.id,
      previousStatus: null,
      newStatus: newOrder.orderStatus,
      changedById: createdByUser.id,
      changedByName: createdByUser.name,
      notes: 'Initial order placement and registration.',
      timestamp: new Date().toISOString()
    });

    this.persist();
    return this.getOrderById(newOrder.id)!;
  }

  public updateOrderStatus(
    orderId: string,
    newStatus: OrderStatus,
    changedByUser: User,
    notes?: string
  ): Order | null {
    const order = this.getOrderById(orderId);
    if (!order) return null;

    const previousStatus = order.orderStatus;
    if (previousStatus === newStatus) return order;

    const orderIdx = this.data.orders.findIndex(o => o.id === order.id);
    this.data.orders[orderIdx].orderStatus = newStatus;
    this.data.orders[orderIdx].updatedAt = new Date().toISOString();

    // Record status history
    this.data.orderStatusHistory.unshift({
      id: `osh-${Date.now()}`,
      orderId: order.id,
      previousStatus,
      newStatus,
      changedById: changedByUser.id,
      changedByName: changedByUser.name,
      notes: notes || `Status changed to ${newStatus}.`,
      timestamp: new Date().toISOString()
    });

    this.persist();
    return this.getOrderById(order.id) || null;
  }

  public getOrderStatusHistory(orderId: string): OrderStatusHistory[] {
    const order = this.getOrderById(orderId);
    if (!order) return [];
    return this.data.orderStatusHistory
      .filter(h => h.orderId === order.id)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  // --- Public Order Tracking (Strictly sanitized, SAFE) ---
  public getPublicOrderTracking(orderCode: string) {
    const cleanCode = orderCode.trim().toUpperCase();
    const order = this.data.orders.find(o => o.orderCode.toUpperCase() === cleanCode);
    if (!order) return null;

    const history = this.data.orderStatusHistory
      .filter(h => h.orderId === order.id)
      .map(h => ({
        status: h.newStatus,
        timestamp: h.timestamp
      }))
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    // Strict public-safe payload: NO internal notes, NO user IDs, NO margins/prices
    return {
      orderCode: order.orderCode,
      customerCompany: order.company,
      country: order.country,
      products: order.products,
      quantity: order.quantity,
      orderStatus: order.orderStatus,
      expectedDelivery: order.expectedDelivery,
      destinationPort: order.destinationPort || 'Standard Port Entry',
      shippingCarrier: order.shippingCarrier || 'International Logistics Partner',
      trackingNumber: order.trackingNumber || 'Available upon vessel departure',
      statusHistory: history
    };
  }

  // --- Audit Logs ---
  public getAuditLogs(limit: number = 50): AuditLog[] {
    return [...this.data.auditLogs]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  public addAuditLog(entry: Omit<AuditLog, 'id' | 'timestamp'>): AuditLog {
    const newEntry: AuditLog = {
      ...entry,
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString()
    };
    this.data.auditLogs.unshift(newEntry);
    this.persist();
    return newEntry;
  }

  // --- Notifications ---
  public getNotifications(userId: string): Notification[] {
    return this.data.notifications
      .filter(n => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public addNotification(notif: Omit<Notification, 'id' | 'createdAt' | 'isRead'>): Notification {
    const newNotif: Notification = {
      ...notif,
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      isRead: false,
      createdAt: new Date().toISOString()
    };
    this.data.notifications.unshift(newNotif);
    this.persist();
    return newNotif;
  }

  public markNotificationAsRead(id: string, userId: string): boolean {
    const notif = this.data.notifications.find(n => n.id === id && n.userId === userId);
    if (!notif) return false;
    notif.isRead = true;
    this.persist();
    return true;
  }

  public markAllNotificationsAsRead(userId: string): void {
    this.data.notifications.forEach(n => {
      if (n.userId === userId) n.isRead = true;
    });
    this.persist();
  }

  // --- Analytical Reports Aggregation ---
  public getReports() {
    // 1. Leads by status
    const leadsByStatus: Record<string, number> = {};
    const leadsByCountry: Record<string, number> = {};
    const leadsBySource: Record<string, number> = {};
    const leadsByMember: Record<string, number> = {};

    this.data.leads.forEach(l => {
      leadsByStatus[l.leadStatus] = (leadsByStatus[l.leadStatus] || 0) + 1;
      leadsByCountry[l.country] = (leadsByCountry[l.country] || 0) + 1;
      leadsBySource[l.leadSource] = (leadsBySource[l.leadSource] || 0) + 1;

      const member = l.assignedMemberId ? this.findUserById(l.assignedMemberId)?.name || 'Unknown' : 'Unassigned';
      leadsByMember[member] = (leadsByMember[member] || 0) + 1;
    });

    const totalLeads = this.data.leads.length;
    const convertedLeads = this.data.leads.filter(l => l.leadStatus === 'Converted').length;
    const conversionRate = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(1) : '0';

    // 2. Tasks by status & overdue
    const tasksByStatus: Record<string, number> = {
      Pending: 0,
      'In Progress': 0,
      Completed: 0,
      Cancelled: 0
    };
    let overdueTasksCount = 0;
    const tasksByMember: Record<string, { total: number; completed: number; overdue: number }> = {};

    this.data.tasks.forEach(t => {
      tasksByStatus[t.status] = (tasksByStatus[t.status] || 0) + 1;
      const ov = this.computeTaskOverdue(t);
      if (ov.isOverdue) overdueTasksCount++;

      const memberName = this.findUserById(t.assignedToId)?.name || 'Unassigned';
      if (!tasksByMember[memberName]) {
        tasksByMember[memberName] = { total: 0, completed: 0, overdue: 0 };
      }
      tasksByMember[memberName].total++;
      if (t.status === 'Completed') tasksByMember[memberName].completed++;
      if (ov.isOverdue) tasksByMember[memberName].overdue++;
    });

    // 3. Orders by status & country
    const ordersByStatus: Record<string, number> = {};
    const ordersByCountry: Record<string, number> = {};
    let totalOrderValueUSD = 0;

    this.data.orders.forEach(o => {
      ordersByStatus[o.orderStatus] = (ordersByStatus[o.orderStatus] || 0) + 1;
      ordersByCountry[o.country] = (ordersByCountry[o.country] || 0) + 1;
      totalOrderValueUSD += o.orderValue;
    });

    return {
      leads: {
        total: totalLeads,
        converted: convertedLeads,
        conversionRate: `${conversionRate}%`,
        byStatus: leadsByStatus,
        byCountry: leadsByCountry,
        bySource: leadsBySource,
        byMember: leadsByMember
      },
      tasks: {
        total: this.data.tasks.length,
        completed: tasksByStatus['Completed'],
        pending: tasksByStatus['Pending'],
        inProgress: tasksByStatus['In Progress'],
        overdue: overdueTasksCount,
        byStatus: tasksByStatus,
        byMember: tasksByMember
      },
      orders: {
        total: this.data.orders.length,
        totalValueUSD: totalOrderValueUSD,
        byStatus: ordersByStatus,
        byCountry: ordersByCountry
      }
    };
  }

  // --- Dashboard Aggregation ---
  public getDashboardOverview(userId: string) {
    const totalLeads = this.data.leads.length;
    const newLeads = this.data.leads.filter(l => l.leadStatus === 'New').length;
    const interestedLeads = this.data.leads.filter(l => l.leadStatus === 'Interested').length;

    // Follow-ups due today or earlier
    const todayStr = new Date().toISOString().slice(0, 10);
    const followUpsDue = this.data.leads.filter(
      l => l.nextFollowUp && l.nextFollowUp.slice(0, 10) <= todayStr && l.leadStatus !== 'Converted' && l.leadStatus !== 'Lost'
    );

    const activeTasks = this.data.tasks.filter(t => t.status !== 'Completed' && t.status !== 'Cancelled');
    const overdueTasks = activeTasks.filter(t => this.computeTaskOverdue(t).isOverdue).map(t => ({
      ...t,
      overdueDays: this.computeTaskOverdue(t).overdueDays
    }));

    const activeOrders = this.data.orders.filter(o => o.orderStatus !== 'Delivered' && o.orderStatus !== 'Cancelled');
    const completedOrders = this.data.orders.filter(o => o.orderStatus === 'Delivered');

    const unassignedLeads = this.data.leads.filter(l => !l.assignedMemberId);
    const ordersNeedingAttention = this.data.orders.filter(
      o => o.orderStatus === 'Order Confirmed' || o.orderStatus === 'Processing'
    );

    // Lead distribution by status
    const leadDistribution: Record<string, number> = {};
    this.data.leads.forEach(l => {
      leadDistribution[l.leadStatus] = (leadDistribution[l.leadStatus] || 0) + 1;
    });

    // Task overview
    const taskOverview = {
      pending: this.data.tasks.filter(t => t.status === 'Pending').length,
      inProgress: this.data.tasks.filter(t => t.status === 'In Progress').length,
      completed: this.data.tasks.filter(t => t.status === 'Completed').length,
      overdue: overdueTasks.length
    };

    // Recent activity (from auditLogs and lead activities)
    const recentActivities = this.data.auditLogs.slice(0, 8);

    return {
      kpi: {
        totalLeads,
        newLeads,
        interestedLeads,
        followUpsDueCount: followUpsDue.length,
        activeTasksCount: activeTasks.length,
        overdueTasksCount: overdueTasks.length,
        activeOrdersCount: activeOrders.length,
        completedOrdersCount: completedOrders.length
      },
      attention: {
        overdueTasks: overdueTasks.slice(0, 5),
        followUpsDueToday: followUpsDue.slice(0, 5),
        unassignedLeads: unassignedLeads.slice(0, 5),
        ordersNeedingAttention: ordersNeedingAttention.slice(0, 5)
      },
      leadDistribution,
      taskOverview,
      recentActivities
    };
  }
}
