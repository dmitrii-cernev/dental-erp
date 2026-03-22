// Auth
export interface LoginResponse {
  access_token: string;
  token_type: string;
}

// Users
export type UserRole = 'admin' | 'staff';

export interface UserRead {
  id: number;
  username: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

// Person (shared shape for clients/doctors/workers)
export interface PersonBase {
  name: string;
  surname: string;
  phone?: string | null;
  email?: string | null;
}

export interface ClientRead extends PersonBase {
  id: number;
  created_at: string;
}

export interface DoctorBase extends PersonBase {
  company?: string | null;
}

export interface DoctorRead extends DoctorBase {
  id: number;
  created_at: string;
}

export interface WorkerRead extends PersonBase {
  id: number;
  created_at: string;
}

export interface WorkerPriceRead {
  worker_id: number;
  service_id: number;
  service_name: string;
  service_price: string;
  price: string;
}

// Services
export interface ServiceCreate {
  name: string;
  price?: string;
  steps?: string[];
}

export interface ServiceUpdate {
  name?: string;
  price?: string;
  steps?: string[];
}

export interface ServiceRead {
  id: number;
  name: string;
  price: string;
  steps: string[];
  created_at: string;
}

// Visits
export type VisitStatus = 'scheduled' | 'completed' | 'cancelled' | 'no_show';

export interface VisitCreate {
  client_id: number;
  date: string;
  doctor_ids?: number[];
  worker_ids?: number[];
  service_ids?: number[];
  comments?: string | null;
  status?: VisitStatus;
}

export interface VisitUpdate {
  client_id?: number;
  date?: string;
  doctor_ids?: number[];
  worker_ids?: number[];
  service_ids?: number[];
  comments?: string | null;
  status?: VisitStatus;
}

export interface VisitRead {
  id: number;
  client_id: number;
  date: string;
  comments: string | null;
  price: string;
  status: VisitStatus;
  created_at: string;
  doctors: DoctorRead[];
  workers: WorkerRead[];
  services: ServiceRead[];
}

// Visit filter params
export interface VisitFilters {
  date_from?: string;
  date_to?: string;
  client_id?: number;
  doctor_id?: number;
  status?: VisitStatus;
}

// Reports
export interface ReportFilters {
  date_from?: string;
  date_to?: string;
  client_id?: number;
  doctor_id?: number;
}

// Dashboard
export interface DashboardStats {
  total_visits_today: number;
  total_visits_this_month: number;
  revenue_today: string;
  revenue_this_month: string;
  total_clients: number;
  visits_by_status: {
    scheduled: number;
    completed: number;
    cancelled: number;
    no_show: number;
  };
}
