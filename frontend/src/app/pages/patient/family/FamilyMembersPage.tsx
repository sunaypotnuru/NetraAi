import React from 'react';

import { motion, AnimatePresence } from "motion/react";
import {
  Users,
  Plus,
  Search,
  Edit,
  Trash2,
  Phone,
  Mail,
  Calendar,
  Shield,
  ArrowLeft,
  UserCheck,
  UserX
} from "lucide-react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { patientPortalAPI } from "@/services/patientPortalAPI";
import { FamilyMember } from "@/types/patientPortal";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n";

export default function FamilyMembersPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [members, setMembers] = React.useState<FamilyMember[]>([]);
  const [filteredMembers, setFilteredMembers] = React.useState<FamilyMember[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState("");

  React.useEffect(() => {
    fetchFamilyMembers();
  }, []);

  React.useEffect(() => {
    filterMembers();
  }, [members, searchTerm]);

  const fetchFamilyMembers = async () => {
    setIsLoading(true);
    try {
      const response = await patientPortalAPI.getFamilyMembers();
      setMembers(response.data || []);
    } catch (error) {
      console.error("Error fetching family members:", error);
      setMembers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filterMembers = () => {
    let filtered = members;

    if (searchTerm) {
      filtered = filtered.filter(m =>
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.relationship.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredMembers(filtered);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(t('patient.family.confirm_delete', `Are you sure you want to remove ${name} from your family members?`))) {
      return;
    }

    try {
      await patientPortalAPI.deleteFamilyMember(id);
      setMembers(prev => prev.filter(m => m.id !== id));
      toast.success(t('patient.family.deleted', "Family member removed successfully"));
    } catch (error) {
      console.error("Error deleting family member:", error);
      toast.error(t('patient.family.delete_failed', "Failed to remove family member"));
    }
  };

  const getRelationshipIcon = (relationship: string) => {
    const rel = relationship.toLowerCase();
    if (rel.includes('parent') || rel.includes('mother') || rel.includes('father')) return '👨‍👩‍👦';
    if (rel.includes('child') || rel.includes('son') || rel.includes('daughter')) return '👶';
    if (rel.includes('spouse') || rel.includes('husband') || rel.includes('wife')) return '💑';
    if (rel.includes('sibling') || rel.includes('brother') || rel.includes('sister')) return '👫';
    if (rel.includes('grandparent')) return '👴';
    return '👤';
  };

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pt-3 pb-10 bg-transparent flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 dark:text-slate-400">{t('patient.family.loading', "Loading family members...")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-3 pb-10 bg-transparent">
      <div className="max-w-7xl mx-auto px-4 space-y-6">
        {/* Header */}
        <button
          onClick={() => navigate("/patient/dashboard")}
          className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors mb-2 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('common.back_to_dashboard', "Back to Dashboard")}
        </button>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Users className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {t('patient.family.title', "Family Members")}
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                {t('patient.family.subtitle', "Manage your family's health information")}
              </p>
            </div>
          </div>
          <Button
            onClick={() => navigate("/patient/family/add")}
            className="bg-teal-600 hover:bg-teal-700 text-white gap-2 rounded-xl shadow-md transition-all duration-300"
          >
            <Plus className="w-5 h-5" />
            {t('patient.family.add_member', "Add Family Member")}
          </Button>
        </div>

        {/* Stats Card */}
        <Card className="p-6 bg-white/70 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/50 dark:border-white/10 shadow-xl transition-all duration-300">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-teal-100 dark:bg-teal-950/40 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                  {t('patient.family.total_members', "Total Members")}
                </p>
                <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{members.length}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950/40 rounded-xl flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                  {t('patient.family.can_view_records', "Can View Records")}
                </p>
                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-450 mt-1">
                  {members.filter(m => m.can_view_records).length}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-950/40 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-450" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                  {t('patient.family.can_book', "Can Book Appointments")}
                </p>
                <p className="text-2xl font-black text-blue-600 dark:text-blue-450 mt-1">
                  {members.filter(m => m.can_book_appointments).length}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Search */}
        <Card className="p-4 bg-white/70 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/50 dark:border-white/10 shadow-xl transition-all duration-300">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder={t('patient.family.search_placeholder', "Search family members...")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50/50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-all duration-300"
            />
          </div>
        </Card>

        {/* Family Members Grid */}
        {filteredMembers.length === 0 ? (
          <Card className="p-12 text-center bg-white/70 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/50 dark:border-white/10 shadow-xl transition-all duration-300">
            <Users className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              {searchTerm
                ? t('patient.family.no_results', "No family members found")
                : t('patient.family.no_members', "No family members yet")}
            </h3>
            <p className="text-slate-500 dark:text-slate-450 mb-6">
              {searchTerm
                ? t('patient.family.try_different_search', "Try a different search term")
                : t('patient.family.add_first', "Add your first family member to get started")}
            </p>
            {!searchTerm && (
              <Button
                onClick={() => navigate("/patient/family/add")}
                className="bg-teal-600 hover:bg-teal-700 text-white gap-2 rounded-xl shadow-md transition-all duration-300"
              >
                <Plus className="w-5 h-5" />
                {t('patient.family.add_member', "Add Family Member")}
              </Button>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredMembers.map((member) => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="p-6 bg-white/70 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/50 dark:border-white/10 shadow-xl hover:shadow-2xl hover:border-slate-300/50 dark:hover:border-white/20 transition-all duration-300 flex flex-col justify-between h-full">
                    <div>
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-3">
                          <div className="text-4xl filter drop-shadow-md">{getRelationshipIcon(member.relationship)}</div>
                          <div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 leading-tight">
                              {member.name}
                            </h3>
                            <Badge className="bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 border border-teal-100 dark:border-teal-900/50 font-semibold text-xs">
                              {member.relationship}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Info */}
                      <div className="space-y-2.5 mb-4 text-sm text-slate-600 dark:text-slate-300">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                          <span className="font-medium">
                            {calculateAge(member.date_of_birth)} {t('patient.family.years_old', "years old")} • {member.gender}
                          </span>
                        </div>

                        {member.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                            <span className="font-medium">{member.phone}</span>
                          </div>
                        )}

                        {member.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                            <span className="truncate font-medium">{member.email}</span>
                          </div>
                        )}
                      </div>

                      {/* Permissions */}
                      <div className="flex flex-wrap gap-2 mb-6">
                        {member.can_view_records ? (
                          <Badge className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50 flex items-center gap-1 font-semibold text-xs">
                            <UserCheck className="w-3.5 h-3.5" />
                            {t('patient.family.view_records', "View Records")}
                          </Badge>
                        ) : (
                          <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 flex items-center gap-1 font-semibold text-xs">
                            <UserX className="w-3.5 h-3.5" />
                            {t('patient.family.no_view', "No View")}
                          </Badge>
                        )}

                        {member.can_book_appointments && (
                          <Badge className="bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 flex items-center gap-1 font-semibold text-xs">
                            <Calendar className="w-3.5 h-3.5" />
                            {t('patient.family.can_book_short', "Book")}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex gap-2">
                      <Button
                        onClick={() => navigate(`/patient/family/edit/${member.id}`)}
                        variant="outline"
                        size="sm"
                        className="flex-1 gap-2 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-300 rounded-xl"
                      >
                        <Edit className="w-4 h-4" />
                        {t('common.edit', "Edit")}
                      </Button>
                      <Button
                        onClick={() => handleDelete(member.id, member.name)}
                        variant="outline"
                        size="sm"
                        className="text-red-650 hover:text-red-700 hover:bg-red-50/50 dark:hover:bg-red-950/20 border-red-200 dark:border-red-900/50 transition-all duration-300 rounded-xl"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Info Card */}
        <Card className="p-6 bg-gradient-to-r from-teal-500/10 to-blue-500/10 dark:from-teal-950/20 dark:to-blue-950/20 border border-teal-200/50 dark:border-teal-900/50 shadow-lg transition-all duration-300">
          <div className="flex items-start gap-3">
            <Shield className="w-6 h-6 text-teal-600 dark:text-teal-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-extrabold text-slate-900 dark:text-white mb-2 leading-relaxed">
                {t('patient.family.privacy_title', "Privacy & Permissions")}
              </p>
              <p className="text-sm text-slate-650 dark:text-slate-350 leading-relaxed">
                {t('patient.family.privacy_desc', "Control what information family members can access. You can grant permissions to view medical records or book appointments on your behalf.")}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
