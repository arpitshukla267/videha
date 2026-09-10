import {
  User,
  Role,
  Permission,
  Department,
  Lead,
  LeadActivity,
  LeadNote,
  CallLog,
  Task,
  Order,
  OrderStatusHistory,
  Bill,
  BillLineItem,
  FinanceOverview,
  PublicOrderTrackingInfo,
  AuditLog,
  Notification,
  OrderStatus,
  FollowUp,
  Company,
  Customer,
  Quotation,
  QuotationStatus,
  LeadPipelineMeta,
  FollowUpType,
  FollowUpStatus,
  CrmDocument,
  DocumentCategory,
  DocumentEntityType,
  Shipment,
  ImportEntityType,
  ImportFieldMeta,
  ImportPreviewResult
} from '../types/crm';
import { ApiError } from '../lib/apiErrors';

const TOKEN_KEY = 'videha_crm_auth_token';

export type PaginatedListResponse<T> = {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type UpdatePayload<T> = Partial<T> & { revision?: number; clientRequestId?: string };

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>)
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(endpoint, {
      ...options,
      headers
    });
  } catch {
    throw new Error('Cannot reach the CRM API. Make sure the backend is running on port 5000.');
  }

  let data: any = null;
  try {
    data = await response.json();
  } catch {
    throw new Error(
      response.ok
        ? 'Invalid response from server.'
        : `Request failed with status ${response.status}`,
    );
  }

  if (!response.ok) {
    if (response.status === 401) {
      if (!endpoint.includes('/api/auth/login')) {
        removeStoredToken();
      }
    }
    throw new ApiError(
      data?.message || `Request failed with status ${response.status}`,
      response.status,
      data?.code,
    );
  }

  return data;
}

async function uploadFormData<T>(endpoint: string, formData: FormData): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(endpoint, { method: 'POST', headers, body: formData });
  } catch {
    throw new Error('Cannot reach the CRM API. Make sure the backend is running on port 5000.');
  }

  let data: any = null;
  try {
    data = await response.json();
  } catch {
    throw new Error(
      response.ok
        ? 'Invalid response from server.'
        : `Request failed with status ${response.status}`,
    );
  }

  if (!response.ok) {
    if (response.status === 401) {
      removeStoredToken();
    }
    throw new ApiError(
      data?.message || `Request failed with status ${response.status}`,
      response.status,
      data?.code,
    );
  }

  return data;
}

