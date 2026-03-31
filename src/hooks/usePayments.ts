"use client";

/**
 * Payments Hook
 * Custom hook for payment management with real API integration
 */

import { useState, useEffect, useCallback } from "react";
import type { PaymentWithDetails, PaymentFilters, CreatePaymentData, UpdatePaymentData } from "@/types/payment";

interface UsePaymentsResponse {
  payments: PaymentWithDetails[];
  totalCount: number;
  totalPages: number;
  stats: {
    totalPayments: number;
    totalAmount: number;
    amountThisMonth: number;
    paymentsThisMonth: number;
    unallocatedPayments: number;
    averagePaymentAmount: number;
  };
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createPayment: (data: CreatePaymentData) => Promise<PaymentWithDetails | null>;
  updatePayment: (id: string, data: UpdatePaymentData) => Promise<PaymentWithDetails | null>;
  deletePayment: (id: string) => Promise<boolean>;
  allocatePayment: (paymentId: string, allocations: Array<{ creditId: string; amount: number }>) => Promise<boolean>;
  reversePayment: (paymentId: string) => Promise<boolean>;
  filters: PaymentFilters;
  setFilters: (filters: PaymentFilters | ((prev: PaymentFilters) => PaymentFilters)) => void;
}

/**
 * Custom hook for payment management
 */
