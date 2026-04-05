import { ClientWithStats } from "@/types/client";
import type {
  ClientMetrics,
  PaymentTrendData,
  CreditUtilizationData,
  ActivityItem,
  ClientProfileTab,
} from "@/types/client-profile";

/**
 * Client Profile Utilities
 * Helper functions for client profile data processing and calculations
 */

/**
 * Calculate comprehensive client metrics
 */
export function calculateClientMetrics(client: ClientWithStats): ClientMetrics {
  const totalCredits = client.totalCredits || 0;
  const totalOutstanding = client.outstandingAmount || 0;
  const totalOverdue = client.overdueAmount || 0;
  const totalPaid = totalCredits > 0 ? totalCredits - totalOutstanding : 0;

  const creditLimit = client.creditLimit || 0;
  const creditUtilizationRate = creditLimit > 0 ? (totalOutstanding / creditLimit) * 100 : 0;

  const paymentComplianceRate = totalCredits > 0 ? ((totalCredits - totalOverdue) / totalCredits) * 100 : 100;

  // Mock average payment time (would be calculated from actual payment data)
  const averagePaymentTime = client.paymentTermDays || 30;

  return {
    totalCredits,
    totalPaid,
    totalOutstanding,
    totalOverdue,
    averagePaymentTime,
    creditUtilizationRate: Math.round(creditUtilizationRate * 100) / 100,
    paymentComplianceRate: Math.round(paymentComplianceRate * 100) / 100,
  };
}

/**
 * Generate payment trend data for visualization
 */
export function generatePaymentTrendData(payments: any[]): PaymentTrendData[] {
  const monthlyData = new Map<string, { amount: number; count: number }>();

  payments.forEach((payment) => {
    const monthKey = new Date(payment.paymentDate).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "short",
    });

    const existing = monthlyData.get(monthKey) || { amount: 0, count: 0 };
    monthlyData.set(monthKey, {
      amount: existing.amount + Number(payment.amount),
      count: existing.count + 1,
    });
  });

  return Array.from(monthlyData.entries())
    .map(([month, data]) => ({
      month,
      amount: data.amount,
      count: data.count,
    }))
    .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
    .slice(-6); // Last 6 months
}

/**
 * Generate credit utilization data for visualization
 */
export function generateCreditUtilizationData(client: ClientWithStats): CreditUtilizationData {
  const creditLimit = client.creditLimit || 0;
  const outstanding = client.outstandingAmount || 0;
  const overdue = client.overdueAmount || 0;

  return {
    used: outstanding - overdue,
    available: Math.max(0, creditLimit - outstanding),
    overdue,
  };
}

/**
 * Generate activity timeline from client data
 */
export function generateActivityItems(client: ClientWithStats): ActivityItem[] {
  const activities: ActivityItem[] = [];

  // Add client creation activity
  activities.push({
    id: `client-created-${client.id}`,
    type: "client_created",
    title: "Client créé",
    description: `Le profil de ${client.fullName} a été créé`,
    timestamp: client.createdAt,
    metadata: { clientId: client.id },
  });

  // Add credit activities (mock - would come from actual data)
  if (client.creditCount > 0) {
    activities.push({
      id: `credits-summary-${client.id}`,
      type: "credit_created",
      title: `${client.creditCount} crédit${client.creditCount > 1 ? "s" : ""} accordé${client.creditCount > 1 ? "s" : ""}`,
      description: `Total des crédits: ${client.outstandingAmount || "0 €"}`,
      timestamp: client.lastActivity || client.createdAt,
      amount: client.outstandingAmount,
      metadata: { creditCount: client.creditCount },
    });
  }

  // Add payment activities (mock)
  if (client.paymentCount > 0) {
    const paidAmount = (client.totalCredits || 0) - (client.outstandingAmount || 0);
    activities.push({
      id: `payments-summary-${client.id}`,
      type: "payment_received",
      title: `${client.paymentCount} paiement${client.paymentCount > 1 ? "s" : ""} reçu${client.paymentCount > 1 ? "s" : ""}`,
      description: `Total des paiements: ${paidAmount}`,
      timestamp: client.lastActivity || client.createdAt,
      amount: paidAmount,
      metadata: { paymentCount: client.paymentCount },
    });
  }

  // Add status changes (mock)
  if (client.overdueAmount && client.overdueAmount > 0) {
    activities.push({
      id: `status-overdue-${client.id}`,
      type: "status_changed",
      title: "Crédit en retard détecté",
      description: `${client.overdueAmount} en retard de paiement`,
      timestamp: client.lastActivity || client.createdAt,
      amount: client.overdueAmount,
      status: "OVERDUE",
      metadata: { previousStatus: "ACTIVE", newStatus: "OVERDUE" },
    });
  }

  return activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 10); // Show last 10 activities
}

/**
 * Get activity icon based on type
 */
