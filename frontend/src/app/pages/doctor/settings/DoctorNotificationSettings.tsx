import React from 'react';
import { motion } from 'motion/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import {
  ArrowLeft, Bell, Mail, MessageSquare, Smartphone, Calendar,
  Users, AlertTriangle, CheckCircle, Settings, Volume2, VolumeX,
  Clock, Shield, Zap, Save, RotateCcw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { preferencesAPI } from '@/lib/api';

interface NotificationSettings {
  id: string;
  doctor_id: string;

  // Email Notifications
  email_enabled: boolean;
  email_appointments: boolean;
  email_cancellations: boolean;
  email_reminders: boolean;
  email_messages: boolean;
  email_reviews: boolean;
  email_system_updates: boolean;
  email_marketing: boolean;

  // SMS Notifications
  sms_enabled: boolean;
  sms_appointments: boolean;
  sms_cancellations: boolean;
  sms_reminders: boolean;
  sms_emergency: boolean;

  // Push Notifications
  push_enabled: boolean;
  push_appointments: boolean;
  push_cancellations: boolean;
  push_messages: boolean;
  push_reminders: boolean;
  push_reviews: boolean;
  push_emergency: boolean;

  // Timing Settings
  reminder_timing: number; // hours before appointment
  quiet_hours_start: string;
  quiet_hours_end: string;
  weekend_notifications: boolean;

  // Frequency Settings
  digest_frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
  summary_frequency: 'daily' | 'weekly' | 'monthly';

  // Sound Settings
  notification_sound: boolean;
  sound_type: 'default' | 'gentle' | 'professional' | 'urgent';
}

