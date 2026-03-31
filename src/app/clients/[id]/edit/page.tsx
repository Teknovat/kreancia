/**
 * Client Edit Page - Swiss Functional
 * Simple, efficient client editing form
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Save,
  User,
  Mail,
  Phone,
  Building2,
  MapPin,
  AlertTriangle,
  Eye
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

interface Client {
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
}

export default function EditClientPage() {
  const router = useRouter();
  const params = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [client, setClient] = useState<Client | null>(null);

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

  // Load client data
  useEffect(() => {
    const fetchClient = async () => {
      if (!params?.id) return;

      try {
        const response = await fetch(`/api/clients/${params.id}`);
        if (response.ok) {
          const clientData = await response.json();
          setClient(clientData);
          setFormData({
            firstName: clientData.firstName || '',
            lastName: clientData.lastName || '',
            email: clientData.email || '',
            phone: clientData.phone || '',
            address: clientData.address || '',
            businessName: clientData.businessName || '',
            taxId: clientData.taxId || '',
            creditLimit: clientData.creditLimit ? clientData.creditLimit.toString() : '',
            paymentTermDays: clientData.paymentTermDays?.toString() || '30'
          });
        } else {
          router.push('/clients');
        }
      } catch (error) {
        console.error('Error loading client:', error);
        router.push('/clients');
      } finally {
        setIsLoading(false);
      }
    };

    fetchClient();
  }, [params?.id, router]);

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
      const response = await fetch(`/api/clients/${params?.id}`, {
        method: 'PUT',
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
        router.push(`/clients/${params?.id}`);
      } else {
        console.error('Error updating client');
      }
    } catch (error) {
      console.error('Error updating client:', error);
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

  if (isLoading) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement du client...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!client) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <AlertTriangle size={48} className="text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-gray-900 mb-2">Client non trouvé</h1>
            <button
              onClick={() => router.push('/clients')}
              className="px-4 py-2 bg-gray-900 text-white border-2 border-gray-900 hover:bg-white hover:text-gray-900 transition-all"
            >
              Retour aux clients
            </button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b-2 border-gray-900">
          <div className="max-w-4xl mx-auto px-6 py-8">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push(`/clients/${client.id}`)}
                className="p-2 border-2 border-gray-900 hover:bg-gray-900 hover:text-white transition-all"
              >
                <ArrowLeft size={20} />
              </button>
              <div className="flex-1">
                <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tight">
                  Modifier Client
                </h1>
                <p className="text-lg text-gray-600 mt-2">
                  {client.firstName} {client.lastName}
                </p>
              </div>
              <button
                onClick={() => router.push(`/clients/${client.id}`)}
                className="p-2 border-2 border-gray-900 hover:bg-gray-900 hover:text-white transition-all"
              >
                <Eye size={20} />
              </button>
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
                  onClick={() => router.push(`/clients/${client.id}`)}
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
                  {isSubmitting ? 'Mise à jour...' : 'Mettre à jour'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </MainLayout>
  );
}