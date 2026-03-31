/**
 * Client Creation Page - Swiss Functional
 * Simple, efficient client creation form
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Save,
  User,
  Mail,
  Phone,
  Building2,
  MapPin,
  AlertTriangle
} from 'lucide-react';

import MainLayout from '@/components/layout/MainLayout';

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  businessName: string;
  taxId: string;
  creditLimit: string;
  paymentTermDays: string;
}

export default function NewClientPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<FormData>>({});

  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    businessName: '',
    taxId: '',
    creditLimit: '',
    paymentTermDays: '30'
  });

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Prénom requis';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Nom requis';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email requis';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email invalide';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          creditLimit: formData.creditLimit ? parseFloat(formData.creditLimit) : null,
          paymentTermDays: parseInt(formData.paymentTermDays)
        }),
      });

      if (response.ok) {
        router.push('/clients');
      } else {
        console.error('Error creating client');
      }
    } catch (error) {
      console.error('Error creating client:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b-2 border-gray-900">
          <div className="max-w-4xl mx-auto px-6 py-8">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/clients')}
                className="p-2 border-2 border-gray-900 hover:bg-gray-900 hover:text-white transition-all"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tight">
                  Nouveau Client
                </h1>
                <p className="text-lg text-gray-600 mt-2">
                  Créer un nouveau client
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="max-w-4xl mx-auto px-6 py-8">
          <form onSubmit={handleSubmit} className="bg-white border-2 border-gray-900">
            <div className="border-b-2 border-gray-900 p-6">
              <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wide">
                Informations Client
              </h2>
            </div>

            <div className="p-6 space-y-6">
              {/* Personal Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2 uppercase tracking-wide">
                    <User size={16} className="inline mr-2" />
                    Prénom *
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleChange('firstName', e.target.value)}
                    className={`w-full px-4 py-3 border-2 ${
                      errors.firstName ? 'border-red-500' : 'border-gray-200'
                    } focus:border-gray-900 focus:outline-none`}
                    disabled={isSubmitting}
                  />
                  {errors.firstName && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertTriangle size={14} />
                      {errors.firstName}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2 uppercase tracking-wide">
                    <User size={16} className="inline mr-2" />
                    Nom *
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleChange('lastName', e.target.value)}
                    className={`w-full px-4 py-3 border-2 ${
                      errors.lastName ? 'border-red-500' : 'border-gray-200'
                    } focus:border-gray-900 focus:outline-none`}
                    disabled={isSubmitting}
                  />
                  {errors.lastName && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertTriangle size={14} />
                      {errors.lastName}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2 uppercase tracking-wide">
                    <Mail size={16} className="inline mr-2" />
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className={`w-full px-4 py-3 border-2 ${
                      errors.email ? 'border-red-500' : 'border-gray-200'
                    } focus:border-gray-900 focus:outline-none`}
                    disabled={isSubmitting}
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertTriangle size={14} />
                      {errors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2 uppercase tracking-wide">
                    <Phone size={16} className="inline mr-2" />
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 focus:border-gray-900 focus:outline-none"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2 uppercase tracking-wide">
                  <MapPin size={16} className="inline mr-2" />
                  Adresse
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 focus:border-gray-900 focus:outline-none"
                  disabled={isSubmitting}
                />
              </div>

              {/* Business Information */}
              <div className="border-t-2 border-gray-200 pt-6">
                <h3 className="text-md font-bold text-gray-900 mb-4 uppercase tracking-wide">
                  <Building2 size={16} className="inline mr-2" />
                  Informations Entreprise
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2 uppercase tracking-wide">
                      Nom de l'entreprise
                    </label>
                    <input
                      type="text"
                      value={formData.businessName}
                      onChange={(e) => handleChange('businessName', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 focus:border-gray-900 focus:outline-none"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2 uppercase tracking-wide">
                      Numéro fiscal
                    </label>
                    <input
                      type="text"
                      value={formData.taxId}
                      onChange={(e) => handleChange('taxId', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 focus:border-gray-900 focus:outline-none"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2 uppercase tracking-wide">
                      Limite de crédit (TND)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.creditLimit}
                      onChange={(e) => handleChange('creditLimit', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 focus:border-gray-900 focus:outline-none"
                      disabled={isSubmitting}
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2 uppercase tracking-wide">
                      Délai de paiement (jours)
                    </label>
                    <input
                      type="number"
                      value={formData.paymentTermDays}
                      onChange={(e) => handleChange('paymentTermDays', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 focus:border-gray-900 focus:outline-none"
                      disabled={isSubmitting}
                      min="1"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="border-t-2 border-gray-200 p-6 bg-gray-50">
              <div className="flex gap-4 justify-end">
                <button
                  type="button"
                  onClick={() => router.push('/clients')}
                  className="px-6 py-3 border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white transition-all font-medium"
                  disabled={isSubmitting}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-gray-900 text-white border-2 border-gray-900 hover:bg-white hover:text-gray-900 transition-all font-medium flex items-center gap-2"
                  disabled={isSubmitting}
                >
                  <Save size={20} />
                  {isSubmitting ? 'Création...' : 'Créer Client'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </MainLayout>
  );
}