export default function DoctorNotificationSettings() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = React.useState('channels');
  const [localSettings, setLocalSettings] = React.useState<Partial<NotificationSettings>>({});
  const [hasChanges, setHasChanges] = React.useState(false);

  const { data: remoteSettings, isLoading } = useQuery({
    queryKey: ['doctor-notification-settings'],
    queryFn: async (): Promise<NotificationSettings> => {
      const res = await preferencesAPI.getNotificationPreferences();
      return res.data;
    }
  });

  const settings = { ...remoteSettings, ...localSettings } as NotificationSettings;

  const updateSettingsMutation = useMutation({
    mutationFn: async (updatedSettings: Partial<NotificationSettings>) => {
      const res = await preferencesAPI.saveNotificationPreferences(updatedSettings);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-notification-settings'] });
      setHasChanges(false);
      setLocalSettings({});
    }
  });

  const handleSettingChange = (key: keyof NotificationSettings, value: any) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    updateSettingsMutation.mutate(localSettings);
  };

  const handleReset = () => {
    setLocalSettings({});
    setHasChanges(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pt-3 pb-12 px-6 bg-transparent text-slate-900 dark:text-white">
        <div className="max-w-4xl mx-auto space-y-8">
          <Skeleton className="w-[300px] h-[40px] bg-slate-200 dark:bg-slate-800" />
          <div className="space-y-6">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-[200px] rounded-2xl bg-slate-200 dark:bg-slate-800" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="min-h-screen pt-3 pb-12 px-6 bg-transparent text-slate-900 dark:text-white">
        <div className="max-w-4xl mx-auto text-center py-12">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Settings Not Found</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6">Unable to load your notification settings.</p>
          <Button onClick={() => navigate('/doctor/settings')} className="bg-sky-500 hover:bg-sky-600 text-white rounded-xl shadow-lg shadow-sky-500/25">
            Back to Settings
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-3 pb-12 px-6 bg-transparent text-slate-900 dark:text-white transition-colors duration-300">
      <div className="max-w-4xl mx-auto space-y-8">

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
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Notification Settings</h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Manage how and when you receive notifications</p>
            </div>
          </div>
          <div className="flex gap-3">
            {hasChanges && (
              <>
                <Button
                  variant="outline"
                  onClick={handleReset}
                  className="rounded-xl border-slate-200/50 dark:border-white/10 text-rose-500 hover:bg-rose-500/10 border-rose-500/30 hover:border-rose-500/50 transition-all duration-300"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={updateSettingsMutation.isPending}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all duration-300"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {updateSettingsMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </>
            )}
          </div>
        </motion.div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-white/40 dark:bg-slate-900/40 border border-slate-200/50 dark:border-white/5 p-1 rounded-xl">
            <TabsTrigger value="channels" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm">Channels</TabsTrigger>
            <TabsTrigger value="types" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm">Types</TabsTrigger>
            <TabsTrigger value="timing" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm">Timing</TabsTrigger>
            <TabsTrigger value="preferences" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm">Preferences</TabsTrigger>
          </TabsList>

          {/* Notification Channels Tab */}
          <TabsContent value="channels" className="space-y-6 mt-6">

            {/* Email Notifications */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-md border border-gray-200/50 dark:border-slate-800/50 shadow-xl rounded-2xl overflow-hidden">
                <CardHeader className="border-b border-slate-250/20 dark:border-white/5 pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Mail className="w-5 h-5 text-sky-500" />
                      Email Notifications
                    </CardTitle>
                    <Switch
                      checked={settings.email_enabled}
                      onCheckedChange={(checked) => handleSettingChange('email_enabled', checked)}
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/40 dark:bg-slate-950/20 border border-slate-200/30 dark:border-white/5">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">New Appointments</p>
                        <p className="text-xs text-slate-500 dark:text-slate-455">When patients book appointments</p>
                      </div>
                      <Switch
                        checked={settings.email_appointments}
                        onCheckedChange={(checked) => handleSettingChange('email_appointments', checked)}
                        disabled={!settings.email_enabled}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/40 dark:bg-slate-950/20 border border-slate-200/30 dark:border-white/5">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">Cancellations</p>
                        <p className="text-xs text-slate-500 dark:text-slate-455">When appointments are cancelled</p>
                      </div>
                      <Switch
                        checked={settings.email_cancellations}
                        onCheckedChange={(checked) => handleSettingChange('email_cancellations', checked)}
                        disabled={!settings.email_enabled}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/40 dark:bg-slate-950/20 border border-slate-200/30 dark:border-white/5">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">Appointment Reminders</p>
                        <p className="text-xs text-slate-500 dark:text-slate-455">Upcoming appointment alerts</p>
                      </div>
                      <Switch
                        checked={settings.email_reminders}
                        onCheckedChange={(checked) => handleSettingChange('email_reminders', checked)}
                        disabled={!settings.email_enabled}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/40 dark:bg-slate-950/20 border border-slate-200/30 dark:border-white/5">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">Patient Messages</p>
                        <p className="text-xs text-slate-500 dark:text-slate-455">New messages from patients</p>
                      </div>
                      <Switch
                        checked={settings.email_messages}
                        onCheckedChange={(checked) => handleSettingChange('email_messages', checked)}
                        disabled={!settings.email_enabled}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/40 dark:bg-slate-950/20 border border-slate-200/30 dark:border-white/5">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">Reviews & Ratings</p>
                        <p className="text-xs text-slate-500 dark:text-slate-455">New patient reviews</p>
                      </div>
                      <Switch
                        checked={settings.email_reviews}
                        onCheckedChange={(checked) => handleSettingChange('email_reviews', checked)}
                        disabled={!settings.email_enabled}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/40 dark:bg-slate-950/20 border border-slate-200/30 dark:border-white/5">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">System Updates</p>
                        <p className="text-xs text-slate-500 dark:text-slate-455">Platform updates and announcements</p>
                      </div>
                      <Switch
                        checked={settings.email_system_updates}
                        onCheckedChange={(checked) => handleSettingChange('email_system_updates', checked)}
                        disabled={!settings.email_enabled}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* SMS Notifications */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-md border border-gray-200/50 dark:border-slate-800/50 shadow-xl rounded-2xl overflow-hidden">
                <CardHeader className="border-b border-slate-250/20 dark:border-white/5 pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-emerald-500" />
                      SMS Notifications
                    </CardTitle>
                    <Switch
                      checked={settings.sms_enabled}
                      onCheckedChange={(checked) => handleSettingChange('sms_enabled', checked)}
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/40 dark:bg-slate-950/20 border border-slate-200/30 dark:border-white/5">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">New Appointments</p>
                        <p className="text-xs text-slate-500 dark:text-slate-455">Instant SMS alerts</p>
                      </div>
                      <Switch
                        checked={settings.sms_appointments}
                        onCheckedChange={(checked) => handleSettingChange('sms_appointments', checked)}
                        disabled={!settings.sms_enabled}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/40 dark:bg-slate-950/20 border border-slate-200/30 dark:border-white/5">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">Cancellations</p>
                        <p className="text-xs text-slate-500 dark:text-slate-455">Immediate cancellation alerts</p>
                      </div>
                      <Switch
                        checked={settings.sms_cancellations}
                        onCheckedChange={(checked) => handleSettingChange('sms_cancellations', checked)}
                        disabled={!settings.sms_enabled}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/40 dark:bg-slate-950/20 border border-slate-200/30 dark:border-white/5">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">Emergency Alerts</p>
                        <p className="text-xs text-slate-500 dark:text-slate-455">Critical notifications only</p>
                      </div>
                      <Switch
                        checked={settings.sms_emergency}
                        onCheckedChange={(checked) => handleSettingChange('sms_emergency', checked)}
                        disabled={!settings.sms_enabled}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Push Notifications */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-md border border-gray-200/50 dark:border-slate-800/50 shadow-xl rounded-2xl overflow-hidden">
                <CardHeader className="border-b border-slate-250/20 dark:border-white/5 pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Smartphone className="w-5 h-5 text-purple-500" />
                      Push Notifications
                    </CardTitle>
                    <Switch
                      checked={settings.push_enabled}
                      onCheckedChange={(checked) => handleSettingChange('push_enabled', checked)}
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/40 dark:bg-slate-950/20 border border-slate-200/30 dark:border-white/5">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">Appointments</p>
                        <p className="text-xs text-slate-500 dark:text-slate-455">New and updated appointments</p>
                      </div>
                      <Switch
                        checked={settings.push_appointments}
                        onCheckedChange={(checked) => handleSettingChange('push_appointments', checked)}
                        disabled={!settings.push_enabled}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/40 dark:bg-slate-950/20 border border-slate-200/30 dark:border-white/5">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">Messages</p>
                        <p className="text-xs text-slate-500 dark:text-slate-455">Patient messages</p>
                      </div>
                      <Switch
                        checked={settings.push_messages}
                        onCheckedChange={(checked) => handleSettingChange('push_messages', checked)}
                        disabled={!settings.push_enabled}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/40 dark:bg-slate-950/20 border border-slate-200/30 dark:border-white/5">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">Reminders</p>
                        <p className="text-xs text-slate-500 dark:text-slate-455">Upcoming appointments</p>
                      </div>
                      <Switch
                        checked={settings.push_reminders}
                        onCheckedChange={(checked) => handleSettingChange('push_reminders', checked)}
                        disabled={!settings.push_enabled}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/40 dark:bg-slate-950/20 border border-slate-200/30 dark:border-white/5">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">Emergency</p>
                        <p className="text-xs text-slate-500 dark:text-slate-455">Critical alerts</p>
                      </div>
                      <Switch
                        checked={settings.push_emergency}
                        onCheckedChange={(checked) => handleSettingChange('push_emergency', checked)}
                        disabled={!settings.push_enabled}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Notification Types Tab */}
          <TabsContent value="types" className="space-y-6 mt-6">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-md border border-gray-200/50 dark:border-slate-800/50 shadow-xl rounded-2xl overflow-hidden">
                <CardHeader className="border-b border-slate-250/20 dark:border-white/5 pb-4">
                  <CardTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Bell className="w-5 h-5 text-amber-500" />
                    Notification Categories
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">

                  {/* Appointments */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-sky-500" />
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Appointments</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-4 md:ml-8">
                      <div className="text-center p-4 bg-white/40 dark:bg-slate-950/40 border border-slate-200/30 dark:border-white/5 shadow-sm rounded-xl">
                        <Mail className="w-6 h-6 text-sky-500 mx-auto mb-2" />
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">Email</p>
                        <Badge
                          className={`mt-1.5 ${
                            settings.email_appointments
                              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                              : 'bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20'
                          }`}
                        >
                          {settings.email_appointments ? 'On' : 'Off'}
                        </Badge>
                      </div>
                      <div className="text-center p-4 bg-white/40 dark:bg-slate-950/40 border border-slate-200/30 dark:border-white/5 shadow-sm rounded-xl">
                        <MessageSquare className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">SMS</p>
                        <Badge
                          className={`mt-1.5 ${
                            settings.sms_appointments
                              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                              : 'bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20'
                          }`}
                        >
                          {settings.sms_appointments ? 'On' : 'Off'}
                        </Badge>
                      </div>
                      <div className="text-center p-4 bg-white/40 dark:bg-slate-950/40 border border-slate-200/30 dark:border-white/5 shadow-sm rounded-xl">
                        <Smartphone className="w-6 h-6 text-purple-500 mx-auto mb-2" />
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">Push</p>
                        <Badge
                          className={`mt-1.5 ${
                            settings.push_appointments
                              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                              : 'bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20'
                          }`}
                        >
                          {settings.push_appointments ? 'On' : 'Off'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <Separator className="border-slate-200/50 dark:border-white/5" />

                  {/* Messages */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-emerald-500" />
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Patient Messages</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-4 md:ml-8">
                      <div className="text-center p-4 bg-white/40 dark:bg-slate-950/40 border border-slate-200/30 dark:border-white/5 shadow-sm rounded-xl">
                        <Mail className="w-6 h-6 text-sky-500 mx-auto mb-2" />
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">Email</p>
                        <Badge
                          className={`mt-1.5 ${
                            settings.email_messages
                              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                              : 'bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20'
                          }`}
                        >
                          {settings.email_messages ? 'On' : 'Off'}
                        </Badge>
                      </div>
                      <div className="text-center p-4 bg-white/40 dark:bg-slate-950/40 border border-slate-200/30 dark:border-white/5 shadow-sm rounded-xl opacity-50">
                        <MessageSquare className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                        <p className="text-sm font-semibold text-slate-400">SMS</p>
                        <Badge variant="secondary" className="mt-1.5">N/A</Badge>
                      </div>
                      <div className="text-center p-4 bg-white/40 dark:bg-slate-950/40 border border-slate-200/30 dark:border-white/5 shadow-sm rounded-xl">
                        <Smartphone className="w-6 h-6 text-purple-500 mx-auto mb-2" />
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">Push</p>
                        <Badge
                          className={`mt-1.5 ${
                            settings.push_messages
                              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                              : 'bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20'
                          }`}
                        >
                          {settings.push_messages ? 'On' : 'Off'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <Separator className="border-slate-200/50 dark:border-white/5" />

                  {/* Emergency */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-5 h-5 text-rose-500" />
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Emergency Alerts</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-4 md:ml-8">
                      <div className="text-center p-4 bg-white/40 dark:bg-slate-950/40 border border-slate-200/30 dark:border-white/5 shadow-sm rounded-xl opacity-50">
                        <Mail className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                        <p className="text-sm font-semibold text-slate-400">Email</p>
                        <Badge variant="secondary" className="mt-1.5">N/A</Badge>
                      </div>
                      <div className="text-center p-4 bg-white/40 dark:bg-slate-950/40 border border-slate-200/30 dark:border-white/5 shadow-sm rounded-xl">
                        <MessageSquare className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">SMS</p>
                        <Badge
                          className={`mt-1.5 ${
                            settings.sms_emergency
                              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                              : 'bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20'
                          }`}
                        >
                          {settings.sms_emergency ? 'On' : 'Off'}
                        </Badge>
                      </div>
                      <div className="text-center p-4 bg-white/40 dark:bg-slate-950/40 border border-slate-200/30 dark:border-white/5 shadow-sm rounded-xl">
                        <Smartphone className="w-6 h-6 text-purple-500 mx-auto mb-2" />
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">Push</p>
                        <Badge
                          className={`mt-1.5 ${
                            settings.push_emergency
                              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                              : 'bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20'
                          }`}
                        >
                          {settings.push_emergency ? 'On' : 'Off'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Timing Tab */}
          <TabsContent value="timing" className="space-y-6 mt-6">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-md border border-gray-200/50 dark:border-slate-800/50 shadow-xl rounded-2xl overflow-hidden">
                <CardHeader className="border-b border-slate-250/20 dark:border-white/5 pb-4">
                  <CardTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Clock className="w-5 h-5 text-purple-500" />
                    Timing & Schedule
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">Reminder Timing</label>
                      <Select
                        value={settings.reminder_timing.toString()}
                        onValueChange={(value) => handleSettingChange('reminder_timing', parseInt(value))}
                      >
                        <SelectTrigger className="bg-white/50 dark:bg-slate-950/40 border-slate-200/50 dark:border-slate-800/50 rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl">
                          <SelectItem value="1">1 hour before</SelectItem>
                          <SelectItem value="2">2 hours before</SelectItem>
                          <SelectItem value="4">4 hours before</SelectItem>
                          <SelectItem value="24">24 hours before</SelectItem>
                          <SelectItem value="48">48 hours before</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-slate-505 mt-1">When to send appointment reminders</p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">Digest Frequency</label>
                      <Select
                        value={settings.digest_frequency}
                        onValueChange={(value) => handleSettingChange('digest_frequency', value)}
                      >
                        <SelectTrigger className="bg-white/50 dark:bg-slate-950/40 border-slate-200/50 dark:border-slate-800/50 rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl">
                          <SelectItem value="immediate">Immediate</SelectItem>
                          <SelectItem value="hourly">Hourly</SelectItem>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-slate-505 mt-1">How often to group notifications</p>
                    </div>
                  </div>

                  <Separator className="border-slate-200/50 dark:border-white/5" />

                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Quiet Hours</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">Start Time</label>
                        <input
                          type="time"
                          value={settings.quiet_hours_start}
                          onChange={(e) => handleSettingChange('quiet_hours_start', e.target.value)}
                          className="w-full px-3 py-2 bg-white/50 dark:bg-slate-950/40 border border-slate-205 dark:border-slate-800/50 rounded-xl focus:border-sky-500 focus:outline-none dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">End Time</label>
                        <input
                          type="time"
                          value={settings.quiet_hours_end}
                          onChange={(e) => handleSettingChange('quiet_hours_end', e.target.value)}
                          className="w-full px-3 py-2 bg-white/50 dark:bg-slate-950/40 border border-slate-205 dark:border-slate-800/50 rounded-xl focus:border-sky-500 focus:outline-none dark:text-white"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-455 mt-2">No notifications during these hours (except emergencies)</p>
                  </div>

                  <Separator className="border-slate-200/50 dark:border-white/5" />

                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/40 dark:bg-slate-950/20 border border-slate-200/30 dark:border-white/5">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">Weekend Notifications</p>
                      <p className="text-xs text-slate-500 dark:text-slate-455">Receive notifications on weekends</p>
                    </div>
                    <Switch
                      checked={settings.weekend_notifications}
                      onCheckedChange={(checked) => handleSettingChange('weekend_notifications', checked)}
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences" className="space-y-6 mt-6">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-md border border-gray-200/50 dark:border-slate-800/50 shadow-xl rounded-2xl overflow-hidden">
                <CardHeader className="border-b border-slate-250/20 dark:border-white/5 pb-4">
                  <CardTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Settings className="w-5 h-5 text-emerald-500" />
                    Sound & Display
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">

                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/40 dark:bg-slate-950/20 border border-slate-200/30 dark:border-white/5">
                    <div className="flex items-center gap-3">
                      {settings.notification_sound ? (
                        <Volume2 className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <VolumeX className="w-5 h-5 text-slate-400" />
                      )}
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">Notification Sounds</p>
                        <p className="text-xs text-slate-505">Play sound for notifications</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.notification_sound}
                      onCheckedChange={(checked) => handleSettingChange('notification_sound', checked)}
                    />
                  </div>

                  {settings.notification_sound && (
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">Sound Type</label>
                      <Select
                        value={settings.sound_type}
                        onValueChange={(value) => handleSettingChange('sound_type', value)}
                      >
                        <SelectTrigger className="bg-white/50 dark:bg-slate-950/40 border-slate-200/50 dark:border-slate-800/50 rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl">
                          <SelectItem value="default">Default</SelectItem>
                          <SelectItem value="gentle">Gentle</SelectItem>
                          <SelectItem value="professional">Professional</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <Separator className="border-slate-200/50 dark:border-white/5" />

                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Summary Reports</h3>
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">Summary Frequency</label>
                      <Select
                        value={settings.summary_frequency}
                        onValueChange={(value) => handleSettingChange('summary_frequency', value)}
                      >
                        <SelectTrigger className="bg-white/50 dark:bg-slate-950/40 border-slate-200/50 dark:border-slate-800/50 rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl">
                          <SelectItem value="daily">Daily Summary</SelectItem>
                          <SelectItem value="weekly">Weekly Summary</SelectItem>
                          <SelectItem value="monthly">Monthly Summary</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-slate-505 mt-1">Receive periodic activity summaries</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Test Notifications */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-md border border-gray-200/50 dark:border-slate-800/50 shadow-xl rounded-2xl overflow-hidden">
                <CardHeader className="border-b border-slate-250/20 dark:border-white/5 pb-4">
                  <CardTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-500" />
                    Test Notifications
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button
                      variant="outline"
                      className="border-sky-500/50 text-sky-600 dark:text-sky-400 hover:bg-sky-500/10 rounded-xl transition-all"
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Test Email
                    </Button>
                    <Button
                      variant="outline"
                      className="border-emerald-500/50 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 rounded-xl transition-all"
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Test SMS
                    </Button>
                    <Button
                      variant="outline"
                      className="border-purple-500/50 text-purple-600 dark:text-purple-400 hover:bg-purple-500/10 rounded-xl transition-all"
                    >
                      <Smartphone className="w-4 h-4 mr-2" />
                      Test Push
                    </Button>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-455 mt-4 italic">
                    Send test notifications to verify your settings are working correctly
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>

      </div>
    </div>
  );
}
