"use client";

/**
 * Overview Tab
 * Client profile overview with key metrics, recent activity, and quick actions
 */

import {
  CreditCard,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Plus,
  Receipt,
  Activity,
  Clock,
  Target,
  CheckCircle,
} from "lucide-react";

import { motion } from "framer-motion";
import {
  calculateClientMetrics,
  generateActivityItems,
  getActivityIcon,
  getActivityColor,
  calculateCreditHealthScore,
} from "@/lib/client-profile";
import { TabContentContainer, TabSectionHeader } from "../ClientProfileTabs";
import type { OverviewTabProps, ActivityItem } from "@/types/client-profile";
import { cn } from "@/lib/utils";

/**
 * Metric Card Component
 */
function MetricCard({
  title,
  value,
  change,
  trend,
  icon: Icon,
  color = "blue",
  onClick,
}: {
  title: string;
  value: string | number;
  change?: string;
  trend?: "up" | "down" | "neutral";
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color?: "blue" | "green" | "amber" | "red" | "purple";
  onClick?: () => void;
}) {
  const colors = {
    blue: "bg-blue-500 text-blue-100",
    green: "bg-green-500 text-green-100",
    amber: "bg-amber-500 text-amber-100",
    red: "bg-red-500 text-red-100",
    purple: "bg-purple-500 text-purple-100",
  };

  const trendColors = {
    up: "text-green-600",
    down: "text-red-600",
    neutral: "text-slate-600",
  };

  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : null;

  return (
    <div
      className={cn(
        "bg-white rounded-xl p-6 border border-slate-200 transition-all duration-200",
        onClick && "cursor-pointer hover:shadow-md hover:border-slate-300",
      )}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-600">{title}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{typeof value === "number" ? value : value}</p>
          {change && trend && (
            <div className="flex items-center mt-2 gap-1">
              {TrendIcon && <TrendIcon size={14} className={trendColors[trend]} />}
              <span className={`text-sm font-medium ${trendColors[trend]}`}>{change}</span>
              <span className="text-sm text-slate-500">vs période précédente</span>
            </div>
          )}
        </div>
        <div className={cn("p-3 rounded-lg", colors[color])}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
}

/**
 * Quick Action Button Component
 */
function QuickActionButton({
  title,
  description,
  icon: Icon,
  onClick,
  variant = "primary",
}: {
  title: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  onClick: () => void;
  variant?: "primary" | "secondary";
}) {
  const variants = {
    primary: "bg-primary-600 text-white hover:bg-primary-700 border-primary-600",
    secondary: "bg-white text-slate-700 hover:bg-slate-50 border-slate-200",
  };

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "p-4 rounded-xl border-2 text-left transition-all duration-200 w-full",
        "focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2",
        variants[variant],
      )}
    >
      <div className="flex items-center gap-3">
        <Icon size={20} />
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="text-sm opacity-80">{description}</p>
        </div>
      </div>
    </motion.button>
  );
}

/**
 * Activity Item Component
 */
