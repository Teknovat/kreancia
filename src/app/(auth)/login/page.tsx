/**
 * Login Page - Swiss Functional
 * Simple, efficient login interface
 */

"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Mail, Lock, ArrowRight, AlertTriangle } from "lucide-react";

interface LoginFormData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

// Form validation schema
const loginSchema = z.object({
  email: z.string().email("Veuillez entrer un email valide"),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
  rememberMe: z.boolean().optional(),
});

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const error = searchParams.get("error");

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        console.error("Login failed:", result.error);
      } else {
        router.push(callbackUrl);
      }
    } catch (error) {
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-6">
      <div className="max-w-md w-full">
        {/* Logo and Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-900 text-white mb-6">
            <span className="text-2xl font-black">K</span>
          </div>
          <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tight mb-2">Kreancia</h1>
          <p className="text-lg text-gray-600">Connexion à votre tableau de bord</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 border-2 border-red-200 bg-red-50">
            <div className="flex items-start gap-2">
              <AlertTriangle size={20} className="text-red-600 mt-0.5" />
              <p className="text-red-800 font-medium">
                {error === "CredentialsSignin"
                  ? "Email ou mot de passe incorrect. Veuillez réessayer."
                  : "Une erreur est survenue. Veuillez réessayer."}
              </p>
            </div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white border-2 border-gray-900">
          <div className="border-b-2 border-gray-900 p-6">
            <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wide">Connexion</h2>
          </div>

          <div className="p-6 space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-bold text-gray-900 mb-2 uppercase tracking-wide">
                <Mail size={16} className="inline mr-2" />
                Email *
              </label>
              <input
                {...register("email")}
                type="email"
                id="email"
                className={`w-full px-4 py-3 border-2 ${
                  errors.email ? "border-red-500" : "border-gray-200"
                } focus:border-gray-900 focus:outline-none`}
                placeholder="merchant@exemple.com"
                disabled={isLoading}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertTriangle size={14} />
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-bold text-gray-900 mb-2 uppercase tracking-wide">
                <Lock size={16} className="inline mr-2" />
                Mot de passe *
              </label>
              <div className="relative">
                <input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  id="password"
                  className={`w-full px-4 py-3 pr-12 border-2 ${
                    errors.password ? "border-red-500" : "border-gray-200"
                  } focus:border-gray-900 focus:outline-none`}
                  placeholder="Votre mot de passe"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff size={20} className="text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye size={20} className="text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertTriangle size={14} />
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  {...register("rememberMe")}
                  type="checkbox"
                  id="rememberMe"
                  className="h-4 w-4 border-2 border-gray-300 text-gray-900 focus:ring-gray-900"
                  disabled={isLoading}
                />
                <label htmlFor="rememberMe" className="ml-2 text-sm text-gray-700 font-medium">
                  Se souvenir de moi
                </label>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="border-t-2 border-gray-200 p-6 bg-gray-50">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-6 py-4 bg-gray-900 text-white border-2 border-gray-900 hover:bg-white hover:text-gray-900 transition-all font-bold text-lg flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Connexion en cours...
                </>
              ) : (
                <>
                  Se connecter
                  <ArrowRight size={24} />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>© 2026 Kreancia by Teknovat</p>
          <p className="mt-1">Gestion de crédits client</p>
        </div>
      </div>
    </div>
  );
}
