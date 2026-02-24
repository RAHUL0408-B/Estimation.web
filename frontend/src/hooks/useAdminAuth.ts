"use client";

import { useState, useEffect } from "react";
import { auth } from "@/lib/supabaseClient";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from "@/lib/supabaseWrapper";

// Super admin emails — add yours here or set NEXT_PUBLIC_SUPER_ADMIN_EMAILS env var
// Format for env var: "admin1@example.com,admin2@example.com"
function isSuperAdmin(email: string): boolean {
    const envEmails = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAILS || "";
    const allowedEmails = envEmails
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);

    // Fallback hardcoded emails if env not set
    const fallbackEmails = ["avvi.mee@gmail.com"];

    const allAllowed = allowedEmails.length > 0 ? allowedEmails : fallbackEmails;
    return allAllowed.includes(email.toLowerCase());
}

export function useAdminAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (supabaseUser) => {
            setLoading(true);
            if (supabaseUser?.email) {
                if (isSuperAdmin(supabaseUser.email)) {
                    console.log("Super Admin confirmed:", supabaseUser.email);
                    setUser(supabaseUser);
                } else {
                    console.warn("Access Denied: Not a super admin email:", supabaseUser.email);
                    setUser(null);
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const login = async (email: string, password: string) => {
        if (!isSuperAdmin(email)) {
            console.warn("Login blocked: Not a super admin email.");
            return false;
        }
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
