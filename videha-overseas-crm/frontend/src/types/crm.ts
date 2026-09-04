export type RoleName = 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'SALES_MEMBER' | 'OPERATIONS';

export interface Department {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive';
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
  category: 'dashboard' | 'users' | 'leads' | 'tasks' | 'orders' | 'reports' | 'settings';
  description: string;
}

export type LeadStatus =
  | 'New'
  | 'Contacted'
  | 'Interested'
  | 'Follow-up'
  | 'Not Interested'
  | 'Converted'
  | 'Lost';
export type Priority = 'Low' | 'Medium' | 'High' | 'Urgent';

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
}

export interface LeadActivity {
  id: string;
  leadId: string;
  type: 'created' | 'assigned' | 'status_change' | 'followup_scheduled' | 'note_added' | 'priority_changed';
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
