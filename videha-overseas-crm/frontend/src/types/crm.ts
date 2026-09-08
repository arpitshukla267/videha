export type RoleName = 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'SALES_MEMBER' | 'OPERATIONS';

export interface Department {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive';
  revision?: number;
  createdAt: string;
  updatedAt: string;
  memberCount?: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  roleId: string;
  roleName: RoleName;
  roleDisplayName?: string;
  status: 'active' | 'inactive';
  phone?: string;
  department?: string;
  departmentId?: string | null;
  createdAt: string;
  updatedAt: string;
  activeTasks?: number;
  overdueTasks?: number;
  leadsAssigned?: number;
  employeeId?: string;
  designation?: string;
  territory?: string;
  assignedTerritory?: string;
  shift?: string;
  emergencyPhone?: string;
  emergencyContact?: string;
  skills?: string[];
  joiningDate?: string;
  revision?: number;
}

export interface Role {
  id: string;
  name: RoleName;
  displayName: string;
  description: string;
  permissions: string[];
}

export interface Permission {
  id: string;
  code: string;
  name: string;
  category: 'dashboard' | 'users' | 'leads' | 'tasks' | 'orders' | 'finance' | 'reports' | 'settings' | 'documents';
  description: string;
}

export type LeadStatus =
  | 'New'
  | 'Contacted'
  | 'Qualified'
  | 'Sample Requested'
  | 'Sample Sent'
  | 'Negotiation'
  | 'Quotation Sent'
  | 'Won'
  | 'Lost'
  | 'Interested'
  | 'Follow-up'
  | 'Not Interested'
  | 'Converted';
export type Priority = 'Low' | 'Medium' | 'High' | 'Urgent';

export interface LeadPipelineMeta {
  allStatuses: LeadStatus[];
  pipelineStatuses: LeadStatus[];
  legacyStatuses: LeadStatus[];
}

export type FollowUpType = 'Call' | 'Email' | 'WhatsApp' | 'Meeting';
export type FollowUpStatus = 'Pending' | 'Completed' | 'Skipped' | 'Cancelled';

export interface FollowUp {
  id: string;
  leadId: string;
  leadCode?: string;
  leadCompany?: string;
  assignedToId: string;
  assignedToName?: string;
  dueAt: string;
  type: FollowUpType;
  status: FollowUpStatus;
  outcome: string;
  notes: string;
  completedAt: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  revision?: number;
}

export interface Company {
  id: string;
  companyCode: string;
  name: string;
  legalName?: string;
  country: string;
  city?: string;
  address?: string;
  website?: string;
  industry?: string;
  status: string;
  assignedToId?: string | null;
  assignedToName?: string;
  revision?: number;
}

export interface Customer {
  id: string;
  customerCode: string;
  companyId: string;
  companyName?: string;
  name: string;
  email: string;
  phone: string;
  whatsAppNumber?: string;
  designation?: string;
  isPrimaryContact?: boolean;
  relatedLeadId?: string | null;
  status: string;
  revision?: number;
}

export type QuotationStatus =
  | 'Draft'
  | 'Sent'
  | 'Negotiation'
  | 'Accepted'
  | 'Rejected'
  | 'Expired'
  | 'Cancelled';

export interface QuotationLineItem {
  description: string;
  quantity: string;
  unitPrice: number;
  discountPercent: number;
  amount: number;
}

export interface Quotation {
  id: string;
  quotationCode: string;
  title: string;
  currency: string;
  lineItems: QuotationLineItem[];
  subtotal: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  validityDate: string | null;
  paymentTerms: string;
  notes: string;
  status: QuotationStatus;
  leadId: string | null;
  leadCode?: string;
  leadName?: string;
  leadCountry?: string;
  leadEmail?: string;
  leadPhone?: string;
  companyId: string | null;
  companyCode?: string;
  companyName?: string;
  companyCountry?: string;
  customerId: string | null;
  customerCode?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  orderId: string | null;
  orderCode?: string;
  assignedToId: string | null;
  assignedToName?: string;
  sentAt: string | null;
  acceptedAt: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  revision?: number;
}

