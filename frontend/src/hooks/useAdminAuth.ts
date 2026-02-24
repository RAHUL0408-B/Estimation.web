"use client";

import { useState, useEffect } from "react";
import { auth } from "@/lib/supabaseClient";
import { signOut, onAuthStateChanged, User } from "@/lib/supabaseWrapper";

// ─── Super Admin Config ───────────────────────────────────────────────────────
// Set NEXT_PUBLIC_SUPER_ADMIN_EMAIL and NEXT_PUBLIC_SUPER_ADMIN_PASSWORD in .env.local
// Fallback to hardcoded values if env vars are not set
const SUPER_ADMIN_EMAIL =
    process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL || "avvi.mee@gmail.com";
const SUPER_ADMIN_PASSWORD =
    process.env.NEXT_PUBLIC_SUPER_ADMIN_PASSWORD || "admin@1234";

function isSuperAdminEmail(email: string): boolean {
    return email.trim().toLowerCase() === SUPER_ADMIN_EMAIL.trim().toLowerCase();
}

// Simple in-memory session key
const SESSION_KEY = "super_admin_session";

function getAdminSession(): { email: string } | null {
    if (typeof window === "undefined") return null;
    try {
        const raw = sessionStorage.getItem(SESSION_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

function setAdminSession(email: string) {
    if (typeof window === "undefined") return;
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ email }));
}

function clearAdminSession() {
    if (typeof window === "undefined") return;
    sessionStorage.removeItem(SESSION_KEY);
}

export function useAdminAuth() {
    const [user, setUser] = useState<{ email: string } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Restore session from sessionStorage
        const session = getAdminSession();
        if (session && isSuperAdminEmail(session.email)) {
            setUser(session);
        } else {
            setUser(null);
        }
        setLoading(false);
    }, []);

    const login = async (email: string, password: string): Promise<boolean> => {
        if (!isSuperAdminEmail(email)) {
            console.warn("Login blocked: Not a super admin email.");
            return false;
        }
        if (password !== SUPER_ADMIN_PASSWORD) {
            console.warn("Login blocked: Wrong password.");
            return false;
        }
        const sessionUser = { email };
        setAdminSession(email);
        setUser(sessionUser);
        return true;
    };

    const logout = async () => {
        clearAdminSession();
        setUser(null);
        window.location.href = "/admin/login";
    };

    return {
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
    };
}
