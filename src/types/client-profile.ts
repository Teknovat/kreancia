import type { ClientWithStats } from "./client";

/**
 * Client Profile Tab Types
 * Type definitions for the client profile page and tab system
 */

export type ClientProfileTab = "overview" | "credits" | "payments" | "activity" | "settings";

export interface ClientProfileTabData {
  id: ClientProfileTab;
  label: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  description: string;
  badge?: number | string;
}

export interface ClientProfileHeaderProps {
  client: ClientWithStats;
  onEdit?: () => void;
  onDelete?: () => void;
  onCall?: () => void;
  onEmail?: () => void;
  className?: string;
}

export interface ClientProfileTabsProps {
  activeTab: ClientProfileTab;
  onTabChange: (tab: ClientProfileTab) => void;
  tabs: ClientProfileTabData[];
  className?: string;
}

export interface ClientProfileContentProps {
  client: ClientWithStats;
  activeTab: string;
}

/**
 * Tab Content Props
 */
export interface TabContentBaseProps {
  client: ClientWithStats;
  onRefresh?: () => void;
}

export interface OverviewTabProps extends TabContentBaseProps {
  recentActivity?: ActivityItem[];
}

export interface CreditsTabProps extends TabContentBaseProps {
  credits?: CreditWithDetails[];
  onCreateCredit?: () => void;
  onEditCredit?: (creditId: string) => void;
}

export interface PaymentsTabProps extends TabContentBaseProps {
  payments?: PaymentWithDetails[];
  onRecordPayment?: () => void;
}

export interface ActivityTabProps extends TabContentBaseProps {
  activities?: ActivityItem[];
  onExport?: () => void;
}

export interface SettingsTabProps extends TabContentBaseProps {
  onSaveSettings?: (settings: ClientSettings) => void;
  onClientUpdate?: (client: ClientWithStats) => void;
}

/**
 * Data Types for Tab Content
 */
export interface ActivityItem {
  id: string;
  type: "credit_created" | "payment_received" | "status_changed" | "limit_updated" | "client_created";
  title: string;
  description: string;
  timestamp: Date;
  amount?: number;
  status?: string;
  metadata?: Record<string, any>;
}

export interface CreditWithDetails {
  id: string;
  totalAmount: number;
  remainingAmount: number;
  dueDate: Date;
  status: "OPEN" | "PAID" | "OVERDUE";
  description?: string;
  createdAt: Date;
  paymentAllocations: PaymentAllocationWithDetails[];
}

export interface PaymentWithDetails {
  id: string;
  amount: number;
  paymentDate: Date;
  method: string;
  reference?: string;
  createdAt: Date;
  paymentAllocations: PaymentAllocationWithDetails[];
}

export interface PaymentAllocationWithDetails {
  id: string;
  amount: number;
  credit?: {
    id: string;
    totalAmount: number;
    description?: string;
  };
  payment?: {
    id: string;
    amount: number;
    paymentDate: Date;
  };
}

export interface ClientSettings {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  address?: string;
  businessName?: string;
  taxId?: string;
  creditLimit?: number;
  paymentTermDays: number;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
}

/**
 * Chart Data Types for Visualizations
 */
export interface PaymentTrendData {
  month: string;
  amount: number;
  count: number;
}

export interface CreditUtilizationData {
  used: number;
  available: number;
  overdue: number;
}

export interface ClientMetrics {
  totalCredits: number;
  totalPaid: number;
  totalOutstanding: number;
  totalOverdue: number;
  availableCreditBalance: number; // Nouveau: Solde créditeur disponible
  averagePaymentTime: number;
  creditUtilizationRate: number;
  paymentComplianceRate: number;
}

/**
 * Action Types
 */
export type QuickAction = {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  variant: "primary" | "secondary" | "success" | "warning" | "danger";
  onClick: () => void;
  disabled?: boolean;
};

/**
 * Form Types
 */
export interface CreditFormData {
  totalAmount: number;
  dueDate: string;
  description?: string;
}

export interface PaymentFormData {
  amount: number;
  paymentDate: string;
  method: string;
  reference?: string;
  creditAllocations?: {
    creditId: string;
    amount: number;
  }[];
}