async function downloadBlob(endpoint: string, filename: string): Promise<void> {
  const token = getStoredToken();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(endpoint, { headers });
  if (!response.ok) {
    let message = `Download failed with status ${response.status}`;
    try {
      const data = await response.json();
      message = data?.message || message;
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  const disposition = response.headers.get('Content-Disposition');
  const filenameMatch = disposition?.match(/filename="([^"]+)"/);
  const downloadName = filenameMatch?.[1] ?? filename;

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = downloadName;
  anchor.click();
  URL.revokeObjectURL(url);
}

function appendExportQuery(
  query: URLSearchParams,
  params: Record<string, string | undefined>,
): void {
  for (const [key, value] of Object.entries(params)) {
    if (value && value !== 'all') query.set(key, value);
  }
}

function exportCsvDownload(path: string, params: Record<string, string | undefined>, fallbackFilename: string) {
  const query = new URLSearchParams();
  appendExportQuery(query, params);
  const qs = query.toString();
  return downloadBlob(qs ? `${path}?${qs}` : path, fallbackFilename);
}

export const api = {
  // Auth
  auth: {
    login: (email: string, password: string) =>
      request<{
        success: boolean;
        data: { token: string; user: User; role: Role | null; permissions: string[] };
      }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      }),
    me: () =>
      request<{
        success: boolean;
        data: { user: User; role: Role | null; permissions: string[] };
      }>('/api/auth/me'),
    changePassword: (currentPassword: string, newPassword: string) =>
      request<{ success: boolean; message: string }>('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword })
      }),
    updateProfile: (profile: { name?: string; phone?: string; department?: string }) =>
      request<{ success: boolean; data: User }>('/api/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(profile)
      }),
    logout: () =>
      request<{ success: boolean; message: string }>('/api/auth/logout', {
        method: 'POST'
      })
  },

  // Dashboard
  dashboard: {
    getOverview: () =>
      request<{
        success: boolean;
        data: {
          kpi: {
            totalLeads: number;
            newLeads: number;
            interestedLeads: number;
            followUpsDueCount: number;
            activeTasksCount: number;
            overdueTasksCount: number;
            activeOrdersCount: number;
            completedOrdersCount: number;
          };
          attention: {
            overdueTasks: Task[];
            followUpsDueToday: Lead[];
            unassignedLeads: Lead[];
            ordersNeedingAttention: Order[];
          };
          leadDistribution: Record<string, number>;
          taskOverview: {
            pending: number;
            inProgress: number;
            completed: number;
            overdue: number;
          };
          recentActivities: AuditLog[];
        };
      }>('/api/dashboard')
  },

  // Leads
  leads: {
    getLeads: (params: {
      search?: string;
      status?: string;
      country?: string;
      priority?: string;
      assignedMemberId?: string;
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    }) => {
      const query = new URLSearchParams();
      if (params.search) query.set('search', params.search);
      if (params.status && params.status !== 'all') query.set('status', params.status);
      if (params.country && params.country !== 'all') query.set('country', params.country);
      if (params.priority && params.priority !== 'all') query.set('priority', params.priority);
      if (params.assignedMemberId && params.assignedMemberId !== 'all')
        query.set('assignedMemberId', params.assignedMemberId);
      if (params.page) query.set('page', params.page.toString());
      if (params.limit) query.set('limit', params.limit.toString());
      if (params.sortBy) query.set('sortBy', params.sortBy);
      if (params.sortOrder) query.set('sortOrder', params.sortOrder);

      return request<{
        success: boolean;
        items: Lead[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }>(`/api/leads?${query.toString()}`);
    },
    getLead: (id: string) =>
      request<{
        success: boolean;
        data: { lead: Lead; activities: LeadActivity[]; notes: LeadNote[]; callLogs: CallLog[] };
      }>(`/api/leads/${id}`),
    createLead: (data: UpdatePayload<Lead>) =>
      request<{ success: boolean; data: Lead }>('/api/leads', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    updateLead: (id: string, data: UpdatePayload<Lead>) =>
      request<{ success: boolean; data: Lead }>(`/api/leads/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    assignLead: (id: string, assignedMemberId: string | null, revision?: number) =>
      request<{ success: boolean; data: Lead }>(`/api/leads/${id}/assign`, {
        method: 'PATCH',
        body: JSON.stringify({
          assignedMemberId,
          ...(revision !== undefined ? { revision } : {})
        })
      }),
    addNote: (id: string, content: string) =>
      request<{ success: boolean; data: { note: LeadNote; activities: LeadActivity[] } }>(
        `/api/leads/${id}/notes`,
        {
          method: 'POST',
          body: JSON.stringify({ content })
        }
      ),
    logCall: (
      id: string,
      data: {
        pickedUp: boolean;
        channel?: string;
        direction?: string;
        outcome?: string;
        durationMinutes?: number;
        spokeWith?: string;
        interestLevel?: string;
        disposition?: string;
        notes?: string;
        nextFollowUp?: string | null;
        followUpRequired?: boolean;
        revision?: number;
      }
    ) =>
      request<{
        success: boolean;
        data: {
          callLog: CallLog;
          lead: Lead;
          activities: LeadActivity[];
          callLogs: CallLog[];
        };
      }>(`/api/leads/${id}/calls`, {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    deleteLead: (id: string) =>
      request<{ success: boolean; message: string }>(`/api/leads/${id}`, {
        method: 'DELETE'
      }),
    convertLead: (id: string, revision?: number) =>
      request<{
        success: boolean;
        data: {
          lead: Lead;
          company: Company;
          customer: Customer;
          alreadyConverted?: boolean;
        };
      }>(`/api/leads/${id}/convert`, {
        method: 'POST',
        body: JSON.stringify(revision !== undefined ? { revision } : {})
      }),
    getLeadFollowUps: (id: string) =>
      request<PaginatedListResponse<FollowUp>>(`/api/leads/${id}/follow-ups`),
    exportCsv: (params: {
      search?: string;
      status?: string;
      country?: string;
      priority?: string;
      assignedMemberId?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    }) =>
      exportCsvDownload('/api/leads/export', params, 'videha_leads.csv')
  },

  // Tasks
  tasks: {
    getTasks: (params: {
      view?: 'my' | 'all' | 'pending' | 'in_progress' | 'completed' | 'overdue';
      search?: string;
      assignedToId?: string;
      priority?: string;
      page?: number;
      limit?: number;
    }) => {
      const query = new URLSearchParams();
      if (params.view) query.set('view', params.view);
      if (params.search) query.set('search', params.search);
      if (params.assignedToId && params.assignedToId !== 'all')
        query.set('assignedToId', params.assignedToId);
      if (params.priority && params.priority !== 'all') query.set('priority', params.priority);
      if (params.page) query.set('page', params.page.toString());
      if (params.limit) query.set('limit', params.limit.toString());

      return request<PaginatedListResponse<Task>>(`/api/tasks?${query.toString()}`);
    },
    getTask: (id: string) =>
      request<{ success: boolean; data: Task }>(`/api/tasks/${id}`),
    createTask: (data: UpdatePayload<Task>) =>
      request<{ success: boolean; data: Task }>('/api/tasks', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    updateTask: (id: string, data: UpdatePayload<Task>) =>
      request<{ success: boolean; data: Task }>(`/api/tasks/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    updateStatus: (id: string, status: string, revision?: number) =>
      request<{ success: boolean; data: Task }>(`/api/tasks/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status,
          ...(revision !== undefined ? { revision } : {})
        })
      }),
    assignTask: (id: string, assignedToId: string) =>
      request<{ success: boolean; data: Task }>(`/api/tasks/${id}/assign`, {
        method: 'PATCH',
        body: JSON.stringify({ assignedToId })
      }),
    deleteTask: (id: string) =>
      request<{ success: boolean; message: string }>(`/api/tasks/${id}`, {
        method: 'DELETE'
      })
  },

  // Orders
  orders: {
    getOrders: (params: {
      search?: string;
      status?: string;
      country?: string;
      assignedMemberId?: string;
      page?: number;
      limit?: number;
    }) => {
      const query = new URLSearchParams();
      if (params.search) query.set('search', params.search);
      if (params.status && params.status !== 'all') query.set('status', params.status);
      if (params.country && params.country !== 'all') query.set('country', params.country);
      if (params.assignedMemberId && params.assignedMemberId !== 'all')
        query.set('assignedMemberId', params.assignedMemberId);
      if (params.page) query.set('page', params.page.toString());
      if (params.limit) query.set('limit', params.limit.toString());

      return request<PaginatedListResponse<Order>>(`/api/orders?${query.toString()}`);
    },
    exportCsv: (params: {
      search?: string;
      status?: string;
      country?: string;
      assignedMemberId?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    }) => exportCsvDownload('/api/orders/export', params, 'videha_orders.csv'),
    getOrder: (id: string) =>
      request<{
        success: boolean;
        data: { order: Order; history: OrderStatusHistory[]; shipments?: Shipment[] };
      }>(`/api/orders/${id}`),
    createOrder: (data: Partial<Order>) =>
      request<{ success: boolean; data: Order }>('/api/orders', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    updateStatus: (id: string, status: OrderStatus, notes?: string, revision?: number) =>
      request<{
        success: boolean;
        data: { order: Order; history: OrderStatusHistory[] };
      }>(`/api/orders/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status,
          notes,
          ...(revision !== undefined ? { revision } : {})
        })
      }),
    updateOrder: (id: string, data: UpdatePayload<Order>) =>
      request<{ success: boolean; data: Order }>(`/api/orders/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      })
  },

  // Team / Users
  users: {
    getTeamDirectory: () =>
      request<{ success: boolean; data: Array<Pick<User, 'id' | 'name' | 'email' | 'roleName' | 'roleDisplayName' | 'designation'>> }>(
        '/api/users/directory'
      ),
    getUsers: (params?: { search?: string; status?: string; page?: number; limit?: number }) => {
      const query = new URLSearchParams();
      if (params?.search) query.set('search', params.search);
      if (params?.status) query.set('status', params.status);
      if (params?.page) query.set('page', params.page.toString());
      if (params?.limit) query.set('limit', params.limit.toString());
      const qs = query.toString();
      return request<PaginatedListResponse<User>>(`/api/users${qs ? `?${qs}` : ''}`);
    },
    createUser: (data: any) =>
      request<{ success: boolean; data: User }>('/api/users', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    updateUser: (id: string, data: UpdatePayload<User>) =>
      request<{ success: boolean; data: User }>(`/api/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    toggleStatus: (id: string, status: 'active' | 'inactive', revision?: number) =>
      request<{ success: boolean; data: User }>(`/api/users/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status,
          ...(revision !== undefined ? { revision } : {})
        })
      })
  },

  // Roles & Permissions
  roles: {
    getRolesAndPermissions: () =>
      request<{
        success: boolean;
        data: { roles: Role[]; permissions: Permission[] };
      }>('/api/roles'),
    updatePermissions: (roleId: string, permissions: string[]) =>
      request<{ success: boolean; data: Role }>(`/api/roles/${roleId}/permissions`, {
        method: 'PUT',
        body: JSON.stringify({ permissions })
      })
  },

  // Reports
  reports: {
    getReports: () =>
      request<{
        success: boolean;
        data: {
          leads: {
            total: number;
            converted: number;
            conversionRate: string;
            byStatus: Record<string, number>;
            byCountry: Record<string, number>;
            bySource: Record<string, number>;
            byMember: Record<string, number>;
          };
          tasks: {
            total: number;
            completed: number;
            pending: number;
            inProgress: number;
            overdue: number;
            byStatus: Record<string, number>;
            byMember: Record<string, { total: number; completed: number; overdue: number }>;
          };
          orders: {
            total: number;
            totalValueINR: number;
            totalValueUSD?: number;
            byStatus: Record<string, number>;
            byCountry: Record<string, number>;
          };
        };
      }>('/api/reports'),
    getAdvancedReports: (params?: {
      from?: string;
      to?: string;
      memberId?: string;
      departmentId?: string;
    }) => {
      const query = new URLSearchParams();
      if (params?.from) query.set('from', params.from);
      if (params?.to) query.set('to', params.to);
      if (params?.memberId && params.memberId !== 'all') query.set('memberId', params.memberId);
      if (params?.departmentId && params.departmentId !== 'all')
        query.set('departmentId', params.departmentId);
      const qs = query.toString();
      return request<{ success: boolean; data: Record<string, unknown> }>(
        `/api/reports/advanced${qs ? `?${qs}` : ''}`
      );
    }
  },

  // Finance
  finance: {
    getOverview: () =>
      request<{ success: boolean; data: FinanceOverview }>('/api/finance/overview')
  },

  // Bills
  bills: {
    getBills: (params?: { search?: string; status?: string }) => {
      const query = new URLSearchParams();
      if (params?.search) query.set('search', params.search);
      if (params?.status) query.set('status', params.status);
      const qs = query.toString();
      return request<{ success: boolean; data: Bill[] }>(`/api/bills${qs ? `?${qs}` : ''}`);
    },
    getBill: (id: string) =>
      request<{ success: boolean; data: Bill }>(`/api/bills/${id}`),
    updateBill: (id: string, data: Partial<Bill>) =>
      request<{ success: boolean; data: Bill }>(`/api/bills/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    recordPayment: (id: string, amount: number, notes?: string) =>
      request<{ success: boolean; data: Bill }>(`/api/bills/${id}/payments`, {
        method: 'POST',
        body: JSON.stringify({ amount, notes })
      }),
    syncFromOrders: () =>
      request<{ success: boolean; data: { created: number } }>('/api/bills/sync', {
        method: 'POST'
      }),
    downloadPdf: (id: string, billCode: string) =>
      downloadBlob(`/api/bills/${id}/pdf`, `${billCode}.pdf`)
  },

  // Audit
  audit: {
    getLogs: (params?: { page?: number; limit?: number }) => {
      const query = new URLSearchParams();
      if (params?.page) query.set('page', params.page.toString());
      if (params?.limit) query.set('limit', params.limit.toString());
      const qs = query.toString();
      return request<PaginatedListResponse<AuditLog>>(`/api/audit${qs ? `?${qs}` : ''}`);
    }
  },

  // Departments
  departments: {
    getDepartments: (status?: string) => {
      const query = new URLSearchParams();
      if (status) query.set('status', status);
      const qs = query.toString();
      return request<{ success: boolean; data: Department[] }>(
        `/api/departments${qs ? `?${qs}` : ''}`
      );
    },
    createDepartment: (data: { name: string; description?: string }) =>
      request<{ success: boolean; data: Department }>('/api/departments', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    updateDepartment: (id: string, data: UpdatePayload<Department>) =>
      request<{ success: boolean; data: Department }>(`/api/departments/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
      }),
    deleteDepartment: (id: string) =>
      request<{ success: boolean; message: string }>(`/api/departments/${id}`, {
        method: 'DELETE'
      })
  },

  // Meta
  meta: {
    getCountries: () =>
      request<{ success: boolean; data: string[] }>('/api/meta/countries'),
    getLeadPipeline: () =>
      request<{ success: boolean; data: LeadPipelineMeta }>('/api/meta/lead-pipeline')
  },

  // Follow-ups
  followUps: {
    getFollowUps: (params: {
      schedule?: 'today' | 'upcoming' | 'overdue' | 'all';
      leadId?: string;
      assignedToId?: string;
      status?: string;
      type?: string;
      search?: string;
      page?: number;
      limit?: number;
    }) => {
      const query = new URLSearchParams();
      if (params.schedule) query.set('schedule', params.schedule);
      if (params.leadId) query.set('leadId', params.leadId);
      if (params.assignedToId && params.assignedToId !== 'all')
        query.set('assignedToId', params.assignedToId);
      if (params.status && params.status !== 'all') query.set('status', params.status);
      if (params.type && params.type !== 'all') query.set('type', params.type);
      if (params.search) query.set('search', params.search);
      if (params.page) query.set('page', params.page.toString());
      if (params.limit) query.set('limit', params.limit.toString());
      return request<PaginatedListResponse<FollowUp>>(`/api/follow-ups?${query.toString()}`);
    },
    getFollowUp: (id: string) =>
      request<{ success: boolean; data: FollowUp }>(`/api/follow-ups/${id}`),
    createFollowUp: (data: UpdatePayload<FollowUp>) =>
      request<{ success: boolean; data: FollowUp }>('/api/follow-ups', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    updateFollowUp: (id: string, data: UpdatePayload<FollowUp>) =>
      request<{ success: boolean; data: FollowUp }>(`/api/follow-ups/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    completeFollowUp: (id: string, data: { outcome?: string; notes?: string; revision?: number }) =>
      request<{ success: boolean; data: FollowUp }>(`/api/follow-ups/${id}/complete`, {
        method: 'PATCH',
        body: JSON.stringify(data)
      }),
    skipFollowUp: (id: string, data: { notes?: string; revision?: number }) =>
      request<{ success: boolean; data: FollowUp }>(`/api/follow-ups/${id}/skip`, {
        method: 'PATCH',
        body: JSON.stringify(data)
      }),
    deleteFollowUp: (id: string) =>
      request<{ success: boolean; message: string }>(`/api/follow-ups/${id}`, {
        method: 'DELETE'
      }),
    exportCsv: (params: {
      schedule?: string;
      leadId?: string;
      assignedToId?: string;
      status?: string;
      type?: string;
      search?: string;
    }) => exportCsvDownload('/api/follow-ups/export', params, 'videha_followups.csv')
  },

  // Quotations
  quotations: {
    getQuotations: (params: {
      search?: string;
      status?: string;
      leadId?: string;
      companyId?: string;
      customerId?: string;
      assignedToId?: string;
      page?: number;
      limit?: number;
    }) => {
      const query = new URLSearchParams();
      if (params.search) query.set('search', params.search);
      if (params.status && params.status !== 'all') query.set('status', params.status);
      if (params.leadId) query.set('leadId', params.leadId);
      if (params.companyId) query.set('companyId', params.companyId);
      if (params.customerId) query.set('customerId', params.customerId);
      if (params.assignedToId && params.assignedToId !== 'all')
        query.set('assignedToId', params.assignedToId);
      if (params.page) query.set('page', params.page.toString());
      if (params.limit) query.set('limit', params.limit.toString());
      return request<PaginatedListResponse<Quotation>>(`/api/quotations?${query.toString()}`);
    },
    exportCsv: (params: {
      search?: string;
      status?: string;
      leadId?: string;
      companyId?: string;
      customerId?: string;
      assignedToId?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    }) => exportCsvDownload('/api/quotations/export', params, 'videha_quotations.csv'),
    getQuotation: (id: string) =>
      request<{ success: boolean; data: Quotation }>(`/api/quotations/${id}`),
    createQuotation: (data: UpdatePayload<Quotation>) =>
      request<{ success: boolean; data: Quotation }>('/api/quotations', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    updateQuotation: (id: string, data: UpdatePayload<Quotation>) =>
      request<{ success: boolean; data: Quotation }>(`/api/quotations/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    updateStatus: (
      id: string,
      status: QuotationStatus,
      options?: { revision?: number; createOrder?: boolean }
    ) =>
      request<{
        success: boolean;
        data: { quotation: Quotation; order?: { id: string; orderCode: string } };
      }>(`/api/quotations/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, ...options })
      }),
    getOrderDraft: (id: string) =>
      request<{
        success: boolean;
        data: {
          alreadyLinked: boolean;
          order?: { id: string; orderCode: string; status: string };
          draft?: {
            quotationId: string;
            quotationCode: string;
            customerName: string;
            company: string;
            phone: string;
            email: string;
            country: string;
            products: string;
            quantity: string;
            orderValue: number;
            currency: string;
            assignedMemberId: string | null;
            orderStatus: string;
            expectedDelivery: string;
            notes: string;
            destinationPort: string;
            shippingCarrier: string;
            trackingNumber: string;
            relatedLeadId: string | null;
            companyId: string | null;
            customerId: string | null;
            paymentTerms: string;
            totalAmount: number;
          };
        };
      }>(`/api/quotations/${id}/order-draft`),
    createOrderFromQuotation: (
      id: string,
      data: Record<string, unknown> & { revision?: number; clientRequestId?: string }
    ) =>
      request<{
        success: boolean;
        data: {
          quotation: Quotation;
          order: { id: string; orderCode: string; status: string; totalAmount: number; currency: string };
          alreadyExists: boolean;
        };
      }>(`/api/quotations/${id}/order`, {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    deleteQuotation: (id: string) =>
      request<{ success: boolean; message: string }>(`/api/quotations/${id}`, {
        method: 'DELETE'
      })
  },

  // Notifications
  notifications: {
    getNotifications: (params?: { page?: number; limit?: number }) => {
      const query = new URLSearchParams();
      if (params?.page) query.set('page', params.page.toString());
      query.set('limit', String(params?.limit ?? 50));
      return request<PaginatedListResponse<Notification>>(`/api/notifications?${query.toString()}`);
    },
    markRead: (id: string) =>
      request<{ success: boolean }>(`/api/notifications/${id}/read`, {
        method: 'PATCH'
      }),
    markAllRead: () =>
      request<{ success: boolean }>('/api/notifications/read-all', {
        method: 'POST'
      })
  },

  // Public Order Tracking (NO LOGIN NEEDED)
  public: {
    trackOrder: (orderCode: string) =>
      request<{
        success: boolean;
        data: PublicOrderTrackingInfo;
      }>(`/api/public/orders/track/${encodeURIComponent(orderCode)}`)
  },

  companies: {
    getCompanies: (params?: { search?: string; page?: number; limit?: number }) => {
      const query = new URLSearchParams();
      if (params?.search) query.set('search', params.search);
      if (params?.page) query.set('page', params.page.toString());
      query.set('limit', String(params?.limit ?? 100));
      return request<PaginatedListResponse<Company>>(`/api/companies?${query.toString()}`);
    },
    exportCsv: (params?: { search?: string; status?: string; country?: string }) =>
      exportCsvDownload('/api/companies/export', params ?? {}, 'videha_companies.csv')
  },

  customers: {
    getCustomers: (params?: {
      search?: string;
      status?: string;
      companyId?: string;
      page?: number;
      limit?: number;
    }) => {
      const query = new URLSearchParams();
      if (params?.search) query.set('search', params.search);
      if (params?.status && params.status !== 'all') query.set('status', params.status);
      if (params?.companyId && params.companyId !== 'all') query.set('companyId', params.companyId);
      if (params?.page) query.set('page', params.page.toString());
      if (params?.limit) query.set('limit', params.limit.toString());
      return request<PaginatedListResponse<Customer>>(`/api/customers?${query.toString()}`);
    },
    getCustomer: (id: string) =>
      request<{ success: boolean; data: Customer }>(`/api/customers/${id}`),
    createCustomer: (data: Partial<Customer>) =>
      request<{ success: boolean; data: Customer }>('/api/customers', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    updateCustomer: (id: string, data: UpdatePayload<Customer>) =>
      request<{ success: boolean; data: Customer }>(`/api/customers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    exportCsv: (params?: { search?: string; status?: string; companyId?: string }) =>
      exportCsvDownload('/api/customers/export', params ?? {}, 'videha_customers.csv')
  },

  documents: {
    getDocuments: (params: {
      search?: string;
      category?: string;
      entityType?: string;
      entityId?: string;
      fileKind?: string;
      page?: number;
      limit?: number;
    }) => {
      const query = new URLSearchParams();
      if (params.search) query.set('search', params.search);
      if (params.category && params.category !== 'all') query.set('category', params.category);
      if (params.entityType && params.entityType !== 'all') query.set('entityType', params.entityType);
      if (params.entityId && params.entityId !== 'all') query.set('entityId', params.entityId);
      if (params.fileKind && params.fileKind !== 'all') query.set('fileKind', params.fileKind);
      if (params.page) query.set('page', params.page.toString());
      if (params.limit) query.set('limit', params.limit.toString());
      return request<PaginatedListResponse<CrmDocument>>(`/api/documents?${query.toString()}`);
    },
    getDocument: (id: string) =>
      request<{ success: boolean; data: CrmDocument }>(`/api/documents/${id}`),
    uploadDocument: (input: {
      file: File;
      title: string;
      category: DocumentCategory;
      entityType: DocumentEntityType;
      entityId: string;
    }) => {
      const formData = new FormData();
      formData.append('file', input.file);
      formData.append('title', input.title);
      formData.append('category', input.category);
      formData.append('entityType', input.entityType);
      formData.append('entityId', input.entityId);
      return uploadFormData<{ success: boolean; data: CrmDocument }>('/api/documents', formData);
    },
    renameDocument: (id: string, data: { title: string; revision?: number }) =>
      request<{ success: boolean; data: CrmDocument }>(`/api/documents/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
      }),
    deleteDocument: (id: string) =>
      request<{ success: boolean; message: string }>(`/api/documents/${id}`, {
        method: 'DELETE'
      }),
    downloadDocument: (id: string, fileName: string) =>
      downloadBlob(`/api/documents/${id}/file?disposition=attachment`, fileName),
    previewDocument: async (id: string) => {
      const token = getStoredToken();
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`/api/documents/${id}/file?disposition=inline`, { headers });
      if (!response.ok) {
        let message = `Preview failed with status ${response.status}`;
        try {
          const data = await response.json();
          message = data?.message || message;
        } catch {
          // ignore
        }
        throw new ApiError(message, response.status);
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    }
  },

  import: {
    getMeta: (entity: ImportEntityType) =>
      request<{
        success: boolean;
        data: {
          entityType: ImportEntityType;
          label: string;
          permission: string;
          fields: ImportFieldMeta[];
          limits: { maxFileBytes: number; maxRows: number; previewRows: number };
        };
      }>(`/api/import/${entity}/meta`),
    preview: (entity: ImportEntityType, file: File, mapping?: Record<string, string | null>) => {
      const formData = new FormData();
      formData.append('file', file);
      if (mapping) formData.append('mapping', JSON.stringify(mapping));
      return uploadFormData<{ success: boolean; data: ImportPreviewResult }>(
        `/api/import/${entity}/preview`,
        formData
      );
    },
    confirm: (entity: ImportEntityType, sessionId: string) =>
      request<{
        success: boolean;
        data: {
          imported: number;
          processed: number;
          failed: number;
          skipped: number;
          duplicates: number;
          totalRows: number;
          failedRows: Array<{
            rowNumber: number;
            errors: string[];
            valid: boolean;
          }>;
        };
      }>(`/api/import/${entity}/confirm`, {
        method: 'POST',
        body: JSON.stringify({ sessionId })
      }),
    downloadErrors: (entity: ImportEntityType, sessionId: string, filename: string) =>
      downloadBlob(`/api/import/${entity}/errors/${sessionId}`, filename)
  },

  shipments: {
    getShipments: (params?: {
      search?: string;
      status?: string;
      orderId?: string;
      page?: number;
      limit?: number;
    }) => {
      const query = new URLSearchParams();
      if (params?.search) query.set('search', params.search);
      if (params?.status && params.status !== 'all') query.set('status', params.status);
      if (params?.orderId) query.set('orderId', params.orderId);
      if (params?.page) query.set('page', params.page.toString());
      if (params?.limit) query.set('limit', params.limit.toString());
      return request<PaginatedListResponse<Shipment>>(`/api/shipments?${query.toString()}`);
    },
    getShipment: (id: string) =>
      request<{ success: boolean; data: Shipment }>(`/api/shipments/${id}`),
    getByOrder: (orderId: string) =>
      request<{ success: boolean; data: Shipment[] }>(`/api/shipments/by-order/${orderId}`),
    createShipment: (data: Partial<Shipment>) =>
      request<{ success: boolean; data: Shipment }>('/api/shipments', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    updateShipment: (id: string, data: Partial<Shipment> & { revision?: number }) =>
      request<{ success: boolean; data: Shipment }>(`/api/shipments/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      })
  }
};