export function getActivityIcon(type: ActivityItem["type"]): string {
  const icons = {
    credit_created: "💳",
    payment_received: "💰",
    status_changed: "⚠️",
    limit_updated: "📊",
    client_created: "👤",
  };

  return icons[type] || "📝";
}

/**
 * Get activity color based on type
 */
export function getActivityColor(type: ActivityItem["type"]): {
  bg: string;
  text: string;
  dot: string;
} {
  const colors = {
    credit_created: {
      bg: "bg-blue-50",
      text: "text-blue-700",
      dot: "bg-blue-500",
    },
    payment_received: {
      bg: "bg-green-50",
      text: "text-green-700",
      dot: "bg-green-500",
    },
    status_changed: {
      bg: "bg-amber-50",
      text: "text-amber-700",
      dot: "bg-amber-500",
    },
    limit_updated: {
      bg: "bg-purple-50",
      text: "text-purple-700",
      dot: "bg-purple-500",
    },
    client_created: {
      bg: "bg-slate-50",
      text: "text-slate-700",
      dot: "bg-slate-500",
    },
  };

  return colors[type] || colors.client_created;
}

/**
 * Format client status for display
 */
export function formatClientStatus(status: ClientWithStats["status"]): {
  label: string;
  variant: "success" | "warning" | "danger";
} {
  const statusMap = {
    ACTIVE: { label: "Actif", variant: "success" as const },
    INACTIVE: { label: "Inactif", variant: "warning" as const },
    SUSPENDED: { label: "Suspendu", variant: "danger" as const },
  };

  return statusMap[status] || statusMap.ACTIVE;
}

/**
 * Calculate credit health score (0-100)
 */
export function calculateCreditHealthScore(client: ClientWithStats): {
  score: number;
  level: "excellent" | "good" | "fair" | "poor";
  factors: string[];
} {
  let score = 100;
  const factors: string[] = [];

  // Overdue amount penalty
  if (client.overdueAmount && client.overdueAmount > 0) {
    const penalty = Math.min(40, (client.overdueAmount / (client.outstandingAmount || 1)) * 40);
    score -= penalty;
    factors.push("Paiements en retard");
  }

  // Credit utilization penalty
  const creditLimit = client.creditLimit || 0;
  if (creditLimit > 0) {
    const utilization = (client.outstandingAmount || 0) / creditLimit;
    if (utilization > 0.8) {
      score -= 20;
      factors.push("Utilisation crédit élevée");
    } else if (utilization > 0.6) {
      score -= 10;
      factors.push("Utilisation crédit modérée");
    }
  }

  // Payment history bonus
  if (client.paymentCount > 5) {
    score += 5;
    factors.push("Historique de paiements stable");
  }

  // Activity penalty
  const daysSinceActivity = client.lastActivity
    ? (Date.now() - client.lastActivity.getTime()) / (1000 * 60 * 60 * 24)
    : 365;

  if (daysSinceActivity > 180) {
    score -= 15;
    factors.push("Inactivité prolongée");
  }

  const finalScore = Math.max(0, Math.min(100, Math.round(score)));

  let level: "excellent" | "good" | "fair" | "poor";
  if (finalScore >= 85) level = "excellent";
  else if (finalScore >= 70) level = "good";
  else if (finalScore >= 50) level = "fair";
  else level = "poor";

  return {
    score: finalScore,
    level,
    factors: factors.length > 0 ? factors : ["Profil client stable"],
  };
}

/**
 * Get tab configuration with badges
 */
export function getTabConfiguration(client: ClientWithStats) {
  const overdueCount = client.overdueAmount && client.overdueAmount > 0 ? 1 : 0;

  return [
    {
      id: "overview" as ClientProfileTab,
      label: "Vue d'ensemble",
      description: "Résumé du client et métriques clés",
    },
    {
      id: "credits" as ClientProfileTab,
      label: "Crédits",
      description: "Gestion des crédits client",
      badge: client.creditCount || 0,
    },
    {
      id: "payments" as ClientProfileTab,
      label: "Paiements",
      description: "Historique des paiements",
      badge: client.paymentCount || 0,
    },
    {
      id: "activity" as ClientProfileTab,
      label: "Activité",
      description: "Timeline des interactions",
    },
    {
      id: "settings" as ClientProfileTab,
      label: "Paramètres",
      description: "Configuration du client",
      badge: overdueCount > 0 ? overdueCount : undefined,
    },
  ];
}

/**
 * Validate tab parameter
 */
export function isValidTab(tab: string): tab is ClientProfileTab {
  const validTabs: ClientProfileTab[] = ["overview", "credits", "payments", "activity", "settings"];
  return validTabs.includes(tab as ClientProfileTab);
}

/**
 * Get default tab
 */
export function getDefaultTab(): ClientProfileTab {
  return "overview";
}