export function usePayments(initialFilters?: Partial<PaymentFilters>): UsePaymentsResponse {
  const [payments, setPayments] = useState<PaymentWithDetails[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [stats, setStats] = useState({
    totalPayments: 0,
    totalAmount: 0,
    amountThisMonth: 0,
    paymentsThisMonth: 0,
    unallocatedPayments: 0,
    averagePaymentAmount: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<PaymentFilters>({
    search: "",
    clientId: undefined,
    method: "ALL",
    dateFrom: undefined,
    dateTo: undefined,
    isFullyAllocated: false,
    sortBy: "paymentDate",
    sortOrder: "desc",
    page: 1,
    limit: 10,
    ...initialFilters,
  });

  /**
   * Fetch payments from API
   */
  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters
      const params = new URLSearchParams();
      if (filters.search) params.append("search", filters.search);
      if (filters.clientId) params.append("clientId", filters.clientId);
      if (filters.method) params.append("method", filters.method);
      if (filters.dateFrom) params.append("dateFrom", filters.dateFrom.toISOString());
      if (filters.dateTo) params.append("dateTo", filters.dateTo.toISOString());
      if (filters.isFullyAllocated !== undefined)
        params.append("isFullyAllocated", filters.isFullyAllocated.toString());
      params.append("sortBy", filters.sortBy);
      params.append("sortOrder", filters.sortOrder);
      params.append("page", filters.page.toString());
      params.append("limit", filters.limit.toString());

      const response = await fetch(`/api/payments?${params}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Network error" }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch payments");
      }

      // Transform payments data to convert date strings to Date objects
      const paymentsWithDates = (data.data || []).map((payment: any) => ({
        ...payment,
        createdAt: new Date(payment.createdAt),
        updatedAt: new Date(payment.updatedAt),
        paymentDate: new Date(payment.paymentDate),
        client: payment.client
          ? {
              ...payment.client,
              createdAt: new Date(payment.client.createdAt),
              updatedAt: new Date(payment.client.updatedAt),
            }
          : null,
        paymentAllocations:
          payment.paymentAllocations?.map((allocation: any) => ({
            ...allocation,
            createdAt: new Date(allocation.createdAt),
            credit: allocation.credit
              ? {
                  ...allocation.credit,
                  createdAt: new Date(allocation.credit.createdAt),
                  updatedAt: new Date(allocation.credit.updatedAt),
                  dueDate: new Date(allocation.credit.dueDate),
                }
              : null,
          })) || [],
      }));

      setPayments(paymentsWithDates);
      setTotalCount(data.pagination.total || 0);
      setTotalPages(data.data.totalPages || 0);
      setStats(
        data.data.stats || {
          totalPayments: 0,
          totalAmount: 0,
          amountThisMonth: 0,
          paymentsThisMonth: 0,
          unallocatedPayments: 0,
          averagePaymentAmount: 0,
        },
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMessage);
      console.error("Error fetching payments:", err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  /**
   * Create a new payment
   */
  const createPayment = useCallback(
    async (data: CreatePaymentData): Promise<PaymentWithDetails | null> => {
      try {
        setError(null);

        const response = await fetch("/api/payments", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: "Network error" }));
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || "Failed to create payment");
        }

        // Refresh payment list
        await fetchPayments();

        return result.data;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to create payment";
        setError(errorMessage);
        console.error("Error creating payment:", err);
        return null;
      }
    },
    [fetchPayments],
  );

  /**
   * Update an existing payment
   */
  const updatePayment = useCallback(
    async (id: string, data: UpdatePaymentData): Promise<PaymentWithDetails | null> => {
      try {
        setError(null);

        const response = await fetch(`/api/payments/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: "Network error" }));
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || "Failed to update payment");
        }

        // Update payment in local state optimistically
        setPayments((prev) =>
          prev.map((payment) =>
            payment.id === id
              ? {
                  ...result.data,
                  createdAt: new Date(result.data.createdAt),
                  updatedAt: new Date(result.data.updatedAt),
                  paymentDate: new Date(result.data.paymentDate),
                }
              : payment,
          ),
        );

        return result.data;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to update payment";
        setError(errorMessage);
        console.error("Error updating payment:", err);
        // Refresh on error to ensure consistency
        await fetchPayments();
        return null;
      }
    },
    [fetchPayments],
  );

  /**
   * Delete a payment
   */
  const deletePayment = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        setError(null);

        const response = await fetch(`/api/payments/${id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: "Network error" }));
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || "Failed to delete payment");
        }

        // Remove payment from local state optimistically
        setPayments((prev) => prev.filter((payment) => payment.id !== id));
        setTotalCount((prev) => prev - 1);

        return true;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to delete payment";
        setError(errorMessage);
        console.error("Error deleting payment:", err);
        // Refresh on error to ensure consistency
        await fetchPayments();
        return false;
      }
    },
    [fetchPayments],
  );

  /**
   * Allocate payment to credits (manual allocation)
   */
  const allocatePayment = useCallback(
    async (paymentId: string, allocations: Array<{ creditId: string; amount: number }>): Promise<boolean> => {
      try {
        setError(null);

        const response = await fetch(`/api/payments/${paymentId}/allocate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ allocations }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: "Network error" }));
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || "Failed to allocate payment");
        }

        // Refresh payment list to get updated allocations
        await fetchPayments();

        return true;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to allocate payment";
        setError(errorMessage);
        console.error("Error allocating payment:", err);
        return false;
      }
    },
    [fetchPayments],
  );

  /**
   * Reverse a payment (remove all allocations)
   */
  const reversePayment = useCallback(
    async (paymentId: string): Promise<boolean> => {
      try {
        setError(null);

        const response = await fetch(`/api/payments/${paymentId}/reverse`, {
          method: "POST",
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: "Network error" }));
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || "Failed to reverse payment");
        }

        // Refresh payment list to get updated state
        await fetchPayments();

        return true;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to reverse payment";
        setError(errorMessage);
        console.error("Error reversing payment:", err);
        return false;
      }
    },
    [fetchPayments],
  );

  /**
   * Refetch payments (for manual refresh)
   */
  const refetch = useCallback(async () => {
    await fetchPayments();
  }, [fetchPayments]);

  // Fetch payments when filters change
  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  return {
    payments,
    totalCount,
    totalPages,
    stats,
    loading,
    error,
    refetch,
    createPayment,
    updatePayment,
    deletePayment,
    allocatePayment,
    reversePayment,
    filters,
    setFilters,
  };
}
