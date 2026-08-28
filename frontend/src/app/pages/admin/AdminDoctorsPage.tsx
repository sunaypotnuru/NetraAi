import React from 'react';

import { motion } from 'motion/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from "@/lib/i18n";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, Shield, ShieldAlert, Check, X, Mail, Phone, AlertCircle } from 'lucide-react';
import { adminAPI } from '@/lib/api';
import { Skeleton } from "@mui/material";
import { toast } from 'sonner';

interface Doctor {
    id: string;
    full_name?: string;
    name?: string;
    email: string;
    phone?: string;
    specialty?: string;
    experience_years?: number;
    is_verified: boolean;
    verification_status?: 'pending' | 'approved' | 'rejected';
}

export default function AdminDoctorsPage() {
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = React.useState('');
    const [filter, setFilter] = React.useState<'all' | 'approved' | 'pending' | 'rejected'>('all');
    const queryClient = useQueryClient();

    const { data: doctors, isLoading, error } = useQuery({
        queryKey: ['adminDoctors'],
        queryFn: () => adminAPI.getDoctors().then(res => res.data)
    });

    const verifyMutation = useMutation({
    mutationFn: ({ id, verify }: { id: string, verify: boolean }) => adminAPI.verifyDoctor(id, verify),
        onMutate: async ({ id, verify }) => {
            // Cancel any outgoing refetches so they don't overwrite our optimistic update
            await queryClient.cancelQueries({ queryKey: ['adminDoctors'] });

            // Snapshot the previous value for rollback on error
            const previousDoctors = queryClient.getQueryData(['adminDoctors']);

            // Optimistically update the cache
            queryClient.setQueryData(['adminDoctors'], (old: any) => {
                if (!old?.doctors) return old;
                return {
                    ...old,
                    doctors: old.doctors.map((d: any) =>
                        d.id === id ? { ...d, is_verified: verify, verification_status: verify ? 'approved' : 'rejected' } : d
                    ),
                };
            });

            return { previousDoctors };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminDoctors'] });
            toast.success(t("admin.doctors.status_updated", "Doctor status updated"));
        },
        onError: (err, _vars, context) => {
            // Roll back to the snapshot if the mutation fails
            if (context?.previousDoctors) {
                queryClient.setQueryData(['adminDoctors'], context.previousDoctors);
            }
            toast.error(`${t("common.error", "Error")}: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    });

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div>
                    <Skeleton width={300} height={40} />
                    <Skeleton width={400} height={24} />
                </div>
                <Card className="p-0 border border-gray-200">
                    <div className="p-8 space-y-4">
                        {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} height={60} variant="rounded" />)}
                    </div>
                </Card>
            </div>
        );
    }

    if (error) {
        console.error("[AdminDoctorsPage] Error loading doctors:", error);
        return (
            <div className="p-12 text-center bg-red-50 dark:bg-red-500/10 rounded-2xl border border-red-100 dark:border-red-500/20">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-red-900 dark:text-red-400">{t("admin.doctors.failed_load", "Failed to load doctors")}</h3>
                <p className="text-red-700 dark:text-red-300">{(error as any)?.response?.data?.detail || (error as Error).message}</p>
                {import.meta.env.DEV && (
                    <div className="mt-4 p-4 bg-black/5 rounded text-left overflow-auto max-h-40">
                        <pre className="text-xs">{JSON.stringify(error, null, 2)}</pre>
                    </div>
                )}
            </div>
        );
    }

    const doctorList: Doctor[] = doctors?.doctors || [];

    const filteredDoctors = doctorList
        .filter((d: Doctor) => {
            const matchesSearch = (d.full_name || d.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (d.email || '').toLowerCase().includes(searchTerm.toLowerCase());
            const status = d.verification_status || (d.is_verified ? 'approved' : 'pending');
            const matchesFilter = filter === 'all' ? true : filter === status;
            return matchesSearch && matchesFilter;
        });

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground mb-1">{t("admin.doctors.title", "Doctor Management")}</h1>
                    <p className="text-muted-foreground">{t("admin.doctors.subtitle", "Approve credentials and manage doctor accounts")}</p>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder={t("admin.doctors.search_placeholder", "Search by name or email...")}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:border-[#8B5CF6] transition-colors bg-white dark:bg-black/20 text-foreground shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    {['all', 'approved', 'pending', 'rejected'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f as 'all' | 'approved' | 'pending' | 'rejected')}
                            className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-all ${filter === f
                                ? "bg-foreground text-white dark:bg-white dark:text-black shadow-md shadow-gray-200 dark:shadow-none"
                                : "bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-muted-foreground hover:border-gray-300 dark:hover:border-white/20"
                                }`}
                        >
                            {t(`common.filter_${f}`, f)}
                        </button>
                    ))}
                </div>
            </div>

            <Card className="border border-gray-200 dark:border-white/10 overflow-hidden bg-white dark:bg-[#1E293B] shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10 text-sm font-semibold text-gray-500 dark:text-gray-400">
                                <th className="p-4">{t("admin.doctors.col_details", "Doctor Details")}</th>
                                <th className="p-4">{t("admin.doctors.col_specialty", "Specialty & Exp.")}</th>
                                <th className="p-4">{t("admin.doctors.col_verification", "Verification")}</th>
                                <th className="p-4 text-right">{t("admin.doctors.col_actions", "Actions")}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                            {filteredDoctors.map((doctor: Doctor) => (
                                <tr key={doctor.id} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-[#0EA5E9]/10 flex items-center justify-center font-bold text-[#0EA5E9]">
                                                {(doctor.full_name || doctor.name || 'D').charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-foreground">{doctor.full_name || doctor.name || t("common.anonymous_doctor", "Anonymous Doctor")}</p>
                                                <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                                                    <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {doctor.email}</span>
                                                    <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {doctor.phone || t("common.no_phone", "No phone")}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <p className="font-medium text-foreground text-sm capitalize">{doctor.specialty || t("common.general", "General")}</p>
                                        <p className="text-xs text-gray-500">{doctor.experience_years ? `${doctor.experience_years} ${t("admin.doctors.years_exp_suffix", "years exp.")}` : t("admin.doctors.exp_not_specified", "Exp not specified")}</p>
                                    </td>
                                    <td className="p-4">
                                        {doctor.verification_status === 'approved' || (doctor.verification_status === undefined && doctor.is_verified) ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#22C55E]/10 text-[#22C55E]">
                                                <Shield className="w-3 h-3" /> {t("common.approved", "Approved")}
                                            </span>
                                        ) : doctor.verification_status === 'rejected' ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#F43F5E]/10 text-[#F43F5E]">
                                                <ShieldAlert className="w-3 h-3" /> {t("common.rejected", "Rejected")}
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#F59E0B]/10 text-[#F59E0B]">
                                                <ShieldAlert className="w-3 h-3" /> {t("common.pending_review", "Pending Review")}
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {doctor.verification_status === 'pending' || (doctor.verification_status === undefined && !doctor.is_verified) ? (
                                                <>
                                                    <Button
                                                        size="sm"
                                                        className="bg-[#22C55E] hover:bg-[#16A34A] text-white"
                                                        onClick={() => verifyMutation.mutate({ id: doctor.id, verify: true })}
                                                        disabled={verifyMutation.isPending}
                                                    >
                                                        <Check className="w-4 h-4 mr-1" /> {t("common.approve", "Approve")}
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="text-[#F43F5E] hover:bg-[#F43F5E]/5 border-[#F43F5E]/20"
                                                        onClick={() => verifyMutation.mutate({ id: doctor.id, verify: false })}
                                                        disabled={verifyMutation.isPending}
                                                    >
                                                        <X className="w-4 h-4 mr-1" /> {t("common.reject", "Reject")}
                                                    </Button>
                                                </>
                                            ) : doctor.verification_status === 'rejected' ? (
                                                <Button
                                                    size="sm"
                                                    className="bg-[#22C55E] hover:bg-[#16A34A] text-white"
                                                    onClick={() => verifyMutation.mutate({ id: doctor.id, verify: true })}
                                                    disabled={verifyMutation.isPending}
                                                >
                                                    <Check className="w-4 h-4 mr-1" /> {t("common.approve", "Approve")}
                                                </Button>
                                            ) : (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="text-muted-foreground hover:bg-gray-100 border-gray-200"
                                                    onClick={() => verifyMutation.mutate({ id: doctor.id, verify: false })}
                                                    disabled={verifyMutation.isPending}
                                                >
                                                    <ShieldAlert className="w-4 h-4 mr-1" /> {t("common.revoke", "Revoke")}
                                                </Button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredDoctors.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-gray-500">
                                        {t("admin.doctors.no_results", "No doctors found matching your filters.")}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </motion.div>
    );
}


