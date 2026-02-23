"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Mail, Loader2, ShieldCheck } from "lucide-react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const { login, loading, user } = useAdminAuth();
    const router = useRouter();

    useEffect(() => {
        if (user) {
            router.push("/admin/dashboard");
        }
    }, [user, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!email || !password) {
            setError("Please fill in all fields");
            return;
        }

        try {
            const success = await login(email, password);
            if (!success) {
                setError("Invalid admin credentials. Access denied.");
            }
        } catch (err: any) {
            setError(err.message || "An error occurred during login");
        }
    };

    if (loading && !user) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    <p className="text-sm text-gray-500 font-medium">Verifying admin access...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
            <Card className="w-full max-w-md shadow-xl border-t-4 border-t-blue-600">
                <CardHeader className="text-center space-y-1">
                    <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                        <Lock className="w-6 h-6 text-blue-600" />
                    </div>
                    <CardTitle className="text-2xl font-bold">Super Admin access</CardTitle>
                    <CardDescription>Login to manage the platform</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="p-3 bg-red-50 text-red-600 border border-red-100 rounded-lg text-sm text-center font-medium animate-pulse">
                                {error}
                            </div>
                        )}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 ml-1">Admin ID (Email)</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                <Input
                                    type="email"
                                    placeholder="admin@platform.com"
                                    className="pl-10 h-11"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 ml-1">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                <Input
                                    type="password"
                                    placeholder="••••••••"
                                    className="pl-10 h-11"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <Button
                            type="submit"
                            className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all shadow-md active:scale-[0.98]"
                            disabled={loading}
                        >
                            {loading ? (
                                <div className="flex items-center gap-2">
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    <span>Processing...</span>
                                </div>
                            ) : (
                                "Sign In"
                            )}
                        </Button>

                        <div className="relative my-4">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-gray-200" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-white px-2 text-gray-400 font-bold">Or continue with</span>
                            </div>
                        </div>

                        <Button
                            type="button"
                            variant="outline"
                            className="w-full bg-white hover:bg-gray-50 text-black border-gray-200 h-11 rounded-lg text-sm font-bold transition-all shadow-sm flex items-center justify-center gap-2"
                            onClick={async () => {
                                await window.location.assign('https://bgrxmhvowawznojdggnl.supabase.co/auth/v1/authorize?provider=google&redirect_to=' + encodeURIComponent(window.location.origin + '/admin/dashboard'));
                            }}
                            disabled={loading}
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Sign in with Google
                        </Button>
                    </form>

                    <div className="mt-6 pt-6 border-t border-gray-100 text-center space-y-3">
                        <p className="text-xs text-gray-400">
                            New Admin?{" "}
                            <Link href="/admin/signup" className="text-slate-900 hover:underline font-bold">
                                Create Admin Account
                            </Link>
                        </p>
                    </div>

                    <div className="mt-8 flex flex-col items-center gap-2">
                        <div className="flex items-center text-xs text-gray-400 gap-1 uppercase tracking-widest font-bold">
                            <ShieldCheck className="w-3 h-3" />
                            Secure Admin Portal
                        </div>
                        <p className="text-[10px] text-gray-300">Protected by platform-level encryption</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
