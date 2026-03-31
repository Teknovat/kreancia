"use client";

/**
 * Clients Hook
 * Custom hook for client management with real API integration
 */

import { useState, useEffect, useCallback } from "react";
import type { ClientWithStats, ClientFilters, CreateClientData, UpdateClientData } from "@/types/client";

interface UseClientsResponse {
  clients: ClientWithStats[];
  totalCount: number;
  totalPages: number;
  stats: {
    totalClients: number;
    activeClients: number;
    totalOutstanding: number;
    overdueClients: number;
    avgCreditLimit: number;
  };
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createClient: (data: CreateClientData) => Promise<ClientWithStats | null>;
  updateClient: (id: string, data: UpdateClientData) => Promise<ClientWithStats | null>;
  deleteClient: (id: string) => Promise<boolean>;
  filters: ClientFilters;
  setFilters: (filters: ClientFilters | ((prev: ClientFilters) => ClientFilters)) => void;
}

/**
 * Custom hook for client management
 */
export function useClients(initialFilters?: Partial<ClientFilters>): UseClientsResponse {
  const [clients, setClients] = useState<ClientWithStats[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [stats, setStats] = useState({
    totalClients: 0,
    activeClients: 0,
    totalOutstanding: 0,
    overdueClients: 0,
    avgCreditLimit: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ClientFilters>({
    search: "",
    status: "ALL",
    hasOverdue: false,
    sortBy: "name",
    sortOrder: "asc",
    page: 1,
    limit: 10,
    ...initialFilters,
  });

  /**
   * Fetch clients from API
   */
  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters matching API schema
      const params = new URLSearchParams();
      if (filters.search) params.append("q", filters.search);
      if (filters.status !== "ALL") params.append("status", filters.status);
      if (filters.hasOverdue) params.append("hasOverdue", "true");

      // Map sortBy to API orderBy field names
      const orderByMap: { [key: string]: string } = {
        name: "firstName",
        firstName: "firstName",
        lastName: "lastName",
        email: "email",
        createdAt: "createdAt",
      };

      params.append("orderBy", orderByMap[filters.sortBy] || "firstName");
      params.append("order", filters.sortOrder);
      params.append("page", filters.page.toString());
      params.append("limit", filters.limit.toString());
      console.log(params);
      const response = await fetch(`/api/clients?${params}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Network error" }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch clients");
      }

      // Transform clients data to convert date strings to Date objects
      const clientsWithDates = (data.data.clients || []).map((client: any) => ({
        ...client,
        createdAt: new Date(client.createdAt),
        updatedAt: new Date(client.updatedAt),
        lastActivity: new Date(client.lastActivity),
      }));
      setClients(clientsWithDates);
      setTotalCount(data.data.totalCount || 0);
      setTotalPages(data.data.totalPages || 0);
      setStats(
        data.data.stats || {
          totalClients: 0,
          activeClients: 0,
          totalOutstanding: 0,
          overdueClients: 0,
          avgCreditLimit: 0,
        },
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMessage);
      console.error("Error fetching clients:", err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  /**
   * Create a new client
   */
  const createClient = useCallback(
    async (data: CreateClientData): Promise<ClientWithStats | null> => {
      try {
        setError(null);

        const response = await fetch("/api/clients", {
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
          throw new Error(result.error || "Failed to create client");
        }

        // Refresh client list
        await fetchClients();

        return result.data;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to create client";
        setError(errorMessage);
        console.error("Error creating client:", err);
        return null;
      }
    },
    [fetchClients],
  );

  /**
   * Update an existing client
   */
  const updateClient = useCallback(
    async (id: string, data: UpdateClientData): Promise<ClientWithStats | null> => {
      try {
        setError(null);

        const response = await fetch(`/api/clients/${id}`, {
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
          throw new Error(result.error || "Failed to update client");
        }

        // Update client in local state optimistically
        setClients((prev) => prev.map((client) => (client.id === id ? result.data : client)));

        return result.data;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to update client";
        setError(errorMessage);
        console.error("Error updating client:", err);
        // Refresh on error to ensure consistency
        await fetchClients();
        return null;
      }
    },
    [fetchClients],
  );

  /**
   * Delete a client
   */
  const deleteClient = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        setError(null);

        const response = await fetch(`/api/clients/${id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: "Network error" }));
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || "Failed to delete client");
        }

        // Remove client from local state optimistically
        setClients((prev) => prev.filter((client) => client.id !== id));
        setTotalCount((prev) => prev - 1);

        return true;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to delete client";
        setError(errorMessage);
        console.error("Error deleting client:", err);
        // Refresh on error to ensure consistency
        await fetchClients();
        return false;
      }
    },
    [fetchClients],
  );

  /**
   * Refetch clients (for manual refresh)
   */
  const refetch = useCallback(async () => {
    await fetchClients();
  }, [fetchClients]);

  // Fetch clients when filters change
  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  return {
    clients,
    totalCount,
    totalPages,
    stats,
    loading,
    error,
    refetch,
    createClient,
    updateClient,
    deleteClient,
    filters,
    setFilters,
  };
}
