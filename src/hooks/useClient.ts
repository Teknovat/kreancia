"use client";

/**
 * Client Hook
 * Custom hook for fetching individual client details
 */

import { useState, useEffect, useCallback } from "react";

interface ClientProfileData {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  businessName: string | null;
  taxId: string | null;
  creditLimit: number | null;
  paymentTermDays: number;
  merchantId: string;
  createdAt: Date;
  updatedAt: Date;
  fullName: string;
  outstandingAmount: number;
  overdueAmount: number;
  totalCreditsAmount: number;
  totalPaymentsAmount: number;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  lastActivity: Date;
  creditUtilization: number;
  avgPaymentDays: number;
  creditCount: number;
  paymentCount: number;
  credits: Array<{
    id: string;
    label: string;
    totalAmount: number;
    remainingAmount: number;
    dueDate: Date | null;
    status: "OPEN" | "PAID" | "OVERDUE";
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
    paymentAllocations: Array<{
      id: string;
      amount: number;
      allocatedAmount: number;
      payment: {
        amount: number;
        paymentDate: Date;
        method: string;
      };
    }>;
  }>;
  payments: Array<{
    id: string;
    amount: number;
    note: string | null;
    method: string;
    reference: string | null;
    paymentDate: Date;
    createdAt: Date;
    paymentAllocations: Array<{
      id: string;
      amount: number;
      allocatedAmount: number;
      credit: {
        label: string;
      };
    }>;
  }>;
}

interface UseClientResponse {
  client: ClientProfileData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook for fetching individual client details
 */
export function useClient(clientId: string | undefined): UseClientResponse {
  const [client, setClient] = useState<ClientProfileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch client details from API
   */
  const fetchClient = useCallback(async () => {
    if (!clientId) {
      setError("Client ID is required");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/clients/${clientId}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Network error" }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to fetch client details");
      }

      // Transform client data to convert date strings to Date objects
      const clientWithDates = {
        ...result.data,
        createdAt: new Date(result.data.createdAt),
        updatedAt: new Date(result.data.updatedAt),
        lastActivity: new Date(result.data.lastActivity),
        credits: result.data.credits.map((credit: any) => ({
          ...credit,
          createdAt: new Date(credit.createdAt),
          updatedAt: new Date(credit.updatedAt),
          dueDate: credit.dueDate ? new Date(credit.dueDate) : null,
          paymentAllocations: credit.paymentAllocations.map((allocation: any) => ({
            ...allocation,
            createdAt: new Date(allocation.createdAt),
            updatedAt: new Date(allocation.updatedAt),
            payment: {
              ...allocation.payment,
              paymentDate: new Date(allocation.payment.paymentDate),
            },
          })),
        })),
        payments: result.data.payments.map((payment: any) => ({
          ...payment,
          createdAt: new Date(payment.createdAt),
          updatedAt: new Date(payment.updatedAt),
          paymentDate: new Date(payment.paymentDate),
          paymentAllocations: payment.paymentAllocations.map((allocation: any) => ({
            ...allocation,
            createdAt: new Date(allocation.createdAt),
            updatedAt: new Date(allocation.updatedAt),
          })),
        })),
      };

      setClient(clientWithDates);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMessage);
      console.error("Error fetching client details:", err);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  /**
   * Refetch client (for manual refresh)
   */
  const refetch = useCallback(async () => {
    await fetchClient();
  }, [fetchClient]);

  // Fetch client when clientId changes
  useEffect(() => {
    fetchClient();
  }, [fetchClient]);

  return {
    client,
    loading,
    error,
    refetch,
  };
}