export interface Lead {
  id: string;
  leadCode: string;
  name: string;
  company: string;
  phoneNumber: string;
  whatsAppNumber: string;
  email: string;
  country: string;
  city?: string;
  productInterest: string;
  leadSource: 'Website' | 'Trade Fair' | 'Referral' | 'LinkedIn' | 'Direct Inquiry' | 'Cold Outreach' | string;
  leadCategory?: 'Wholesale' | 'Retail Chain' | 'Institutional' | 'Distributor' | string;
  leadStatus: LeadStatus;
  priority: Priority;
  assignedMemberId: string | null;
  assignedMemberName?: string;
  departmentId?: string | null;
  createdDate: string;
  nextFollowUp: string | null;
  notes: string;
  createdById: string;
  updatedAt: string;
  destinationPort?: string;
  hsCode?: string;
  tradeIncoTerms?: string;
  estimatedValue?: number;
  estimatedVolume?: string;
  preferredContact?: string;
  companyWebsite?: string;
  secondaryPhone?: string;
  lastCallAt?: string | null;
  lastCallOutcome?: string | null;
  lastCallChannel?: string | null;
  lastCallPickedUp?: boolean | null;
  totalCallsCount?: number;
  lostReason?: string;
  companyId?: string | null;
  customerId?: string | null;
  convertedAt?: string | null;
  revision?: number;
}

export type CallChannel = 'phone' | 'whatsapp' | 'email' | 'video' | 'in_person';
export type CallDirection = 'outbound' | 'inbound';
export type CallOutcome =
  | 'picked_up'
  | 'not_picked_up'
  | 'busy'
  | 'voicemail'
  | 'wrong_number'
  | 'switched_off'
  | 'callback_requested'
  | 'no_answer';
export type InterestLevel = 'hot' | 'warm' | 'cold' | 'none';

export interface CallLog {
  id: string;
  leadId: string;
  performedById: string;
  performedByName: string;
  channel: CallChannel;
  direction: CallDirection;
  pickedUp: boolean;
  outcome: CallOutcome;
  durationMinutes: number;
  spokeWith: string;
  interestLevel: InterestLevel;
  disposition: string;
  notes: string;
  nextFollowUp: string | null;
  followUpRequired: boolean;
  createdAt: string;
}

export interface LeadActivity {
  id: string;
  leadId: string;
  type: 'created' | 'assigned' | 'status_change' | 'followup_scheduled' | 'note_added' | 'priority_changed' | 'call_logged';
  title: string;
  description: string;
  performedById: string;
  performedByName: string;
  createdAt: string;
}

export interface LeadNote {
  id: string;
  leadId: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: string;
}

export type TaskStatus = 'Pending' | 'In Progress' | 'Completed' | 'Cancelled';
export type TaskType =
  | 'follow_up_call'
  | 'email'
  | 'whatsapp'
  | 'meeting'
  | 'sample_dispatch'
  | 'documentation'
  | 'pricing_quote'
  | 'logistics'
  | 'internal'
  | 'other';
export type TaskChannel = 'phone' | 'whatsapp' | 'email' | 'video' | 'in_person' | 'none';

export interface Task {
  id: string;
  taskCode: string;
  taskTitle: string;
  description: string;
  assignedToId: string;
  assignedToName?: string;
  createdById: string;
  createdByName?: string;
  relatedLeadId: string | null;
  relatedLeadName?: string;
  relatedOrderId: string | null;
  relatedOrderCode?: string;
  taskType?: TaskType;
  channel?: TaskChannel;
  pickedUp?: boolean | null;
  outcome?: string;
  completionNotes?: string;
  priority: Priority;
  status: TaskStatus;
  dueDate: string;
  createdDate: string;
  completedDate: string | null;
  isOverdue?: boolean;
  overdueDays?: number;
  updatedAt: string;
  category?: string;
  estimatedHours?: number;
  deliverables?: string[];
  tags?: string[];
  reminderAlert?: string;
  revision?: number;
}

export type OrderStatus =
  | 'Order Confirmed'
  | 'Processing'
  | 'Production'
  | 'Packed'
  | 'Shipped'
  | 'In Transit'
  | 'Delivered'
  | 'Cancelled';

export interface OrderStatusHistory {
  id: string;
  orderId: string;
  previousStatus: OrderStatus | null;
  newStatus: OrderStatus;
  changedById: string;
  changedByName: string;
  notes?: string;
  timestamp: string;
}

export interface Order {
  id: string;
  orderCode: string;
  customerName: string;
  company: string;
  phone: string;
  email: string;
  country: string;
  products: string;
  quantity: string;
  orderValue: number;
  currency: string;
  assignedMemberId: string;
  assignedMemberName?: string;
  orderStatus: OrderStatus;
  expectedDelivery: string;
  createdDate: string;
  notes: string;
  destinationPort?: string;
  shippingCarrier?: string;
  trackingNumber?: string;
  updatedAt: string;
  revision?: number;
}

export type ShipmentStatus =
  | 'Planned'
  | 'Booked'
  | 'In Transit'
  | 'Arrived'
  | 'Delivered'
  | 'Cancelled';

