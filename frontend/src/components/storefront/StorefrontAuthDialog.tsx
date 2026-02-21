"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCustomerAuth } from "@/hooks/useCustomerAuth";
import { useToast } from "@/hooks/use-toast";

interface StorefrontAuthDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    defaultTab?: "login" | "signup";
    tenantId: string;
}

export function StorefrontAuthDialog({
    open,
    onOpenChange,
    defaultTab = "login",
    tenantId
}: StorefrontAuthDialogProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<"login" | "signup">(defaultTab);

    // Sync active tab with defaultTab when dialog opens
    useEffect(() => {
        if (open) {
            setActiveTab(defaultTab);
        }
    }, [open, defaultTab]);

    const { loginWithEmail, signupWithEmail } = useCustomerAuth();
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const formData = new FormData(e.target as HTMLFormElement);
        const email = (formData.get("email") || formData.get("signup-email")) as string;
        const password = (formData.get("password") || formData.get("signup-password")) as string;
        const firstName = formData.get("firstName") as string;
        const lastName = formData.get("lastName") as string;
        const phone = formData.get("phone") as string;

        try {
            if (activeTab === "login") {
                await loginWithEmail(email, password);
                toast({ title: "Success", description: "Logged in successfully." });
            } else {
                await signupWithEmail(email, password, `${firstName} ${lastName}`, phone || "", tenantId);
                toast({ title: "Success", description: "Account created successfully." });
            }

            // Sync legacy simulated session for backward compatibility in components using it
            const userSession = {
                email,
                name: activeTab === "login" ? "User" : `${firstName} ${lastName}`,
                isLoggedIn: true,
                loginTime: new Date().toISOString()
            };
            localStorage.setItem(`storefront_user_${tenantId}`, JSON.stringify(userSession));
            window.dispatchEvent(new Event("storage"));

            onOpenChange(false);

            // If there's a returnUrl in searchParams, we might want to stay there
            // But usually the hooks handle state change and UI proceeds
            const urlParams = new URLSearchParams(window.location.search);
            const returnUrl = urlParams.get("returnUrl");
            if (returnUrl) {
                router.push(returnUrl + (returnUrl.includes("?") ? "&" : "?") + "autoSubmit=true");
            } else {
                router.push(`/${tenantId}/dashboard`);
            }
        } catch (error: any) {
            console.error("Auth error:", error);
            toast({
                title: "Authentication Failed",
                description: error.message || "Please check your credentials and try again.",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    }

    const handleForgotPassword = () => {
        alert("Forgot password functionality would open here.");
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-center">
                        {activeTab === "login" ? "Welcome Back" : "Create Account"}
                    </DialogTitle>
                    <DialogDescription className="text-center">
                        {activeTab === "login"
                            ? "Enter your credentials to access your account"
                            : "Enter your details to create a new account"}
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "login" | "signup")} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-6">
                        <TabsTrigger value="login">Login</TabsTrigger>
                        <TabsTrigger value="signup">Sign Up</TabsTrigger>
                    </TabsList>

                    <TabsContent value="login">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" name="email" type="email" placeholder="name@example.com" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input id="password" name="password" type="password" required />
                            </div>
                            <div className="flex justify-end">
                                <Button
                                    variant="link"
                                    className="px-0 font-normal h-auto text-xs text-muted-foreground hover:text-primary"
                                    type="button"
                                    onClick={handleForgotPassword}
                                >
                                    Forgot password?
                                </Button>
                            </div>
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Sign In
                            </Button>
                        </form>
                    </TabsContent>

                    <TabsContent value="signup">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName">First Name</Label>
                                    <Input id="firstName" name="firstName" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lastName">Last Name</Label>
                                    <Input id="lastName" name="lastName" required />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="signup-email">Email</Label>
                                <Input id="signup-email" name="signup-email" type="email" placeholder="name@example.com" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone Number</Label>
                                <Input id="phone" name="phone" placeholder="+91 XXXXX XXXXX" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="signup-password">Password</Label>
                                <Input id="signup-password" name="signup-password" type="password" required />
                            </div>
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Create Account
                            </Button>
                        </form>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
