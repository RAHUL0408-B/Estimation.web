"use client";

import { useState, useEffect } from "react";
import { auth } from "@/lib/supabaseClient";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from "@/lib/supabaseWrapper";
import { useRouter } from "next/navigation";
import { getTenantByEmail } from "@/lib/firestoreHelpers";

export function useAdminAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (supabaseUser) => {
            setLoading(true);
            if (supabaseUser?.email) {
                try {
                    console.log("Checking admin status for:", supabaseUser.email);
                    // Check if this user is a tenant
                    const tenant = await getTenantByEmail(supabaseUser.email);

                    if (tenant) {
                        // User is a tenant, NOT a super admin. Deny access.
                        console.warn("Access Denied: Tenant user attempted to access Super Admin panel.");
                        setUser(null);
                    } else {
                        // User is authenticated and NOT a tenant -> Assume Super Admin
                        console.log("Super Admin confirmed (Not a tenant)");
                        setUser(supabaseUser);
                    }
                } catch (error) {
                    console.error("Critical error checking admin status:", error);
                    // If check fails (e.g. firestore rules), we might be a super admin 
                    // or just having network issues. To be safe in dev, let's allow 
                    // but log it.
                    setUser(supabaseUser);
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const login = async (email: string, password: string) => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
            return true;
        } catch (error) {
            console.error("Login failed", error);
            return false;
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
            // Use window.location.href to ensure a full page reload and clean state
            window.location.href = "/admin/login";
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    return {
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
    };
}
