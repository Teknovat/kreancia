"use client";

/**
 * Client Table Component
 * Responsive table displaying client data with actions
 */

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Mail,
  Phone,
  CreditCard,
  Calendar,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  AlertTriangle,
  User,
} from "lucide-react";

import type { ClientWithStats } from "@/types/client";
import { CLIENT_STATUS_COLORS } from "@/types/client";
import { cn } from "@/lib/utils";

interface ClientTableProps {
  clients: ClientWithStats[];
  loading?: boolean;
  onEdit?: (client: ClientWithStats) => void;
  onDelete?: (client: ClientWithStats) => void;
  onView?: (client: ClientWithStats) => void;
  className?: string;
}

/**
 * Status Badge Component
 */
function StatusBadge({ status }: { status: ClientWithStats["status"] }) {
  const colors = CLIENT_STATUS_COLORS[status] || CLIENT_STATUS_COLORS.INACTIVE;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border",
        colors.bg,
        colors.text,
        colors.border,
      )}
    >
      <div className={cn("w-1.5 h-1.5 rounded-full", colors.dot)} />
      {status ? status.toLowerCase() : 'inactive'}
    </span>
  );
}

/**
 * Actions Dropdown Component
 */
function ActionsDropdown({
  client,
  onEdit,
  onDelete,
  onView,
}: {
  client: ClientWithStats;
  onEdit?: (client: ClientWithStats) => void;
  onDelete?: (client: ClientWithStats) => void;
  onView?: (client: ClientWithStats) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg hover:bg-slate-100 transition-colors duration-200"
      >
        <MoreHorizontal size={16} className="text-slate-500" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-10">
          {onView && (
            <button
              onClick={() => {
                onView(client);
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Eye size={14} />
              View Details
            </button>
          )}
          {onEdit && (
            <button
              onClick={() => {
                onEdit(client);
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Edit size={14} />
              Edit Client
            </button>
          )}
          {onDelete && (
            <>
              <div className="h-px bg-slate-100 my-1" />
              <button
                onClick={() => {
                  onDelete(client);
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-700 hover:bg-red-50 transition-colors"
              >
                <Trash2 size={14} />
                Delete Client
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Mobile Client Card Component
 */
function ClientCard({
  client,
  onEdit,
  onDelete,
  onView,
}: {
  client: ClientWithStats;
} & Pick<ClientTableProps, "onEdit" | "onDelete" | "onView">) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-sm transition-shadow duration-200"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-semibold">
            {client.firstName.charAt(0)}
            {client.lastName.charAt(0)}
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">{client.fullName}</h3>
            <div className="flex items-center gap-2 mt-1">
              <StatusBadge status={client.status} />
            </div>
          </div>
        </div>
        <ActionsDropdown client={client} onEdit={onEdit} onDelete={onDelete} onView={onView} />
      </div>

      {/* Contact Info */}
      <div className="space-y-2 mb-4">
        {client.email && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Mail size={14} />
            <span className="truncate">{client.email}</span>
          </div>
        )}
        {client.phone && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Phone size={14} />
            <span>{client.phone}</span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100">
        <div>
          <p className="text-xs text-slate-500">Credit Limit</p>
          <p className="font-semibold text-slate-900">${(client.creditLimit || 0).toLocaleString("en-US")}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Outstanding</p>
          <p className={cn("font-semibold", client.outstandingAmount > 0 ? "text-amber-600" : "text-green-600")}>
            ${client.outstandingAmount.toLocaleString("en-US")}
          </p>
        </div>
      </div>

      {client.overdueAmount > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle size={14} />
            <span className="text-sm font-medium">${client.overdueAmount.toLocaleString("en-US")} overdue</span>
          </div>
        </div>
      )}
    </motion.div>
  );
}

/**
 * Main Client Table Component
 */
export default function ClientTable({
  clients,
  loading = false,
  onEdit,
  onDelete,
  onView,
  className,
}: ClientTableProps) {
  if (loading) {
    return (
      <div className={cn("bg-white rounded-xl border border-slate-200", className)}>
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading clients...</p>
        </div>
      </div>
    );
  }

  if (clients.length === 0) {
    return (
      <div className={cn("bg-white rounded-xl border border-slate-200", className)}>
        <div className="p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User size={24} className="text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No clients found</h3>
          <p className="text-slate-600 mb-6">Get started by adding your first client to the system.</p>
          <button className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors duration-200">
            Add First Client
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("bg-white rounded-xl border border-slate-200 overflow-hidden", className)}>
      {/* Desktop Table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="text-left py-3 px-4 font-semibold text-slate-700">Client</th>
              <th className="text-left py-3 px-4 font-semibold text-slate-700">Contact</th>
              <th className="text-left py-3 px-4 font-semibold text-slate-700">Status</th>
              <th className="text-right py-3 px-4 font-semibold text-slate-700">Credit Limit</th>
              <th className="text-right py-3 px-4 font-semibold text-slate-700">Outstanding</th>
              <th className="text-left py-3 px-4 font-semibold text-slate-700">Credits</th>
              <th className="text-left py-3 px-4 font-semibold text-slate-700">Last Activity</th>
              <th className="w-12 py-3 px-4"></th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client, index) => (
              <motion.tr
                key={client.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="border-b border-slate-100 hover:bg-slate-50 transition-colors duration-200"
              >
                {/* Client Info */}
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-purple-500 rounded-lg flex items-center justify-center text-white text-sm font-semibold">
                      {client.firstName.charAt(0)}
                      {client.lastName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{client.fullName}</p>
                      <p className="text-sm text-slate-500">Created {client.createdAt.toLocaleDateString("en-US")}</p>
                    </div>
                  </div>
                </td>

                {/* Contact */}
                <td className="py-4 px-4">
                  <div className="space-y-1">
                    {client.email && (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Mail size={12} />
                        <span className="truncate max-w-32">{client.email}</span>
                      </div>
                    )}
                    {client.phone && (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Phone size={12} />
                        <span>{client.phone}</span>
                      </div>
                    )}
                  </div>
                </td>

                {/* Status */}
                <td className="py-4 px-4">
                  <StatusBadge status={client.status} />
                  {client.overdueAmount > 0 && (
                    <div className="flex items-center gap-1 mt-1 text-red-600">
                      <AlertTriangle size={12} />
                      <span className="text-xs">Overdue</span>
                    </div>
                  )}
                </td>

                {/* Credit Limit */}
                <td className="py-4 px-4 text-right">
                  <p className="font-semibold text-slate-900">${(client.creditLimit || 0).toLocaleString("en-US")}</p>
                  <p className="text-sm text-slate-500">{client.paymentTermDays}d terms</p>
                </td>

                {/* Outstanding */}
                <td className="py-4 px-4 text-right">
                  <p
                    className={cn("font-semibold", client.outstandingAmount > 0 ? "text-amber-600" : "text-green-600")}
                  >
                    ${client.outstandingAmount.toLocaleString("en-US")}
                  </p>
                  {client.overdueAmount > 0 && (
                    <p className="text-sm text-red-600">${client.overdueAmount.toLocaleString("en-US")} overdue</p>
                  )}
                </td>

                {/* Credits */}
                <td className="py-4 px-4">
                  <div className="flex items-center gap-2">
                    <CreditCard size={14} className="text-slate-400" />
                    <span className="text-sm text-slate-600">
                      {client.creditCount} {client.creditCount === 1 ? "credit" : "credits"}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500">
                    {client.paymentCount} {client.paymentCount === 1 ? "payment" : "payments"}
                  </p>
                </td>

                {/* Last Activity */}
                <td className="py-4 px-4">
                  {client.lastActivity ? (
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-slate-400" />
                      <span className="text-sm text-slate-600">{client.lastActivity.toLocaleDateString("en-US")}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-slate-400">No activity</span>
                  )}
                </td>

                {/* Actions */}
                <td className="py-4 px-4">
                  <ActionsDropdown client={client} onEdit={onEdit} onDelete={onDelete} onView={onView} />
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden p-4 space-y-4">
        {clients.map((client) => (
          <ClientCard key={client.id} client={client} onEdit={onEdit} onDelete={onDelete} onView={onView} />
        ))}
      </div>
    </div>
  );
}
