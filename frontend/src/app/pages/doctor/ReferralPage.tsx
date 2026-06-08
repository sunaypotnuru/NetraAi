import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    FileText, Share2,
    X, AlertCircle, UserPlus, FileSearch
} from "lucide-react";
import { doctorAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "@/lib/i18n";

interface ReferralRecord {
    id: string;
    status: 'pending' | 'accepted' | 'declined';
    patient?: { full_name?: string; age?: number; gender?: string };
    referrer?: { full_name?: string; specialty?: string };
    target?: { full_name?: string; specialty?: string };
    notes?: string;
    expires_at: string;
    created_at: string;
}

interface PatientRecord {
    id: string;
    profiles_patient?: { full_name?: string };
    notes?: string;
}

export default function ReferralPage() {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const [referralNotes, setReferralNotes] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [targetDoctorId, setTargetDoctorId] = useState("");
    const [selectedPatientId, setSelectedPatientId] = useState("");

    const { data: sentReferrals, isLoading: isLoadingSent } = useQuery({
        queryKey: ['referrals-sent'],
        queryFn: () => doctorAPI.getReferralsSent().then(res => res.data)
    });

    const { data: receivedReferrals, isLoading: isLoadingReceived } = useQuery({
        queryKey: ['referrals-received'],
        queryFn: () => doctorAPI.getReferralsReceived().then(res => res.data)
    });

    const { data: patientsList } = useQuery({
        queryKey: ['patients-list'],
        queryFn: () => doctorAPI.getPatients().then(res => res.data)
    });

    const createReferral = useMutation({
        mutationFn: (data: { target_doctor_id: string; patient_id: string; notes: string }) => doctorAPI.createReferral(data),
        onSuccess: () => {
            toast.success(t("doctor.referral.create_success", "Referral sent successfully!"));
            queryClient.invalidateQueries({ queryKey: ['referrals-sent'] });
            setIsCreateModalOpen(false);
            setTargetDoctorId("");
            setSelectedPatientId("");
            setReferralNotes("");
        },
        onError: (err) => {
            const detail = err instanceof Error && 'response' in err && err.response && typeof err.response === 'object' && 'data' in err.response && err.response.data && typeof err.response.data === 'object' && 'detail' in err.response.data ? String(err.response.data.detail) : '';
            toast.error(detail || t("doctor.referral.create_error", "Failed to create referral"));
        }
    });

    const respondReferral = useMutation({
        mutationFn: ({ id, data }: { id: string, data: { status: string; notes?: string } }) => doctorAPI.respondReferral(id, data),
        onSuccess: () => {
            toast.success(t("doctor.referral.update_success", "Referral status updated"));
            queryClient.invalidateQueries({ queryKey: ['referrals-received'] });
        },
        onError: () => toast.error(t("doctor.referral.update_error", "Failed to update status"))
    });

    const handleCreateReferral = (e: React.FormEvent) => {
        e.preventDefault();
        if (!targetDoctorId || !selectedPatientId) {
            toast.error(t("doctor.referral.validation_error", "Please select both a doctor and a patient"));
            return;
        }
        createReferral.mutate({
            target_doctor_id: targetDoctorId,
            patient_id: selectedPatientId,
            notes: referralNotes
        });
    };

    return (
        <div className="min-h-screen pt-24 pb-12 px-6 bg-transparent">
            <div className="max-w-6xl mx-auto space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/70 dark:bg-slate-900/50 backdrop-blur-md p-6 rounded-3xl shadow-xl border border-gray-200/50 dark:border-white/10">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center">
                            <Share2 className="w-7 h-7" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-200">{t("doctor.referral.title", "Referrals & Second Opinions")}</h1>
                            <p className="text-slate-500 dark:text-slate-400 font-medium tracking-wide text-sm">{t("doctor.referral.subtitle", "Collaborate securely with cross-specialty experts.")}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto relative">
                        <div className="relative flex-1 md:w-64">
                            <FileSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 w-4 h-4" />
                            <input
                                type="text"
                                placeholder={t("common.search", "Search...")}
                                className="w-full pl-9 pr-4 py-2 border border-gray-200/50 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all bg-white/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 text-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-11 shadow-lg shadow-indigo-600/20 whitespace-nowrap"
                        >
                            <UserPlus className="w-4 h-4 mr-2" /> {t("doctor.referral.btn_request_opinion", "Request Second Opinion")}
                        </Button>
                    </div>
                </div>

                <div className="bg-white/75 dark:bg-slate-900/40 backdrop-blur-md rounded-3xl overflow-hidden shadow-xl border border-gray-200/50 dark:border-white/10">
                    <div className="flex border-b border-gray-200/50 dark:border-white/10 p-2 gap-2 bg-slate-50/30 dark:bg-slate-950/20">
                        <button
                            onClick={() => setActiveTab('received')}
                            className={`flex-1 py-3 px-6 rounded-xl font-bold text-sm transition-all flex justify-center items-center gap-2 ${activeTab === 'received' ? 'bg-white/80 dark:bg-slate-900/80 text-indigo-600 dark:text-indigo-450 shadow-sm border border-gray-200/50 dark:border-white/10' : 'text-slate-500 hover:bg-slate-100/50 dark:hover:bg-slate-800/50'
                                }`}
                        >
                            <FileSearch className="w-4 h-4" /> {t("doctor.referral.tab_received", "Received Referrals")}
                            {receivedReferrals?.filter((r: ReferralRecord) => r.status === 'pending').length > 0 && (
                                <span className="bg-rose-500 text-white text-xs px-2 py-0.5 rounded-full ml-1">
                                    {receivedReferrals?.filter((r: ReferralRecord) => r.status === 'pending').length}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('sent')}
                            className={`flex-1 py-3 px-6 rounded-xl font-bold text-sm transition-all flex justify-center items-center gap-2 ${activeTab === 'sent' ? 'bg-white/80 dark:bg-slate-900/80 text-indigo-600 dark:text-indigo-450 shadow-sm border border-gray-200/50 dark:border-white/10' : 'text-slate-500 hover:bg-slate-100/50 dark:hover:bg-slate-800/50'
                                }`}
                        >
                            <Share2 className="w-4 h-4" /> {t("doctor.referral.tab_sent", "Sent Requests")}
                        </button>
                    </div>

                    <div className="p-6">
                        {activeTab === 'received' && (
                            <div className="space-y-4">
                                {isLoadingReceived ? (
                                    <Skeleton className="rounded-xl w-full h-[100px]" />
                                ) : receivedReferrals?.filter((ref: ReferralRecord) =>
                                    (ref.patient?.full_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    (ref.referrer?.full_name || "").toLowerCase().includes(searchTerm.toLowerCase())
                                  ).length === 0 ? (
                                    <div className="py-12 text-center">
                                        <FileText className="w-12 h-12 text-gray-300 dark:text-slate-700 mx-auto mb-3" />
                                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">{t("doctor.referral.no_received", "No Received Referrals")}</h3>
                                        <p className="text-slate-500 dark:text-slate-400">{t("doctor.referral.no_received_desc", "You have no pending second opinion requests.")}</p>
                                    </div>
                                ) : (
                                    receivedReferrals?.filter((ref: ReferralRecord) =>
                                        (ref.patient?.full_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                                        (ref.referrer?.full_name || "").toLowerCase().includes(searchTerm.toLowerCase())
                                    ).map((ref: ReferralRecord) => (
                                        <div key={ref.id} className="p-5 border border-gray-200/50 dark:border-white/10 rounded-2xl bg-white/70 dark:bg-slate-900/50 shadow-md hover:shadow-xl transition-all">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex gap-4">
                                                    <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-550 dark:text-slate-400 font-bold shrink-0">
                                                        {ref.patient?.full_name?.charAt(0) || "P"}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                                            {t("common.patient", "Patient")}: {ref.patient?.full_name}
                                                            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded uppercase font-bold">
                                                                {ref.patient?.age}{t("common.age_years", "y")} • {ref.patient?.gender}
                                                            </span>
                                                        </h4>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                                            {t("doctor.referral.referred_by", "Referred by")} <span className="font-semibold text-slate-700 dark:text-slate-350">{t("common.dr_prefix", "Dr.")} {ref.referrer?.full_name}</span> ({ref.referrer?.specialty})
                                                        </p>
                                                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-1">
                                                            {t("doctor.referral.expires", "Expires:")} {format(new Date(ref.expires_at), 'MMM dd, yyyy')}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div>
                                                    <span className={`px-3 py-1 text-xs font-bold rounded-full uppercase tracking-widest ${ref.status === 'pending' ? 'bg-amber-100/80 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400' :
                                                        ref.status === 'accepted' ? 'bg-emerald-100/80 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400' :
                                                            'bg-rose-100/80 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400'
                                                        }`}>
                                                        {ref.status}
                                                    </span>
                                                </div>
                                            </div>

                                            {ref.notes && (
                                                <div className="bg-indigo-50/50 dark:bg-indigo-950/20 p-4 rounded-xl border border-indigo-100/50 dark:border-indigo-900/20 mb-4">
                                                    <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-400 mb-1">{t("doctor.referral.doctor_notes", "Doctor's Notes")}</p>
                                                    <p className="text-sm text-indigo-800/80 dark:text-indigo-300/80">{ref.notes}</p>
                                                </div>
                                            )}

                                            {ref.status === 'pending' && (
                                                <div className="flex gap-3 justify-end border-t border-gray-150/50 dark:border-white/5 pt-4 mt-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => respondReferral.mutate({ id: ref.id, data: { status: 'declined', notes: t("doctor.referral.decline_notes", "Unavailable to take this case.") } })}
                                                        className="text-slate-600 dark:text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 font-bold px-6 bg-transparent border-gray-200/50 dark:border-white/10"
                                                    >
                                                        {t("common.decline", "Decline")}
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        onClick={() => respondReferral.mutate({ id: ref.id, data: { status: 'accepted' } })}
                                                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-600/20 px-6"
                                                    >
                                                        {t("doctor.referral.accept_review", "Accept & Review Record")}
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {activeTab === 'sent' && (
                            <div className="space-y-4">
                                {isLoadingSent ? (
                                    <Skeleton className="rounded-xl w-full h-[100px]" />
                                ) : sentReferrals?.filter((ref: ReferralRecord) =>
                                    (ref.patient?.full_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    (ref.target?.full_name || "").toLowerCase().includes(searchTerm.toLowerCase())
                                  ).length === 0 ? (
                                    <div className="py-12 text-center">
                                        <Share2 className="w-12 h-12 text-gray-300 dark:text-slate-700 mx-auto mb-3" />
                                        <h3 className="text-lg font-bold text-slate-805 dark:text-white">{t("doctor.referral.no_sent", "No Sent Referrals")}</h3>
                                        <p className="text-slate-500 dark:text-slate-400">{t("doctor.referral.no_sent_desc", "You haven't requested any second opinions yet.")}</p>
                                    </div>
                                ) : (
                                    sentReferrals?.filter((ref: ReferralRecord) =>
                                        (ref.patient?.full_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                                        (ref.target?.full_name || "").toLowerCase().includes(searchTerm.toLowerCase())
                                    ).map((ref: ReferralRecord) => (
                                        <div key={ref.id} className="p-5 border border-gray-200/50 dark:border-white/10 rounded-2xl bg-white/70 dark:bg-slate-900/50 shadow-md hover:shadow-xl transition-all">
                                            <div className="flex justify-between items-start">
                                                <div className="flex gap-4">
                                                    <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 font-bold shrink-0">
                                                        {ref.patient?.full_name?.charAt(0) || "P"}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-slate-900 dark:text-white">{t("common.patient", "Patient")}: {ref.patient?.full_name}</h4>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                                            {t("doctor.referral.sent_to", "Sent to")} <span className="font-semibold text-slate-700 dark:text-slate-350">{t("common.dr_prefix", "Dr.")} {ref.target?.full_name}</span> ({ref.target?.specialty})
                                                        </p>
                                                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                                                            {t("doctor.referral.requested_on", "Requested on")} {format(new Date(ref.created_at), 'MMM dd, yyyy')}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div>
                                                    <span className={`px-3 py-1 text-xs font-bold rounded-full uppercase tracking-widest ${ref.status === 'pending' ? 'bg-amber-100/80 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400' :
                                                        ref.status === 'accepted' ? 'bg-emerald-100/80 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400' :
                                                            'bg-rose-100/80 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400'
                                                        }`}>
                                                        {ref.status}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Create Referral Modal */}
            <AnimatePresence>
                {isCreateModalOpen && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-gray-200/50 dark:border-white/10"
                        >
                            <div className="p-6 border-b border-gray-200/50 dark:border-white/10 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/20">
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t("doctor.referral.modal_title", "Request Second Opinion")}</h2>
                                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={handleCreateReferral} className="p-6 space-y-5">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-350 mb-2">{t("doctor.referral.target_uuid", "Select Target Doctor's UUID")}</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder={t("doctor.referral.target_placeholder", "e.g. 550e8400-e29b-41d4-a716-446655440000")}
                                        value={targetDoctorId}
                                        onChange={(e) => setTargetDoctorId(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white/50 dark:bg-slate-800/50 text-slate-900 dark:text-white font-mono text-sm"
                                    />
                                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3 text-indigo-500" /> {t("doctor.referral.uuid_hint", "Get this UUID from your colleague's profile")}
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-350 mb-2">{t("doctor.referral.select_patient", "Select Patient File")}</label>
                                    <select
                                        required
                                        value={selectedPatientId}
                                        onChange={(e) => setSelectedPatientId(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white/50 dark:bg-slate-800/50 text-slate-900 dark:text-white"
                                    >
                                        <option value="" className="dark:bg-slate-900">{t("doctor.referral.choose_patient", "Select a patient")}</option>
                                        {patientsList?.map((p: PatientRecord) => (
                                            <option key={p.id} value={p.id} className="dark:bg-slate-900">
                                                {p.profiles_patient?.full_name} ({p.notes || t("doctor.referral.recent_consult", "Recent consult")})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-350 mb-2">{t("doctor.referral.notes_label", "Clinical Question / Notes")}</label>
                                    <textarea
                                        rows={3}
                                        placeholder={t("doctor.referral.notes_placeholder", "Specific reason for referral or question for the specialist...")}
                                        value={referralNotes}
                                        onChange={(e) => setReferralNotes(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white/50 dark:bg-slate-800/50 text-slate-900 dark:text-white resize-none"
                                    />
                                </div>

                                <div className="bg-amber-50/50 dark:bg-amber-950/20 rounded-xl p-4 flex gap-3 border border-amber-100/50 dark:border-amber-900/20">
                                    <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                                    <p className="text-xs text-amber-800 dark:text-amber-300">
                                        {t("doctor.referral.security_notice", "This generates a secure Temporary Access Token valid for 7 days. The target doctor will have read-only access to this patient's history.")}
                                    </p>
                                </div>

                                <div className="pt-4 flex gap-3">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsCreateModalOpen(false)}
                                        className="flex-1 py-6 rounded-xl font-bold bg-transparent border-gray-200/50 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                    >
                                        {t("common.cancel", "Cancel")}
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={createReferral.isPending}
                                        className="flex-1 py-6 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/30 animate-pulse"
                                    >
                                        {createReferral.isPending ? t("doctor.referral.sending", "Sending...") : t("doctor.referral.send", "Send Referral")}
                                    </Button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
