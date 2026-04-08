/**
 * Custom Hook for Dashboard Statistics
 * Provides real-time KPIs and analytics data
 */

import { useState, useEffect, useCallback } from "react";

interface DashboardStats {
  // Client statistics
  totalClients: number;
  activeClients: number;

  // Credit statistics
  totalCredits: number;
  openCredits: number;
  paidCredits: number;
  overdueCredits: number;
  totalCreditsAmount: number;
  totalOutstandingAmount: number;
  totalOverdueAmount: number;

  // Payment statistics
  totalPayments: number;
  totalPaymentsAmount: number;
  totalAllocatedAmount: number;
  totalUnallocatedAmount: number;
  paymentsThisMonth: number;
  amountThisMonth: number;

  // Trends (simplified for now)
  clientsTrend: number;
  creditsTrend: number;
  paymentsTrend: number;
  outstandingTrend: number;
}

interface RecentActivity {
  id: string;
  type: "CREDIT_CREATED" | "PAYMENT_RECEIVED" | "PAYMENT_REVERSED";
  description: string;
  amount?: number;
  date: Date;
  clientName?: string;
  relatedId?: string;
}

interface UseDashboardResult {
  stats: DashboardStats | null;
  recentActivity: RecentActivity[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useDashboard(): UseDashboardResult {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch dashboard statistics
  const fetchDashboardStats = useCallback(async () => {
    try {
      // Fetch multiple data sources in parallel
      const [clientsRes, creditsRes, paymentsRes] = await Promise.all([
        fetch("/api/clients"),
        fetch("/api/credits?limit=100"), // Get all credits for statistics
        fetch("/api/payments?limit=100"), // Get all payments for statistics
      ]);

      if (!clientsRes.ok || !creditsRes.ok || !paymentsRes.ok) {
        throw new Error("Failed to fetch dashboard data");
      }

      const [clientsData, creditsData, paymentsData] = await Promise.all([
        clientsRes.json(),
        creditsRes.json(),
        paymentsRes.json(),
      ]);

      if (!clientsData.success || !creditsData.success || !paymentsData.success) {
        throw new Error("API returned error");
      }

      // Calculate statistics
      const clients = clientsData.data.clients;
      const credits = creditsData.data;
      const payments = paymentsData.data;

      // Client stats
      const totalClients = clients.length;
      const activeClients = clients.filter((c: any) => c.status === "ACTIVE").length;

      // Credit stats
      const totalCredits = credits.length;
      const openCredits = credits.filter((c: any) => c.status === "OPEN").length;
      const paidCredits = credits.filter((c: any) => c.status === "PAID").length;
      const overdueCredits = credits.filter((c: any) => c.status === "OVERDUE").length;

      const totalCreditsAmount = credits.reduce((sum: number, c: any) => sum + c.totalAmount, 0);
      const totalOutstandingAmount = credits.reduce((sum: number, c: any) => sum + c.remainingAmount, 0);
      const totalOverdueAmount = credits
        .filter((c: any) => c.status === "OVERDUE")
        .reduce((sum: number, c: any) => sum + c.remainingAmount, 0);

      // Payment stats
      const totalPayments = payments.length;
      const totalPaymentsAmount = payments.reduce((sum: number, p: any) => sum + p.amount, 0);
      const totalAllocatedAmount = payments.reduce((sum: number, p: any) => sum + p.totalAllocated, 0);
      const totalUnallocatedAmount = payments.reduce((sum: number, p: any) => sum + p.unallocatedAmount, 0);

      // This month stats
      const thisMonth = new Date();
      thisMonth.setDate(1);
      thisMonth.setHours(0, 0, 0, 0);

      const paymentsThisMonth = payments.filter((p: any) => new Date(p.paymentDate) >= thisMonth).length;

      const amountThisMonth = payments
        .filter((p: any) => new Date(p.paymentDate) >= thisMonth)
        .reduce((sum: number, p: any) => sum + p.amount, 0);

      // Calculate simple trends (mock for now - would need historical data)
      const clientsTrend = 5.2; // % change
      const creditsTrend = 12.8;
      const paymentsTrend = 8.1;
      const outstandingTrend = -3.2;

      const dashboardStats: DashboardStats = {
        totalClients,
        activeClients,
        totalCredits,
        openCredits,
        paidCredits,
        overdueCredits,
        totalCreditsAmount,
        totalOutstandingAmount,
        totalOverdueAmount,
        totalPayments,
        totalPaymentsAmount,
        totalAllocatedAmount,
        totalUnallocatedAmount,
        paymentsThisMonth,
        amountThisMonth,
        clientsTrend,
        creditsTrend,
        paymentsTrend,
        outstandingTrend,
      };

      setStats(dashboardStats);

      // Generate recent activity from credits and payments
      const activities: RecentActivity[] = [];

      // Add recent credits
      credits.slice(0, 5).forEach((credit: any) => {
        activities.push({
          id: `credit-${credit.id}`,
          type: "CREDIT_CREATED",
          description: `Crédit "${credit.label}" créé`,
          amount: credit.totalAmount,
          date: new Date(credit.createdAt),
          clientName: credit.client.fullName,
          relatedId: credit.id,
        });
      });

      // Add recent payments
      payments.slice(0, 5).forEach((payment: any) => {
        activities.push({
          id: `payment-${payment.id}`,
          type: "PAYMENT_RECEIVED",
          description: `Paiement reçu (${payment.method})`,
          amount: payment.amount,
          date: new Date(payment.paymentDate),
          clientName: payment.client.fullName,
          relatedId: payment.id,
        });
      });

      // Sort by date and limit
      activities.sort((a, b) => b.date.getTime() - a.date.getTime());
      setRecentActivity(activities.slice(0, 10));
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    }
  }, []);

  // Main fetch function
  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await fetchDashboardStats();
    } catch (err) {
      console.error("Error in fetchDashboard:", err);
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setLoading(false);
    }
  }, [fetchDashboardStats]);

  // Fetch dashboard data on mount
  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return {
    stats,
    recentActivity,
    loading,
    error,
    refetch: fetchDashboard,
  };
}
