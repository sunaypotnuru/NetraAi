import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import {
  ArrowLeft, User, Mail, Phone, MapPin, Calendar, Camera,
  Save, Edit, Shield, Award, Clock, Globe, FileText,
  CheckCircle, AlertCircle, Upload, X, Plus, Trash2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { doctorAPI, profileAPI, authAPI } from '@/lib/api';

interface DoctorProfile {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  gender: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  avatar_url?: string;
  medical_license: string;
  specializations: string[];
  qualifications: string[];
  experience_years: number;
  languages: string[];
  bio: string;
  consultation_fee: number;
  follow_up_fee: number;
  emergency_fee: number;
  clinic_name: string;
  clinic_address: string;
  clinic_phone: string;
  website?: string;
  social_media: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
  };
  availability_status: 'available' | 'busy' | 'offline';
  auto_accept_appointments: boolean;
  email_notifications: boolean;
  sms_notifications: boolean;
  push_notifications: boolean;
}

export default function DoctorProfileSettings() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('personal');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<DoctorProfile>>({});

  const { data: profile, isLoading } = useQuery({
    queryKey: ['doctor-profile'],
    queryFn: async (): Promise<DoctorProfile> => {
      const { data: { user } } = await authAPI.getCurrentUser();
      if (!user) throw new Error("Not authenticated");

      const { data: dbProfile, error } = await profileAPI.getProfile(user.id, 'doctor');
      if (error || !dbProfile) throw error || new Error("Profile not found");

      // Map DB profile to DoctorProfile interface
      return {
        id: dbProfile.id,
        full_name: dbProfile.full_name || 'Doctor',
        email: dbProfile.email || '',
        phone: dbProfile.phone || '',
        date_of_birth: dbProfile.date_of_birth || '',
        gender: dbProfile.gender || 'Male',
        address: dbProfile.address || '',
        city: dbProfile.city || '',
        state: dbProfile.state || '',
        postal_code: dbProfile.postal_code || '',
        country: dbProfile.country || 'India',
        avatar_url: dbProfile.avatar_url,
        medical_license: dbProfile.license_number || '',
        specializations: dbProfile.specialty ? [dbProfile.specialty] : [],
        qualifications: dbProfile.qualifications || [],
        experience_years: dbProfile.experience_years || 0,
        languages: dbProfile.languages_spoken || ['English'],
        bio: dbProfile.bio || '',
        consultation_fee: dbProfile.consultation_fee || 0,
        follow_up_fee: dbProfile.follow_up_fee || 0,
        emergency_fee: dbProfile.emergency_fee || 0,
        clinic_name: dbProfile.clinic_name || 'Netra AI Clinic',
        clinic_address: dbProfile.clinic_address || '',
        clinic_phone: dbProfile.clinic_phone || '',
        website: dbProfile.website || '',
        social_media: dbProfile.social_media || {},
        availability_status: 'available',
        auto_accept_appointments: true,
        email_notifications: true,
        sms_notifications: true,
        push_notifications: true
      };
    }
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (updatedProfile: Partial<DoctorProfile>) => {
      if (!profile?.id) return;

      // Map DoctorProfile back to DB schema
      const updates: any = {
        full_name: updatedProfile.full_name,
        phone: updatedProfile.phone,
        date_of_birth: updatedProfile.date_of_birth,
        gender: updatedProfile.gender,
        address: updatedProfile.address,
        city: updatedProfile.city,
        state: updatedProfile.state,
        postal_code: updatedProfile.postal_code,
        license_number: updatedProfile.medical_license,
        specialty: updatedProfile.specializations?.[0],
        qualifications: updatedProfile.qualifications,
        experience_years: updatedProfile.experience_years,
        languages_spoken: updatedProfile.languages,
        bio: updatedProfile.bio,
        consultation_fee: updatedProfile.consultation_fee,
        follow_up_fee: updatedProfile.follow_up_fee,
        emergency_fee: updatedProfile.emergency_fee,
        clinic_name: updatedProfile.clinic_name,
        clinic_address: updatedProfile.clinic_address,
        clinic_phone: updatedProfile.clinic_phone,
        website: updatedProfile.website,
        social_media: updatedProfile.social_media
      };

      const { data, error } = await profileAPI.updateProfile(profile.id, updates, 'doctor');
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-profile'] });
      setIsEditing(false);
    }
  });

  const handleInputChange = (field: keyof DoctorProfile, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    updateProfileMutation.mutate(formData);
  };

  const handleEdit = () => {
    setFormData(profile || {});
    setIsEditing(true);
  };

  const handleCancel = () => {
    setFormData({});
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-6 bg-transparent text-slate-900 dark:text-white">
        <div className="max-w-6xl mx-auto space-y-8">
          <Skeleton className="w-[300px] h-[40px] bg-slate-200 dark:bg-slate-800" />
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <Skeleton className="h-[400px] rounded-2xl bg-slate-200 dark:bg-slate-800" />
            <div className="lg:col-span-3 space-y-6">
              <Skeleton className="h-[200px] rounded-2xl bg-slate-200 dark:bg-slate-800" />
              <Skeleton className="h-[300px] rounded-2xl bg-slate-200 dark:bg-slate-800" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-6 bg-transparent text-slate-900 dark:text-white">
        <div className="max-w-4xl mx-auto text-center py-12">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Profile Not Found</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6">Unable to load your profile information.</p>
          <Button onClick={() => navigate('/doctor/dashboard')} className="bg-sky-500 hover:bg-sky-600 text-white rounded-xl shadow-lg shadow-sky-500/20">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const currentData = isEditing ? { ...profile, ...formData } : profile;

  return (
    <div className="min-h-screen pt-24 pb-12 px-6 bg-transparent text-slate-900 dark:text-white transition-colors duration-300">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/doctor/settings')}
              className="p-2 hover:bg-white/20 dark:hover:bg-slate-850/30 border border-transparent hover:border-slate-200/50 dark:hover:border-white/10 rounded-xl transition-all"
            >
              <ArrowLeft className="w-5 h-5 text-slate-700 dark:text-slate-350" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Profile Settings</h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Manage your professional profile and personal information</p>
            </div>
          </div>
          <div className="flex gap-3">
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  className="rounded-xl border-slate-200/50 dark:border-white/10 text-rose-500 hover:bg-rose-500/10 border-rose-500/30 hover:border-rose-500/50 transition-all duration-300"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={updateProfileMutation.isPending}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all duration-300"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </>
            ) : (
              <Button
                onClick={handleEdit}
                className="bg-sky-500 hover:bg-sky-600 text-white rounded-xl shadow-lg shadow-sky-500/20 hover:shadow-sky-500/30 transition-all duration-300 transform hover:-translate-y-0.5"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* Profile Summary Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="lg:col-span-1"
          >
            <Card className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-md border border-gray-200/50 dark:border-slate-800/50 shadow-xl rounded-2xl overflow-hidden hover:scale-[1.02] transition-all duration-300">
              <CardContent className="p-6 text-center">
                <div className="relative mb-6 w-24 h-24 mx-auto group">
                  <Avatar className="w-24 h-24 border-2 border-sky-500/20 shadow-inner">
                    <AvatarImage src={currentData.avatar_url} />
                    <AvatarFallback className="bg-sky-500/10 text-sky-500 text-2xl font-bold">
                      {currentData.full_name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  {isEditing && (
                    <Button
                      size="sm"
                      className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 p-1.5 rounded-full shadow-md"
                    >
                      <Camera className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                <h2 className="text-xl font-bold text-slate-905 dark:text-white mb-1 tracking-tight">{currentData.full_name}</h2>
                <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mb-4">{currentData.specializations.join(', ') || 'General Physician'}</p>

                <div className="flex justify-center mb-5">
                  <Badge
                    className={`${
                      currentData.availability_status === 'available' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20' :
                      currentData.availability_status === 'busy' ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20' :
                      'bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20'
                    } border capitalize`}
                  >
                    {currentData.availability_status}
                  </Badge>
                </div>

                <div className="space-y-3 text-sm border-t border-slate-200/50 dark:border-white/5 pt-4 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Experience</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-200">{currentData.experience_years} years</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">License</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-200">{currentData.medical_license || 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Languages</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-200">{currentData.languages.join(', ')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="lg:col-span-3"
          >
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-white/40 dark:bg-slate-900/40 border border-slate-200/50 dark:border-white/5 p-1 rounded-xl">
                <TabsTrigger value="personal" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm">Personal</TabsTrigger>
                <TabsTrigger value="professional" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm">Professional</TabsTrigger>
                <TabsTrigger value="clinic" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm">Clinic</TabsTrigger>
                <TabsTrigger value="preferences" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm">Preferences</TabsTrigger>
              </TabsList>

              {/* Personal Information Tab */}
              <TabsContent value="personal" className="space-y-6 mt-6">
                <Card className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-md border border-gray-200/50 dark:border-slate-800/50 shadow-xl rounded-2xl overflow-hidden">
                  <CardHeader className="border-b border-slate-250/20 dark:border-white/5 pb-4">
                    <CardTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <User className="w-5 h-5 text-sky-500" />
                      Personal Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6 pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">Full Name</label>
                        {isEditing ? (
                          <Input
                            value={currentData.full_name}
                            onChange={(e) => handleInputChange('full_name', e.target.value)}
                            className="bg-white/50 dark:bg-slate-950/40 border-slate-200/50 dark:border-slate-800/50 rounded-xl focus:border-sky-500"
                          />
                        ) : (
                          <p className="text-slate-500 dark:text-slate-455 py-2 font-medium">{currentData.full_name}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">Email</label>
                        {isEditing ? (
                          <Input
                            type="email"
                            value={currentData.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            className="bg-white/50 dark:bg-slate-950/40 border-slate-200/50 dark:border-slate-800/50 rounded-xl focus:border-sky-500"
                          />
                        ) : (
                          <p className="text-slate-500 dark:text-slate-455 py-2 font-medium">{currentData.email}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">Phone</label>
                        {isEditing ? (
                          <Input
                            value={currentData.phone}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                            className="bg-white/50 dark:bg-slate-950/40 border-slate-200/50 dark:border-slate-800/50 rounded-xl focus:border-sky-500"
                          />
                        ) : (
                          <p className="text-slate-500 dark:text-slate-455 py-2 font-medium">{currentData.phone}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">Date of Birth</label>
                        {isEditing ? (
                          <Input
                            type="date"
                            value={currentData.date_of_birth}
                            onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                            className="bg-white/50 dark:bg-slate-950/40 border-slate-200/50 dark:border-slate-800/50 rounded-xl focus:border-sky-500"
                          />
                        ) : (
                          <p className="text-slate-500 dark:text-slate-455 py-2 font-medium">
                            {currentData.date_of_birth ? new Date(currentData.date_of_birth).toLocaleDateString() : 'N/A'}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">Gender</label>
                        {isEditing ? (
                          <Select value={currentData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                            <SelectTrigger className="bg-white/50 dark:bg-slate-950/40 border-slate-200/50 dark:border-slate-800/50 rounded-xl">
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl">
                              <SelectItem value="Male">Male</SelectItem>
                              <SelectItem value="Female">Female</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <p className="text-slate-500 dark:text-slate-455 py-2 font-medium">{currentData.gender}</p>
                        )}
                      </div>
                    </div>

                    <Separator className="border-slate-200/50 dark:border-white/5" />

                    <div>
                      <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">Address</label>
                      {isEditing ? (
                        <Textarea
                          value={currentData.address}
                          onChange={(e) => handleInputChange('address', e.target.value)}
                          className="bg-white/50 dark:bg-slate-950/40 border-slate-200/50 dark:border-slate-800/50 rounded-xl focus:border-sky-500"
                          rows={3}
                        />
                      ) : (
                        <p className="text-slate-500 dark:text-slate-455 py-2 font-medium">{currentData.address || 'Not provided'}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">City</label>
                        {isEditing ? (
                          <Input
                            value={currentData.city}
                            onChange={(e) => handleInputChange('city', e.target.value)}
                            className="bg-white/50 dark:bg-slate-950/40 border-slate-200/50 dark:border-slate-800/50 rounded-xl focus:border-sky-500"
                          />
                        ) : (
                          <p className="text-slate-500 dark:text-slate-455 py-2 font-medium">{currentData.city || 'Not provided'}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">State</label>
                        {isEditing ? (
                          <Input
                            value={currentData.state}
                            onChange={(e) => handleInputChange('state', e.target.value)}
                            className="bg-white/50 dark:bg-slate-950/40 border-slate-200/50 dark:border-slate-800/50 rounded-xl focus:border-sky-500"
                          />
                        ) : (
                          <p className="text-slate-500 dark:text-slate-455 py-2 font-medium">{currentData.state || 'Not provided'}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">Postal Code</label>
                        {isEditing ? (
                          <Input
                            value={currentData.postal_code}
                            onChange={(e) => handleInputChange('postal_code', e.target.value)}
                            className="bg-white/50 dark:bg-slate-950/40 border-slate-200/50 dark:border-slate-800/50 rounded-xl focus:border-sky-500"
                          />
                        ) : (
                          <p className="text-slate-500 dark:text-slate-455 py-2 font-medium">{currentData.postal_code || 'Not provided'}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Professional Information Tab */}
              <TabsContent value="professional" className="space-y-6 mt-6">
                <Card className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-md border border-gray-200/50 dark:border-slate-800/50 shadow-xl rounded-2xl overflow-hidden">
                  <CardHeader className="border-b border-slate-250/20 dark:border-white/5 pb-4">
                    <CardTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Award className="w-5 h-5 text-emerald-500" />
                      Professional Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6 pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">Medical License</label>
                        {isEditing ? (
                          <Input
                            value={currentData.medical_license}
                            onChange={(e) => handleInputChange('medical_license', e.target.value)}
                            className="bg-white/50 dark:bg-slate-950/40 border-slate-200/50 dark:border-slate-800/50 rounded-xl focus:border-sky-500"
                          />
                        ) : (
                          <p className="text-slate-500 dark:text-slate-455 py-2 font-medium">{currentData.medical_license || 'Not provided'}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">Experience (Years)</label>
                        {isEditing ? (
                          <Input
                            type="number"
                            value={currentData.experience_years}
                            onChange={(e) => handleInputChange('experience_years', parseInt(e.target.value))}
                            className="bg-white/50 dark:bg-slate-950/40 border-slate-200/50 dark:border-slate-800/50 rounded-xl focus:border-sky-500"
                          />
                        ) : (
                          <p className="text-slate-500 dark:text-slate-455 py-2 font-medium">{currentData.experience_years} years</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">Specializations</label>
                      {isEditing ? (
                        <div className="space-y-2">
                          {currentData.specializations.map((spec, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <Input
                                value={spec}
                                onChange={(e) => {
                                  const newSpecs = [...currentData.specializations];
                                  newSpecs[index] = e.target.value;
                                  handleInputChange('specializations', newSpecs);
                                }}
                                className="bg-white/50 dark:bg-slate-950/40 border-slate-200/50 dark:border-slate-800/50 rounded-xl focus:border-sky-500"
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const newSpecs = currentData.specializations.filter((_, i) => i !== index);
                                  handleInputChange('specializations', newSpecs);
                                }}
                                className="border-rose-500/50 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              handleInputChange('specializations', [...currentData.specializations, '']);
                            }}
                            className="border-emerald-500/50 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 rounded-xl"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Specialization
                          </Button>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2 pt-1.5">
                          {currentData.specializations.map((spec, index) => (
                            <Badge key={index} className="bg-sky-500/10 text-sky-750 dark:text-sky-400 border border-sky-500/20">
                              {spec}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">Qualifications</label>
                      {isEditing ? (
                        <div className="space-y-2">
                          {currentData.qualifications.map((qual, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <Input
                                value={qual}
                                onChange={(e) => {
                                  const newQuals = [...currentData.qualifications];
                                  newQuals[index] = e.target.value;
                                  handleInputChange('qualifications', newQuals);
                                }}
                                className="bg-white/50 dark:bg-slate-950/40 border-slate-200/50 dark:border-slate-800/50 rounded-xl focus:border-sky-500"
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const newQuals = currentData.qualifications.filter((_, i) => i !== index);
                                  handleInputChange('qualifications', newQuals);
                                }}
                                className="border-rose-500/50 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              handleInputChange('qualifications', [...currentData.qualifications, '']);
                            }}
                            className="border-emerald-500/50 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 rounded-xl"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Qualification
                          </Button>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2 pt-1.5">
                          {currentData.qualifications.map((qual, index) => (
                            <Badge key={index} className="bg-emerald-500/10 text-emerald-750 dark:text-emerald-400 border border-emerald-500/20">
                              {qual}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">Languages</label>
                      {isEditing ? (
                        <div className="space-y-2">
                          {currentData.languages.map((lang, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <Input
                                value={lang}
                                onChange={(e) => {
                                  const newLangs = [...currentData.languages];
                                  newLangs[index] = e.target.value;
                                  handleInputChange('languages', newLangs);
                                }}
                                className="bg-white/50 dark:bg-slate-950/40 border-slate-200/50 dark:border-slate-800/50 rounded-xl focus:border-sky-500"
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const newLangs = currentData.languages.filter((_, i) => i !== index);
                                  handleInputChange('languages', newLangs);
                                }}
                                className="border-rose-500/50 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              handleInputChange('languages', [...currentData.languages, '']);
                            }}
                            className="border-emerald-500/50 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 rounded-xl"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Language
                          </Button>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2 pt-1.5">
                          {currentData.languages.map((lang, index) => (
                            <Badge key={index} className="bg-purple-500/10 text-purple-750 dark:text-purple-400 border border-purple-500/20">
                              {lang}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">Professional Bio</label>
                      {isEditing ? (
                        <Textarea
                          value={currentData.bio}
                          onChange={(e) => handleInputChange('bio', e.target.value)}
                          className="bg-white/50 dark:bg-slate-950/40 border-slate-200/50 dark:border-slate-800/50 rounded-xl focus:border-sky-500"
                          rows={4}
                          placeholder="Write a brief professional bio..."
                        />
                      ) : (
                        <p className="text-slate-500 dark:text-slate-455 py-2 font-medium leading-relaxed">{currentData.bio || 'No professional bio provided'}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Clinic Information Tab */}
              <TabsContent value="clinic" className="space-y-6 mt-6">
                <Card className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-md border border-gray-200/50 dark:border-slate-800/50 shadow-xl rounded-2xl overflow-hidden">
                  <CardHeader className="border-b border-slate-250/20 dark:border-white/5 pb-4">
                    <CardTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-amber-500" />
                      Clinic Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6 pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">Clinic Name</label>
                        {isEditing ? (
                          <Input
                            value={currentData.clinic_name}
                            onChange={(e) => handleInputChange('clinic_name', e.target.value)}
                            className="bg-white/50 dark:bg-slate-950/40 border-slate-200/50 dark:border-slate-800/50 rounded-xl focus:border-sky-500"
                          />
                        ) : (
                          <p className="text-slate-500 dark:text-slate-455 py-2 font-medium">{currentData.clinic_name}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">Clinic Phone</label>
                        {isEditing ? (
                          <Input
                            value={currentData.clinic_phone}
                            onChange={(e) => handleInputChange('clinic_phone', e.target.value)}
                            className="bg-white/50 dark:bg-slate-950/40 border-slate-200/50 dark:border-slate-800/50 rounded-xl focus:border-sky-500"
                          />
                        ) : (
                          <p className="text-slate-500 dark:text-slate-455 py-2 font-medium">{currentData.clinic_phone || 'Not provided'}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">Clinic Address</label>
                      {isEditing ? (
                        <Textarea
                          value={currentData.clinic_address}
                          onChange={(e) => handleInputChange('clinic_address', e.target.value)}
                          className="bg-white/50 dark:bg-slate-950/40 border-slate-200/50 dark:border-slate-800/50 rounded-xl focus:border-sky-500"
                          rows={3}
                        />
                      ) : (
                        <p className="text-slate-500 dark:text-slate-455 py-2 font-medium">{currentData.clinic_address || 'Not provided'}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">Website</label>
                      {isEditing ? (
                        <Input
                          type="url"
                          value={currentData.website || ''}
                          onChange={(e) => handleInputChange('website', e.target.value)}
                          className="bg-white/50 dark:bg-slate-950/40 border-slate-200/50 dark:border-slate-800/50 rounded-xl focus:border-sky-500"
                          placeholder="https://your-clinic-website.com"
                        />
                      ) : (
                        <p className="text-slate-500 dark:text-slate-455 py-2 font-medium">{currentData.website || 'Not provided'}</p>
                      )}
                    </div>

                    <Separator className="border-slate-200/50 dark:border-white/5" />

                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Consultation Fees</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-3 bg-white/40 dark:bg-slate-950/20 border border-slate-200/30 dark:border-white/5 rounded-2xl">
                          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Consultation Fee</label>
                          {isEditing ? (
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 font-semibold">₹</span>
                              <Input
                                type="number"
                                value={currentData.consultation_fee}
                                onChange={(e) => handleInputChange('consultation_fee', parseInt(e.target.value))}
                                className="pl-8 bg-white/50 dark:bg-slate-950/40 border-slate-200/50 dark:border-slate-800/50 rounded-xl focus:border-sky-500"
                              />
                            </div>
                          ) : (
                            <p className="text-lg font-bold text-slate-900 dark:text-white">₹{currentData.consultation_fee}</p>
                          )}
                        </div>

                        <div className="p-3 bg-white/40 dark:bg-slate-950/20 border border-slate-200/30 dark:border-white/5 rounded-2xl">
                          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Follow-up Fee</label>
                          {isEditing ? (
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 font-semibold">₹</span>
                              <Input
                                type="number"
                                value={currentData.follow_up_fee}
                                onChange={(e) => handleInputChange('follow_up_fee', parseInt(e.target.value))}
                                className="pl-8 bg-white/50 dark:bg-slate-950/40 border-slate-200/50 dark:border-slate-800/50 rounded-xl focus:border-sky-500"
                              />
                            </div>
                          ) : (
                            <p className="text-lg font-bold text-slate-900 dark:text-white">₹{currentData.follow_up_fee}</p>
                          )}
                        </div>

                        <div className="p-3 bg-white/40 dark:bg-slate-950/20 border border-slate-200/30 dark:border-white/5 rounded-2xl">
                          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Emergency Fee</label>
                          {isEditing ? (
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 font-semibold">₹</span>
                              <Input
                                type="number"
                                value={currentData.emergency_fee}
                                onChange={(e) => handleInputChange('emergency_fee', parseInt(e.target.value))}
                                className="pl-8 bg-white/50 dark:bg-slate-950/40 border-slate-200/50 dark:border-slate-800/50 rounded-xl focus:border-sky-500"
                              />
                            </div>
                          ) : (
                            <p className="text-lg font-bold text-slate-900 dark:text-white">₹{currentData.emergency_fee}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <Separator className="border-slate-200/50 dark:border-white/5" />

                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Social Media</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">LinkedIn</label>
                          {isEditing ? (
                            <Input
                              type="url"
                              value={currentData.social_media?.linkedin || ''}
                              onChange={(e) => handleInputChange('social_media', {
                                ...currentData.social_media,
                                linkedin: e.target.value
                              })}
                              className="bg-white/50 dark:bg-slate-950/40 border-slate-200/50 dark:border-slate-800/50 rounded-xl focus:border-sky-500"
                              placeholder="https://linkedin.com/in/your-profile"
                            />
                          ) : (
                            <p className="text-slate-500 dark:text-slate-455 py-2 font-medium">
                              {currentData.social_media?.linkedin || 'Not provided'}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">Twitter</label>
                          {isEditing ? (
                            <Input
                              type="url"
                              value={currentData.social_media?.twitter || ''}
                              onChange={(e) => handleInputChange('social_media', {
                                ...currentData.social_media,
                                twitter: e.target.value
                              })}
                              className="bg-white/50 dark:bg-slate-950/40 border-slate-200/50 dark:border-slate-800/50 rounded-xl focus:border-sky-500"
                              placeholder="https://twitter.com/your-handle"
                            />
                          ) : (
                            <p className="text-slate-500 dark:text-slate-455 py-2 font-medium">
                              {currentData.social_media?.twitter || 'Not provided'}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Preferences Tab */}
              <TabsContent value="preferences" className="space-y-6 mt-6">
                <Card className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-md border border-gray-200/50 dark:border-slate-800/50 shadow-xl rounded-2xl overflow-hidden">
                  <CardHeader className="border-b border-slate-250/20 dark:border-white/5 pb-4">
                    <CardTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Shield className="w-5 h-5 text-purple-500" />
                      Account Preferences
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6 pt-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">Availability Status</label>
                      {isEditing ? (
                        <Select
                          value={currentData.availability_status}
                          onValueChange={(value) => handleInputChange('availability_status', value)}
                        >
                          <SelectTrigger className="bg-white/50 dark:bg-slate-950/40 border-slate-200/50 dark:border-slate-800/50 rounded-xl">
                            <SelectValue placeholder="Select availability status" />
                          </SelectTrigger>
                          <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl">
                            <SelectItem value="available">Available</SelectItem>
                            <SelectItem value="busy">Busy</SelectItem>
                            <SelectItem value="offline">Offline</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge
                          className={`${
                            currentData.availability_status === 'available' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20' :
                            currentData.availability_status === 'busy' ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20' :
                            'bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20'
                          } border capitalize`}
                        >
                          {currentData.availability_status}
                        </Badge>
                      )}
                    </div>

                    <Separator className="border-slate-200/50 dark:border-white/5" />

                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Appointment Settings</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 rounded-xl bg-white/40 dark:bg-slate-950/20 border border-slate-200/30 dark:border-white/5">
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white">Auto-accept Appointments</p>
                            <p className="text-xs text-slate-500 dark:text-slate-455">Automatically accept new appointment requests</p>
                          </div>
                          {isEditing ? (
                            <Switch
                              checked={currentData.auto_accept_appointments}
                              onCheckedChange={(checked) => handleInputChange('auto_accept_appointments', checked)}
                            />
                          ) : (
                            <Badge className={currentData.auto_accept_appointments ? 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20' : 'bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20'}>
                              {currentData.auto_accept_appointments ? 'Enabled' : 'Disabled'}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <Separator className="border-slate-200/50 dark:border-white/5" />

                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Notification Preferences</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 rounded-xl bg-white/40 dark:bg-slate-950/20 border border-slate-200/30 dark:border-white/5">
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white">Email Notifications</p>
                            <p className="text-xs text-slate-500 dark:text-slate-455">Receive notifications via email</p>
                          </div>
                          {isEditing ? (
                            <Switch
                              checked={currentData.email_notifications}
                              onCheckedChange={(checked) => handleInputChange('email_notifications', checked)}
                            />
                          ) : (
                            <Badge className={currentData.email_notifications ? 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20' : 'bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20'}>
                              {currentData.email_notifications ? 'Enabled' : 'Disabled'}
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-xl bg-white/40 dark:bg-slate-950/20 border border-slate-200/30 dark:border-white/5">
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white">SMS Notifications</p>
                            <p className="text-xs text-slate-500 dark:text-slate-455">Receive notifications via SMS</p>
                          </div>
                          {isEditing ? (
                            <Switch
                              checked={currentData.sms_notifications}
                              onCheckedChange={(checked) => handleInputChange('sms_notifications', checked)}
                            />
                          ) : (
                            <Badge className={currentData.sms_notifications ? 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20' : 'bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20'}>
                              {currentData.sms_notifications ? 'Enabled' : 'Disabled'}
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-xl bg-white/40 dark:bg-slate-950/20 border border-slate-200/30 dark:border-white/5">
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white">Push Notifications</p>
                            <p className="text-xs text-slate-500 dark:text-slate-455">Receive push notifications on your device</p>
                          </div>
                          {isEditing ? (
                            <Switch
                              checked={currentData.push_notifications}
                              onCheckedChange={(checked) => handleInputChange('push_notifications', checked)}
                            />
                          ) : (
                            <Badge className={currentData.push_notifications ? 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20' : 'bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20'}>
                              {currentData.push_notifications ? 'Enabled' : 'Disabled'}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>

      </div>
    </div>
  );
}
