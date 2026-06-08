import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Card } from "@/components/ui/card";
import { Search, Video, Clock, Filter, Eye, MapPin, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { adminAPI } from '@/lib/api';
import { Skeleton } from "@mui/material";
import { getWebSocketManager } from '@/app/services/websocket';

interface Appointment {
    id: string;
    consultation_type?: string;
    profiles_patient?: { full_name?: string };
    profiles_doctor?: { full_name?: string; consultation_fee?: number };
    scheduled_at?: string;
    status?: string;
}

interface AppointmentsResponse {
    appointments: Appointment[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
}

export default function AdminAppointmentsPage() {
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [page, setPage] = useState(1);
    const limit = 10;
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    useEffect(() => {
        const setupWS = async () => {
            try {
                const manager = getWebSocketManager();
                if (manager) {
                    const conn = await manager.connect('notifications');
                    conn.on('appointment_update', () => {
                        queryClient.invalidateQueries({ queryKey: ['adminAppointments'] });
                    });
                }
            } catch (err) {
                console.error("WS setup failed for admin appointments:", err);
            }
        };
        setupWS();
    }, [queryClient]);

    // Reset page on filter change
    useEffect(() => {
        setPage(1);
    }, [searchTerm, statusFilter]);

    const { data: appointmentsData, isLoading, error } = useQuery({
        queryKey: ['adminAppointments', searchTerm, statusFilter, page],
        queryFn: () => adminAPI.getAppointments({
            search: searchTerm || undefined,
            status: statusFilter !== 'All' ? statusFilter.toLowerCase() : undefined,
            page,
            limit
        }).then(res => res.data as AppointmentsResponse)
    });

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton width={300} height={40} />
                <Card className="p-8">
                    <Skeleton height={400} variant="rounded" />
                </Card>
            </div>
        );
    }

    if (error) {
        console.error("[AdminAppointmentsPage] Error loading appointments:", error);
        return (
            <div className="p-12 text-center bg-red-50 dark:bg-red-500/10 rounded-2xl border border-red-100 dark:border-red-500/20">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-red-900 dark:text-red-400">{t("admin.appointments.failed_load", "Failed to load appointments")}</h3>
                <p className="text-red-700 dark:text-red-300">{(error as any)?.response?.data?.detail || (error as Error).message}</p>
                {import.meta.env.DEV && (
                    <div className="mt-4 p-4 bg-black/5 dark:bg-white/5 rounded text-left overflow-auto max-h-40">
                        <pre className="text-xs text-red-500/80">{JSON.stringify(error, null, 2)}</pre>
                    </div>
                )}
            </div>
        );
    }

    const appointments = appointmentsData?.appointments || [];

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-foreground mb-1">{t("admin.appointments.title", "Platform Appointments")}</h1>
                <p className="text-muted-foreground">{t("admin.appointments.subtitle", "Monitor all scheduled, completed, and cancelled consultations")}</p>
            </div>

            <div className="flex flex-col lg:flex-row gap-4 justify-between">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder={t("admin.appointments.search_placeholder", "Search APT ID, Patient, or Doctor...")}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:border-[#8B5CF6] transition-colors bg-white dark:bg-black/20 text-foreground shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0">
                    <Filter className="w-5 h-5 text-gray-400 shrink-0 mr-1" />
                    {['All', 'Scheduled', 'Completed', 'Cancelled'].map(s => (
                        <button
                            key={s}
                            onClick={() => setStatusFilter(s)}
                            className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${statusFilter === s
                                ? "bg-foreground text-white dark:bg-white dark:text-black shadow-md"
                                : "bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-muted-foreground hover:bg-gray-50 dark:hover:bg-white/10"
                                }`}
                        >
                            {t(`common.filter_${s.toLowerCase()}`, s)}
                        </button>
                    ))}
                </div>
            </div>

            <Card className="border border-gray-200 dark:border-white/10 overflow-hidden bg-white dark:bg-[#1E293B] shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10 text-sm font-semibold text-gray-500 dark:text-gray-400">
                                <th className="p-4">{t("admin.appointments.col_id_type", "Appt ID & Type")}</th>
                                <th className="p-4">{t("admin.appointments.col_patient", "Patient")}</th>
                                <th className="p-4">{t("admin.appointments.col_doctor", "Doctor")}</th>
                                <th className="p-4">{t("admin.appointments.col_date_time", "Date & Time")}</th>
                                <th className="p-4">{t("admin.appointments.col_status_fee", "Status & Fee")}</th>
                                <th className="p-4 text-right">{t("admin.appointments.col_details", "Details")}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {appointments.map((apt: Appointment) => (
                                <tr key={apt.id} className="hover:bg-muted/50 transition-colors">
                                    <td className="p-4">
                                        <p className="font-bold text-foreground font-mono text-sm">{apt.id.slice(0, 8)}...</p>
                                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                            {apt.consultation_type === "video" ? <Video className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                                            {apt.consultation_type === "video" ? t("common.video_call", "Video Call") : t("common.in_person", "In-Person")}
                                        </p>
                                    </td>
                                    <td className="p-4 font-medium text-foreground text-sm">
                                        {apt.profiles_patient?.full_name || t("common.unknown_patient", "Unknown Patient")}
                                    </td>
                                    <td className="p-4 text-sm text-muted-foreground">
                                        {apt.profiles_doctor?.full_name || t("common.unknown_doctor", "Unknown Doctor")}
                                    </td>
                                    <td className="p-4">
                                        <p className="text-sm font-medium text-foreground">
                                            {apt.scheduled_at ? new Date(apt.scheduled_at).toLocaleDateString() : t("common.na", "N/A")}
                                        </p>
                                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                            <Clock className="w-3 h-3" />
                                            {apt.scheduled_at ? new Date(apt.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : t("common.na", "N/A")}
                                        </p>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-col items-start gap-1">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${apt.status === "scheduled" ? "bg-[#0EA5E9]/10 text-[#0EA5E9]" :
                                                apt.status === "completed" ? "bg-[#22C55E]/10 text-[#22C55E]" :
                                                    "bg-[#F43F5E]/10 text-[#F43F5E]"
                                                }`}>
                                                {apt.status ? String(t(`common.status_${apt.status}`, apt.status)) : t("common.unknown", "Unknown")}
                                            </span>
                                            <span className="text-xs font-semibold text-[#64748B]">
                                                {apt.profiles_doctor?.consultation_fee ? `₹${apt.profiles_doctor.consultation_fee}` : t("common.na", "N/A")}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-right">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="text-[#8B5CF6] hover:bg-[#8B5CF6]/10"
                                            onClick={() => navigate(`/admin/appointments/${apt.id}`)}
                                        >
                                            <Eye className="w-4 h-4 mr-1.5" /> {t("common.view", "View")}
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            {appointments.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-gray-500">
                                        {t("admin.appointments.no_results", "No appointments found matching filters.")}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Pagination Controls */}
            {appointmentsData && appointmentsData.total_pages > 1 && (
                <div className="flex items-center justify-between mt-6">
                    <p className="text-sm text-muted-foreground">
                        Showing {(page - 1) * limit + 1} to {Math.min(page * limit, appointmentsData.total)} of {appointmentsData.total} appointments
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                        >
                            <ChevronLeft className="w-4 h-4 mr-1" />
                            Previous
                        </Button>
                        <div className="flex items-center gap-1">
                            {Array.from({ length: Math.min(5, appointmentsData.total_pages) }, (_, i) => {
                                const pageNum = i + 1;
                                return (
                                    <Button
                                        key={pageNum}
                                        variant={page === pageNum ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setPage(pageNum)}
                                        className={page === pageNum ? "bg-[#8B5CF6] hover:bg-[#7C3AED]" : ""}
                                    >
                                        {pageNum}
                                    </Button>
                                );
                            })}
                            {appointmentsData.total_pages > 5 && <span className="px-2 text-muted-foreground">...</span>}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => Math.min(appointmentsData.total_pages, p + 1))}
                            disabled={page === appointmentsData.total_pages}
                        >
                            Next
                            <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                    </div>
                </div>
            )}
        </motion.div>
    );
}




