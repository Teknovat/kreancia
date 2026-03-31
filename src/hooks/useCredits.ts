"use client";

/**
 * Credits Hook
 * Custom hook for credit management with real API integration
 */

import { useState, useEffect, useCallback } from "react";
import type { CreditWithDetails, CreditFilters, CreateCreditData, UpdateCreditData } from "@/types/credit";

interface UseCreditsResponse {
  credits: CreditWithDetails[];
  totalCount: number;
  totalPages: number;
  stats: {
    totalCredits: number;
    openCredits: number;
    paidCredits: number;
    overdueCredits: number;
    totalAmount: number;
    totalOutstanding: number;
    totalOverdue: number;
  };
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createCredit: (data: CreateCreditData) => Promise<CreditWithDetails | null>;
  updateCredit: (id: string, data: UpdateCreditData) => Promise<CreditWithDetails | null>;
  deleteCredit: (id: string) => Promise<boolean>;
  filters: CreditFilters;
  setFilters: (filters: CreditFilters | ((prev: CreditFilters) => CreditFilters)) => void;
}

/**
 * Custom hook for credit management
 */
export function useCredits(initialFilters?: Partial<CreditFilters>): UseCreditsResponse {
  const [credits, setCredits] = useState<CreditWithDetails[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [stats, setStats] = useState({
    totalCredits: 0,
    openCredits: 0,
    paidCredits: 0,
    overdueCredits: 0,
    totalAmount: 0,
    totalOutstanding: 0,
    totalOverdue: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<CreditFilters>({
    search: "",
    status: "ALL",
    clientId: undefined,
    dueAfter: undefined,
    dueBefore: undefined,
    sortBy: "createdAt",
    sortOrder: "desc",
    page: 1,
    limit: 10,
    ...initialFilters,
  });

  /**
   * Fetch credits from API
   */
  const fetchCredits = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters
      const params = new URLSearchParams();
      if (filters.search) params.append("search", filters.search);
      if (filters.status && filters.status !== "ALL") params.append("status", filters.status);
      if (filters.clientId) params.append("clientId", filters.clientId);
      if (filters.dueAfter) params.append("dateFrom", filters.dueAfter.toISOString());
      if (filters.dueBefore) params.append("dateTo", filters.dueBefore.toISOString());
      params.append("sortBy", filters.sortBy);
      params.append("sortOrder", filters.sortOrder);
      params.append("page", filters.page.toString());
      params.append("limit", filters.limit.toString());

      const response = await fetch(`/api/credits?${params}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Network error" }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch credits");
      }

      // Transform credits data to convert date strings to Date objects
      const creditsWithDates = (data.data || []).map((credit: any) => ({
        ...credit,
        createdAt: new Date(credit.createdAt),
        updatedAt: new Date(credit.updatedAt),
        dueDate: new Date(credit.dueDate),
        client: credit.client
          ? {
              ...credit.client,
              createdAt: new Date(credit.client.createdAt),
              updatedAt: new Date(credit.client.updatedAt),
            }
          : null,
      }));

      setCredits(creditsWithDates);
      setTotalCount(data.pagination.total || 0);
      setTotalPages(data.pagination.totalPages || 0);
      setStats(
        data.data.stats || {
          totalCredits: 0,
          openCredits: 0,
          paidCredits: 0,
          overdueCredits: 0,
          totalAmount: 0,
          totalOutstanding: 0,
          totalOverdue: 0,
        },
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMessage);
      console.error("Error fetching credits:", err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  /**
   * Create a new credit
   */
  const createCredit = useCallback(
    async (data: CreateCreditData): Promise<CreditWithDetails | null> => {
      try {
        setError(null);

        const response = await fetch("/api/credits", {
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
          throw new Error(result.error || "Failed to create credit");
        }

        // Refresh credit list
        await fetchCredits();

        return result.data;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to create credit";
        setError(errorMessage);
        console.error("Error creating credit:", err);
        return null;
      }
    },
    [fetchCredits],
  );

  /**
   * Update an existing credit
   */
  const updateCredit = useCallback(
    async (id: string, data: UpdateCreditData): Promise<CreditWithDetails | null> => {
      try {
        setError(null);

        const response = await fetch(`/api/credits/${id}`, {
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
          throw new Error(result.error || "Failed to update credit");
        }

        // Update credit in local state optimistically
        setCredits((prev) =>
          prev.map((credit) =>
            credit.id === id
              ? {
                  ...result.data,
                  createdAt: new Date(result.data.createdAt),
                  updatedAt: new Date(result.data.updatedAt),
                  dueDate: new Date(result.data.dueDate),
                }
              : credit,
          ),
        );

        return result.data;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to update credit";
        setError(errorMessage);
        console.error("Error updating credit:", err);
        // Refresh on error to ensure consistency
        await fetchCredits();
        return null;
      }
    },
    [fetchCredits],
  );

  /**
   * Delete a credit
   */
  const deleteCredit = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        setError(null);

        const response = await fetch(`/api/credits/${id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: "Network error" }));
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || "Failed to delete credit");
        }

        // Remove credit from local state optimistically
        setCredits((prev) => prev.filter((credit) => credit.id !== id));
        setTotalCount((prev) => prev - 1);

        return true;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to delete credit";
        setError(errorMessage);
        console.error("Error deleting credit:", err);
        // Refresh on error to ensure consistency
        await fetchCredits();
        return false;
      }
    },
    [fetchCredits],
  );

  /**
   * Refetch credits (for manual refresh)
   */
  const refetch = useCallback(async () => {
    await fetchCredits();
  }, [fetchCredits]);

  // Fetch credits when filters change
  useEffect(() => {
    fetchCredits();
    console.log("after fetch");
    console.log(credits);
  }, [fetchCredits]);

  return {
    credits,
    totalCount,
    totalPages,
    stats,
    loading,
    error,
    refetch,
    createCredit,
    updateCredit,
    deleteCredit,
    filters,
    setFilters,
  };
}
