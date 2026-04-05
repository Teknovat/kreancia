"use client";

/**
 * Settings Tab
 * Client profile settings with editable information, credit limits, and account management
 */

import { useState } from "react";
import { motion } from "framer-motion";
import {
  User,
  Phone,
  Mail,
  Building2,
  MapPin,
  CreditCard,
  Calendar,
  Shield,
  AlertTriangle,
  Save,
  X,
  Edit3,
  Lock,
  Unlock,
  History,
  FileText,
  Settings as _SettingsIcon,
} from "lucide-react";

import { TabContentContainer, TabSectionHeader } from "../ClientProfileTabs";
import type { SettingsTabProps } from "@/types/client-profile";
import { cn } from "@/lib/utils";

/**
 * Editable Field Component
 */
function EditableField({
  label,
  value,
  type = "text",
  icon: Icon,
  isEditing,
  onChange,
  onSave,
  onCancel,
  onEdit,
  placeholder,
  required = false,
}: {
  label: string;
  value: string | number;
  type?: "text" | "email" | "tel" | "number";
  icon: React.ComponentType<{ size?: number; className?: string }>;
  isEditing: boolean;
  onChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  onEdit: () => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-3 px-4 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors">
      <div className="flex items-center gap-3 flex-1">
        <Icon size={16} className="text-slate-500" />
        <div className="flex-1">
          <label className="text-sm font-medium text-slate-700 block mb-1">
            {label} {required && <span className="text-red-500">*</span>}
          </label>
          {isEditing ? (
            <input
              type={type}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-primary-400 focus:border-transparent"
              autoFocus
            />
          ) : (
            <span className="text-sm text-slate-900">
              {value || <span className="text-slate-400 italic">Non renseigné</span>}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {isEditing ? (
          <>
            <button
              onClick={onSave}
              className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
              title="Enregistrer"
            >
              <Save size={14} />
            </button>
            <button
              onClick={onCancel}
              className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
              title="Annuler"
            >
              <X size={14} />
            </button>
          </>
        ) : (
          <button
            onClick={onEdit}
            className="p-1.5 text-slate-600 hover:bg-slate-50 rounded transition-colors"
            title="Modifier"
          >
            <Edit3 size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Status Toggle Component
 */
function StatusToggle({
  label,
  description,
  isEnabled,
  onChange,
  variant = "default",
}: {
  label: string;
  description: string;
  isEnabled: boolean;
  onChange: (enabled: boolean) => void;
  variant?: "default" | "danger";
}) {
  const Icon = isEnabled ? Unlock : Lock;
  const colors = {
    default: {
      bg: isEnabled ? "bg-green-100" : "bg-slate-100",
      icon: isEnabled ? "text-green-600" : "text-slate-600",
      toggle: isEnabled ? "bg-green-500" : "bg-slate-300",
    },
    danger: {
      bg: isEnabled ? "bg-red-100" : "bg-slate-100",
      icon: isEnabled ? "text-red-600" : "text-slate-600",
      toggle: isEnabled ? "bg-red-500" : "bg-slate-300",
    },
  };

  const color = colors[variant];

  return (
    <div className="flex items-center justify-between py-4 px-4 rounded-lg border border-slate-200">
      <div className="flex items-center gap-3 flex-1">
        <div className={cn("p-2 rounded-full", color.bg)}>
          <Icon size={16} className={color.icon} />
        </div>
        <div>
          <h4 className="font-medium text-slate-900">{label}</h4>
          <p className="text-sm text-slate-600">{description}</p>
        </div>
      </div>

      <button
        onClick={() => onChange(!isEnabled)}
        className={cn(
          "relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200",
          "focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2",
          color.toggle,
        )}
      >
        <span
          className={cn(
            "inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200",
            isEnabled ? "translate-x-6" : "translate-x-1",
          )}
        />
      </button>
    </div>
  );
}

/**
 * Action Card Component
 */
function ActionCard({
  title,
  description,
  icon: Icon,
  onClick,
  variant = "default",
}: {
  title: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  onClick: () => void;
  variant?: "default" | "danger";
}) {
  const variants = {
    default: "hover:border-primary-200 hover:bg-primary-50",
    danger: "hover:border-red-200 hover:bg-red-50",
  };

  const iconColors = {
    default: "text-primary-600",
    danger: "text-red-600",
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "w-full p-4 rounded-lg border border-slate-200 text-left transition-all duration-200",
        "focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2",
        variants[variant],
      )}
    >
      <div className="flex items-center gap-3">
        <Icon size={20} className={iconColors[variant]} />
        <div>
          <h3 className="font-semibold text-slate-900">{title}</h3>
          <p className="text-sm text-slate-600">{description}</p>
        </div>
      </div>
    </motion.button>
  );
}

/**
 * Settings Tab Component
 */
export default function SettingsTab({ client, onClientUpdate }: SettingsTabProps) {
  // Editing states
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValues, setEditValues] = useState({
    businessName: client.businessName || "",
    contactFirstName: client.firstName || "",
    contactLastName: client.lastName || "",
    contactEmail: client.email || "",
    contactPhone: client.phone || "",
    address: client.address || "",
    taxId: client.taxId || "",
    creditLimit: client.creditLimit?.toString() || "",
    paymentTermDays: client.paymentTermDays?.toString() || "30",
  });

  // Status states
  const [isActive, setIsActive] = useState(client.status === "ACTIVE");
  const [creditEnabled, setCreditEnabled] = useState(true);
  const [autoNotifications, setAutoNotifications] = useState(true);

  // Handle field editing
  const handleEdit = (field: string) => {
    setEditingField(field);
  };

  const handleSave = (field: string) => {
    // TODO: Call API to update client
    console.log("Updating client field:", field, editValues[field as keyof typeof editValues]);
    setEditingField(null);

    if (onClientUpdate) {
      // Simulate update
      onClientUpdate({
        ...client,
        [field]: editValues[field as keyof typeof editValues],
      });
    }
  };

  const handleCancel = (field: string) => {
    // Reset to original value
    const originalValue = (client as any)[field] || "";
    setEditValues((prev) => ({
      ...prev,
      [field]: originalValue,
    }));
    setEditingField(null);
  };

  const handleChange = (field: string, value: string) => {
    setEditValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle status changes
  const handleStatusChange = (enabled: boolean) => {
    setIsActive(enabled);
    // TODO: Call API to update client status
    console.log("Updating client status:", enabled ? "ACTIVE" : "INACTIVE");
  };

  const handleCreditToggle = (enabled: boolean) => {
    setCreditEnabled(enabled);
    // TODO: Call API to update credit settings
    console.log("Updating credit enabled:", enabled);
  };

  const handleNotificationsToggle = (enabled: boolean) => {
    setAutoNotifications(enabled);
    // TODO: Call API to update notification settings
    console.log("Updating auto notifications:", enabled);
  };

  return (
    <TabContentContainer>
      {/* Client Information */}
      <div className="mb-8">
        <TabSectionHeader title="Informations Client" description="Gérer les données personnelles et coordonnées" />

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="space-y-4">
            <EditableField
              label="Nom de l'entreprise"
              value={editValues.businessName}
              icon={Building2}
              isEditing={editingField === "businessName"}
              onChange={(value) => handleChange("businessName", value)}
              onSave={() => handleSave("businessName")}
              onCancel={() => handleCancel("businessName")}
              onEdit={() => handleEdit("businessName")}
              placeholder="Nom de l'entreprise"
              required
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <EditableField
                label="Prénom du contact"
                value={editValues.contactFirstName}
                icon={User}
                isEditing={editingField === "contactFirstName"}
                onChange={(value) => handleChange("contactFirstName", value)}
                onSave={() => handleSave("contactFirstName")}
                onCancel={() => handleCancel("contactFirstName")}
                onEdit={() => handleEdit("contactFirstName")}
                placeholder="Prénom"
              />

              <EditableField
                label="Nom du contact"
                value={editValues.contactLastName}
                icon={User}
                isEditing={editingField === "contactLastName"}
                onChange={(value) => handleChange("contactLastName", value)}
                onSave={() => handleSave("contactLastName")}
                onCancel={() => handleCancel("contactLastName")}
                onEdit={() => handleEdit("contactLastName")}
                placeholder="Nom"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <EditableField
                label="Email"
                value={editValues.contactEmail}
                type="email"
                icon={Mail}
                isEditing={editingField === "contactEmail"}
                onChange={(value) => handleChange("contactEmail", value)}
                onSave={() => handleSave("contactEmail")}
                onCancel={() => handleCancel("contactEmail")}
                onEdit={() => handleEdit("contactEmail")}
                placeholder="email@exemple.fr"
              />

              <EditableField
                label="Téléphone"
                value={editValues.contactPhone}
                type="tel"
                icon={Phone}
                isEditing={editingField === "contactPhone"}
                onChange={(value) => handleChange("contactPhone", value)}
                onSave={() => handleSave("contactPhone")}
                onCancel={() => handleCancel("contactPhone")}
                onEdit={() => handleEdit("contactPhone")}
                placeholder="01 23 45 67 89"
              />
            </div>

            <EditableField
              label="Adresse"
              value={editValues.address}
              icon={MapPin}
              isEditing={editingField === "address"}
              onChange={(value) => handleChange("address", value)}
              onSave={() => handleSave("address")}
              onCancel={() => handleCancel("address")}
              onEdit={() => handleEdit("address")}
              placeholder="Adresse complète"
            />

            <EditableField
              label="TaxId"
              value={editValues.taxId}
              icon={FileText}
              isEditing={editingField === "taxId"}
              onChange={(value) => handleChange("taxId", value)}
              onSave={() => handleSave("taxId")}
              onCancel={() => handleCancel("taxId")}
              onEdit={() => handleEdit("taxId")}
              placeholder="12345678901234"
            />
          </div>
        </div>
      </div>

      {/* Credit Settings */}
      <div className="mb-8">
        <TabSectionHeader title="Paramètres de Crédit" description="Configurer les limites et conditions de paiement" />

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <EditableField
              label="Limite de crédit"
              value={editValues.creditLimit}
              type="number"
              icon={CreditCard}
              isEditing={editingField === "creditLimit"}
              onChange={(value) => handleChange("creditLimit", value)}
              onSave={() => handleSave("creditLimit")}
              onCancel={() => handleCancel("creditLimit")}
              onEdit={() => handleEdit("creditLimit")}
              placeholder="10000"
            />

            <EditableField
              label="Délai de paiement (jours)"
              value={editValues.paymentTermDays}
              type="number"
              icon={Calendar}
              isEditing={editingField === "paymentTermDays"}
              onChange={(value) => handleChange("paymentTermDays", value)}
              onSave={() => handleSave("paymentTermDays")}
              onCancel={() => handleCancel("paymentTermDays")}
              onEdit={() => handleEdit("paymentTermDays")}
              placeholder="30"
            />
          </div>

          <div className="space-y-4">
            <StatusToggle
              label="Crédit Autorisé"
              description="Permettre à ce client d'obtenir des crédits"
              isEnabled={creditEnabled}
              onChange={handleCreditToggle}
            />

            <StatusToggle
              label="Notifications Automatiques"
              description="Envoyer des rappels automatiques pour les échéances"
              isEnabled={autoNotifications}
              onChange={handleNotificationsToggle}
            />
          </div>
        </div>
      </div>

      {/* Account Status */}
      <div className="mb-8">
        <TabSectionHeader title="Statut du Compte" description="Gérer l'activation et la sécurité du compte" />

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <StatusToggle
            label={isActive ? "Compte Actif" : "Compte Suspendu"}
            description={
              isActive
                ? "Le client peut effectuer des transactions"
                : "Le client ne peut plus effectuer de nouvelles transactions"
            }
            isEnabled={isActive}
            onChange={handleStatusChange}
            variant={isActive ? "default" : "danger"}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-6">
        <TabSectionHeader title="Actions Avancées" description="Opérations de gestion du compte client" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ActionCard
            title="Historique Complet"
            description="Voir l'historique détaillé de toutes les transactions"
            icon={History}
            onClick={() => {
              // TODO: Open history modal or navigate to history page
              console.log("View complete history for client", client.id);
            }}
          />

          <ActionCard
            title="Exporter les Données"
            description="Télécharger un rapport complet des données client"
            icon={FileText}
            onClick={() => {
              // TODO: Export client data
              console.log("Export client data", client.id);
            }}
          />

          <ActionCard
            title="Réinitialiser le Mot de Passe"
            description="Envoyer un lien de réinitialisation au client"
            icon={Shield}
            onClick={() => {
              // TODO: Send password reset
              console.log("Reset password for client", client.id);
            }}
          />

          <ActionCard
            title="Supprimer le Client"
            description="Supprimer définitivement ce client et ses données"
            icon={AlertTriangle}
            variant="danger"
            onClick={() => {
              // TODO: Confirm and delete client
              console.log("Delete client", client.id);
            }}
          />
        </div>
      </div>
    </TabContentContainer>
  );
}
