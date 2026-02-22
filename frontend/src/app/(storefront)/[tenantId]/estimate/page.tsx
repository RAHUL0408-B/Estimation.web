"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2, CheckCircle2, Plus, Minus, Download, Home, Building2, ChevronRight, ArrowLeft, Menu, ArrowRight as ArrowForward, User, LayoutGrid, Calculator, ChevronDown, Calendar, TrendingUp, Info, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePricingConfig, PricingItem } from "@/hooks/usePricingConfig";
import { useCities } from "@/hooks/useCities";
import { useCustomerAuth } from "@/hooks/useCustomerAuth";
import { usePublicWebsiteConfig } from "@/hooks/useWebsiteConfig";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { getTenantByStoreId, Tenant } from "@/lib/firestoreHelpers";
import { generateEstimatePDF } from "@/lib/generateEstimatePdf";
import { useToast } from "@/hooks/use-toast";

type Plan = 'Basic' | 'Standard' | 'Luxe';

interface ItemQuantity {
    [itemId: string]: number;
}

interface BedroomConfig {
    items: ItemQuantity;
}

interface BathroomConfig {
    items: ItemQuantity;
}

export default function EstimatorPage({ params }: { params: Promise<{ tenantId: string }> }) {
    const { tenantId: tenantSlug } = use(params);
    const router = useRouter();


    const [resolvedTenant, setResolvedTenant] = useState<Tenant | null>(null);
    const [tenantLoading, setTenantLoading] = useState(true);
    const [resolutionError, setResolutionError] = useState(false);

    useEffect(() => {
        const resolveTenant = async () => {
            if (!tenantSlug) return;
            try {
                // Try lowercase first as it's the standard for storeIds
                const tenant = await getTenantByStoreId(tenantSlug.toLowerCase()) || await getTenantByStoreId(tenantSlug);
                if (tenant) {
                    setResolvedTenant(tenant);
                } else {
                    setResolutionError(true);
                }
            } catch (error) {
                console.error("Error resolving tenant:", error);
                setResolutionError(true);
            } finally {
                setTenantLoading(false);
            }
        };
        resolveTenant();
    }, [tenantSlug]);

    const { config: websiteConfig, loading: websiteLoading } = usePublicWebsiteConfig(tenantSlug);
    const { config, loading: pricingLoading } = usePricingConfig(resolvedTenant?.id || null);
    const { cities, loading: citiesLoading } = useCities(resolvedTenant?.id || null);
    const { customer, loading: authLoading, isAdmin } = useCustomerAuth();

    const loading = tenantLoading || pricingLoading || citiesLoading || websiteLoading;

    const primaryColor = websiteConfig?.primaryColor || "#0F172A";
    const secondaryColor = websiteConfig?.secondaryColor || "#1E293B";
    const buttonRadius = websiteConfig?.buttonRadius || 12;
    const backgroundColor = websiteConfig?.backgroundColor || "#ffffff";

    // NOTE: Removed auth guard - guests can now access estimate page
    // Auth check moved to handleSubmit function

    const [step, setStep] = useState(1);
    const [currentEstimateId, setCurrentEstimateId] = useState<string | null>(null);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

    // Customer Info
    const [customerName, setCustomerName] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");
    const [customerEmail, setCustomerEmail] = useState("");
    const [selectedCity, setSelectedCity] = useState("");

    // Project Details
    const [segment, setSegment] = useState<'Residential' | 'Commercial'>('Residential');
    const [selectedPlan, setSelectedPlan] = useState<Plan>('Standard');
    const [carpetArea, setCarpetArea] = useState("");
    const [bedroomCount, setBedroomCount] = useState(0);
    const [bathroomCount, setBathroomCount] = useState(0);

    // Item Selections
    const [livingAreaItems, setLivingAreaItems] = useState<ItemQuantity>({});
    const [kitchenLayout, setKitchenLayout] = useState("");
    const [kitchenMaterial, setKitchenMaterial] = useState("");
    const [kitchenItems, setKitchenItems] = useState<ItemQuantity>({});
    const [bedrooms, setBedrooms] = useState<BedroomConfig[]>([]);
    const [bathrooms, setBathrooms] = useState<BathroomConfig[]>([]);

    // Commercial Specific Counts
    const [cabinCount, setCabinCount] = useState(0);
    const [cabins, setCabins] = useState<BedroomConfig[]>([]);

    const [estimatedTotal, setEstimatedTotal] = useState(0);
    const [breakdown, setBreakdown] = useState<any[]>([]);

    // Update bedroom/bathroom arrays when counts change
    useEffect(() => {
        const count = Math.max(0, bedroomCount);
        if (count > bedrooms.length) {
            setBedrooms(prev => [...prev, ...Array(count - prev.length).fill({ items: {} })]);
        } else if (count < bedrooms.length) {
            setBedrooms(prev => prev.slice(0, count));
        }
    }, [bedroomCount]);

    useEffect(() => {
        const count = Math.max(0, bathroomCount);
        if (count > bathrooms.length) {
            setBathrooms(prev => [...prev, ...Array(count - prev.length).fill({ items: {} })]);
        } else if (count < bathrooms.length) {
            setBathrooms(prev => prev.slice(0, count));
        }
    }, [bathroomCount]);

    useEffect(() => {
        const count = Math.max(0, cabinCount);
        if (count > cabins.length) {
            setCabins(prev => [...prev, ...Array(count - prev.length).fill({ items: {} })]);
        } else if (count < cabins.length) {
            setCabins(prev => prev.slice(0, count));
        }
    }, [cabinCount]);

    const priceKey = selectedPlan === 'Basic' ? 'basicPrice' : selectedPlan === 'Standard' ? 'standardPrice' : 'luxePrice';

    const RenderItem = ({
        item,
        value,
        onValueChange,
    }: {
        item: PricingItem,
        value: number,
        onValueChange: (val: number, type?: 'delta' | 'direct') => void,
    }) => {
        const isPerSqft = item.type === 'perSqft';

        return (
            <div key={item.id} className="flex items-center justify-between p-6 border border-gray-100 bg-white rounded-2xl hover:shadow-lg transition-all duration-300">
                <div className="flex flex-col gap-1">
                    <span className="font-semibold text-lg text-gray-700">{item.name}</span>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                        ₹{item[priceKey as keyof PricingItem]?.toLocaleString('en-IN')} / {isPerSqft ? 'sqft' : 'unit'}
                        {value > 0 && (
                            <span className="text-emerald-600 ml-2 bg-emerald-50 px-2 py-0.5 rounded-md">
                                Total: ₹{(value * (Number(item[priceKey as keyof PricingItem]) || 0)).toLocaleString('en-IN')}
                            </span>
                        )}
                    </span>
                </div>

                {isPerSqft ? (
                    <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 h-12 border border-gray-100 focus-within:border-black/20 transition-all">
                        <Input
                            type="number"
                            value={value || ""}
                            onChange={(e) => onValueChange(parseFloat(e.target.value) || 0, 'direct')}
                            placeholder="0"
                            className="w-20 bg-transparent border-0 h-full text-right font-bold text-lg focus-visible:ring-0 p-0"
                        />
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">sqft</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-1">
                        <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 rounded-lg hover:bg-white hover:shadow-sm"
                            onClick={() => onValueChange(-1, 'delta')}
                        >
                            <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center font-bold text-lg">{value}</span>
                        <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 rounded-lg hover:bg-white hover:shadow-sm"
                            onClick={() => onValueChange(1, 'delta')}
                        >
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>
                )}
            </div>
        );
    };

    // Set default kitchen layout and material when config loads
    useEffect(() => {
        if (config?.kitchenLayouts?.length && !kitchenLayout) {
            const firstEnabled = config.kitchenLayouts.find(l => l.enabled);
            if (firstEnabled) setKitchenLayout(firstEnabled.name);
        }
        if (config?.kitchenMaterials?.length && !kitchenMaterial) {
            const firstEnabled = config.kitchenMaterials.find(m => m.enabled);
            if (firstEnabled) setKitchenMaterial(firstEnabled.name);
        }
    }, [config, kitchenLayout, kitchenMaterial]);

    // Scroll to top on step change
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [step]);

    // Auto-submit after login if there's pending estimate data
    useEffect(() => {
        const checkPendingEstimate = async () => {
            // Check URL params for autoSubmit flag
            const urlParams = new URLSearchParams(window.location.search);
            const shouldAutoSubmit = urlParams.get('autoSubmit') === 'true';

            if (shouldAutoSubmit && (customer || isAdmin)) {
                // User just logged in, check for pending estimate
                const pendingData = sessionStorage.getItem('pendingEstimate');

                if (pendingData) {
                    try {
                        const formData = JSON.parse(pendingData);

                        // Restore form state
                        setCustomerName(formData.customerInfo.name);
                        setCustomerPhone(formData.customerInfo.phone);
                        setCustomerEmail(formData.customerInfo.email);
                        setSelectedCity(formData.customerInfo.city);
                        setSegment(formData.segment);
                        setSelectedPlan(formData.plan);
                        setCarpetArea(formData.carpetArea.toString());
                        setBedroomCount(formData.bedrooms);
                        setBathroomCount(formData.bathrooms);
                        setLivingAreaItems(formData.configuration.livingArea);
                        setKitchenLayout(formData.configuration.kitchen.layout);
                        setKitchenMaterial(formData.configuration.kitchen.material);
                        setKitchenItems(formData.configuration.kitchen.items);
                        setBedrooms(formData.configuration.bedrooms);
                        setBathrooms(formData.configuration.bathrooms);
                        if (formData.configuration.cabins) {
                            setCabins(formData.configuration.cabins);
                            setCabinCount(formData.configuration.cabins.length);
                        }

                        // Wait a moment for state to update, then submit
                        setTimeout(() => {
                            handleSubmit();
                            // Clean up URL
                            window.history.replaceState({}, '', `/${tenantSlug}/estimate`);
                        }, 500);
                    } catch (error) {
                        console.error('Error restoring pending estimate:', error);
                        sessionStorage.removeItem('pendingEstimate');
                    }
                }
            }
        };

        if (!authLoading) {
            checkPendingEstimate();
        }
    }, [customer, isAdmin, authLoading]);

    const isStepValid = () => {
        if (step === 1) return true;
        if (step === 2) return true;
        if (step === 3) return carpetArea && parseFloat(carpetArea) > 0;
        if (step === 4) return true;
        if (step === 5) return customerName && customerPhone.length >= 10 && customerEmail.includes('@') && selectedCity;
        return false;
    };

    const updateItemQuantity = (
        category: 'livingArea' | 'kitchen' | 'bedroom' | 'bathroom' | 'cabin',
        itemId: string,
        value: number,
        type: 'delta' | 'direct' = 'delta',
        index?: number
    ) => {
        const getNewValue = (current: number) => {
            if (type === 'delta') return Math.max(0, (current || 0) + value);
            return Math.max(0, value);
        };

        if (category === 'livingArea') {
            setLivingAreaItems(prev => ({
                ...prev,
                [itemId]: getNewValue(prev[itemId])
            }));
        } else if (category === 'kitchen') {
            setKitchenItems(prev => ({
                ...prev,
                [itemId]: getNewValue(prev[itemId])
            }));
        } else if (category === 'bedroom' && index !== undefined) {
            setBedrooms(prev => {
                const newBedrooms = [...prev];
                newBedrooms[index] = {
                    ...newBedrooms[index],
                    items: {
                        ...newBedrooms[index].items,
                        [itemId]: getNewValue(newBedrooms[index].items[itemId])
                    }
                };
                return newBedrooms;
            });
        } else if (category === 'bathroom' && index !== undefined) {
            setBathrooms(prev => {
                const newBathrooms = [...prev];
                newBathrooms[index] = {
                    ...newBathrooms[index],
                    items: {
                        ...newBathrooms[index].items,
                        [itemId]: getNewValue(newBathrooms[index].items[itemId])
                    }
                };
                return newBathrooms;
            });
        } else if (category === 'cabin' && index !== undefined) {
            setCabins(prev => {
                const newCabins = [...prev];
                newCabins[index] = {
                    ...newCabins[index],
                    items: {
                        ...newCabins[index].items,
                        [itemId]: getNewValue(newCabins[index].items[itemId])
                    }
                };
                return newCabins;
            });
        }
    };

    const calculateEstimate = () => {
        if (!config?.categories) return { total: 0, breakdown: [] };

        const area = parseFloat(carpetArea) || 0;
        let total = 0;
        const breakdown: any[] = [];

        const priceKey = selectedPlan === 'Basic' ? 'basicPrice' : selectedPlan === 'Standard' ? 'standardPrice' : 'luxePrice';

        // Helper to calculate item cost
        const calculateItemCost = (item: PricingItem, value: number) => {
            if (item.type === 'fixed' || item.type === 'perUnit') {
                // Fixed/PerUnit: quantity × configured rate
                return value * item[priceKey];
            } else if (item.type === 'perSqft') {
                // Per Sqft: entered sqft (stored in value) × configured rate
                return value * item[priceKey];
            }
            return 0;
        };

        // 1. Process All Categories for "General" items (stored in livingAreaItems for custom cats)
        config.categories.forEach(category => {
            const isKitchen = category.id === 'kitchen' || category.name.toLowerCase() === 'kitchen';
            const isBedroom = category.id === 'bedroom' || category.name.toLowerCase() === 'bedroom';
            const isBathroom = category.id === 'bathroom' || category.name.toLowerCase() === 'bathroom';

            if (!isKitchen && !isBedroom && !isBathroom) {
                // Living Area + All Other Custom Categories
                Object.entries(livingAreaItems).forEach(([itemId, quantity]) => {
                    if (quantity > 0) {
                        const item = category.items.find(i => i.id === itemId);
                        if (item && item.enabled) {
                            const cost = calculateItemCost(item, quantity);
                            total += cost;
                            breakdown.push({
                                category: category.name,
                                item: item.name,
                                quantity,
                                unitPrice: item[priceKey],
                                total: cost
                            });
                        }
                    }
                });
            } else if (isKitchen) {
                // Kitchen items
                Object.entries(kitchenItems).forEach(([itemId, quantity]) => {
                    if (quantity > 0) {
                        const item = category.items.find(i => i.id === itemId);
                        if (item && item.enabled) {
                            const cost = calculateItemCost(item, quantity);
                            total += cost;
                            breakdown.push({
                                category: category.name,
                                item: item.name,
                                quantity,
                                unitPrice: item[priceKey],
                                total: cost
                            });
                        }
                    }
                });
            } else if (isBedroom) {
                // Bedroom items (mapped per room)
                bedrooms.forEach((bedroom, index) => {
                    Object.entries(bedroom.items).forEach(([itemId, quantity]) => {
                        if (quantity > 0) {
                            const item = category.items.find(i => i.id === itemId);
                            if (item && item.enabled) {
                                const cost = calculateItemCost(item, quantity);
                                total += cost;
                                breakdown.push({
                                    category: `Bedroom ${index + 1}`,
                                    item: item.name,
                                    quantity,
                                    unitPrice: item[priceKey],
                                    total: cost
                                });
                            }
                        }
                    });
                });
            } else if (isBathroom) {
                // Bathroom items (mapped per room)
                bathrooms.forEach((bathroom, index) => {
                    Object.entries(bathroom.items).forEach(([itemId, quantity]) => {
                        if (quantity > 0) {
                            const item = category.items.find(i => i.id === itemId);
                            if (item && item.enabled) {
                                const cost = calculateItemCost(item, quantity);
                                total += cost;
                                breakdown.push({
                                    category: `Bathroom ${index + 1}`,
                                    item: item.name,
                                    quantity,
                                    unitPrice: item[priceKey],
                                    total: cost
                                });
                            }
                        }
                    });
                });
            } else if (category.id === 'cabin' || category.name.toLowerCase() === 'cabin') {
                // Cabin items (mapped per room)
                cabins.forEach((cabin, index) => {
                    Object.entries(cabin.items).forEach(([itemId, quantity]) => {
                        if (quantity > 0) {
                            const item = category.items.find(i => i.id === itemId);
                            if (item && item.enabled) {
                                const cost = calculateItemCost(item, quantity);
                                total += cost;
                                breakdown.push({
                                    category: `Cabin ${index + 1}`,
                                    item: item.name,
                                    quantity,
                                    unitPrice: item[priceKey],
                                    total: cost
                                });
                            }
                        }
                    });
                });
            }
        });

        return { total, breakdown };
    };

    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async () => {
        // Validation
        if (!customerName || !customerPhone || !customerEmail || !selectedCity) {
            toast({
                title: "Information Required",
                description: "Please fill in all customer information fields before submitting.",
                variant: "destructive"
            });
            return;
        }
        if (!carpetArea || parseFloat(carpetArea) <= 0) {
            toast({
                title: "Invalid Input",
                description: "Please enter a valid carpet area.",
                variant: "destructive"
            });
            return;
        }

        // Check if user is authenticated via Firebase Auth
        if (!customer && !isAdmin) {
            // User is not logged in - save form data to sessionStorage
            const formData = {
                customerInfo: {
                    name: customerName,
                    phone: customerPhone,
                    email: customerEmail,
                    city: selectedCity
                },
                segment,
                plan: selectedPlan,
                carpetArea: parseFloat(carpetArea),
                bedrooms: bedroomCount,
                bathrooms: bathroomCount,
                configuration: {
                    livingArea: livingAreaItems,
                    kitchen: {
                        layout: kitchenLayout,
                        material: kitchenMaterial,
                        items: kitchenItems
                    },
                    bedrooms: bedrooms,
                    bathrooms: bathrooms,
                    cabins: cabins
                },
                tenantId: resolvedTenant?.id,
                tenantSlug: tenantSlug
            };

            // Save to sessionStorage
            sessionStorage.setItem('pendingEstimate', JSON.stringify(formData));

            // Redirect to home with auth trigger
            const currentUrl = window.location.pathname;
            toast({
                title: "Authentication Required",
                description: "Please login to save and view your estimate breakdown.",
            });
            router.push(`/${tenantSlug}?openAuth=true&returnUrl=${encodeURIComponent(currentUrl)}`);
            return;
        }

        // Auto-fill customer info from simulated user if not provided (though form validation ensures it is)
        // We can also ensure the email matches the logged in user if we wanted to be strict.

        // User is logged in - proceed with submission
        setIsSubmitting(true);

        try {
            const { total, breakdown: estimateBreakdown } = calculateEstimate();

            // Save to Firestore - ensuring all fields expected by Admin Orders are present
            const estimateData = {
                customerInfo: {
                    name: customerName,
                    phone: customerPhone,
                    email: customerEmail,
                    city: selectedCity
                },
                // Flatten fields for backward compatibility with orders list
                clientName: customerName,
                clientPhone: customerPhone,
                clientEmail: customerEmail,

                segment,
                plan: selectedPlan,
                carpetArea: parseFloat(carpetArea),
                bedrooms: bedroomCount,
                bathrooms: bathroomCount,
                configuration: {
                    livingArea: livingAreaItems,
                    kitchen: {
                        layout: kitchenLayout,
                        material: kitchenMaterial,
                        items: kitchenItems
                    },
                    bedrooms: bedrooms,
                    bathrooms: bathrooms,
                    cabins: cabins
                },
                totalAmount: total,
                status: "pending", // Default status for Orders page
                tenantId: resolvedTenant?.id,
                customerId: customer?.uid || null,
                createdAt: serverTimestamp()
            };

            const estimatesRef = collection(db, `tenants/${resolvedTenant?.id}/estimates`);
            const docRef = await addDoc(estimatesRef, estimateData);

            setCurrentEstimateId(docRef.id);
            setEstimatedTotal(total);
            setBreakdown(estimateBreakdown);
            setStep(6);

            // Clear sessionStorage if it exists
            sessionStorage.removeItem('pendingEstimate');

            toast({
                title: "Estimate Generated",
                description: "Your estimate has been saved successfully.",
            });
        } catch (error: any) {
            console.error("Error submitting estimate:", error);
            toast({
                title: "Submission Failed",
                description: `Error: ${error.message || "Unknown error"}. Please try again.`,
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDownloadPDF = async () => {
        if (!currentEstimateId) return;
        setIsGeneratingPDF(true);
        try {
            await generateEstimatePDF(currentEstimateId, resolvedTenant?.businessName || "Company", { download: true, uploadToStorage: true, tenantId: resolvedTenant?.id });
        } catch (error) {
            console.error("Error generating PDF:", error);
            alert("Failed to generate PDF");
        } finally {
            setIsGeneratingPDF(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#0F172A]" />
            </div>
        );
    }

    if (resolutionError || (!resolvedTenant && !tenantLoading)) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <Card className="max-w-md w-full text-center p-8">
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold">Store Not Found</CardTitle>
                        <CardDescription>
                            The estimate page you're trying to reach doesn't exist or the company ID is incorrect.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={() => router.push('/')} className="w-full">
                            Go to Home
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (step === 6) {
        return (
            <div className="min-h-screen py-12 px-4 transition-colors duration-500" style={{ backgroundColor: `${primaryColor}05` }}>
                <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {/* Header Card */}
                    <Card className="border-none shadow-2xl overflow-hidden rounded-[40px] bg-white border border-gray-100">
                        <div className="p-8 md:p-12 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Estimate Provided By</p>
                                    <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none">{resolvedTenant?.businessName}</h1>
                                </div>
                                <div className="flex flex-wrap items-center gap-6 text-xs font-bold text-gray-400">
                                    <span className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full"><Calendar className="h-3.5 w-3.5" /> {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                    <span className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full">#EST-{currentEstimateId?.slice(-6).toUpperCase()}</span>
                                    <span className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full text-blue-600"><CheckCircle2 className="h-3.5 w-3.5" /> Verified Estimate</span>
                                </div>
                            </div>
                            <div className="px-6 py-4 rounded-[24px] bg-slate-50 border border-slate-100 flex flex-col items-end shadow-sm">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Design Tier</span>
                                <div className="px-4 py-1.5 rounded-full text-[10px] font-black text-white uppercase tracking-wider shadow-lg" style={{ backgroundColor: primaryColor }}>
                                    {selectedPlan} Plan
                                </div>
                            </div>
                        </div>

                        <CardContent className="p-0">
                            {/* Summary Banner */}
                            <div className="p-8 md:p-12 text-white flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden"
                                style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}>
                                <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                                <div className="text-center md:text-left space-y-1 relative z-10">
                                    <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-70 mb-2">Estimated Investment</p>
                                    <div className="text-7xl font-black tracking-tighter drop-shadow-lg">₹ {estimatedTotal.toLocaleString('en-IN')}</div>
                                    <p className="text-sm opacity-60 font-medium italic">* Includes standard materials & professional labor</p>
                                </div>
                                <div className="flex flex-col items-center md:items-end gap-3 bg-white/10 backdrop-blur-xl p-8 rounded-[32px] border border-white/20 shadow-2xl relative z-10 w-full md:w-auto">
                                    <div className="flex justify-between w-full md:w-56 text-[10px] font-bold uppercase tracking-widest opacity-80">
                                        <span>Subtotal</span>
                                        <span>₹ {estimatedTotal.toLocaleString('en-IN')}</span>
                                    </div>
                                    <div className="flex justify-between w-full md:w-56 text-[10px] font-bold uppercase tracking-widest opacity-80">
                                        <span>GST (Approx 18%)</span>
                                        <span>₹ {Math.round(estimatedTotal * 0.18).toLocaleString('en-IN')}</span>
                                    </div>
                                    <div className="h-px w-full bg-white/20 my-2"></div>
                                    <div className="flex justify-between w-full md:w-56 text-2xl font-black tracking-tight">
                                        <span className="text-xs font-bold self-center opacity-60 uppercase mr-2">Grand Total</span>
                                        <span>₹ {Math.round(estimatedTotal * 1.18).toLocaleString('en-IN')}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Detailed List */}
                            <div className="p-8 md:p-12 space-y-12 bg-white">
                                <div className="flex items-center gap-3 border-b border-slate-50 pb-6">
                                    <div className="h-10 w-2 rounded-full" style={{ backgroundColor: primaryColor }}></div>
                                    <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase tracking-[0.1em]">Detailed Work Breakdown</h2>
                                </div>

                                <div className="grid grid-cols-1 gap-8">
                                    {Object.entries(
                                        breakdown.reduce((acc: any, item: any) => {
                                            if (!acc[item.category]) acc[item.category] = [];
                                            acc[item.category].push(item);
                                            return acc;
                                        }, {})
                                    ).map(([categoryName, items]: [string, any]) => (
                                        <div key={categoryName} className="space-y-6 group">
                                            <div className="flex justify-between items-end border-b border-slate-100 pb-2">
                                                <span className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">{categoryName}</span>
                                                <span className="text-lg font-black text-slate-900 tracking-tight bg-slate-50 px-4 py-1 rounded-full border border-slate-100 shadow-sm">
                                                    ₹ {items.reduce((sum: number, it: any) => sum + it.total, 0).toLocaleString('en-IN')}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-1 gap-4 px-2">
                                                {items.map((it: any, idx: number) => (
                                                    <div key={idx} className="flex justify-between items-center text-sm p-4 rounded-2xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100 group/row">
                                                        <div className="flex items-center gap-4">
                                                            <div className="h-2 w-2 rounded-full bg-slate-200 group-hover/row:scale-150 group-hover/row:bg-blue-400 transition-all"></div>
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-slate-800 tracking-tight">{it.item}</span>
                                                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                                                                    {it.quantity} Unit(s) × ₹{it.unitPrice.toLocaleString('en-IN')}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <span className="font-black text-slate-900 tracking-tight tabular-nums">₹ {it.total.toLocaleString('en-IN')}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Action Footer */}
                    <div className="flex flex-col md:flex-row items-center justify-center gap-6 pt-8 pb-12">
                        <Button
                            onClick={handleDownloadPDF}
                            disabled={isGeneratingPDF}
                            className="w-full md:w-auto min-w-[280px] h-20 text-white font-black uppercase tracking-[0.2em] shadow-[0_20px_50px_rgba(249,115,22,0.3)] hover:scale-[1.02] transition-all group relative overflow-hidden active:scale-95"
                            style={{ backgroundColor: "#F97316", borderRadius: (buttonRadius as number) * 1.5 }}
                        >
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-all duration-500"></div>
                            <div className="relative z-10 flex items-center justify-center gap-3">
                                {isGeneratingPDF ? <Loader2 className="animate-spin w-6 h-6" /> : <Download className="w-6 h-6" />}
                                <span className="text-lg">Download PDF</span>
                            </div>
                        </Button>

                        <Button
                            onClick={() => router.push(`/${tenantSlug}/book-consultation`)}
                            className="w-full md:w-auto min-w-[240px] h-16 text-white font-black uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] transition-all text-sm bg-slate-900 hover:bg-black group relative overflow-hidden active:scale-95"
                            style={{ borderRadius: (buttonRadius as number) * 1.5 }}
                        >
                            <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover:translate-x-0 transition-all duration-500"></div>
                            <div className="relative z-10 flex items-center justify-center gap-3">
                                <Calendar className="w-5 h-5 opacity-70" />
                                <span>Book Consultation</span>
                            </div>
                        </Button>
                    </div>

                    <div className="text-center space-y-2 pt-8">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em]">
                            Estimation Generated via {resolvedTenant?.businessName} Professional Engine
                        </p>
                        <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest max-w-lg mx-auto leading-relaxed">
                            This is a preliminary estimate generated digitally. Final pricing is subject to precise site measurement and chosen material finishes.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    const allCategories = config?.categories || [];
    const categories = allCategories.filter(c => {
        if (segment === 'Residential') return !c.type || c.type === 'residential';
        return c.type === 'commercial';
    });

    // Helper to match category names robustly
    const isRoom = (cat: any, name: string) =>
        cat.id === name ||
        cat.id === name.replace(' ', '_') ||
        cat.name.trim().toLowerCase() === name.replace('_', ' ').toLowerCase();

    const livingAreaCategory = categories.find(c => isRoom(c, 'living_area'));
    const kitchenCategory = categories.find(c => isRoom(c, 'kitchen'));
    const bedroomCategory = categories.find(c => isRoom(c, 'bedroom'));
    const bathroomCategory = categories.find(c => isRoom(c, 'bathroom'));

    // Other categories to show in a general section
    const otherCategories = categories.filter(c =>
        !isRoom(c, 'living_area') &&
        !isRoom(c, 'kitchen') &&
        !isRoom(c, 'bedroom') &&
        !isRoom(c, 'bathroom')
    );

    const enabledCities = cities.length > 0
        ? cities.filter(c => c.enabled)
        : [
            { id: 'def-1', name: 'Mumbai', enabled: true },
            { id: 'def-2', name: 'Delhi', enabled: true },
            { id: 'def-3', name: 'Bangalore', enabled: true },
            { id: 'def-4', name: 'Hyderabad', enabled: true },
            { id: 'def-5', name: 'Ahmedabad', enabled: true },
            { id: 'def-6', name: 'Chennai', enabled: true },
            { id: 'def-7', name: 'Kolkata', enabled: true },
            { id: 'def-8', name: 'Pune', enabled: true }
        ];

    const { total: currentTotal, breakdown: currentBreakdown } = calculateEstimate();

    return (
        <div className="min-h-screen text-[#0F172A] font-sans pt-4 pb-32 relative z-0 transition-colors duration-500" style={{ backgroundColor }}>
            {/* Minimal Header Removed to allow Main Layout Header */}

            <main className="max-w-3xl mx-auto px-6 py-12">
                {/* Progress Indicators */}
                <div className="hidden md:flex justify-between items-center mb-16 relative px-4 max-w-2xl mx-auto">
                    {/* Background Progress Line */}
                    <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-100 -translate-y-1/2 z-0"></div>
                    {/* Active Progress Line */}
                    <div
                        className="absolute top-1/2 left-0 h-0.5 transition-all duration-700 ease-in-out z-0"
                        style={{
                            backgroundColor: primaryColor,
                            width: `${(step - 1) * 25}%`
                        }}
                    ></div>

                    {[
                        { id: 1, label: 'Type', icon: Building2 },
                        { id: 2, label: 'Plan', icon: LayoutGrid },
                        { id: 3, label: 'Basics', icon: Calculator },
                        { id: 4, label: 'Details', icon: ChevronDown },
                        { id: 5, label: 'Finish', icon: CheckCircle2 }
                    ].map((s, idx) => {
                        const Icon = s.icon;
                        const isActive = step === s.id;
                        const isCompleted = step > s.id;

                        return (
                            <div key={s.id} className="relative z-10 flex flex-col items-center gap-3">
                                <div
                                    className={cn(
                                        "h-10 w-10 rounded-full flex items-center justify-center transition-all duration-500 border-2",
                                        isActive ? "bg-white border-black scale-110 shadow-lg" :
                                            isCompleted ? "bg-black border-black text-white" :
                                                "bg-white border-gray-100 text-gray-300"
                                    )}
                                    style={{
                                        borderColor: isActive || isCompleted ? primaryColor : undefined,
                                        backgroundColor: isCompleted ? primaryColor : isActive ? '#fff' : undefined,
                                        color: isCompleted ? '#fff' : isActive ? primaryColor : undefined
                                    }}
                                >
                                    {isCompleted ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                                </div>
                                <span className={cn(
                                    "text-[10px] font-black uppercase tracking-widest transition-colors duration-300",
                                    isActive ? "text-slate-900" : "text-gray-300"
                                )}>
                                    {s.label}
                                </span>
                            </div>
                        );
                    })}
                </div>

                <div className="md:hidden flex justify-center mb-12">
                    <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map(s => (
                            <div
                                key={s}
                                className={cn(
                                    "h-1.5 rounded-full transition-all duration-500 ease-out",
                                    step === s ? "w-8" : step > s ? "w-8 opacity-20" : "w-1.5 bg-gray-200"
                                )}
                                style={{ backgroundColor: step >= s ? primaryColor : undefined }}
                            />
                        ))}
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                    >
                        {/* Step 1: Segment */}
                        {step === 1 && (
                            <div className="space-y-12 animate-in slide-in-from-bottom-8 fade-in duration-700 ease-out">
                                <div className="space-y-3 text-center">
                                    <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">Project Type</h1>
                                    <p className="text-xl text-gray-500 font-light">What kind of space are we designing today?</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {['Residential', 'Commercial'].map((s) => (
                                        <motion.div
                                            key={s}
                                            whileHover={{ y: -8, transition: { duration: 0.2 } }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => setSegment(s as any)}
                                            className={cn(
                                                "cursor-pointer group relative overflow-hidden transition-all duration-500 border-2 p-10 flex flex-col items-center text-center",
                                                segment === s
                                                    ? "bg-white ring-8 shadow-2xl"
                                                    : "border-gray-100 bg-white hover:border-gray-200"
                                            )}
                                            style={{
                                                borderRadius: (buttonRadius as number) * 3,
                                                borderColor: segment === s ? primaryColor : undefined,
                                                boxShadow: segment === s ? `${primaryColor}20 0px 20px 60px` : undefined
                                            }}
                                        >
                                            <div className={cn(
                                                "h-32 w-32 rounded-[35px] flex items-center justify-center transition-all duration-500 shadow-lg mb-8 group-hover:rotate-6",
                                                segment === s ? "text-white scale-110" : "bg-slate-50 text-gray-400 group-hover:bg-gray-100 group-hover:scale-110"
                                            )}
                                                style={{ backgroundColor: segment === s ? primaryColor : undefined }}
                                            >
                                                {s === 'Residential' ? <Home className="h-12 w-12" /> : <Building2 className="h-12 w-12" />}
                                            </div>
                                            <h3 className="text-3xl font-black text-slate-900 tracking-tight mb-4">{s}</h3>
                                            <p className="text-gray-500 font-medium leading-relaxed max-w-[200px]">
                                                {s === 'Residential' ? 'Design for your personal sanctuary' : 'Functional workspaces for growth'}
                                            </p>
                                            {segment === s && (
                                                <div className="absolute top-6 right-6 p-1.5 rounded-full" style={{ color: primaryColor, backgroundColor: `${primaryColor}10` }}>
                                                    <CheckCircle2 className="h-6 w-6" />
                                                </div>
                                            )}
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Step 2: Plan */}
                        {step === 2 && (
                            <div className="space-y-12 animate-in slide-in-from-bottom-8 fade-in duration-700 ease-out">
                                <div className="text-center space-y-3">
                                    <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">Select Plan</h1>
                                    <p className="text-xl text-gray-500 font-light">Choose a tier that matches your vision</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {(['Basic', 'Standard', 'Luxe'] as Plan[]).map(plan => (
                                        <motion.button
                                            key={plan}
                                            whileHover={{ y: -5 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => setSelectedPlan(plan)}
                                            className={cn(
                                                "relative p-8 border-2 rounded-[32px] text-center transition-all duration-500 group flex flex-col items-center justify-between min-h-[320px]",
                                                selectedPlan === plan
                                                    ? "bg-white ring-8 shadow-2xl"
                                                    : "border-gray-100 bg-white hover:border-gray-200"
                                            )}
                                            style={{
                                                borderColor: selectedPlan === plan ? primaryColor : undefined,
                                                boxShadow: selectedPlan === plan ? `${primaryColor}15 0px 15px 45px` : undefined
                                            }}
                                        >
                                            {plan === 'Standard' && (
                                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-black text-[10px] font-black text-white uppercase tracking-widest z-20 shadow-lg">
                                                    Most Popular
                                                </div>
                                            )}
                                            {plan === 'Luxe' && (
                                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[#B8860B] text-[10px] font-black text-white uppercase tracking-widest z-20 shadow-lg">
                                                    Premium Choice
                                                </div>
                                            )}

                                            <div className={cn(
                                                "h-16 w-16 rounded-2xl flex items-center justify-center mb-6 transition-all duration-500",
                                                selectedPlan === plan ? "bg-black text-white scale-110 rotate-3" : "bg-slate-50 text-slate-400 group-hover:scale-110"
                                            )} style={{ backgroundColor: selectedPlan === plan ? primaryColor : undefined }}>
                                                {plan === 'Basic' && <Home className="h-7 w-7" />}
                                                {plan === 'Standard' && <LayoutGrid className="h-7 w-7" />}
                                                {plan === 'Luxe' && <TrendingUp className="h-7 w-7" />}
                                            </div>

                                            <div className="space-y-2 mb-6">
                                                <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none">{plan}</h3>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                    {plan === 'Basic' ? 'Quality & Value' : plan === 'Standard' ? 'Modern Lifestyle' : 'Ultimate Luxury'}
                                                </p>
                                            </div>

                                            <div className="space-y-3 w-full text-left">
                                                {[1, 2, 3].map((_, i) => (
                                                    <div key={i} className="flex items-center gap-2">
                                                        <div className="h-1.5 w-1.5 rounded-full bg-gray-200"></div>
                                                        <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden">
                                                            <div className="h-full bg-slate-200 transition-all duration-1000" style={{ width: `${60 + (i * 10)}%` }}></div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className={cn(
                                                "mt-8 h-12 w-12 rounded-full flex items-center justify-center border transition-all duration-300",
                                                selectedPlan === plan ? "bg-black border-black text-white scale-110" : "border-gray-100 text-gray-300"
                                            )} style={{ backgroundColor: selectedPlan === plan ? primaryColor : undefined, borderColor: selectedPlan === plan ? primaryColor : undefined }}>
                                                <Check className="h-5 w-5" />
                                            </div>
                                        </motion.button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Step 3: Project Basics */}
                        {step === 3 && (
                            <div className="space-y-12 animate-in slide-in-from-bottom-8 fade-in duration-700 ease-out">
                                <div className="text-center space-y-3">
                                    <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">Project Basics</h1>
                                    <p className="text-xl text-gray-500 font-light">Tell us about the space dimensions</p>
                                </div>
                                <div className={cn(
                                    "grid grid-cols-1 gap-12 max-w-2xl mx-auto bg-white p-12 rounded-[40px] shadow-2xl border border-gray-100 relative overflow-hidden",
                                    segment === 'Residential' ? "md:grid-cols-2" : "md:grid-cols-1"
                                )}>
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2"></div>

                                    <div className="space-y-4">
                                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Total Area (sqft)</Label>
                                        <div className="relative group">
                                            <Input
                                                type="number"
                                                placeholder="e.g 1200"
                                                className="h-20 text-4xl font-black bg-slate-50 border-0 focus:ring-[12px] focus:ring-black/5 rounded-[24px] transition-all pl-8 tabular-nums placeholder:text-slate-200"
                                                value={carpetArea}
                                                onChange={(e) => setCarpetArea(e.target.value)}
                                                autoFocus
                                            />
                                            <div className="absolute right-6 top-1/2 -translate-y-1/2 text-xs font-black text-slate-300 uppercase tracking-widest">sqft</div>
                                        </div>
                                    </div>

                                    {segment === 'Residential' ? (
                                        <>
                                            <div className="space-y-4">
                                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Bedrooms</Label>
                                                <div className="flex items-center gap-4 bg-slate-50 rounded-[24px] p-2 h-20 border border-slate-100/50 shadow-inner">
                                                    <Button size="icon" variant="ghost" className="h-14 w-14 rounded-2xl hover:bg-white shadow-sm transition-all" onClick={() => setBedroomCount(Math.max(0, bedroomCount - 1))}><Minus className="h-6 w-6" /></Button>
                                                    <div className="flex-1 text-center font-black text-4xl tabular-nums leading-none pt-1">{bedroomCount}</div>
                                                    <Button size="icon" variant="ghost" className="h-14 w-14 rounded-2xl hover:bg-white shadow-sm transition-all" onClick={() => setBedroomCount(bedroomCount + 1)}><Plus className="h-6 w-6" /></Button>
                                                </div>
                                            </div>
                                            <div className="space-y-4 md:col-span-2 max-w-xs mx-auto w-full">
                                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 text-center block">Bathrooms</Label>
                                                <div className="flex items-center gap-4 bg-slate-50 rounded-[24px] p-2 h-20 border border-slate-100/50 shadow-inner">
                                                    <Button size="icon" variant="ghost" className="h-14 w-14 rounded-2xl hover:bg-white shadow-sm transition-all" onClick={() => setBathroomCount(Math.max(0, bathroomCount - 1))}><Minus className="h-6 w-6" /></Button>
                                                    <div className="flex-1 text-center font-black text-4xl tabular-nums leading-none pt-1">{bathroomCount}</div>
                                                    <Button size="icon" variant="ghost" className="h-14 w-14 rounded-2xl hover:bg-white shadow-sm transition-all" onClick={() => setBathroomCount(bathroomCount + 1)}><Plus className="h-6 w-6" /></Button>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="space-y-4">
                                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">No. of Cabins</Label>
                                                <div className="flex items-center gap-4 bg-slate-50 rounded-[24px] p-2 h-20 border border-slate-100/50 shadow-inner">
                                                    <Button size="icon" variant="ghost" className="h-14 w-14 rounded-2xl hover:bg-white shadow-sm transition-all" onClick={() => setCabinCount(Math.max(0, cabinCount - 1))}><Minus className="h-6 w-6" /></Button>
                                                    <div className="flex-1 text-center font-black text-4xl tabular-nums leading-none pt-1">{cabinCount}</div>
                                                    <Button size="icon" variant="ghost" className="h-14 w-14 rounded-2xl hover:bg-white shadow-sm transition-all" onClick={() => setCabinCount(cabinCount + 1)}><Plus className="h-6 w-6" /></Button>
                                                </div>
                                            </div>
                                            <div className="space-y-4 md:col-span-1">
                                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Bathroom Units</Label>
                                                <div className="flex items-center gap-4 bg-slate-50 rounded-[24px] p-2 h-20 border border-slate-100/50 shadow-inner">
                                                    <Button size="icon" variant="ghost" className="h-14 w-14 rounded-2xl hover:bg-white shadow-sm transition-all" onClick={() => setBathroomCount(Math.max(0, bathroomCount - 1))}><Minus className="h-6 w-6" /></Button>
                                                    <div className="flex-1 text-center font-black text-4xl tabular-nums leading-none pt-1">{bathroomCount}</div>
                                                    <Button size="icon" variant="ghost" className="h-14 w-14 rounded-2xl hover:bg-white shadow-sm transition-all" onClick={() => setBathroomCount(bathroomCount + 1)}><Plus className="h-6 w-6" /></Button>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Step 4: Essentials Configuration */}
                        {step === 4 && (
                            <div className="space-y-12 animate-in slide-in-from-bottom-8 fade-in duration-700 ease-out">
                                <div className="text-center space-y-3">
                                    <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">Configure Details</h1>
                                    <p className="text-xl text-gray-500 font-light">Customize essentials for each room</p>
                                </div>

                                <div className="space-y-16">
                                    {/* Living Area */}
                                    {livingAreaCategory && livingAreaCategory.items.filter(i => i.enabled).length > 0 && (
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-4 border-b border-gray-100 pb-4">
                                                <div className="h-10 w-1 rounded-full" style={{ backgroundColor: primaryColor }}></div>
                                                <h2 className="text-2xl font-bold text-[#0F172A]">Living Area</h2>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {livingAreaCategory.items.filter(i => i.enabled).map(item => (
                                                    <RenderItem
                                                        key={item.id}
                                                        item={item}
                                                        value={livingAreaItems[item.id] || 0}
                                                        onValueChange={(val, type) => updateItemQuantity('livingArea', item.id, val, type)}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Kitchen */}
                                    {kitchenCategory && (
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-4 border-b border-gray-100 pb-4">
                                                <div className="h-10 w-1 rounded-full" style={{ backgroundColor: primaryColor }}></div>
                                                <h2 className="text-2xl font-bold text-[#0F172A]">Kitchen</h2>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                                <div className="space-y-3">
                                                    <Label className="uppercase text-xs font-bold text-gray-400">Layout</Label>
                                                    <Select value={kitchenLayout} onValueChange={setKitchenLayout}>
                                                        <SelectTrigger className="h-14 rounded-2xl bg-white border border-gray-200 text-lg">
                                                            <SelectValue placeholder="Select layout" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {config?.kitchenLayouts?.filter(l => l.enabled).map(layout => (
                                                                <SelectItem key={layout.id} value={layout.name}>{layout.name}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-3">
                                                    <Label className="uppercase text-xs font-bold text-gray-400">Material</Label>
                                                    <Select value={kitchenMaterial} onValueChange={setKitchenMaterial}>
                                                        <SelectTrigger className="h-14 rounded-2xl bg-white border border-gray-200 text-lg">
                                                            <SelectValue placeholder="Select material" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {config?.kitchenMaterials?.filter(m => m.enabled).map(material => (
                                                                <SelectItem key={material.id} value={material.name}>{material.name}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                            {kitchenCategory.items.filter(i => i.enabled).length > 0 && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {kitchenCategory.items.filter(i => i.enabled).map(item => (
                                                        <RenderItem
                                                            key={item.id}
                                                            item={item}
                                                            value={kitchenItems[item.id] || 0}
                                                            onValueChange={(val, type) => updateItemQuantity('kitchen', item.id, val, type)}
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Bedrooms */}
                                    {bedroomCount > 0 && bedroomCategory && (
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-4 border-b border-gray-100 pb-4">
                                                <div className="h-10 w-1 rounded-full" style={{ backgroundColor: primaryColor }}></div>
                                                <h2 className="text-2xl font-bold text-[#0F172A]">Bedrooms</h2>
                                            </div>
                                            {bedrooms.map((bedroom, index) => (
                                                <div key={index} className="space-y-4 p-8 bg-gray-50/50 rounded-3xl border border-gray-100">
                                                    <h3 className="font-bold text-lg text-gray-400 uppercase tracking-widest mb-4">Bedroom {index + 1}</h3>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        {bedroomCategory.items.filter(i => i.enabled).map(item => (
                                                            <RenderItem
                                                                key={item.id}
                                                                item={item}
                                                                value={bedroom.items[item.id] || 0}
                                                                onValueChange={(val, type) => updateItemQuantity('bedroom', item.id, val, type, index)}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Bathrooms */}
                                    {bathroomCount > 0 && bathroomCategory && (
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-4 border-b border-gray-100 pb-4">
                                                <div className="h-10 w-1 rounded-full" style={{ backgroundColor: primaryColor }}></div>
                                                <h2 className="text-2xl font-bold text-[#0F172A]">Bathrooms</h2>
                                            </div>
                                            {bathrooms.map((bathroom, index) => (
                                                <div key={index} className="space-y-4 p-8 bg-gray-50/50 rounded-3xl border border-gray-100">
                                                    <h3 className="font-bold text-lg text-gray-400 uppercase tracking-widest mb-4">Bathroom Unit {index + 1}</h3>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        {bathroomCategory.items.filter(i => i.enabled).map(item => (
                                                            <RenderItem
                                                                key={item.id}
                                                                item={item}
                                                                value={bathroom.items[item.id] || 0}
                                                                onValueChange={(val, type) => updateItemQuantity('bathroom', item.id, val, type, index)}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Cabins (Commercial Only) */}
                                    {cabinCount > 0 && categories.find(c => c.id === 'cabin' || c.name.toLowerCase() === 'cabin') && (
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-4 border-b border-gray-100 pb-4">
                                                <div className="h-10 w-1 rounded-full" style={{ backgroundColor: primaryColor }}></div>
                                                <h2 className="text-2xl font-bold text-[#0F172A]">Office Cabins</h2>
                                            </div>
                                            {cabins.map((cabin, index) => (
                                                <div key={index} className="space-y-4 p-8 bg-gray-50/50 rounded-3xl border border-gray-100">
                                                    <h3 className="font-bold text-lg text-gray-400 uppercase tracking-widest mb-4">Cabin {index + 1}</h3>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        {categories.find(c => c.id === 'cabin' || c.name.toLowerCase() === 'cabin')?.items.filter(i => i.enabled).map(item => (
                                                            <RenderItem
                                                                key={item.id}
                                                                item={item}
                                                                value={cabin.items[item.id] || 0}
                                                                onValueChange={(val, type) => updateItemQuantity('cabin', item.id, val, type, index)}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Other Categories */}
                                    {otherCategories.map(category => (
                                        <div key={category.id} className="space-y-6">
                                            <div className="flex items-center gap-4 border-b border-gray-100 pb-4">
                                                <div className="h-10 w-1 rounded-full" style={{ backgroundColor: primaryColor }}></div>
                                                <h2 className="text-2xl font-bold text-[#0F172A]">{category.name}</h2>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {category.items.filter(i => i.enabled).map(item => (
                                                    <RenderItem
                                                        key={item.id}
                                                        item={item}
                                                        value={livingAreaItems[item.id] || 0}
                                                        onValueChange={(val, type) => updateItemQuantity('livingArea', item.id, val, type)}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    ))}

                                    {categories.length === 0 && (
                                        <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                                            <p className="text-gray-400">No items available for configuration.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Step 5: Review & Submit */}
                        {step === 5 && (
                            <div className="space-y-12 animate-in slide-in-from-bottom-8 fade-in duration-700 ease-out">
                                <div className="text-center space-y-3">
                                    <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">Final Review</h1>
                                    <p className="text-xl text-gray-500 font-light">Confirm your details and receive estimate</p>
                                </div>

                                <div className="rounded-3xl p-10 text-white text-center shadow-2xl transform hover:scale-[1.01] transition-all duration-500 relative overflow-hidden"
                                    style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`, borderRadius: (buttonRadius as number) * 2 }}>
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                                    <div className="relative z-10">
                                        <p className="text-gray-400 font-bold mb-3 uppercase tracking-widest text-xs">Estimated Cost</p>
                                        <div className="text-6xl font-bold mb-3 tracking-tight">₹ {currentTotal.toLocaleString('en-IN')}</div>
                                        <p className="text-sm opacity-60 font-medium">Based on {selectedPlan} Plan</p>
                                    </div>
                                </div>

                                <div className="space-y-6 max-w-2xl mx-auto bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                                    <h3 className="font-bold text-lg border-b border-gray-100 pb-4 text-gray-900">Customer Details</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold uppercase text-gray-500">Full Name</Label>
                                            <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="h-14 bg-gray-50 border-0 rounded-xl px-4 text-lg" placeholder="John Doe" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold uppercase text-gray-500">Phone</Label>
                                            <Input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="h-14 bg-gray-50 border-0 rounded-xl px-4 text-lg" placeholder="+91 98765 43210" />
                                        </div>
                                        <div className="space-y-2 md:col-span-2">
                                            <Label className="text-xs font-bold uppercase text-gray-500">Email</Label>
                                            <Input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} className="h-14 bg-gray-50 border-0 rounded-xl px-4 text-lg" placeholder="john@example.com" />
                                        </div>
                                        <div className="space-y-2 md:col-span-2">
                                            <Label className="text-xs font-bold uppercase text-gray-500">City</Label>
                                            <Select value={selectedCity} onValueChange={setSelectedCity}>
                                                <SelectTrigger className="h-14 bg-gray-50 border-0 rounded-xl px-4 text-lg"><SelectValue placeholder="Select City" /></SelectTrigger>
                                                <SelectContent>
                                                    {enabledCities.map(city => (<SelectItem key={city.id} value={city.name}>{city.name}</SelectItem>))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </main>

            {/* Floating Summary Card for Large Screens */}
            <AnimatePresence>
                {step >= 2 && step <= 4 && (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="hidden xl:block fixed top-24 right-8 w-80 z-40"
                    >
                        <Card className="border-0 shadow-2xl rounded-[32px] overflow-hidden bg-white/90 backdrop-blur-md border border-gray-100">
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Summary</span>
                                    <div className="px-3 py-1 rounded-full text-[10px] font-bold text-white uppercase tracking-wider"
                                        style={{ backgroundColor: primaryColor }}>
                                        {selectedPlan} Plan
                                    </div>
                                </div>
                                <CardTitle className="text-3xl font-black tracking-tight text-slate-900">
                                    <motion.div
                                        key={currentTotal}
                                        initial={{ scale: 1.05 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                    >
                                        ₹{currentTotal.toLocaleString('en-IN')}
                                    </motion.div>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                    {currentBreakdown.length > 0 ? (
                                        Object.entries(
                                            currentBreakdown.reduce((acc: any, item: any) => {
                                                if (!acc[item.category]) acc[item.category] = 0;
                                                acc[item.category] += item.total;
                                                return acc;
                                            }, {})
                                        ).map(([cat, total]: [string, any]) => (
                                            <div key={cat} className="flex justify-between items-center group">
                                                <span className="text-[10px] font-bold text-gray-500 group-hover:text-gray-900 transition-colors uppercase tracking-[0.1em]">{cat}</span>
                                                <span className="text-sm font-bold text-slate-700">₹{total.toLocaleString('en-IN')}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-4 text-gray-400 text-[10px] font-bold uppercase tracking-widest italic opacity-50">
                                            Select items to see breakdown
                                        </div>
                                    )}
                                </div>
                                <div className="mt-8 pt-6 border-t border-gray-100 italic text-[10px] text-gray-400 leading-relaxed font-medium">
                                    * Estimates are subject to site verification and material price fluctuations.
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Sticky Footer */}
            <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-gray-100 p-4 z-50">
                <div className="max-w-4xl mx-auto flex justify-between items-center px-4">
                    <Button
                        variant="ghost"
                        disabled={step === 1}
                        onClick={() => setStep(s => s - 1)}
                        className="text-gray-500 hover:text-black font-semibold h-12 px-6 rounded-xl hover:bg-gray-100"
                    >
                        <ArrowLeft className="mr-2 h-5 w-5" /> Back
                    </Button>

                    {step > 1 && step < 5 && (
                        <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center">
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] mb-0.5">Live Estimate</span>
                            <motion.span
                                key={currentTotal}
                                initial={{ scale: 1.1, y: -2 }}
                                animate={{ scale: 1, y: 0 }}
                                className="text-xl font-black text-slate-900"
                            >
                                ₹{currentTotal.toLocaleString('en-IN')}
                            </motion.span>
                        </div>
                    )}

                    {step < 5 ? (
                        <Button
                            className="text-white px-10 py-7 text-lg font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 border-0"
                            onClick={() => setStep(s => s + 1)}
                            disabled={!isStepValid()}
                            style={{ backgroundColor: primaryColor, borderRadius: (buttonRadius as number) * 2 }}
                        >
                            Continue <ChevronRight className="ml-2 h-5 w-5" />
                        </Button>
                    ) : (
                        <Button
                            className="text-white px-10 py-7 text-lg font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 border-0"
                            onClick={handleSubmit}
                            disabled={isSubmitting || !isStepValid()}
                            style={{ backgroundColor: primaryColor, borderRadius: (buttonRadius as number) * 2 }}
                        >
                            {isSubmitting ? <><Loader2 className="mr-2 animate-spin" /> Submitting...</> : "Confirm & Submit"}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
