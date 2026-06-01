"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { login, signup } from "@/app/(auth)/login/actions";
import { Eye, EyeOff, Mail, Lock, LogIn, UserPlus } from "lucide-react";

export function LoginForm() {
    const searchParams = useSearchParams();
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [rememberMe, setRememberMe] = useState(false);
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

    // URL'den gelen hata mesajını toast ile göster
    useEffect(() => {
        const error = searchParams?.get("error");
        if (error) {
            const decodedError = decodeURIComponent(error).replace(/_/g, " ");
            toast.error(decodedError);
        }
    }, [searchParams]);

    const validateForm = (): boolean => {
        const newErrors: { email?: string; password?: string } = {};

        if (!email.trim()) {
            newErrors.email = "Email adresi gereklidir";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            newErrors.email = "Geçerli bir email adresi girin";
        }

        if (!password) {
            newErrors.password = "Şifre gereklidir";
        } else if (password.length < 6) {
            newErrors.password = "Şifre en az 6 karakter olmalıdır";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleLogin = (formData: FormData) => {
        if (!validateForm()) {
            toast.error("Lütfen formdaki hataları düzeltin");
            return;
        }
        login(formData);
    };

    const handleSignup = (formData: FormData) => {
        if (!validateForm()) {
            toast.error("Lütfen formdaki hataları düzeltin");
            return;
        }
        signup(formData);
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-br from-zinc-50 to-blue-50 dark:from-zinc-950 dark:to-zinc-900">
            <div className="w-full max-w-md space-y-8 bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-xl border border-zinc-200/60 dark:border-zinc-800/60">
                {/* Logo ve Başlık */}
                <div className="flex flex-col items-center gap-2">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                        <span className="text-2xl font-bold text-white">F</span>
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                        Financee
                    </h2>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        Hesabınıza giriş yapın veya kayıt olun
                    </p>
                </div>

                {/* Form */}
                <form className="space-y-5">
                    {/* Email */}
                    <div>
                        <label
                            htmlFor="email-address"
                            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5"
                        >
                            Email Adresi
                        </label>
                        <div className="relative">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
                                <Mail size={18} />
                            </div>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                                }}
                                className={`block w-full pl-10 pr-3 py-2.5 rounded-xl border text-sm bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-offset-0 transition-all ${errors.email
                                        ? "border-red-400 dark:border-red-500 focus:ring-red-400"
                                        : "border-zinc-200 dark:border-zinc-700 focus:ring-indigo-500"
                                    }`}
                                placeholder="ornek@email.com"
                            />
                        </div>
                        {errors.email && (
                            <p className="mt-1 text-xs text-red-500">{errors.email}</p>
                        )}
                    </div>

                    {/* Şifre */}
                    <div>
                        <label
                            htmlFor="password"
                            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5"
                        >
                            Şifre
                        </label>
                        <div className="relative">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
                                <Lock size={18} />
                            </div>
                            <input
                                id="password"
                                name="password"
                                type={showPassword ? "text" : "password"}
                                autoComplete="current-password"
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                                }}
                                className={`block w-full pl-10 pr-12 py-2.5 rounded-xl border text-sm bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-offset-0 transition-all ${errors.password
                                        ? "border-red-400 dark:border-red-500 focus:ring-red-400"
                                        : "border-zinc-200 dark:border-zinc-700 focus:ring-indigo-500"
                                    }`}
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                                tabIndex={-1}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        {errors.password && (
                            <p className="mt-1 text-xs text-red-500">{errors.password}</p>
                        )}
                    </div>

                    {/* Beni Unutma */}
                    <div className="flex items-center">
                        <input
                            id="remember-me"
                            name="rememberMe"
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-600 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                        <label
                            htmlFor="remember-me"
                            className="ml-2 text-sm text-zinc-600 dark:text-zinc-400 cursor-pointer select-none"
                        >
                            Beni Unutma
                        </label>
                    </div>

                    {/* Butonlar */}
                    <div className="flex flex-col gap-2.5 pt-2">
                        <button
                            type="button"
                            onClick={() => {
                                const formData = new FormData();
                                formData.append("email", email);
                                formData.append("password", password);
                                if (rememberMe) formData.append("rememberMe", "on");
                                handleLogin(formData);
                            }}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 active:bg-indigo-700 transition-colors shadow-md shadow-indigo-500/20"
                        >
                            <LogIn size={17} />
                            Giriş Yap
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                const formData = new FormData();
                                formData.append("email", email);
                                formData.append("password", password);
                                handleSignup(formData);
                            }}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-white dark:bg-zinc-800 px-4 py-2.5 text-sm font-semibold text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-750 active:bg-zinc-100 transition-colors"
                        >
                            <UserPlus size={17} />
                            Kayıt Ol
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}