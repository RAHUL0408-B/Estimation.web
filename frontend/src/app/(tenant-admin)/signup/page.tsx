"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createUserWithEmailAndPassword } from "@/lib/supabaseWrapper";
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
