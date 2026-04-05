"use client";

/**
 * Activity Tab
 * Timeline of all client interactions and system events
 */

import { useState, useMemo } from "react";
import {
  Download,
  Search,
  Activity,
  Clock,
  CreditCard,
  DollarSign,
  User,
  Settings,
  AlertTriangle,
  CheckCircle,
  Calendar,
  RefreshCw,
} from "lucide-react";

import { TabContentContainer, TabSectionHeader } from "../ClientProfileTabs";
import { generateActivityItems, getActivityIcon, getActivityColor } from "@/lib/client-profile";
import type { ActivityTabProps, ActivityItem } from "@/types/client-profile";
import { cn } from "@/lib/utils";

/**
 * Activity Type Filter Component
 */
function ActivityTypeFilter({
  selectedTypes,
  onTypesChange,
}: {
  selectedTypes: string[];
  onTypesChange: (types: string[]) => void;
}) {
  const _activityTypes = [
    { value: "all", label: "Tout", color: "slate" },
    { value: "credit_created", label: "Crédits", color: "blue" },
    { value: "payment_received", label: "Paiements", color: "green" },
    { value: "status_changed", label: "Statut", color: "amber" },
    { value: "limit_updated", label: "Limite", color: "purple" },
    { value: "client_created", label: "Profil", color: "slate" },
  ];

  const handleTypeToggle = (type: string) => {
    if (type === "all") {
      onTypesChange([]);
    } else {
      const newTypes = selectedTypes.includes(type)
        ? selectedTypes.filter((t) => t !== type)
        : [...selectedTypes, type];
      onTypesChange(newTypes);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {_activityTypes.map((type) => {
        const isSelected = type.value === "all" ? selectedTypes.length === 0 : selectedTypes.includes(type.value);

        const colorClasses = {
          slate: isSelected ? "bg-slate-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200",
          blue: isSelected ? "bg-blue-600 text-white" : "bg-blue-100 text-blue-700 hover:bg-blue-200",
          green: isSelected ? "bg-green-600 text-white" : "bg-green-100 text-green-700 hover:bg-green-200",
          amber: isSelected ? "bg-amber-600 text-white" : "bg-amber-100 text-amber-700 hover:bg-amber-200",
          purple: isSelected ? "bg-purple-600 text-white" : "bg-purple-100 text-purple-700 hover:bg-purple-200",
        };

        return (
          <button
            key={type.value}
            onClick={() => handleTypeToggle(type.value)}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm font-medium transition-colors duration-200",
              colorClasses[type.color as keyof typeof colorClasses],
            )}
          >
            {type.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Activity Item Component
 */
function ActivityItemComponent({ activity }: { activity: ActivityItem }) {
  const colors = getActivityColor(activity.type);
  const isRecent = Date.now() - activity.timestamp.getTime() < 7 * 24 * 60 * 60 * 1000; // 7 days

  return (
    <div className="relative flex gap-4">
      {/* Timeline Connector */}
      <div className="relative flex flex-col items-center">
        {/* Activity Dot */}
        <div
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center text-lg font-semibold border-2 border-white shadow-sm",
            colors.bg,
            colors.text,
            isRecent && "ring-2 ring-primary-200",
          )}
        >
          {getActivityIcon(activity.type)}
        </div>

        {/* Timeline Line */}
        <div className="w-0.5 h-8 bg-slate-200 mt-2" />
      </div>

      {/* Activity Content */}
      <div className="flex-1 pb-8">
        <div className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-sm transition-shadow duration-200">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="font-semibold text-slate-900">{activity.title}</h4>
                {isRecent && (
                  <span className="px-2 py-0.5 bg-primary-100 text-primary-700 text-xs font-medium rounded-full">
                    Récent
                  </span>
                )}
              </div>

              <p className="text-slate-600 text-sm mb-3">{activity.description}</p>

              {/* Metadata */}
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <div className="flex items-center gap-1">
                  <Clock size={12} />
                  <span>
                    {activity.timestamp.toLocaleDateString("fr-FR")} à{" "}
                    {activity.timestamp.toLocaleTimeString("fr-FR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                  <div className="flex items-center gap-1">
                    <Settings size={12} />
                    <span>Détails disponibles</span>
                  </div>
                )}
              </div>
            </div>

            {/* Amount Badge */}
            {activity.amount && (
              <div className="ml-4">
                <span
                  className={cn(
                    "inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold",
                    activity.type === "payment_received"
                      ? "bg-green-100 text-green-700 border border-green-200"
                      : "bg-blue-100 text-blue-700 border border-blue-200",
                  )}
                >
                  {activity.amount}
                </span>
              </div>
            )}
          </div>

          {/* Status Badge */}
          {activity.status && (
            <div className="mt-3 pt-3 border-t border-slate-100">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium",
                  activity.status === "OVERDUE"
                    ? "bg-red-100 text-red-700 border border-red-200"
                    : "bg-slate-100 text-slate-700 border border-slate-200",
                )}
              >
                {activity.status === "OVERDUE" && <AlertTriangle size={12} />}
                {activity.status === "PAID" && <CheckCircle size={12} />}
                {activity.status}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Activity Timeline Component
 */
function ActivityTimeline({ activities }: { activities: ActivityItem[] }) {
  if (activities.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
        <Activity size={48} className="mx-auto text-slate-300 mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Aucune activité</h3>
        <p className="text-slate-600">Les interactions et transactions apparaîtront ici au fur et à mesure.</p>
      </div>
    );
  }

  // Group activities by date
  const groupedActivities = activities.reduce(
    (groups, activity) => {
      const date = activity.timestamp.toLocaleDateString("fr-FR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(activity);
      return groups;
    },
    {} as Record<string, ActivityItem[]>,
  );

  return (
    <div className="space-y-8">
      {Object.entries(groupedActivities).map(([date, dayActivities]) => (
        <div key={date} className="space-y-4">
          {/* Date Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px flex-1 bg-slate-200" />
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full">
              <Calendar size={14} className="text-slate-600" />
              <span className="text-sm font-medium text-slate-700">{date}</span>
            </div>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          {/* Activities for this date */}
          <div className="space-y-0">
            {dayActivities.map((activity) => (
              <ActivityItemComponent key={activity.id} activity={activity} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Activity Stats Component
 */
function ActivityStats({ activities }: { activities: ActivityItem[] }) {
  const stats = useMemo(() => {
    const totalActivities = activities.length;
    const recentActivities = activities.filter(
      (a) => Date.now() - a.timestamp.getTime() < 7 * 24 * 60 * 60 * 1000,
    ).length;

    const typeCount = activities.reduce(
      (acc, activity) => {
        acc[activity.type] = (acc[activity.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const totalAmount = activities.filter((a) => a.amount).reduce((sum, a) => sum + (a.amount || 0), 0);

    return {
      totalActivities,
      recentActivities,
      typeCount,
      totalAmount,
    };
  }, [activities]);

  const _activityTypes = [
    {
      type: "credit_created",
      label: "Crédits créés",
      icon: CreditCard,
      color: "text-blue-600 bg-blue-50",
    },
    {
      type: "payment_received",
      label: "Paiements reçus",
      icon: DollarSign,
      color: "text-green-600 bg-green-50",
    },
    {
      type: "status_changed",
      label: "Changements statut",
      icon: AlertTriangle,
      color: "text-amber-600 bg-amber-50",
    },
    {
      type: "client_created",
      label: "Profil créé",
      icon: User,
      color: "text-slate-600 bg-slate-50",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-600">Total Activités</p>
            <p className="text-2xl font-bold text-slate-900">{stats.totalActivities}</p>
          </div>
          <Activity className="text-slate-500" size={24} />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-600">Cette Semaine</p>
            <p className="text-2xl font-bold text-primary-900">{stats.recentActivities}</p>
          </div>
          <Clock className="text-primary-500" size={24} />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-600">Montants Impliqués</p>
            <p className="text-lg font-bold text-green-900">{stats.totalAmount}</p>
          </div>
          <DollarSign className="text-green-500" size={24} />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-600">Types d&apos;Activité</p>
            <p className="text-2xl font-bold text-slate-900">{Object.keys(stats.typeCount).length}</p>
          </div>
          <Settings className="text-slate-500" size={24} />
        </div>
      </div>
    </div>
  );
}

/**
 * Activity Tab Component
 */
export default function ActivityTab({ client, activities: initialActivities, onExport, onRefresh }: ActivityTabProps) {
  const activities = initialActivities || generateActivityItems(client);

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [dateFilter, setDateFilter] = useState("all");

  // Filter activities
  const filteredActivities = useMemo(() => {
    let filtered = activities;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (activity) =>
          activity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          activity.description.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    // Apply type filter
    if (selectedTypes.length > 0) {
      filtered = filtered.filter((activity) => selectedTypes.includes(activity.type));
    }

    // Apply date filter
    if (dateFilter !== "all") {
      const now = Date.now();
      const filterMs =
        {
          week: 7 * 24 * 60 * 60 * 1000,
          month: 30 * 24 * 60 * 60 * 1000,
          quarter: 90 * 24 * 60 * 60 * 1000,
        }[dateFilter] || 0;

      filtered = filtered.filter((activity) => now - activity.timestamp.getTime() < filterMs);
    }

    return filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [activities, searchQuery, selectedTypes, dateFilter]);

  return (
    <TabContentContainer>
      {/* Header with Actions */}
      <TabSectionHeader
        title="Journal d'Activité"
        description={`${activities.length} activité${activities.length > 1 ? "s" : ""} enregistrée${activities.length > 1 ? "s" : ""}`}
        action={
          <div className="flex gap-2">
            <button
              onClick={onRefresh || (() => console.log("Refresh activities"))}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              <RefreshCw size={16} />
              Actualiser
            </button>
            <button
              onClick={onExport || (() => console.log("Export activities for", client.id))}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              <Download size={16} />
              Exporter
            </button>
          </div>
        }
      />

      {/* Activity Stats */}
      <ActivityStats activities={activities} />

      {/* Filters */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 mb-6 space-y-4">
        {/* Search and Date Filter */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher dans l'activité..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent"
            />
          </div>

          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent"
          >
            <option value="all">Toute la période</option>
            <option value="week">Cette semaine</option>
            <option value="month">Ce mois</option>
            <option value="quarter">Ce trimestre</option>
          </select>
        </div>

        {/* Type Filter */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Filtrer par type d&apos;activité :</label>
          <ActivityTypeFilter selectedTypes={selectedTypes} onTypesChange={setSelectedTypes} />
        </div>
      </div>

      {/* Results Counter */}
      {(searchQuery || selectedTypes.length > 0 || dateFilter !== "all") && (
        <div className="mb-4">
          <p className="text-sm text-slate-600">
            {filteredActivities.length} activité{filteredActivities.length > 1 ? "s" : ""} trouvée
            {filteredActivities.length > 1 ? "s" : ""}
            {filteredActivities.length !== activities.length && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedTypes([]);
                  setDateFilter("all");
                }}
                className="ml-2 text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                Réinitialiser les filtres
              </button>
            )}
          </p>
        </div>
      )}

      {/* Activity Timeline */}
      <ActivityTimeline activities={filteredActivities} />
    </TabContentContainer>
  );
}
