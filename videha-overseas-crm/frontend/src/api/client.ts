import {
  User,
  Role,
  Permission,
  Department,
  Lead,
  LeadActivity,
  LeadNote,
  Task,
  Order,
  OrderStatusHistory,
  PublicOrderTrackingInfo,
  AuditLog,
  Notification,
  OrderStatus
} from '../types/crm';

const TOKEN_KEY = 'videha_crm_auth_token';

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
    throw new Error(data?.message || `Request failed with status ${response.status}`);
  }

  return data;
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
        data: { lead: Lead; activities: LeadActivity[]; notes: LeadNote[] };
      }>(`/api/leads/${id}`),
    createLead: (data: Partial<Lead>) =>
      request<{ success: boolean; data: Lead }>('/api/leads', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    updateLead: (id: string, data: Partial<Lead>) =>
      request<{ success: boolean; data: Lead }>(`/api/leads/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    assignLead: (id: string, assignedMemberId: string | null) =>
      request<{ success: boolean; data: Lead }>(`/api/leads/${id}/assign`, {
        method: 'PATCH',
        body: JSON.stringify({ assignedMemberId })
      }),
    addNote: (id: string, content: string) =>
      request<{ success: boolean; data: { note: LeadNote; activities: LeadActivity[] } }>(
        `/api/leads/${id}/notes`,
        {
          method: 'POST',
          body: JSON.stringify({ content })
        }
      ),
    deleteLead: (id: string) =>
      request<{ success: boolean; message: string }>(`/api/leads/${id}`, {
        method: 'DELETE'
      })
  },

  // Tasks
  tasks: {
    getTasks: (params: {
      view?: 'my' | 'all' | 'pending' | 'in_progress' | 'completed' | 'overdue';
      search?: string;
      assignedToId?: string;
      priority?: string;
    }) => {
      const query = new URLSearchParams();
      if (params.view) query.set('view', params.view);
      if (params.search) query.set('search', params.search);
      if (params.assignedToId && params.assignedToId !== 'all')
        query.set('assignedToId', params.assignedToId);
      if (params.priority && params.priority !== 'all') query.set('priority', params.priority);

      return request<{ success: boolean; data: Task[] }>(`/api/tasks?${query.toString()}`);
    },
    getTask: (id: string) =>
      request<{ success: boolean; data: Task }>(`/api/tasks/${id}`),
    createTask: (data: Partial<Task>) =>
      request<{ success: boolean; data: Task }>('/api/tasks', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    updateTask: (id: string, data: Partial<Task>) =>
      request<{ success: boolean; data: Task }>(`/api/tasks/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    updateStatus: (id: string, status: string) =>
      request<{ success: boolean; data: Task }>(`/api/tasks/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
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
    }) => {
      const query = new URLSearchParams();
      if (params.search) query.set('search', params.search);
      if (params.status && params.status !== 'all') query.set('status', params.status);
      if (params.country && params.country !== 'all') query.set('country', params.country);
      if (params.assignedMemberId && params.assignedMemberId !== 'all')
        query.set('assignedMemberId', params.assignedMemberId);

      return request<{ success: boolean; data: Order[] }>(`/api/orders?${query.toString()}`);
    },
    getOrder: (id: string) =>
      request<{
        success: boolean;
        data: { order: Order; history: OrderStatusHistory[] };
      }>(`/api/orders/${id}`),
    createOrder: (data: Partial<Order>) =>
      request<{ success: boolean; data: Order }>('/api/orders', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    updateStatus: (id: string, status: OrderStatus, notes?: string) =>
      request<{
        success: boolean;
        data: { order: Order; history: OrderStatusHistory[] };
      }>(`/api/orders/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, notes })
      }),
    updateOrder: (id: string, data: Partial<Order>) =>
      request<{ success: boolean; data: Order }>(`/api/orders/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      })
  },

  // Team / Users
  users: {
    getUsers: () =>
      request<{ success: boolean; data: User[] }>('/api/users'),
    createUser: (data: any) =>
      request<{ success: boolean; data: User }>('/api/users', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    updateUser: (id: string, data: any) =>
      request<{ success: boolean; data: User }>(`/api/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    toggleStatus: (id: string, status: 'active' | 'inactive') =>
      request<{ success: boolean; data: User }>(`/api/users/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
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
      }>('/api/reports')
  },

  // Audit
  audit: {
    getLogs: (limit = 50) =>
      request<{ success: boolean; data: AuditLog[] }>(`/api/audit?limit=${limit}`)
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
    updateDepartment: (id: string, data: Partial<Department>) =>
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
      request<{ success: boolean; data: string[] }>('/api/meta/countries')
  },

  // Notifications
  notifications: {
    getNotifications: () =>
      request<{ success: boolean; data: Notification[] }>('/api/notifications'),
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
  }
};
