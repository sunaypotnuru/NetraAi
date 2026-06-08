import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Search, Download, Filter, RefreshCw, User, Clock, Globe, X, Eye } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import api from '@/lib/api';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Badge } from "@/components/ui/badge";

interface AuditLog {
    id: string;
    user_id: string;
    action: string;
    resource_type: string;
    resource_id?: string;
    ip_address?: string;
    user_agent?: string;
    status: string;
    created_at: string;
    details?: Record<string, unknown>;
}

const ACTION_COLORS: Record<string, string> = {
    'GET': 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    'POST': 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    'PUT': 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    'DELETE': 'text-rose-400 bg-rose-400/10 border-rose-400/20',
    'PATCH': 'text-violet-400 bg-violet-400/10 border-violet-400/20',
};

export default function AdminAuditLogsPage() {
    const { t } = useTranslation();
    const [search, setSearch] = useState('');
    const [actionFilter, setActionFilter] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    const { data, isLoading, refetch } = useQuery({
        queryKey: ['auditLogs', actionFilter, dateFrom, dateTo],
        queryFn: async () => {
            const params = new URLSearchParams({ limit: '200' });
            if (actionFilter) params.set('action', actionFilter);
            if (dateFrom) params.set('start_date', dateFrom);
            if (dateTo) params.set('end_date', dateTo);
            const res = await api.get(`/api/v1/admin/audit/logs?${params}`);
            return res.data;
        },
        staleTime: 30 * 1000,
    });

    const logs: AuditLog[] = data?.logs || [];

    const filtered = logs.filter(log => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
            log.action?.toLowerCase().includes(q) ||
            log.user_id?.toLowerCase().includes(q) ||
            log.resource_type?.toLowerCase().includes(q) ||
            log.ip_address?.toLowerCase().includes(q)
        );
    });

    const exportCSV = () => {
        if (!filtered.length) { toast.error(t("admin.audit.no_data", "No data to export")); return; }
        const headers = ["Time", "User ID", "Action", "Resource", "IP Address", "Status"];
        const rows = filtered.map(l => [
            new Date(l.created_at).toLocaleString(),
            l.user_id || '',
            l.action || '',
            `${l.resource_type || ''} ${l.resource_id || ''}`.trim(),
            l.ip_address || '',
            l.status || ''
        ]);
        const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'audit_logs.csv'; a.click();
        toast.success("Audit logs exported to CSV");
    };

    const getMethodColor = (action: string) => {
        const method = action?.split(' ')[0] || '';
        return ACTION_COLORS[method] || 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    };

    return (
        <div className="min-h-screen pt-24 pb-12 px-6 bg-white dark:bg-[#0B0F1A]">
            <div className="max-w-7xl mx-auto space-y-8">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            <Shield className="w-8 h-8 text-[#8B5CF6]" />
                            {t("admin.audit.title", "Audit Logs")}
                        </h1>
                        <p className="text-gray-400 mt-1">Industrial Traceability • Forensic System Logs</p>
                    </div>
                    <div className="flex gap-3">
                        <Button onClick={() => refetch()} variant="outline" className="border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl h-11 px-6">
                            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} /> {t("common.refresh", "Refresh")}
                        </Button>
                        <Button onClick={exportCSV} className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white rounded-xl h-11 px-6 shadow-lg shadow-purple-500/20">
                            <Download className="w-4 h-4 mr-2" /> {t("common.export_csv", "Export CSV")}
                        </Button>
                    </div>
                </div>

                {/* Stats Matrix */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { label: "Total Logs", value: logs.length, icon: Shield, color: 'text-purple-400' },
                        { label: "Filtered", value: filtered.length, icon: Filter, color: 'text-blue-400' },
                        { label: "Unique Users", value: new Set(logs.map(l => l.user_id)).size, icon: User, color: 'text-emerald-400' },
                        { label: "Unique IPs", value: new Set(logs.map(l => l.ip_address).filter(Boolean)).size, icon: Globe, color: 'text-amber-400' },
                    ].map(({ label, value, icon: Icon, color }) => (
                        <Card key={label} className="bg-white dark:bg-[#161B2B] border-gray-200 dark:border-white/5 shadow-xl">
                            <CardContent className="p-6 flex items-center gap-4">
                                <div className={`p-3 rounded-xl bg-white/5 ${color}`}>
                                    <Icon className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">{value}</p>
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">{label}</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Filter Matrix */}
                <Card className="bg-white dark:bg-[#161B2B] border-gray-200 dark:border-white/5 shadow-xl">
                    <CardContent className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <input
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder="Filter by user, action..."
                                    className="w-full bg-gray-50 dark:bg-[#0B0F1A] border border-gray-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-[#8B5CF6] transition-all"
                                />
                            </div>
                            <div className="relative">
                                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <select
                                    value={actionFilter}
                                    onChange={e => setActionFilter(e.target.value)}
                                    className="w-full bg-gray-50 dark:bg-[#0B0F1A] border border-gray-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-[#8B5CF6] transition-all appearance-none"
                                >
                                    <option value="">All Methods</option>
                                    <option value="GET">GET</option>
                                    <option value="POST">POST</option>
                                    <option value="PUT">PUT</option>
                                    <option value="DELETE">DELETE</option>
                                </select>
                            </div>
                            <input
                                type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                                className="w-full bg-gray-50 dark:bg-[#0B0F1A] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-[#8B5CF6] transition-all"
                            />
                            <input
                                type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                                className="w-full bg-gray-50 dark:bg-[#0B0F1A] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-[#8B5CF6] transition-all"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Table Section */}
                <Card className="bg-white dark:bg-[#161B2B] border-gray-200 dark:border-white/5 shadow-xl overflow-hidden rounded-2xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 uppercase text-[10px] tracking-widest font-bold">
                                    <th className="px-6 py-4">Timestamp</th>
                                    <th className="px-6 py-4">Principal ID</th>
                                    <th className="px-6 py-4">Operation</th>
                                    <th className="px-6 py-4">Resource Cluster</th>
                                    <th className="px-6 py-4">Network IP</th>
                                    <th className="px-6 py-4">Outcome</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                <AnimatePresence mode="popLayout">
                                    {isLoading ? (
                                        Array.from({ length: 8 }).map((_, i) => (
                                            <tr key={i} className="animate-pulse bg-gray-50/50 dark:bg-white/5">
                                                {Array.from({ length: 6 }).map((_, j) => (
                                                    <td key={j} className="px-6 py-4"><div className="h-4 bg-white/5 rounded w-full" /></td>
                                                ))}
                                            </tr>
                                        ))
                                    ) : filtered.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-20 text-center text-gray-500">
                                                <Shield className="w-16 h-16 mx-auto mb-4 text-white/5" />
                                                <p className="text-lg font-bold text-gray-400 dark:text-white/40">No audit logs detected</p>
                                                <p className="text-xs mt-1">Ensure the Hugging Face audit stream is active.</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        filtered.map((log, i) => (
                                            <motion.tr
                                                key={log.id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors group"
                                            >
                                                <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        {new Date(log.created_at).toLocaleString()}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <code className="text-xs text-[#0EA5E9] bg-[#0EA5E9]/10 px-2 py-0.5 rounded">
                                                        {log.user_id ? `${log.user_id.slice(0, 12)}...` : 'ANONYMOUS'}
                                                    </code>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Badge variant="outline" className={`${getMethodColor(log.action)} font-mono text-[10px] px-2 py-0`}>
                                                        {log.action?.split(' ')[0]}
                                                    </Badge>
                                                    <span className="ml-3 text-gray-400 font-mono text-xs truncate max-w-[180px] inline-block align-middle">
                                                        {log.action?.split(' ').slice(1).join(' ')}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-gray-400">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-gray-900 dark:text-white/80">{log.resource_type}</span>
                                                        <span className="text-[10px] font-mono">{log.resource_id}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 font-mono text-xs text-gray-500">
                                                    {log.ip_address || '0.0.0.0'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-1.5 h-1.5 rounded-full ${log.status === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                                        <span className={`text-[10px] font-bold uppercase tracking-widest ${log.status === 'success' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                            {log.status || 'success'}
                                                        </span>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ))
                                    )}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </div>
    );
}
