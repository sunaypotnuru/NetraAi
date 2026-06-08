import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Card } from "@/components/ui/card";
import { Search, Filter, Scan, Eye, MapPin, Activity, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { adminAPI } from '@/lib/api';
import { Skeleton } from "@mui/material";
import { toast } from 'sonner';

interface ScanRecord {
    id: string;
    profiles_patient?: { full_name?: string };
    created_at: string;
    prediction?: string;
    confidence?: number;
    image_url?: string;
}

interface ScansResponse {
    scans: ScanRecord[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
}

export default function AdminScansPage() {
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState('');
    const [riskFilter, setRiskFilter] = useState('All');
    const [page, setPage] = useState(1);
    const limit = 20;

    // Reset page on filter change
    useEffect(() => {
        setPage(1);
    }, [searchTerm, riskFilter]);

    const { data: scansData, isLoading, error } = useQuery({
        queryKey: ['adminScans', searchTerm, riskFilter, page],
        queryFn: () => adminAPI.getScans({
            search: searchTerm || undefined,
            risk: riskFilter !== 'All' ? riskFilter : undefined,
            page,
            limit
        }).then(res => res.data as ScansResponse)
    });

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton width={300} height={40} />
                <Card className="p-8"><Skeleton variant="rounded" height={300} /></Card>
            </div>
        );
    }

    if (error) {
        console.error("[AdminScansPage] Error loading scans:", error);
        return (
            <div className="p-12 text-center bg-red-50 dark:bg-red-500/10 rounded-2xl border border-red-100 dark:border-red-500/20">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-red-900 dark:text-red-400">{t("admin.scans.failed_load", "Failed to load scans")}</h3>
                <p className="text-red-700 dark:text-red-300">{(error as any)?.response?.data?.detail || (error as Error).message}</p>
                {import.meta.env.DEV && (
                    <div className="mt-4 p-4 bg-black/5 dark:bg-white/5 rounded text-left overflow-auto max-h-40">
                        <pre className="text-xs text-red-500/80">{JSON.stringify(error, null, 2)}</pre>
                    </div>
                )}
            </div>
        );
    }

    const scans = scansData?.scans || [];

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-foreground mb-1">{t("admin.scans.title", "Global AI Scans")}</h1>
                <p className="text-muted-foreground">{t("admin.scans.subtitle", "Platform-wide conjunctiva analysis scan history")}</p>
            </div>

            <div className="flex flex-col lg:flex-row gap-4 justify-between">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder={t("admin.scans.search_placeholder", "Search Scan ID or Patient Name...")}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:border-[#8B5CF6] transition-colors bg-white dark:bg-black/20 text-foreground shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0">
                    <Filter className="w-5 h-5 text-gray-400 shrink-0 mr-1" />
                    {['All', 'High', 'Moderate', 'Low', 'Normal'].map(f => (
                        <button
                            key={f}
                            onClick={() => setRiskFilter(f)}
                            className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${riskFilter === f
                                ? "bg-foreground text-white dark:bg-white dark:text-black shadow-md"
                                : "bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-muted-foreground hover:bg-gray-50 dark:hover:bg-white/10"
                                }`}
                        >
                            {f === 'All' ? t("admin.scans.filter_all", "All Results") : t(`common.risk_${f.toLowerCase()}`, f)}
                        </button>
                    ))}
                </div>
            </div>

            <Card className="border border-gray-200 dark:border-white/10 overflow-hidden bg-white dark:bg-[#1E293B] shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10 text-sm font-semibold text-gray-500 dark:text-gray-400">
                                <th className="p-4">{t("admin.scans.col_id", "Scan ID")}</th>
                                <th className="p-4">{t("admin.scans.col_patient", "Patient")}</th>
                                <th className="p-4">{t("admin.scans.col_date", "Scan Date")}</th>
                                <th className="p-4">{t("admin.scans.col_prediction", "AI Prediction")}</th>
                                <th className="p-4 text-right">{t("admin.scans.col_raw", "Raw Data")}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                            {scans.map((scan: ScanRecord) => (
                                <tr key={scan.id} className="hover:bg-muted/50 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                                <Scan className="w-5 h-5 text-primary" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-foreground font-mono text-sm">{scan.id.slice(0, 8)}...</p>
                                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><Activity className="w-3 h-3" /> {t("admin.scans.ai_version", "Netra AI V2")}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <p className="font-medium text-foreground text-sm">{scan.profiles_patient?.full_name || t("common.anonymous", "Anonymous")}</p>
                                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" /> {t("common.india", "India")}</p>
                                    </td>
                                    <td className="p-4 text-sm font-medium text-foreground">
                                        {new Date(scan.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-col items-start gap-1">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
                                                (scan.prediction || '').toLowerCase().includes('high') ? "bg-red-500/10 text-red-500" :
                                                (scan.prediction || '').toLowerCase().includes('moderate') ? "bg-orange-500/10 text-orange-500" :
                                                (scan.prediction || '').toLowerCase().includes('low') ? "bg-yellow-500/10 text-yellow-500" :
                                                "bg-green-500/10 text-green-500"
                                            }`}>
                                                {scan.prediction ? String(t(`common.risk_${scan.prediction.replace(/ /g, '_').toLowerCase()}`, scan.prediction)) : t("common.unknown", "Unknown")}
                                            </span>
                                            <span className="text-xs font-semibold text-[#64748B]">{t("common.confidence", "Confidence")}: {Math.round((scan.confidence || 0) * 100)}%</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-right">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="text-[#8B5CF6] hover:bg-[#8B5CF6]/10"
                                            onClick={(e) => {
                                                if (!scan.image_url) {
                                                    e.preventDefault();
                                                    toast.error(t("admin.scans.no_image", "No image available for this scan"));
                                                } else {
                                                    toast.info(t("admin.scans.opening_image", "Opening raw scan image in new tab"));
                                                    window.open(scan.image_url, '_blank', 'noopener,noreferrer');
                                                }
                                            }}
                                        >
                                            <Eye className="w-4 h-4 mr-1.5" /> {t("admin.scans.view_image", "View Image")}
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            {scans.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-gray-500">
                                        {t("admin.scans.no_results", "No scans found matching filters.")}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Pagination Controls */}
            {scansData && scansData.total_pages > 1 && (
                <div className="flex items-center justify-between mt-6">
                    <p className="text-sm text-muted-foreground">
                        Showing {(page - 1) * limit + 1} to {Math.min(page * limit, scansData.total)} of {scansData.total} scans
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
                            {Array.from({ length: Math.min(5, scansData.total_pages) }, (_, i) => {
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
                            {scansData.total_pages > 5 && <span className="px-2 text-muted-foreground">...</span>}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => Math.min(scansData.total_pages, p + 1))}
                            disabled={page === scansData.total_pages}
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


