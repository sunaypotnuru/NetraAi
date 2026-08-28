import React from 'react';

import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n";
import api from "@/lib/api";
import PageWrapper from "@/components/ui/PageWrapper";

export default function ContactPage() {
    const { t } = useTranslation();
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [formData, setFormData] = React.useState({
        firstName: "",
        lastName: "",
        email: "",
        message: ""
    });

    const validateEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.firstName || !formData.email || !formData.message) {
            toast.error(t("public.contact.required_fields", "Please fill in all required fields"));
            return;
        }

        if (!validateEmail(formData.email)) {
            toast.error(t("public.contact.invalid_email", "Please enter a valid email address"));
            return;
        }

        setIsSubmitting(true);
        try {
            // Combine first and last name for the API
            const fullName = `${formData.firstName} ${formData.lastName}`.trim();
            await api.post("/api/v1/contact/submit", {
                name: fullName,
                email: formData.email,
                phone: "", // Optional field not in this form
                message: formData.message
            });
            toast.success(t("public.contact.success_msg", "Message sent successfully! We will get back to you soon."));
            setFormData({ firstName: "", lastName: "", email: "", message: "" });
            (e.target as HTMLFormElement).reset();
        } catch (error) {
            console.error("Failed to send message:", error);
            toast.error(t("public.contact.error_msg", "Failed to send message. Please try again."));
        } finally {
            setIsSubmitting(false);
        }
    };

    const infoCards = [
        {
            icon: Mail,
            iconColor: "text-[#0D9488]",
            iconBg: "rgba(13,148,136,0.15)",
            title: t("public.contact.email_us", "Email Us"),
            lines: ["support@netraai.com", "sales@netraai.com"],
            delay: 0,
        },
        {
            icon: Phone,
            iconColor: "text-[#0EA5E9]",
            iconBg: "rgba(14,165,233,0.15)",
            title: t("public.contact.call_us", "Call Us"),
            lines: ["+91 1800-NETRA-AI"],
            emergency: t("public.contact.emergency", "Emergency: 108"),
            delay: 0.1,
        },
        {
            icon: MapPin,
            iconColor: "text-[#8B5CF6]",
            iconBg: "rgba(139,92,246,0.15)",
            title: t("public.contact.headquarters", "Headquarters"),
            lines: ["Universal AI University", t("public.contact.location", "Mumbai, India")],
            delay: 0.2,
        },
    ];

    return (
        <PageWrapper>
            <div className="max-w-6xl mx-auto px-6 lg:px-12">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-16"
                >
                    <span
                        className="inline-block px-4 py-1 rounded-full text-xs font-semibold tracking-widest uppercase mb-4 bg-teal-100 dark:bg-teal-900/40 text-teal-800 dark:text-teal-300"
                    >
                        Get In Touch
                    </span>
                    <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
                        {t("public.contact.title", "Contact Us")}
                    </h1>
                    <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
                        {t("public.contact.description", "Have questions about our platform or need technical support? We're here to help.")}
                    </p>
                </motion.div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Info cards */}
                    <div className="lg:col-span-1 space-y-6">
                        {infoCards.map((card, i) => {
                            const Icon = card.icon;
                            return (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: card.delay }}
                                    whileHover={{ y: -4 }}
                                    className="rounded-2xl p-6 border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 transition-all flex gap-4 bg-slate-50/50 dark:bg-white/5 backdrop-blur-md"
                                >
                                    <div
                                        className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                                        style={{ background: card.iconBg }}
                                    >
                                        <Icon className={`w-6 h-6 ${card.iconColor}`} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900 dark:text-white mb-1">{card.title}</h4>
                                        {card.lines.map((line, j) => (
                                            <p key={j} className="text-slate-550 dark:text-slate-450 text-sm mb-1">{line}</p>
                                        ))}
                                        {card.emergency && (
                                            <p
                                                className="text-red-400 font-semibold text-xs mt-2 border border-red-500/30 rounded px-2 py-1 inline-block"
                                                style={{ background: "rgba(239,68,68,0.12)" }}
                                            >
                                                {card.emergency}
                                            </p>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* Form */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="lg:col-span-2 rounded-2xl p-8 border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 backdrop-blur-md"
                    >
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
                            {t("public.contact.form_title", "Send us a message")}
                        </h3>
                        <form className="space-y-6" onSubmit={handleSubmit}>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="firstName" className="block text-sm font-semibold text-slate-650 dark:text-slate-350 mb-2">
                                        {t("public.contact.first_name", "First Name")}
                                    </label>
                                    <input
                                        id="firstName"
                                        type="text"
                                        required
                                        value={formData.firstName}
                                        onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                                        className="w-full px-4 py-3 rounded-xl text-slate-950 dark:text-white bg-slate-100/50 dark:bg-slate-900/40 placeholder-slate-400 dark:placeholder-slate-500 outline-none border border-slate-200 dark:border-white/20 focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488] transition-all"
                                        placeholder={t("public.contact.first_name_placeholder", "John")}
                                        aria-label={t("public.contact.first_name", "First Name")}
                                        aria-required="true"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="lastName" className="block text-sm font-semibold text-slate-650 dark:text-slate-350 mb-2">
                                        {t("public.contact.last_name", "Last Name")}
                                    </label>
                                    <input
                                        id="lastName"
                                        type="text"
                                        value={formData.lastName}
                                        onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                                        className="w-full px-4 py-3 rounded-xl text-slate-950 dark:text-white bg-slate-100/50 dark:bg-slate-900/40 placeholder-slate-400 dark:placeholder-slate-500 outline-none border border-slate-200 dark:border-white/20 focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488] transition-all"
                                        placeholder={t("public.contact.last_name_placeholder", "Doe")}
                                        aria-label={t("public.contact.last_name", "Last Name")}
                                    />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="email" className="block text-sm font-semibold text-slate-650 dark:text-slate-350 mb-2">
                                    {t("public.contact.email_address", "Email Address")}
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                    className="w-full px-4 py-3 rounded-xl text-slate-950 dark:text-white bg-slate-100/50 dark:bg-slate-900/40 placeholder-slate-400 dark:placeholder-slate-500 outline-none border border-slate-200 dark:border-white/20 focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488] transition-all"
                                    placeholder={t("public.contact.email_placeholder", "john@example.com")}
                                    aria-label={t("public.contact.email_address", "Email Address")}
                                    aria-required="true"
                                    aria-describedby="email-error"
                                />
                            </div>
                            <div>
                                <label htmlFor="message" className="block text-sm font-semibold text-slate-650 dark:text-slate-350 mb-2">
                                    {t("public.contact.message", "Message")}
                                </label>
                                <textarea
                                    id="message"
                                    rows={5}
                                    required
                                    value={formData.message}
                                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                                    className="w-full px-4 py-3 rounded-xl text-slate-950 dark:text-white bg-slate-100/50 dark:bg-slate-900/40 placeholder-slate-400 dark:placeholder-slate-500 outline-none border border-slate-200 dark:border-white/20 focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488] transition-all resize-none"
                                    placeholder={t("public.contact.message_placeholder", "How can we help you?")}
                                    aria-label={t("public.contact.message", "Message")}
                                    aria-required="true"
                                />
                            </div>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-gradient-to-r from-[#0D9488] to-[#0EA5E9] hover:from-[#0F766E] hover:to-[#0284C7] text-white py-4 rounded-xl text-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-70 border-0 transition-all"
                            >
                                <Send className="w-5 h-5" />
                                {isSubmitting ? t("public.contact.sending", "Sending...") : t("public.contact.send", "Send Message")}
                            </Button>
                        </form>
                    </motion.div>
                </div>
            </div>
        </PageWrapper>
    );
}