export interface Shipment {
  id: string;
  shipmentCode: string;
  shipmentReference: string;
  containerReference: string;
  orderId: string | null;
  orderCode?: string;
  orderStatus?: string;
  companyId: string | null;
  companyName?: string;
  customerId: string | null;
  customerName?: string;
  product: string;
  quantity: string;
  originPort: string;
  destinationPort: string;
  etd: string | null;
  eta: string | null;
  carrier: string;
  shippingLine: string;
  trackingNumber: string;
  status: ShipmentStatus;
  notes: string;
  assignedToId: string | null;
  assignedToName?: string;
  createdAt: string;
  updatedAt: string;
  revision?: number;
}

export type ImportEntityType =
  | 'leads'
  | 'companies'
  | 'customers'
  | 'follow-ups'
  | 'quotations'
  | 'orders';

export interface ImportPreviewRow {
  rowNumber: number;
  raw: Record<string, string>;
  mapped: Record<string, unknown>;
  errors: string[];
  warnings: string[];
  isDuplicate: boolean;
  valid: boolean;
}

export interface ImportFieldMeta {
  key: string;
  label: string;
  required: boolean;
  aliases?: string[];
}

export interface ImportPreviewResult {
  sessionId: string;
  entityType: ImportEntityType;
  fileName: string;
  headers: string[];
  mapping: Record<string, string | null>;
  fields: ImportFieldMeta[];
  summary: {
    totalRows: number;
    validRows: number;
    errorRows: number;
    duplicateRows: number;
  };
  previewRows: ImportPreviewRow[];
}

export interface PublicOrderTrackingInfo {
  orderCode: string;
  customerCompany: string;
  country: string;
  products: string;
  quantity: string;
  orderStatus: OrderStatus;
  expectedDelivery: string;
  destinationPort?: string;
  shippingCarrier?: string;
  trackingNumber?: string;
  statusHistory: Array<{
    status: OrderStatus;
    timestamp: string;
    notes?: string;
  }>;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'task_assigned' | 'lead_assigned' | 'task_due' | 'task_overdue' | 'order_status' | 'system';
  isRead: boolean;
  linkUrl?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  entity: string;
  entityId: string;
  details: string;
  timestamp: string;
}

export type BillStatus = 'draft' | 'issued' | 'partially_paid' | 'paid' | 'overdue' | 'void';

export interface BillLineItem {
  description: string;
  quantity: string;
  unitPrice: number;
  amount: number;
}

export interface Bill {
  id: string;
  billCode: string;
  orderId: string;
  orderCode: string;
  customerName: string;
  company: string;
  phone: string;
  email: string;
  country: string;
  products: string;
  quantity: string;
  lineItems: BillLineItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  amountPaid: number;
  amountDue: number;
  currency: string;
  paymentTerms: string;
  status: BillStatus;
  dueDate: string;
  issuedAt: string;
  paidAt: string;
  invoiceNotes: string;
  billingAddress: string;
  gstNumber: string;
  bankDetails: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface FinanceOverview {
  totalRevenue: number;
  totalDue: number;
  overdueAmount: number;
  revenueThisMonth: number;
  paidBillsCount: number;
  dueBillsCount: number;
  overdueBillsCount: number;
  totalBills: number;
  revenueByCurrency: Record<string, number>;
  dueByCurrency: Record<string, number>;
  recentDue: Array<{
    id: string;
    billCode: string;
    orderCode: string;
    company: string;
    amountDue: number;
    totalAmount: number;
    amountPaid: number;
    currency: string;
    dueDate: string;
    status: BillStatus;
  }>;
  recentPaid: Array<{
    id: string;
    billCode: string;
    orderCode: string;
    company: string;
    amountPaid: number;
    currency: string;
    paidAt: string;
  }>;
}

export type DocumentCategory =
  | 'KYC'
  | 'Quotation'
  | 'Invoice'
  | 'Contract'
  | 'Shipping'
  | 'Other';

export type DocumentEntityType = 'Lead' | 'Company' | 'Customer' | 'Quotation' | 'Order';

export interface CrmDocument {
  id: string;
  documentCode: string;
  title: string;
  fileName: string;
  category: DocumentCategory;
  entityType: DocumentEntityType;
  entityId: string;
  entityLabel: string;
  entityCode: string;
  mimeType: string;
  fileSize: number;
  publicId: string;
  url: string;
  resourceType: 'image' | 'raw';
  previewUrl: string;
  downloadUrl: string;
  createdById: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
  revision?: number;
}
