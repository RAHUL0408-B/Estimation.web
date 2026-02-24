"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createUserWithEmailAndPassword, signInWithGoogle } from "@/lib/supabaseWrapper";
import { auth } from "@/lib/supabaseClient";
import { addDesigner, generateStoreId } from "@/lib/firestoreHelpers";
import { ArrowRight, Shield } from "lucide-react";
import { motion } from "framer-motion";

export default function SignupPage() {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        phone: "",
        businessName: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            // Comprehensive Validation
            if (!formData.name || !formData.email || !formData.password || !formData.businessName || !formData.confirmPassword) {
                setError("Please fill in all required fields.");
                setLoading(false);
                return;
            }

            // Email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData.email)) {
                setError("Please enter a valid email address.");
                setLoading(false);
                return;
            }

            if (formData.password.length < 6) {
                setError("Password must be at least 6 characters.");
                setLoading(false);
                return;
            }

            if (formData.password !== formData.confirmPassword) {
                setError("Passwords do not match.");
                setLoading(false);
                return;
            }

            // Create Supabase Auth account
            const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);

            // Create active tenant record in Firestore
            await addDesigner({
                uid: userCredential.user.uid,
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                businessName: formData.businessName,
                storeId: generateStoreId(formData.businessName),
                plan: "free",
                status: "active", // Set to active for immediate access
            });

            // Auto-redirect to dashboard
            router.push("/dashboard");
        } catch (err: any) {
            if (err.code === "auth/email-already-in-use") {
                setError("Account already exists with this email.");
            } else if (err.code === "auth/weak-password") {
                setError("The password provided is too weak.");
            } else {
                setError(err.message || "Something went wrong. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-white px-4 py-12 selection:bg-black selection:text-white">
            {/* Soft Ambient Background */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-gray-50/50 blur-[120px] rounded-full -translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-gray-50/50 blur-[120px] rounded-full translate-x-1/2 translate-y-1/2"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-xl z-10"
            >
                <div className="flex flex-col items-center mb-12">
                    <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg mb-4">
                        U
                    </div>
                    <h1 className="text-sm font-bold tracking-[0.3em] text-black uppercase">unmatrix.io</h1>
                </div>

                <Card className="rounded-xl border border-gray-100 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] bg-white overflow-hidden">
                    <CardHeader className="pt-10 pb-6 px-10 text-center">
                        <CardTitle className="text-3xl font-bold tracking-tight text-black">Create your account</CardTitle>
                        <p className="text-gray-400 text-sm mt-2 font-medium">Join the next generation of interior design studios</p>
                    </CardHeader>
                    <CardContent className="px-10 pb-12">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-xs font-bold text-gray-500 uppercase tracking-wider">Full Name</Label>
                                    <Input
                                        id="name"
                                        placeholder="John Doe"
                                        className="rounded-lg border-gray-100 bg-gray-50 focus:bg-white focus:ring-0 focus:border-black transition-all h-12 text-sm font-medium"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                        disabled={loading}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-xs font-bold text-gray-500 uppercase tracking-wider">Email Address</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="john@example.com"
                                        className="rounded-lg border-gray-100 bg-gray-50 focus:bg-white focus:ring-0 focus:border-black transition-all h-12 text-sm font-medium"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="phone" className="text-xs font-bold text-gray-500 uppercase tracking-wider">Phone Number</Label>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        placeholder="+1 (555) 000-0000"
                                        className="rounded-lg border-gray-100 bg-gray-50 focus:bg-white focus:ring-0 focus:border-black transition-all h-12 text-sm font-medium"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        disabled={loading}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="businessName" className="text-xs font-bold text-gray-500 uppercase tracking-wider">Studio Name</Label>
                                    <Input
                                        id="businessName"
                                        placeholder="Your Studio Name"
                                        className="rounded-lg border-gray-100 bg-gray-50 focus:bg-white focus:ring-0 focus:border-black transition-all h-12 text-sm font-medium"
                                        value={formData.businessName}
                                        onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                                        required
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="password" className="text-xs font-bold text-gray-500 uppercase tracking-wider">Password</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="At least 6 characters"
                                        className="rounded-lg border-gray-100 bg-gray-50 focus:bg-white focus:ring-0 focus:border-black transition-all h-12 text-sm font-medium"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        required
                                        disabled={loading}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword" className="text-xs font-bold text-gray-500 uppercase tracking-wider">Confirm Password</Label>
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        placeholder="Repeat password"
                                        className="rounded-lg border-gray-100 bg-gray-50 focus:bg-white focus:ring-0 focus:border-black transition-all h-12 text-sm font-medium"
                                        value={formData.confirmPassword}
                                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                        required
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            {error && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="rounded-lg bg-red-50 p-4 text-xs font-semibold text-red-600 border border-red-100"
                                >
                                    {error}
                                </motion.div>
                            )}

                            <div className="pt-4">
                                <Button
                                    type="submit"
                                    className="w-full bg-black hover:bg-gray-800 text-white h-12 rounded-lg text-sm font-bold transition-all shadow-lg shadow-black/5 group"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        "Creating account..."
                                    ) : (
                                        <span className="flex items-center justify-center gap-2">
                                            Sign Up
                                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                        </span>
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
                                    className="w-full bg-white hover:bg-gray-50 text-black border-gray-200 h-12 rounded-lg text-sm font-bold transition-all shadow-sm flex items-center justify-center gap-2"
                                    onClick={async () => {
                                        await signInWithGoogle(window.location.origin + '/dashboard');
                                    }}
                                    disabled={loading}
                                >
                                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                    Sign up with Google
                                </Button>
                            </div>
                        </form>
                        <div className="mt-8 text-center text-sm font-medium text-gray-400">
                            Already have an account?{" "}
                            <Link href="/login" className="text-black hover:text-gray-600 transition-colors underline underline-offset-4">
                                Sign in
                            </Link>
                        </div>
                    </CardContent>
                </Card>

                <div className="mt-12 text-center opacity-30">
                    <Shield className="mx-auto w-5 h-5 text-black" />
                </div>
            </motion.div>
        </div>
    );
}
