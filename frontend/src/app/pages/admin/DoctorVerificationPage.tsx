import React from 'react';

import { motion, AnimatePresence } from 'motion/react';
import { StaggerContainer, StaggerItem, ScaleIn, FadeIn } from "@/animations";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router';
import {
  ArrowLeft, CheckCircle, XCircle, FileText, Download, Eye, Shield,
  User, Mail, Phone, MapPin, Calendar, Award, Building, AlertTriangle,
  Clock, Upload, ExternalLink, Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { toast } from 'sonner';

interface DoctorVerification {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  specialization?: string;
  license_number?: string;
  license_state?: string;
  license_expiry?: string;
  medical_school?: string;
  graduation_year?: string;
  years_of_experience?: number;
  hospital_affiliation?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  verification_status: 'pending' | 'verified' | 'rejected';
  verification_notes?: string;
  documents?: {
    license?: string;
    degree?: string;
    identity?: string;
    certification?: string;
  };
  created_at: string;
  updated_at: string;
}

export default function DoctorVerificationPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [verificationNotes, setVerificationNotes] = React.useState('');
  const [selectedDocument, setSelectedDocument] = React.useState<string | null>(null);

  // Fetch doctor details
  const { data: doctor, isLoading } = useQuery({
    queryKey: ['doctor-verification', id],
    queryFn: async (): Promise<DoctorVerification> => {
      const response = await fetch(`/api/v1/admin/doctors/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch doctor details');
      }

      return response.json();
    },
    enabled: !!id
  });

  // Verify doctor mutation
  const verifyMutation = useMutation({
    mutationFn: async ({ status, notes }: { status: 'verified' | 'rejected'; notes: string }) => {
      const response = await fetch(`/api/v1/admin/doctors/${id}/verify`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          verification_status: status,
          verification_notes: notes
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update verification status');
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['doctor-verification', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-doctors'] });
      toast.success(`Doctor ${variables.status === 'verified' ? 'verified' : 'rejected'} successfully`);
      navigate('/admin/doctors');
    },
    onError: () => {
      toast.error('Failed to update verification status');
    }
  });

  const handleVerify = (status: 'verified' | 'rejected') => {
    if (!verificationNotes.trim() && status === 'rejected') {
      toast.error('Please provide rejection reason');
      return;
    }
    verifyMutation.mutate({ status, notes: verificationNotes });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-green-100 text-green-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pt-3 pb-12 px-6 bg-gradient-to-br from-[#F0F9FF] via-white to-[#F8FAFC]">
        <div className="max-w-7xl mx-auto space-y-8">
          <Skeleton className="w-[300px] h-[40px]" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-[500px] rounded-xl" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-[300px] rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="min-h-screen pt-3 pb-12 px-6 bg-gradient-to-br from-[#F0F9FF] via-white to-[#F8FAFC]">
        <div className="max-w-7xl mx-auto text-center py-12">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-[#0F172A] mb-4">Doctor Not Found</h2>
          <p className="text-[#64748B] mb-6">The doctor you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/admin/doctors')} className="bg-[#0EA5E9] hover:bg-[#0284C7] text-white">
            Back to Doctors
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-3 pb-12 px-6 bg-gradient-to-br from-[#F0F9FF] via-white to-[#F8FAFC]">
      <StaggerContainer stagger="normal" delayChildren={0.05} className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <StaggerItem>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/admin/doctors')}
                className="hover:bg-white transition-all duration-200 hover:translate-x-[-4px]"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-[#0F172A] mb-2 tracking-tight">
                  Doctor Verification
                </h1>
                <p className="text-[#64748B] text-sm">
                  Review and verify doctor credentials
                </p>
              </div>
            </div>
            <Badge className={`${getStatusColor(doctor.verification_status)} border-0 text-sm px-4 py-2 shadow-sm font-semibold`}>
              {doctor.verification_status.charAt(0).toUpperCase() + doctor.verification_status.slice(1)}
            </Badge>
          </div>
        </StaggerItem>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left Column - Doctor Info & Documents */}
          <div className="lg:col-span-2 space-y-6">

            {/* Doctor Information */}
            <StaggerItem>
              <Card className="border-0 shadow-md dark:shadow-2xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-md transition-all duration-300 hover:shadow-lg">
                <CardHeader className="border-b border-gray-100 dark:border-white/5 pb-4">
                  <CardTitle className="flex items-center gap-2 text-[#0EA5E9]">
                    <User className="w-5 h-5" />
                    Doctor Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <Tabs defaultValue="personal" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 bg-gray-100/50 dark:bg-slate-800/50 p-1 rounded-xl">
                      <TabsTrigger value="personal" className="rounded-lg">Personal</TabsTrigger>
                      <TabsTrigger value="professional" className="rounded-lg">Professional</TabsTrigger>
                      <TabsTrigger value="documents" className="rounded-lg">Documents</TabsTrigger>
                    </TabsList>

                    <TabsContent value="personal" className="space-y-4 mt-6">
                      <FadeIn duration="normal">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="p-3 bg-gray-50/50 dark:bg-slate-800/30 rounded-lg">
                            <Label className="text-[#64748B] text-xs font-semibold">Full Name</Label>
                            <p className="text-[#0F172A] dark:text-white font-medium mt-1">
                              Dr. {doctor.first_name} {doctor.last_name}
                            </p>
                          </div>
                          <div className="p-3 bg-gray-50/50 dark:bg-slate-800/30 rounded-lg">
                            <Label className="text-[#64748B] text-xs font-semibold">Email</Label>
                            <p className="text-[#0F172A] dark:text-white font-medium mt-1">{doctor.email}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                          <div className="p-3 bg-gray-50/50 dark:bg-slate-800/30 rounded-lg">
                            <Label className="text-[#64748B] text-xs font-semibold">Phone</Label>
                            <p className="text-[#0F172A] dark:text-white font-medium mt-1">{doctor.phone || 'Not provided'}</p>
                          </div>
                          <div className="p-3 bg-gray-50/50 dark:bg-slate-800/30 rounded-lg">
                            <Label className="text-[#64748B] text-xs font-semibold">Specialization</Label>
                            <p className="text-[#0F172A] dark:text-white font-medium mt-1">{doctor.specialization || 'Not specified'}</p>
                          </div>
                        </div>

                        <div className="p-3 bg-gray-50/50 dark:bg-slate-800/30 rounded-lg mt-4">
                          <Label className="text-[#64748B] text-xs font-semibold">Address</Label>
                          <p className="text-[#0F172A] dark:text-white font-medium mt-1">
                            {doctor.address || 'Not provided'}
                            {doctor.city && `, ${doctor.city}`}
                            {doctor.state && `, ${doctor.state}`}
                            {doctor.zip_code && ` ${doctor.zip_code}`}
                          </p>
                        </div>
                      </FadeIn>
                    </TabsContent>

                    <TabsContent value="professional" className="space-y-4 mt-6">
                      <FadeIn duration="normal">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="p-3 bg-gray-50/50 dark:bg-slate-800/30 rounded-lg">
                            <Label className="text-[#64748B] text-xs font-semibold">License Number</Label>
                            <p className="text-[#0F172A] dark:text-white font-medium mt-1">{doctor.license_number || 'Not provided'}</p>
                          </div>
                          <div className="p-3 bg-gray-50/50 dark:bg-slate-800/30 rounded-lg">
                            <Label className="text-[#64748B] text-xs font-semibold">License State</Label>
                            <p className="text-[#0F172A] dark:text-white font-medium mt-1">{doctor.license_state || 'Not provided'}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                          <div className="p-3 bg-gray-50/50 dark:bg-slate-800/30 rounded-lg">
                            <Label className="text-[#64748B] text-xs font-semibold">License Expiry</Label>
                            <p className="text-[#0F172A] dark:text-white font-medium mt-1">
                              {doctor.license_expiry
                                ? new Date(doctor.license_expiry).toLocaleDateString()
                                : 'Not provided'
                              }
                            </p>
                          </div>
                          <div className="p-3 bg-gray-50/50 dark:bg-slate-800/30 rounded-lg">
                            <Label className="text-[#64748B] text-xs font-semibold">Years of Experience</Label>
                            <p className="text-[#0F172A] dark:text-white font-medium mt-1">
                              {doctor.years_of_experience || 'Not provided'}
                            </p>
                          </div>
                        </div>

                        <div className="p-3 bg-gray-50/50 dark:bg-slate-800/30 rounded-lg mt-4">
                          <Label className="text-[#64748B] text-xs font-semibold">Medical School</Label>
                          <p className="text-[#0F172A] dark:text-white font-medium mt-1">{doctor.medical_school || 'Not provided'}</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                          <div className="p-3 bg-gray-50/50 dark:bg-slate-800/30 rounded-lg">
                            <Label className="text-[#64748B] text-xs font-semibold">Graduation Year</Label>
                            <p className="text-[#0F172A] dark:text-white font-medium mt-1">{doctor.graduation_year || 'Not provided'}</p>
                          </div>
                          <div className="p-3 bg-gray-50/50 dark:bg-slate-800/30 rounded-lg">
                            <Label className="text-[#64748B] text-xs font-semibold">Hospital Affiliation</Label>
                            <p className="text-[#0F172A] dark:text-white font-medium mt-1">{doctor.hospital_affiliation || 'Not provided'}</p>
                          </div>
                        </div>
                      </FadeIn>
                    </TabsContent>

                    <TabsContent value="documents" className="space-y-4 mt-6">
                      <FadeIn duration="normal">
                        {doctor.documents && Object.keys(doctor.documents).length > 0 ? (
                          <div className="space-y-3">
                            {Object.entries(doctor.documents).map(([type, url]) => (
                              <motion.div
                                key={type}
                                whileHover={{ scale: 1.01, y: -2 }}
                                transition={{ duration: 0.2 }}
                                className="flex items-center justify-between p-4 bg-[#F8FAFC]/80 dark:bg-slate-800/30 rounded-xl border border-gray-150 dark:border-white/5 shadow-sm"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-lg bg-[#0EA5E9]/10 flex items-center justify-center">
                                    <FileText className="w-5 h-5 text-[#0EA5E9]" />
                                  </div>
                                  <div>
                                    <p className="font-semibold text-sm text-[#0F172A] dark:text-white">
                                      {type.charAt(0).toUpperCase() + type.slice(1)} Document
                                    </p>
                                    <p className="text-xs text-[#64748B]">Verification asset uploaded by doctor</p>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="rounded-lg text-xs"
                                    onClick={() => setSelectedDocument(url as string)}
                                  >
                                    <Eye className="w-3.5 h-3.5 mr-1" />
                                    View
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="rounded-lg text-xs"
                                    onClick={() => window.open(url as string, '_blank')}
                                  >
                                    <Download className="w-3.5 h-3.5 mr-1" />
                                    Download
                                  </Button>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <Upload className="w-12 h-12 text-[#64748B] mx-auto mb-3 opacity-60" />
                            <p className="text-[#64748B] text-sm">No documents uploaded</p>
                          </div>
                        )}
                      </FadeIn>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </StaggerItem>

            {/* Verification Notes */}
            {doctor.verification_status === 'pending' && (
              <StaggerItem>
                <Card className="border-0 shadow-md bg-white/60 dark:bg-slate-900/60 backdrop-blur-md">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-[#0EA5E9]">
                      <FileText className="w-5 h-5" />
                      Verification Review
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Textarea
                      placeholder="Add notes about the verification process, reasons for approval/rejection, or any concerns..."
                      className="min-h-[120px] rounded-xl focus:ring-[#0EA5E9]"
                      value={verificationNotes}
                      onChange={(e) => setVerificationNotes(e.target.value)}
                    />
                    <p className="text-xs text-[#64748B]">
                      These notes will be saved and logged along with the verification decision for compliance.
                    </p>
                  </CardContent>
                </Card>
              </StaggerItem>
            )}

            {/* Previous Verification Notes */}
            {doctor.verification_notes && (
              <StaggerItem>
                <Card className="border-0 shadow-md bg-white/60 dark:bg-slate-900/60 backdrop-blur-md">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-gray-700 dark:text-white">
                      <FileText className="w-5 h-5" />
                      Verification Logs
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="p-4 bg-gray-50/80 dark:bg-slate-800/40 rounded-xl border dark:border-white/5">
                      <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{doctor.verification_notes}</p>
                    </div>
                  </CardContent>
                </Card>
              </StaggerItem>
            )}
          </div>

          {/* Right Column - Actions & Status */}
          <div className="space-y-6">

            {/* Quick Info */}
            <StaggerItem>
              <Card className="border-0 shadow-md bg-white/60 dark:bg-slate-900/60 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="text-lg font-bold">Metadata Profile</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50/50 dark:bg-slate-800/30 rounded-xl">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#64748B]" />
                      <span className="text-xs font-semibold text-[#64748B]">Registration Date</span>
                    </div>
                    <span className="text-sm font-semibold text-[#0F172A] dark:text-white">
                      {new Date(doctor.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50/50 dark:bg-slate-800/30 rounded-xl">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#64748B]" />
                      <span className="text-xs font-semibold text-[#64748B]">Last Update Log</span>
                    </div>
                    <span className="text-sm font-semibold text-[#0F172A] dark:text-white">
                      {new Date(doctor.updated_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50/50 dark:bg-slate-800/30 rounded-xl">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-[#64748B]" />
                      <span className="text-xs font-semibold text-[#64748B]">Ocular Status</span>
                    </div>
                    <Badge className={`${getStatusColor(doctor.verification_status)} border-0 font-bold px-2.5 py-0.5 shadow-sm text-xs`}>
                      {doctor.verification_status.charAt(0).toUpperCase() + doctor.verification_status.slice(1)}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </StaggerItem>

            {/* Verification Actions */}
            {doctor.verification_status === 'pending' && (
              <StaggerItem>
                <Card className="border-0 shadow-md bg-white/60 dark:bg-slate-900/60 backdrop-blur-md">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold">Action Terminal</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          className="w-full bg-green-500 hover:bg-green-600 text-white rounded-xl py-5 shadow-lg shadow-green-500/10 font-bold"
                          disabled={verifyMutation.isPending}
                        >
                          {verifyMutation.isPending ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <CheckCircle className="w-4 h-4 mr-2" />
                          )}
                          Approve Doctor
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="rounded-2xl">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Approve Doctor Credentials</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to verify Dr. {doctor.first_name} {doctor.last_name}?
                            This will grant them immediate full clinical rights inside the portals.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleVerify('verified')}
                            className="bg-green-500 hover:bg-green-600 rounded-xl"
                          >
                            Approve
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl py-5 font-bold"
                          disabled={verifyMutation.isPending}
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Decline Request
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="rounded-2xl">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Decline Application</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to reject Dr. {doctor.first_name}'s application?
                            Rejection requires providing specific review feedback in the notes field.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleVerify('rejected')}
                            className="bg-red-500 hover:bg-red-600 rounded-xl"
                          >
                            Decline
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </CardContent>
                </Card>
              </StaggerItem>
            )}

            {/* Verification Checklist */}
            <StaggerItem>
              <Card className="border-0 shadow-md bg-white/60 dark:bg-slate-900/60 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="text-lg font-bold">Verification Checklist</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <motion.div
                    whileHover={{ x: 2 }}
                    className="flex items-center gap-3 p-2 bg-gray-50/50 dark:bg-slate-800/30 rounded-lg"
                  >
                    {doctor.license_number ? (
                      <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                    )}
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">License Number Verified</span>
                  </motion.div>
                  <motion.div
                    whileHover={{ x: 2 }}
                    className="flex items-center gap-3 p-2 bg-gray-50/50 dark:bg-slate-800/30 rounded-lg"
                  >
                    {doctor.medical_school ? (
                      <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                    )}
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Medical School Affiliation</span>
                  </motion.div>
                  <motion.div
                    whileHover={{ x: 2 }}
                    className="flex items-center gap-3 p-2 bg-gray-50/50 dark:bg-slate-800/30 rounded-lg"
                  >
                    {doctor.documents && Object.keys(doctor.documents).length > 0 ? (
                      <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                    )}
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Degree & Identity Assets</span>
                  </motion.div>
                  <motion.div
                    whileHover={{ x: 2 }}
                    className="flex items-center gap-3 p-2 bg-gray-50/50 dark:bg-slate-800/30 rounded-lg"
                  >
                    {doctor.specialization ? (
                      <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                    )}
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Ocular/Clinical Specialty</span>
                  </motion.div>
                </CardContent>
              </Card>
            </StaggerItem>
          </div>
        </div>
      </StaggerContainer>

      {/* Document Viewer Modal */}
      <AnimatePresence>
        {selectedDocument && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6"
            onClick={() => setSelectedDocument(null)}
          >
            <ScaleIn
              className="bg-white dark:bg-slate-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl border dark:border-white/10"
            >
              <div className="w-full h-full flex flex-col" onClick={(e) => e.stopPropagation()}>
                <div className="p-5 border-b dark:border-white/5 flex items-center justify-between bg-gray-50 dark:bg-slate-900/80">
                  <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#0EA5E9]" />
                    Document Verification Preview
                  </h3>
                  <Button variant="ghost" className="rounded-lg p-1.5 h-auto text-gray-500 hover:bg-gray-150" onClick={() => setSelectedDocument(null)}>
                    <XCircle className="w-5 h-5" />
                  </Button>
                </div>
                <div className="p-6 overflow-auto max-h-[calc(90vh-80px)] flex justify-center bg-gray-100 dark:bg-slate-950/40">
                  <img
                    src={selectedDocument}
                    alt="Clinical Credentials Asset"
                    className="max-w-full h-auto rounded-lg shadow-md border"
                  />
                </div>
              </div>
            </ScaleIn>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