function ActivityItemComponent({ activity }: { activity: ActivityItem }) {
  const colors = getActivityColor(activity.type);

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors duration-200">
      {/* Activity Dot */}
      <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-xs", colors.bg)}>
        <span className={colors.text}>{getActivityIcon(activity.type)}</span>
      </div>

      {/* Activity Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-medium text-slate-900">{activity.title}</p>
            <p className="text-sm text-slate-600 mt-1">{activity.description}</p>
          </div>
          {activity.amount && (
            <span
              className={cn(
                "text-sm font-semibold px-2 py-1 rounded",
                activity.type === "payment_received" ? "text-green-700 bg-green-50" : "text-blue-700 bg-blue-50",
              )}
            >
              {activity.amount}
            </span>
          )}
        </div>
        <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
          <Clock size={10} />
          {activity.timestamp.toLocaleDateString("fr-FR")} à{" "}
          {activity.timestamp.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </div>
  );
}

/**
 * Credit Health Score Component
 */
function CreditHealthScore({ client }: { client: any }) {
  const health = calculateCreditHealthScore(client);

  const levelColors = {
    excellent: { bg: "bg-green-100", bar: "bg-green-500", text: "text-green-700" },
    good: { bg: "bg-blue-100", bar: "bg-blue-500", text: "text-blue-700" },
    fair: { bg: "bg-amber-100", bar: "bg-amber-500", text: "text-amber-700" },
    poor: { bg: "bg-red-100", bar: "bg-red-500", text: "text-red-700" },
  };

  const colors = levelColors[health.level];

  return (
    <div className="bg-white rounded-xl p-6 border border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-900 flex items-center gap-2">
          <Target size={16} />
          Score de Crédit
        </h3>
        <span className={cn("px-3 py-1 rounded-full text-sm font-medium", colors.bg, colors.text)}>
          {health.score}/100
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-200 rounded-full h-2 mb-4">
        <div className={cn("h-2 rounded-full", colors.bar)} />
      </div>

      {/* Factors */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-slate-700">Facteurs d&apos;influence :</h4>
        <div className="space-y-1">
          {health.factors.map((factor, index) => (
            <div key={index} className="flex items-center gap-2 text-sm text-slate-600">
              <CheckCircle size={12} className="text-slate-400" />
              {factor}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Overview Tab Component
 */
export default function OverviewTab({ client, recentActivity, onRefresh }: OverviewTabProps) {
  const metrics = calculateClientMetrics(client);
  const activities = recentActivity || generateActivityItems(client);

  return (
    <TabContentContainer>
      {/* Key Metrics */}
      <div className="mb-8">
        <TabSectionHeader title="Métriques Clés" description="Vue d'ensemble des performances financières du client" />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <MetricCard title="Crédits Accordés" value={metrics.totalCredits} icon={CreditCard} color="blue" />

          <MetricCard
            title="Montant en Cours"
            value={metrics.totalOutstanding}
            trend={metrics.totalOutstanding > 0 ? "up" : "neutral"}
            icon={DollarSign}
            color={metrics.totalOutstanding > 0 ? "amber" : "green"}
          />

          <MetricCard
            title="Montant en Retard"
            value={metrics.totalOverdue}
            trend={metrics.totalOverdue > 0 ? "down" : "neutral"}
            icon={AlertTriangle}
            color={metrics.totalOverdue > 0 ? "red" : "green"}
          />

          <MetricCard
            title="Taux d'Utilisation"
            value={`${metrics.creditUtilizationRate}%`}
            icon={TrendingUp}
            color={metrics.creditUtilizationRate > 80 ? "red" : metrics.creditUtilizationRate > 60 ? "amber" : "green"}
          />

          <MetricCard
            title="Solde Créditeur"
            value={metrics.availableCreditBalance || 0}
            icon={DollarSign}
            color={metrics.availableCreditBalance && metrics.availableCreditBalance > 0 ? "green" : "blue"}
          />
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <TabSectionHeader
            title="Activité Récente"
            description="Dernières interactions et transactions"
            action={
              <button
                onClick={onRefresh}
                className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
              >
                <Activity size={14} />
                Actualiser
              </button>
            }
          />

          <div className="bg-white rounded-xl border border-slate-200">
            {activities.length > 0 ? (
              <div className="p-2">
                {activities.slice(0, 5).map((activity, _index) => (
                  <ActivityItemComponent key={activity.id} activity={activity} />
                ))}
              </div>
            ) : (
              <div className="p-12 text-center">
                <Activity size={48} className="mx-auto text-slate-300 mb-4" />
                <p className="text-slate-600">Aucune activité récente</p>
                <p className="text-sm text-slate-500 mt-2">Les transactions et interactions apparaîtront ici</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Credit Health Score */}
          <CreditHealthScore client={client} />

          {/* Quick Actions */}
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-900">Actions Rapides</h3>

            <QuickActionButton
              title="Nouveau Crédit"
              description="Accorder un crédit au client"
              icon={Plus}
              onClick={() => {
                // TODO: Open credit creation modal
                console.log("Create credit for", client.id);
              }}
              variant="primary"
            />

            <QuickActionButton
              title="Enregistrer un Paiement"
              description="Saisir un paiement reçu"
              icon={Receipt}
              onClick={() => {
                // TODO: Open payment recording modal
                console.log("Record payment for", client.id);
              }}
              variant="secondary"
            />
          </div>

          {/* Client Summary */}
          <div className="bg-white rounded-xl p-6 border border-slate-200">
            <h3 className="font-semibold text-slate-900 mb-4">Résumé Client</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Statut :</span>
                <span className="font-medium">{client.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Depuis :</span>
                <span className="font-medium">{client.createdAt.toLocaleDateString("fr-FR")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Termes :</span>
                <span className="font-medium">{client.paymentTermDays} jours</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Limite :</span>
                <span className="font-medium">{client.creditLimit || "Non définie"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Solde créditeur :</span>
                <span className={`font-medium ${client.creditBalance && client.creditBalance > 0 ? 'text-green-600' : 'text-slate-600'}`}>
                  {client.creditBalance || 0} TND
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </TabContentContainer>
  );
}
