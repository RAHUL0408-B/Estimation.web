"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    FileText,
    Users,
    Clock,
    CalendarDays,
    Eye,
    Download,
    AlertCircle,
    Plus,
    List,
    Settings,
    Globe,
    X,
    User,
    Home,
    Layers,
    IndianRupee,
    CheckCircle,
    XCircle,
    Hammer,
    TrendingUp
} from "lucide-react";
import { useTenantAuth } from "@/hooks/useTenantAuth";
import { useTenantDashboard, RecentOrder } from "@/hooks/useTenantDashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogClose,
} from "@/components/ui/dialog";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion } from "framer-motion";

import { generateSampleData } from "@/lib/sampleData";

export default function TenantDashboardPage() {
    const { tenant, isAuthenticated, loading: authLoading } = useTenantAuth();
    const stats = useTenantDashboard(tenant?.id || null);
    const router = useRouter();

    const [selectedOrder, setSelectedOrder] = useState<RecentOrder | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push("/login");
        }
    }, [authLoading, isAuthenticated, router]);

    // Generate sample data if needed
    useEffect(() => {
        if (tenant?.id) {
            import("@/lib/seeder").then((module) => {
                module.checkAndSeed(tenant.id);
            });
        }
    }, [tenant?.id]);

    if (authLoading || stats.loading) {
        return (
            <div className="flex min-h-[400px] items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                    <div className="text-sm text-gray-500">Loading dashboard...</div>
                </div>
            </div>
        );
    }

    if (!tenant) return null;

    const getStatusColor = (status: string) => {
        switch (status) {
            case "pending": return "bg-orange-100 text-orange-700 hover:bg-orange-100";
            case "approved": return "bg-green-100 text-green-700 hover:bg-green-100";
            case "rejected": return "bg-red-100 text-red-700 hover:bg-red-100";
            case "generated": return "bg-blue-100 text-blue-700 hover:bg-blue-100";
            default: return "bg-gray-100 text-gray-700 hover:bg-gray-100";
        }
    };

    const formatAmount = (amount: number | undefined) => {
        if (amount === undefined || amount === null) return "-";
        return amount >= 100000
            ? `₹${(amount / 100000).toFixed(1)}L`
            : `₹${amount.toLocaleString('en-IN')}`;
    };

    const formatDate = (timestamp: any) => {
        if (!timestamp?.toDate) return "-";
        return timestamp.toDate().toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const openDetails = (order: RecentOrder) => {
        setSelectedOrder(order);
        setIsDetailsOpen(true);
    };

    const handleApprove = async (orderId: string) => {
        try {
            const orderRef = doc(db, "orders", orderId);
            await updateDoc(orderRef, { status: "approved" });
            if (selectedOrder?.id === orderId) {
                setSelectedOrder({ ...selectedOrder, status: "approved" });
            }
        } catch (error) {
            console.error("Error approving order:", error);
        }
    };

    const handleReject = async (orderId: string) => {
        try {
            const orderRef = doc(db, "orders", orderId);
            await updateDoc(orderRef, { status: "rejected" });
            if (selectedOrder?.id === orderId) {
                setSelectedOrder({ ...selectedOrder, status: "rejected" });
            }
        } catch (error) {
            console.error("Error rejecting order:", error);
        }
    };

    return (
        <>
            <div className="space-y-12 pb-20">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                    <div className="space-y-1">
                        <h1 className="text-4xl font-extrabold tracking-tight text-slate-950 uppercase tracking-[0.05em]">Analytics Overview</h1>
                        <p className="text-lg text-slate-500 font-medium">Welcome back, {tenant.name.split(' ')[0]}. Here's your business performance today.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Live System Status</span>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
                    {/* Monthly Revenue */}
                    <Card className="group relative overflow-hidden border-none shadow-enterprise hover:scale-[1.02] transition-all duration-300">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-blue-500/10 transition-colors"></div>
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                Monthly Revenue
                            </CardTitle>
                            <div className="p-2.5 bg-blue-50 rounded-xl group-hover:rotate-6 transition-transform">
                                <IndianRupee className="h-4 w-4 text-blue-600" />
                            </div>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <div className="text-4xl font-black text-slate-900 tracking-tight">{formatAmount(stats.revenue.thisMonth)}</div>
                            <div className="mt-4 flex items-center gap-2">
                                <div className={cn(
                                    "flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                                    stats.revenue.growth > 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                                )}>
                                    <TrendingUp className={cn("h-3 w-3", stats.revenue.growth < 0 && "rotate-180")} />
                                    {stats.revenue.growth > 0 ? `+${stats.revenue.growth.toFixed(1)}%` : `${stats.revenue.growth.toFixed(1)}%`}
                                </div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Vs Last Month</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Estimates This Month */}
                    <Card className="group relative overflow-hidden border-none shadow-enterprise hover:scale-[1.02] transition-all duration-300">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-purple-500/10 transition-colors"></div>
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                New Leads
                            </CardTitle>
                            <div className="p-2.5 bg-purple-50 rounded-xl group-hover:rotate-6 transition-transform">
                                <FileText className="h-4 w-4 text-purple-600" />
                            </div>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <div className="text-4xl font-black text-slate-900 tracking-tight">{stats.estimatesThisMonthCount}</div>
                            <p className="text-[10px] font-bold text-slate-400 mt-4 uppercase tracking-[0.1em]">Estimates Generated</p>
                        </CardContent>
                    </Card>

                    {/* Conversion Rate */}
                    <Card className="group relative overflow-hidden border-none shadow-enterprise hover:scale-[1.02] transition-all duration-300">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-orange-500/10 transition-colors"></div>
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                Conversion
                            </CardTitle>
                            <div className="p-2.5 bg-orange-50 rounded-xl group-hover:rotate-6 transition-transform">
                                <CheckCircle className="h-4 w-4 text-orange-600" />
                            </div>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <div className="text-4xl font-black text-slate-900 tracking-tight">{stats.conversionRate.toFixed(1)}%</div>
                            <div className="mt-4 flex items-center gap-4">
                                <div className="h-1.5 flex-1 bg-slate-100 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${stats.conversionRate}%` }}
                                        transition={{ duration: 1, ease: "easeOut" }}
                                        className="h-full bg-orange-500 rounded-full"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Active Projects */}
                    <Link href="/dashboard/projects" className="block">
                        <Card className="group relative overflow-hidden border-none shadow-enterprise hover:scale-[1.02] transition-all duration-300 bg-slate-950 text-white">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-white/10 transition-colors"></div>
                            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                <CardTitle className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                    Operations
                                </CardTitle>
                                <div className="p-2.5 bg-white/10 rounded-xl group-hover:rotate-6 transition-transform">
                                    <Hammer className="h-4 w-4 text-slate-300" />
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <div className="text-4xl font-black text-white tracking-tight">{stats.activeProjectsCount}</div>
                                <p className="text-[10px] font-bold text-slate-400 mt-4 uppercase tracking-[0.1em]">Active Projects</p>
                            </CardContent>
                        </Card>
                    </Link>
                </div>

                {/* Needs Your Attention */}
                {(stats.pendingApprovalsCount > 0 || stats.rejectedThisWeekCount > 0) && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <Card className="border border-amber-200 shadow-enterprise bg-amber-50/30 rounded-2xl">
                            <CardContent className="py-6">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                                    <div className="p-4 bg-white rounded-2xl shadow-sm text-amber-600 border border-amber-100/50">
                                        <AlertCircle className="h-6 w-6" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[10px] font-black text-amber-900 uppercase tracking-[0.2em] mb-1">Operational Alert</p>
                                        <p className="text-base text-amber-700 font-medium leading-relaxed">
                                            {stats.pendingApprovalsCount > 0 && (
                                                <span>You have <strong>{stats.pendingApprovalsCount}</strong> pending approval{stats.pendingApprovalsCount !== 1 ? 's' : ''} awaiting review.</span>
                                            )}
                                            {stats.pendingApprovalsCount > 0 && stats.rejectedThisWeekCount > 0 && ' '}
                                            {stats.rejectedThisWeekCount > 0 && (
                                                <span>System flagged <strong>{stats.rejectedThisWeekCount}</strong> rejected estimate{stats.rejectedThisWeekCount !== 1 ? 's' : ''} this week.</span>
                                            )}
                                        </p>
                                    </div>
                                    <Link href="/dashboard/orders" className="shrink-0">
                                        <Button variant="outline" className="bg-white border-amber-200 text-amber-900 hover:bg-amber-100 font-black uppercase tracking-widest text-[10px] px-6 h-12 shadow-sm">
                                            Review Orders
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

                {/* Quick Actions */}
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="h-px flex-1 bg-slate-100"></div>
                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                            <Settings className="h-3 w-3" />
                            Quick Core Operations
                        </div>
                        <div className="h-px flex-1 bg-slate-100"></div>
                    </div>
                    <div className="flex flex-wrap justify-center gap-4">
                        <Link href="/dashboard/orders">
                            <Button variant="outline" className="min-w-[160px] gap-3 rounded-xl border-slate-200 h-14 px-6 font-bold text-slate-600 hover:bg-white hover:border-primary hover:text-primary shadow-sm">
                                <List className="h-5 w-5" />
                                All Orders
                            </Button>
                        </Link>
                        <Link href="/dashboard/projects">
                            <Button variant="outline" className="min-w-[160px] gap-3 rounded-xl bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100 hover:border-emerald-200 h-14 px-6 font-bold shadow-sm">
                                <Hammer className="h-5 w-5" />
                                Active Projects
                            </Button>
                        </Link>
                        <Link href="/dashboard/pricing">
                            <Button variant="outline" className="min-w-[160px] gap-3 rounded-xl border-slate-200 h-14 px-6 font-bold text-slate-600 hover:bg-white hover:border-primary hover:text-primary shadow-sm">
                                <Settings className="h-5 w-5" />
                                Pricing Config
                            </Button>
                        </Link>
                        <Link href="/dashboard/website-setup">
                            <Button variant="outline" className="min-w-[160px] gap-3 rounded-xl border-slate-200 h-14 px-6 font-bold text-slate-600 hover:bg-white hover:border-primary hover:text-primary shadow-sm">
                                <Globe className="h-5 w-5" />
                                Site Settings
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Recent Client Estimates Table */}
                <Card className="border-none shadow-enterprise rounded-2xl overflow-hidden bg-white mt-8">
                    <CardHeader className="bg-slate-50/40 py-8 px-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <CardTitle className="text-2xl font-black text-slate-900 tracking-tight">Recent Estimates</CardTitle>
                            <p className="text-sm text-slate-500 font-medium">Monitoring latest client interactions from the storefront portal.</p>
                        </div>
                        <Link href="/dashboard/orders">
                            <Button variant="ghost" className="text-[10px] font-black text-slate-400 hover:text-primary uppercase tracking-[0.2em]">
                                View Comprehensive Logs
                            </Button>
                        </Link>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="pl-10">Client Identity</TableHead>
                                    <TableHead>Contact Node</TableHead>
                                    <TableHead>Project Value</TableHead>
                                    <TableHead>Lifecycle Status</TableHead>
                                    <TableHead>Timestamp</TableHead>
                                    <TableHead className="text-right pr-10">Operations</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {stats.recentOrders.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-20 text-slate-400 font-medium italic">
                                            System initialized. Awaiting first client estimate.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    stats.recentOrders.map((order) => (
                                        <TableRow key={order.id}>
                                            <TableCell className="pl-10">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-black text-xs">
                                                        {(order.clientName || "U").charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="font-bold text-slate-900">{order.clientName || "Unknown Client"}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-slate-500 font-medium">
                                                {order.clientPhone || "N/A"}
                                            </TableCell>
                                            <TableCell className="font-black text-slate-900">
                                                {formatAmount(order.estimatedAmount)}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={
                                                    order.status === "approved" ? "success" :
                                                        order.status === "pending" ? "warning" :
                                                            order.status === "rejected" ? "destructive" : "secondary"
                                                }>
                                                    {order.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-slate-400 text-xs font-bold">
                                                {formatDate(order.createdAt)}
                                            </TableCell>
                                            <TableCell className="text-right pr-10">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="secondary"
                                                        size="icon"
                                                        onClick={() => openDetails(order)}
                                                        className="h-10 w-10 hover:bg-slate-200 transition-colors"
                                                        title="View Detailed Order"
                                                    >
                                                        <Eye className="h-4 w-4 text-slate-600" />
                                                    </Button>
                                                    {order.pdfUrl && (
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            onClick={() => window.open(order.pdfUrl, '_blank')}
                                                            className="h-10 w-10 hover:border-primary hover:text-primary transition-colors"
                                                            title="Download Estimate (PDF)"
                                                        >
                                                            <Download className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Order Details Modal */}
                <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                    <DialogContent className="max-w-2xl p-0 gap-0 bg-white border-none shadow-2xl rounded-xl overflow-hidden flex flex-col h-[85vh]">
                        {/* Sticky Header */}
                        <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b bg-white">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Order Details</h2>
                                <p className="text-sm text-gray-500">Estimate #{selectedOrder?.estimateId?.slice(-8) || selectedOrder?.id?.slice(-8)}</p>
                            </div>
                            <DialogClose asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <X className="h-4 w-4" />
                                </Button>
                            </DialogClose>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-6 space-y-6">
                            {selectedOrder && (
                                <>
                                    {/* Client Information */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 text-sm font-bold text-gray-500 uppercase tracking-wider">
                                            <User className="h-4 w-4" />
                                            Client Information
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-lg p-4">
                                            <div>
                                                <p className="text-xs text-gray-400 uppercase">Full Name</p>
                                                <p className="font-semibold text-gray-900">{selectedOrder.clientName || "-"}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-400 uppercase">Email</p>
                                                <p className="font-semibold text-gray-900">{selectedOrder.clientEmail || "-"}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-400 uppercase">Phone</p>
                                                <p className="font-semibold text-gray-900">{selectedOrder.clientPhone || "-"}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-400 uppercase">Estimate ID</p>
                                                <p className="font-mono text-sm text-gray-900">{selectedOrder.estimateId || selectedOrder.id}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Project Details */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 text-sm font-bold text-gray-500 uppercase tracking-wider">
                                            <Home className="h-4 w-4" />
                                            Project Details
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-lg p-4">
                                            {selectedOrder.carpetArea && (
                                                <div>
                                                    <p className="text-xs text-gray-400 uppercase">Carpet Area</p>
                                                    <p className="font-semibold text-gray-900">{selectedOrder.carpetArea} sqft</p>
                                                </div>
                                            )}
                                            {selectedOrder.numberOfRooms && (
                                                <div>
                                                    <p className="text-xs text-gray-400 uppercase">Number of Rooms</p>
                                                    <p className="font-semibold text-gray-900">{selectedOrder.numberOfRooms}</p>
                                                </div>
                                            )}
                                            {(selectedOrder.rooms || selectedOrder.selectedRooms) && (selectedOrder.rooms || selectedOrder.selectedRooms)!.length > 0 && (
                                                <div className="col-span-2">
                                                    <p className="text-xs text-gray-400 uppercase mb-2">Selected Rooms / Items</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {(selectedOrder.rooms || selectedOrder.selectedRooms)!.map((room, idx) => (
                                                            <Badge key={idx} variant="outline" className="bg-white text-gray-700">
                                                                {room}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Specifications */}
                                    {(selectedOrder.materialGrade || selectedOrder.finishType) && (
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 text-sm font-bold text-gray-500 uppercase tracking-wider">
                                                <Layers className="h-4 w-4" />
                                                Specifications
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-lg p-4">
                                                {selectedOrder.materialGrade && (
                                                    <div>
                                                        <p className="text-xs text-gray-400 uppercase">Material Grade</p>
                                                        <p className="font-semibold text-gray-900">{selectedOrder.materialGrade}</p>
                                                    </div>
                                                )}
                                                {selectedOrder.finishType && (
                                                    <div>
                                                        <p className="text-xs text-gray-400 uppercase">Finish Type</p>
                                                        <p className="font-semibold text-gray-900">{selectedOrder.finishType}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Estimate Summary */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 text-sm font-bold text-gray-500 uppercase tracking-wider">
                                            <IndianRupee className="h-4 w-4" />
                                            Summary
                                        </div>
                                        <div className="bg-[#0F172A] rounded-lg p-6 text-white">
                                            <div className="flex items-center justify-between mb-4">
                                                <span className="text-gray-400">Estimated Amount</span>
                                                <span className="text-3xl font-bold">{formatAmount(selectedOrder.estimatedAmount)}</span>
                                            </div>
                                            <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                                                <span className="text-gray-400">Status</span>
                                                <Badge className={cn("capitalize px-3 py-1", getStatusColor(selectedOrder.status))}>
                                                    {selectedOrder.status}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center justify-between pt-4">
                                                <span className="text-gray-400">Created</span>
                                                <span className="text-white">{formatDate(selectedOrder.createdAt)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Sticky Footer */}
                        <div className="shrink-0 flex items-center justify-between gap-3 px-6 py-4 border-t bg-gray-50">
                            <div className="flex gap-2">
                                {selectedOrder?.pdfUrl && (
                                    <Button
                                        variant="outline"
                                        onClick={() => window.open(selectedOrder.pdfUrl, '_blank')}
                                        className="gap-2"
                                    >
                                        <Download className="h-4 w-4" />
                                        Download PDF
                                    </Button>
                                )}
                            </div>
                            <div className="flex gap-2">
                                {selectedOrder?.status === "pending" && (
                                    <>
                                        <Button
                                            variant="outline"
                                            onClick={() => selectedOrder && handleReject(selectedOrder.id)}
                                            className="gap-2 border-red-200 text-red-600 hover:bg-red-50"
                                        >
                                            <XCircle className="h-4 w-4" />
                                            Reject
                                        </Button>
                                        <Button
                                            onClick={() => selectedOrder && handleApprove(selectedOrder.id)}
                                            className="gap-2 bg-green-600 hover:bg-green-700 text-white"
                                        >
                                            <CheckCircle className="h-4 w-4" />
                                            Approve
                                        </Button>
                                    </>
                                )}
                                {selectedOrder?.status !== "pending" && (
                                    <DialogClose asChild>
                                        <Button variant="outline">Close</Button>
                                    </DialogClose>
                                )}
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}
