import React from 'react';

import { motion } from "motion/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, Mail, Loader2, Activity, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { doctorAPI } from "@/lib/api";
import { useTranslation } from "@/lib/i18n";

interface FollowUpTemplate {
    id: string;
    name: string;
    trigger_event: string;
    subject: string;
    body: string;
    delay_minutes: number;
    is_active: boolean;
}

interface TemplateFormState {
    name: string;
    trigger_event: string;
    subject: string;
    body: string;
    delay_minutes: number;
    is_active: boolean;
}

export default function DoctorFollowUpTemplates() {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const [isEditing, setIsEditing] = React.useState<string | null>(null);
    const [isDialogOpen, setIsDialogOpen] = React.useState(false);

    const [formState, setFormState] = React.useState<TemplateFormState>({
        name: "",
        trigger_event: "upcoming_appointment",
        subject: "",
        body: "",
        delay_minutes: 1440,
        is_active: true
    });

    const { data: templates = [], isLoading } = useQuery<FollowUpTemplate[]>({
        queryKey: ["followUpTemplates"],
        queryFn: () => doctorAPI.getFollowUpTemplates().then(res => res.data)
    });

    const createMutation = useMutation({
        mutationFn: (data: TemplateFormState) => doctorAPI.createFollowUpTemplate(data as unknown as Record<string, unknown>),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["followUpTemplates"] });
            toast.success(t("doctor.templates.create_success", "Template created"));
            handleClose();
        },
        onError: () => toast.error(t("doctor.templates.create_error", "Failed to create template"))
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string, data: TemplateFormState }) => doctorAPI.updateFollowUpTemplate(id, data as unknown as Record<string, unknown>),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["followUpTemplates"] });
            toast.success(t("doctor.templates.update_success", "Template updated"));
            handleClose();
        },
        onError: () => toast.error(t("doctor.templates.update_error", "Failed to update template"))
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => doctorAPI.deleteFollowUpTemplate(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["followUpTemplates"] });
            toast.success(t("doctor.templates.delete_success", "Template deleted"));
        },
        onError: () => toast.error(t("doctor.templates.delete_error", "Failed to delete template"))
    });

    const handleOpenEdit = (template: FollowUpTemplate) => {
        setIsEditing(template.id);
        setFormState({
            name: template.name,
            trigger_event: template.trigger_event,
            subject: template.subject || "",
            body: template.body,
            delay_minutes: template.delay_minutes,
            is_active: template.is_active
        });
        setIsDialogOpen(true);
    };

    const handleClose = () => {
        setIsEditing(null);
        setFormState({
            name: "",
            trigger_event: "upcoming_appointment",
            subject: "",
            body: "",
            delay_minutes: 1440,
            is_active: true
        });
        setIsDialogOpen(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isEditing) updateMutation.mutate({ id: isEditing, data: formState });
        else createMutation.mutate(formState);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen pt-3 pb-12 px-6 bg-transparent flex flex-col justify-center items-center">
                <Loader2 className="w-12 h-12 animate-spin text-sky-500 mb-4" />
                <p className="text-slate-650 dark:text-slate-400 font-medium">Loading templates...</p>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="min-h-screen pt-3 pb-12 px-6 bg-transparent max-w-6xl mx-auto space-y-8"
        >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 border border-gray-200/50 dark:border-white/10 bg-white/70 dark:bg-slate-900/50 backdrop-blur-md shadow-xl rounded-3xl gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{t("doctor.templates.title", "Automated Follow-ups")}</h1>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mt-1">{t("doctor.templates.subtitle", "Design smart reminders and post-consultation messages.")}</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) handleClose(); else setIsDialogOpen(open); }}>
                    <DialogTrigger asChild>
                        <Button onClick={() => handleClose()} className="bg-[#0EA5E9] hover:bg-[#0284C7] dark:bg-sky-600 dark:hover:bg-sky-700 text-white font-bold h-11 px-5 rounded-2xl shadow-lg shadow-sky-500/10 hover:scale-[1.02] active:scale-[0.98] transition-all gap-2">
                            <Plus className="w-4 h-4" /> {t("doctor.templates.new_template", "New Template")}
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px] bg-white/95 dark:bg-slate-900/95 border border-gray-200/50 dark:border-white/10 backdrop-blur-xl rounded-3xl p-6 shadow-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-black text-slate-900 dark:text-white">{isEditing ? t("doctor.templates.edit_template", "Edit Template") : t("doctor.templates.create_template", "Create Auto-Responder Template")}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-slate-700 dark:text-slate-300 font-bold text-sm">{t("doctor.templates.field_name", "Template Name")}</Label>
                                    <Input value={formState.name} onChange={e => setFormState({ ...formState, name: e.target.value })} className="w-full px-4 py-3 border border-gray-200/50 dark:border-white/10 rounded-2xl bg-white/50 dark:bg-slate-950/50 text-slate-800 dark:text-slate-100 outline-none transition-all shadow-sm" required />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-slate-700 dark:text-slate-300 font-bold text-sm">{t("doctor.templates.field_trigger", "Trigger Event")}</Label>
                                    <select
                                        className="w-full flex h-11 rounded-2xl border border-gray-200/50 dark:border-white/10 bg-white/50 dark:bg-slate-950/50 text-slate-800 dark:text-slate-100 px-4 py-2 text-sm outline-none transition-all shadow-sm"
                                        value={formState.trigger_event}
                                        onChange={e => setFormState({ ...formState, trigger_event: e.target.value })}
                                    >
                                        <option value="upcoming_appointment" className="dark:bg-slate-900">{t("doctor.templates.trigger_upcoming", "Upcoming Appointment")}</option>
                                        <option value="appointment_completed" className="dark:bg-slate-900">{t("doctor.templates.trigger_completed", "Appointment Completed")}</option>
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-700 dark:text-slate-300 font-bold text-sm">{t("doctor.templates.field_delay", "Delay Setting")}</Label>
                                <select
                                    className="w-full flex h-11 rounded-2xl border border-gray-200/50 dark:border-white/10 bg-white/50 dark:bg-slate-950/50 text-slate-800 dark:text-slate-100 px-4 py-2 text-sm outline-none transition-all shadow-sm"
                                    value={formState.delay_minutes}
                                    onChange={e => setFormState({ ...formState, delay_minutes: parseInt(e.target.value) })}
                                >
                                    <optgroup label={t("doctor.templates.trigger_upcoming", "Upcoming Appointment")} className="dark:bg-slate-900">
                                        <option value={1440} className="dark:bg-slate-900">{t("doctor.templates.delay_24h_before", "24 Hours Before")}</option>
                                        <option value={60} className="dark:bg-slate-900">{t("doctor.templates.delay_1h_before", "1 Hour Before")}</option>
                                    </optgroup>
                                    <optgroup label={t("doctor.templates.trigger_completed", "Completed Appointment")} className="dark:bg-slate-900">
                                        <option value={60} className="dark:bg-slate-900">{t("doctor.templates.delay_1h_after", "1 Hour After")}</option>
                                        <option value={1440} className="dark:bg-slate-900">{t("doctor.templates.delay_1d_after", "1 Day After")}</option>
                                        <option value={10080} className="dark:bg-slate-900">{t("doctor.templates.delay_1w_after", "1 Week After")}</option>
                                    </optgroup>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-700 dark:text-slate-300 font-bold text-sm">{t("doctor.templates.field_subject", "Notification Subject")}</Label>
                                <Input value={formState.subject} onChange={e => setFormState({ ...formState, subject: e.target.value })} className="w-full px-4 py-3 border border-gray-200/50 dark:border-white/10 rounded-2xl bg-white/50 dark:bg-slate-950/50 text-slate-800 dark:text-slate-100 outline-none transition-all shadow-sm" placeholder={t("doctor.templates.subject_placeholder", "E.g., Reminder: Dr. {{doctor_name}} Appointment")} required />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-700 dark:text-slate-300 font-bold text-sm">{t("doctor.templates.field_body", "Message Body")}</Label>
                                <Textarea
                                    rows={5}
                                    value={formState.body}
                                    onChange={e => setFormState({ ...formState, body: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200/50 dark:border-white/10 rounded-2xl bg-white/50 dark:bg-slate-950/50 text-slate-800 dark:text-slate-100 outline-none transition-all shadow-sm"
                                    placeholder={t("doctor.templates.body_placeholder", "Available placeholders: {{patient_name}}, {{doctor_name}}")}
                                    required
                                />
                                <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold">{t("doctor.templates.hint", "Hint: Use {{patient_name}} and {{doctor_name}} for personalization.")}</p>
                            </div>
                            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-white/5 mt-4">
                                <Button type="button" variant="outline" onClick={handleClose} className="bg-white/70 dark:bg-slate-900/50 border-gray-200/50 dark:border-white/10 text-slate-700 dark:text-slate-300 font-bold rounded-2xl h-11 px-5">{t("common.cancel", "Cancel")}</Button>
                                <Button type="submit" className="bg-[#0EA5E9] text-white hover:bg-[#0284C7] dark:bg-sky-600 dark:hover:bg-sky-700 font-bold h-11 px-6 rounded-2xl shadow-lg shadow-sky-500/10 transition-all">{t("doctor.templates.save_btn", "Save Template")}</Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates.map((tpl) => (
                    <Card key={tpl.id} className="p-6 border border-gray-200/50 dark:border-white/10 bg-white/70 dark:bg-slate-900/50 backdrop-blur-md shadow-xl hover:shadow-2xl transition-all rounded-3xl flex flex-col justify-between relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-[#0EA5E9]/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                        <div>
                            <div className="flex justify-between items-start mb-4 relative z-10">
                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border border-slate-100 dark:border-white/5 ${tpl.trigger_event === 'upcoming_appointment' ? 'bg-amber-100 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400' : 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400'}`}>
                                    {tpl.trigger_event === 'upcoming_appointment' ? <Activity className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(tpl)} className="h-8 w-8 text-slate-500 dark:text-slate-400 hover:text-[#0EA5E9] dark:hover:text-[#0EA5E9] hover:bg-slate-100/50 dark:hover:bg-slate-800/50 rounded-xl transition-all"><Edit className="w-4 h-4" /></Button>
                                    <Button variant="ghost" size="icon" onClick={() => { if (confirm(t("doctor.templates.confirm_delete", "Delete template?"))) deleteMutation.mutate(tpl.id); }} className="h-8 w-8 text-rose-500 hover:text-rose-700 hover:bg-rose-500/10 dark:hover:bg-rose-500/20 rounded-xl transition-all"><Trash2 className="w-4 h-4" /></Button>
                                </div>
                            </div>
                            <h3 className="font-black text-slate-900 dark:text-white text-lg mb-1 relative z-10">{tpl.name}</h3>
                            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 relative z-10">
                                {tpl.trigger_event === 'upcoming_appointment' ? t("doctor.templates.trigger_upcoming", "Upcoming Appointment") : t("doctor.templates.trigger_completed", "Appointment Completed")} • {tpl.delay_minutes < 60 ? tpl.delay_minutes + 'm' : tpl.delay_minutes / 60 + 'h'}
                            </p>
                            <p className="text-sm text-slate-650 dark:text-slate-350 font-medium italic bg-slate-50/50 dark:bg-slate-800/30 p-4 rounded-2xl border border-slate-100/50 dark:border-white/5 relative z-10 leading-relaxed">"{tpl.body}"</p>
                        </div>
                    </Card>
                ))}
            </div>

            {templates.length === 0 && (
                <div className="text-center py-20 bg-white/70 dark:bg-slate-900/50 border border-gray-200/50 dark:border-white/10 backdrop-blur-md rounded-3xl shadow-xl">
                    <Mail className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                    <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2">{t("doctor.templates.no_templates", "No Templates Found")}</h3>
                    <p className="text-slate-600 dark:text-slate-400 font-medium max-w-sm mx-auto">{t("doctor.templates.no_templates_desc", "Automate your reminders by creating your first sequence.")}</p>
                </div>
            )}
        </motion.div>
    );
}
