import React from 'react';
import { motion } from 'motion/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import {
  ArrowLeft, Clock, Calendar, Plus, Trash2, Save, Edit,
  X, CheckCircle, AlertCircle, Copy, RotateCcw, Settings
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface TimeSlot {
  start_time: string;
  end_time: string;
  is_available: boolean;
}

interface DaySchedule {
  day: string;
  is_working_day: boolean;
  slots: TimeSlot[];
}

interface AvailabilitySettings {
  id: string;
  doctor_id: string;
  weekly_schedule: DaySchedule[];
  break_duration: number; // minutes
  slot_duration: number; // minutes
  advance_booking_days: number;
  same_day_booking: boolean;
  emergency_slots: boolean;
  buffer_time: number; // minutes between appointments
  auto_accept: boolean;
  timezone: string;
  special_dates: Array<{
    date: string;
    type: 'holiday' | 'special_hours' | 'unavailable';
    note?: string;
    custom_slots?: TimeSlot[];
  }>;
}
import { doctorAPI, authAPI } from '@/lib/api';

export default function DoctorAvailabilitySettings() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = React.useState('schedule');
  const [isEditing, setIsEditing] = React.useState(false);
  const [editingDay, setEditingDay] = React.useState<string | null>(null);

  const { data: availability, isLoading } = useQuery({
    queryKey: ['doctor-availability-settings'],
    queryFn: async (): Promise<AvailabilitySettings> => {
      const { data: { user } } = await authAPI.getCurrentUser();
      if (!user) throw new Error("Not authenticated");

      const response = await doctorAPI.getAvailability();
      const dbAvailability = response.data.availability || {};

      // Default weekly schedule if none exists
      const defaultSchedule: DaySchedule[] = [
        'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
      ].map(day => ({
        day,
        is_working_day: day !== 'Sunday',
        slots: day !== 'Sunday' ? [{ start_time: '09:00', end_time: '17:00', is_available: true }] : []
      }));

      return {
        id: user.id,
        doctor_id: user.id,
        weekly_schedule: dbAvailability.weekly_schedule || defaultSchedule,
        break_duration: dbAvailability.break_duration || 15,
        slot_duration: dbAvailability.slot_duration || 30,
        advance_booking_days: dbAvailability.advance_booking_days || 30,
        same_day_booking: dbAvailability.same_day_booking ?? true,
        emergency_slots: dbAvailability.emergency_slots ?? true,
        buffer_time: dbAvailability.buffer_time || 5,
        auto_accept: dbAvailability.auto_accept ?? true,
        timezone: dbAvailability.timezone || 'Asia/Kolkata',
        special_dates: dbAvailability.special_dates || []
      };
    }
  });

  const updateAvailabilityMutation = useMutation({
    mutationFn: async (updatedAvailability: Partial<AvailabilitySettings>) => {
      // Merge with current availability
      const newAvailability = {
        ...availability,
        ...updatedAvailability
      };

      const res = await doctorAPI.updateAvailability(newAvailability);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-availability-settings'] });
      setIsEditing(false);
      setEditingDay(null);
    }
  });

  const handleScheduleUpdate = (dayIndex: number, updatedSchedule: DaySchedule) => {
    if (!availability) return;

    const newWeeklySchedule = [...availability.weekly_schedule];
    newWeeklySchedule[dayIndex] = updatedSchedule;

    updateAvailabilityMutation.mutate({
      weekly_schedule: newWeeklySchedule
    });
  };

  const addTimeSlot = (dayIndex: number) => {
    if (!availability) return;

    const newSlot: TimeSlot = {
      start_time: '09:00',
      end_time: '10:00',
      is_available: true
    };

    const updatedSchedule = {
      ...availability.weekly_schedule[dayIndex],
      slots: [...availability.weekly_schedule[dayIndex].slots, newSlot]
    };

    handleScheduleUpdate(dayIndex, updatedSchedule);
  };

  const removeTimeSlot = (dayIndex: number, slotIndex: number) => {
    if (!availability) return;

    const updatedSchedule = {
      ...availability.weekly_schedule[dayIndex],
      slots: availability.weekly_schedule[dayIndex].slots.filter((_, i) => i !== slotIndex)
    };

    handleScheduleUpdate(dayIndex, updatedSchedule);
  };

  const copySchedule = (fromDayIndex: number, toDayIndex: number) => {
    if (!availability) return;

    const sourceSchedule = availability.weekly_schedule[fromDayIndex];
    const updatedSchedule = {
      ...availability.weekly_schedule[toDayIndex],
      slots: [...sourceSchedule.slots],
      is_working_day: sourceSchedule.is_working_day
    };

    handleScheduleUpdate(toDayIndex, updatedSchedule);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pt-3 pb-12 px-6 bg-transparent text-slate-900 dark:text-white">
        <div className="max-w-6xl mx-auto space-y-8">
          <Skeleton className="w-[300px] h-[40px] bg-slate-200 dark:bg-slate-800" />
          <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
            {[1, 2, 3, 4, 5, 6, 7].map(i => (
              <Skeleton key={i} className="h-[300px] rounded-2xl bg-slate-200 dark:bg-slate-800" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!availability) {
    return (
      <div className="min-h-screen pt-3 pb-12 px-6 bg-transparent text-slate-900 dark:text-white">
        <div className="max-w-6xl mx-auto text-center py-12">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Availability Settings Not Found</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6">Unable to load your availability settings.</p>
          <Button onClick={() => navigate('/doctor/settings')} className="bg-sky-500 hover:bg-sky-600 text-white rounded-xl shadow-lg shadow-sky-500/20">
            Back to Settings
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-3 pb-12 px-6 bg-transparent text-slate-900 dark:text-white transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-8">

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
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Availability Settings</h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Manage your working hours and appointment availability</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setIsEditing(!isEditing)}
              className={`rounded-xl border-slate-200/50 dark:border-white/10 transition-all duration-300 ${
                isEditing
                  ? 'border-rose-500 text-rose-500 hover:bg-rose-500 hover:text-white'
                  : 'bg-white/40 dark:bg-slate-900/30 hover:bg-white/70 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
              }`}
            >
              {isEditing ? <X className="w-4 h-4 mr-2" /> : <Edit className="w-4 h-4 mr-2" />}
              {isEditing ? 'Cancel' : 'Edit Schedule'}
            </Button>
            {isEditing && (
              <Button
                onClick={() => updateAvailabilityMutation.mutate({})}
                disabled={updateAvailabilityMutation.isPending}
                className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all duration-300 transform hover:-translate-y-0.5"
              >
                <Save className="w-4 h-4 mr-2" />
                {updateAvailabilityMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            )}
          </div>
        </motion.div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-white/40 dark:bg-slate-900/40 border border-slate-200/50 dark:border-white/5 p-1 rounded-xl">
            <TabsTrigger value="schedule" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm">Weekly Schedule</TabsTrigger>
            <TabsTrigger value="settings" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm">Booking Settings</TabsTrigger>
            <TabsTrigger value="special" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm">Special Dates</TabsTrigger>
          </TabsList>

          {/* Weekly Schedule Tab */}
          <TabsContent value="schedule" className="space-y-6 mt-6">

            {/* Quick Settings */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
            >
              <Card className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-md border border-gray-200/50 dark:border-slate-800/50 shadow-xl rounded-2xl overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Settings className="w-5 h-5 text-sky-500 animate-pulse" />
                    Quick Settings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-350 mb-2">Slot Duration</label>
                      <Select
                        value={availability.slot_duration.toString()}
                        onValueChange={(value) => updateAvailabilityMutation.mutate({ slot_duration: parseInt(value) })}
                        disabled={!isEditing}
                      >
                        <SelectTrigger className="bg-white/50 dark:bg-slate-950/40 border-slate-200/50 dark:border-slate-800/50 rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl">
                          <SelectItem value="15">15 minutes</SelectItem>
                          <SelectItem value="30">30 minutes</SelectItem>
                          <SelectItem value="45">45 minutes</SelectItem>
                          <SelectItem value="60">60 minutes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-350 mb-2">Break Duration</label>
                      <Select
                        value={availability.break_duration.toString()}
                        onValueChange={(value) => updateAvailabilityMutation.mutate({ break_duration: parseInt(value) })}
                        disabled={!isEditing}
                      >
                        <SelectTrigger className="bg-white/50 dark:bg-slate-950/40 border-slate-200/50 dark:border-slate-800/50 rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl">
                          <SelectItem value="5">5 minutes</SelectItem>
                          <SelectItem value="10">10 minutes</SelectItem>
                          <SelectItem value="15">15 minutes</SelectItem>
                          <SelectItem value="30">30 minutes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-350 mb-2">Buffer Time</label>
                      <Select
                        value={availability.buffer_time.toString()}
                        onValueChange={(value) => updateAvailabilityMutation.mutate({ buffer_time: parseInt(value) })}
                        disabled={!isEditing}
                      >
                        <SelectTrigger className="bg-white/50 dark:bg-slate-950/40 border-slate-200/50 dark:border-slate-800/50 rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl">
                          <SelectItem value="0">No buffer</SelectItem>
                          <SelectItem value="5">5 minutes</SelectItem>
                          <SelectItem value="10">10 minutes</SelectItem>
                          <SelectItem value="15">15 minutes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-350 mb-2">Timezone</label>
                      <Select
                        value={availability.timezone}
                        onValueChange={(value) => updateAvailabilityMutation.mutate({ timezone: value })}
                        disabled={!isEditing}
                      >
                        <SelectTrigger className="bg-white/50 dark:bg-slate-950/40 border-slate-200/50 dark:border-slate-800/50 rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl">
                          <SelectItem value="Asia/Kolkata">Asia/Kolkata (IST)</SelectItem>
                          <SelectItem value="America/New_York">America/New_York (EST)</SelectItem>
                          <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                          <SelectItem value="Asia/Dubai">Asia/Dubai (GST)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Weekly Schedule Grid */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="grid grid-cols-1 lg:grid-cols-7 gap-4"
            >
              {availability.weekly_schedule.map((daySchedule, dayIndex) => (
                <Card key={daySchedule.day} className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-md border border-gray-200/50 dark:border-slate-800/50 shadow-lg rounded-2xl overflow-hidden hover:shadow-xl transition-shadow duration-300">
                  <CardHeader className="pb-3 border-b border-slate-250/20 dark:border-white/5">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">
                        {daySchedule.day}
                      </CardTitle>
                      {isEditing && (
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const updatedSchedule = {
                                ...daySchedule,
                                is_working_day: !daySchedule.is_working_day,
                                slots: !daySchedule.is_working_day ? [{ start_time: '09:00', end_time: '17:00', is_available: true }] : []
                              };
                              handleScheduleUpdate(dayIndex, updatedSchedule);
                            }}
                            className="p-1 h-6 w-6 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 rounded-md"
                          >
                            <RotateCcw className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                          </Button>
                          {dayIndex > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copySchedule(dayIndex - 1, dayIndex)}
                              className="p-1 h-6 w-6 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 rounded-md"
                            >
                              <Copy className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {isEditing ? (
                        <Switch
                          checked={daySchedule.is_working_day}
                          onCheckedChange={(checked) => {
                            const updatedSchedule = {
                              ...daySchedule,
                              is_working_day: checked,
                              slots: checked ? (daySchedule.slots.length === 0 ? [{ start_time: '09:00', end_time: '17:00', is_available: true }] : daySchedule.slots) : []
                            };
                            handleScheduleUpdate(dayIndex, updatedSchedule);
                          }}
                        />
                      ) : (
                        <Badge
                          className={daySchedule.is_working_day
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                            : 'bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20'}
                        >
                          {daySchedule.is_working_day ? 'Working' : 'Off'}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    {daySchedule.is_working_day ? (
                      <div className="space-y-2">
                        {daySchedule.slots.map((slot, slotIndex) => (
                          <div key={slotIndex} className="flex flex-col gap-2 p-2 bg-white/40 dark:bg-slate-950/45 border border-slate-200/30 dark:border-white/5 shadow-sm rounded-xl">
                            {isEditing ? (
                              <div className="flex items-center gap-1.5">
                                <Input
                                  type="time"
                                  value={slot.start_time}
                                  onChange={(e) => {
                                    const updatedSlots = [...daySchedule.slots];
                                    updatedSlots[slotIndex] = { ...slot, start_time: e.target.value };
                                    handleScheduleUpdate(dayIndex, { ...daySchedule, slots: updatedSlots });
                                  }}
                                  className="text-xs h-8 px-2 bg-white/50 dark:bg-slate-900/50 border-slate-200/50 dark:border-slate-800/50 rounded-lg focus:border-sky-500"
                                />
                                <span className="text-xs text-slate-500 dark:text-slate-400">-</span>
                                <Input
                                  type="time"
                                  value={slot.end_time}
                                  onChange={(e) => {
                                    const updatedSlots = [...daySchedule.slots];
                                    updatedSlots[slotIndex] = { ...slot, end_time: e.target.value };
                                    handleScheduleUpdate(dayIndex, { ...daySchedule, slots: updatedSlots });
                                  }}
                                  className="text-xs h-8 px-2 bg-white/50 dark:bg-slate-900/50 border-slate-200/50 dark:border-slate-800/50 rounded-lg focus:border-sky-500"
                                />
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeTimeSlot(dayIndex, slotIndex)}
                                  className="p-1 h-6 w-6 text-rose-500 hover:text-rose-700 hover:bg-rose-500/10 rounded-md"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex flex-col gap-1 w-full text-center">
                                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                                  {slot.start_time} - {slot.end_time}
                                </span>
                                <Badge
                                  className={`text-[10px] py-0.5 justify-center ${
                                    slot.is_available
                                      ? 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20'
                                      : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20'
                                  }`}
                                >
                                  {slot.is_available ? 'Available' : 'Blocked'}
                                </Badge>
                              </div>
                            )}
                          </div>
                        ))}
                        {isEditing && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addTimeSlot(dayIndex)}
                            className="w-full text-xs border-emerald-500/50 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 rounded-xl"
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Add Slot
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-xs text-slate-450 dark:text-slate-500 italic">Day off</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </motion.div>
          </TabsContent>

          {/* Booking Settings Tab */}
          <TabsContent value="settings" className="space-y-6 mt-6">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
            >
              <Card className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-md border border-gray-200/50 dark:border-slate-800/50 shadow-xl rounded-2xl overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-emerald-500" />
                    Booking Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-350 mb-2">Advance Booking Days</label>
                      <Select
                        value={availability.advance_booking_days.toString()}
                        onValueChange={(value) => updateAvailabilityMutation.mutate({ advance_booking_days: parseInt(value) })}
                        disabled={!isEditing}
                      >
                        <SelectTrigger className="bg-white/50 dark:bg-slate-950/40 border-slate-200/50 dark:border-slate-800/50 rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl">
                          <SelectItem value="7">7 days</SelectItem>
                          <SelectItem value="14">14 days</SelectItem>
                          <SelectItem value="30">30 days</SelectItem>
                          <SelectItem value="60">60 days</SelectItem>
                          <SelectItem value="90">90 days</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">How far in advance patients can book</p>
                    </div>
                  </div>

                  <Separator className="border-slate-200/50 dark:border-white/5" />

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Booking Options</h3>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/40 dark:bg-slate-950/20 border border-slate-200/30 dark:border-white/5">
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">Same Day Booking</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Allow patients to book appointments for today</p>
                      </div>
                      {isEditing ? (
                        <Switch
                          checked={availability.same_day_booking}
                          onCheckedChange={(checked) => updateAvailabilityMutation.mutate({ same_day_booking: checked })}
                        />
                      ) : (
                        <Badge className={availability.same_day_booking ? 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20' : 'bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20'}>
                          {availability.same_day_booking ? 'Enabled' : 'Disabled'}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/40 dark:bg-slate-950/20 border border-slate-200/30 dark:border-white/5">
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">Emergency Slots</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Reserve slots for emergency appointments</p>
                      </div>
                      {isEditing ? (
                        <Switch
                          checked={availability.emergency_slots}
                          onCheckedChange={(checked) => updateAvailabilityMutation.mutate({ emergency_slots: checked })}
                        />
                      ) : (
                        <Badge className={availability.emergency_slots ? 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20' : 'bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20'}>
                          {availability.emergency_slots ? 'Enabled' : 'Disabled'}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/40 dark:bg-slate-950/20 border border-slate-200/30 dark:border-white/5">
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">Auto Accept Appointments</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Automatically confirm new appointment requests</p>
                      </div>
                      {isEditing ? (
                        <Switch
                          checked={availability.auto_accept}
                          onCheckedChange={(checked) => updateAvailabilityMutation.mutate({ auto_accept: checked })}
                        />
                      ) : (
                        <Badge className={availability.auto_accept ? 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20' : 'bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20'}>
                          {availability.auto_accept ? 'Enabled' : 'Disabled'}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Special Dates Tab */}
          <TabsContent value="special" className="space-y-6 mt-6">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
            >
              <Card className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-md border border-gray-200/50 dark:border-slate-800/50 shadow-xl rounded-2xl overflow-hidden">
                <CardHeader>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <CardTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-amber-500" />
                      Special Dates & Holidays
                    </CardTitle>
                    {isEditing && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-emerald-500/50 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 rounded-xl"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Special Date
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-sm">
                          <DialogHeader>
                            <DialogTitle className="text-slate-900 dark:text-white">Add Special Date</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-slate-700 dark:text-slate-350">Date</label>
                              <Input
                                type="date"
                                id="special-date-input"
                                className="bg-white/50 dark:bg-slate-950/40 border-slate-200/50 dark:border-slate-800/50 rounded-xl focus:border-sky-500"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-slate-700 dark:text-slate-350">Type</label>
                              <Select defaultValue="holiday">
                                <SelectTrigger className="bg-white/50 dark:bg-slate-950/40 border-slate-200/50 dark:border-slate-800/50 rounded-xl">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl">
                                  <SelectItem value="holiday">Holiday (Full Day Off)</SelectItem>
                                  <SelectItem value="unavailable">Unavailable (Specific Period)</SelectItem>
                                  <SelectItem value="special_hours">Special Working Hours</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-slate-700 dark:text-slate-350">Note / Reason</label>
                              <Input
                                placeholder="e.g. Annual Leave, Conference..."
                                id="special-note-input"
                                className="bg-white/50 dark:bg-slate-950/40 border-slate-200/50 dark:border-slate-800/50 rounded-xl focus:border-sky-500"
                              />
                            </div>
                            <Button
                              onClick={() => {
                                const date = (document.getElementById('special-date-input') as HTMLInputElement).value;
                                const selectTrigger = document.querySelector('[role="combobox"]');
                                // Retrieve the text or attribute to find type
                                const type = selectTrigger?.textContent?.includes('Holiday') ? 'holiday' :
                                             selectTrigger?.textContent?.includes('Unavailable') ? 'unavailable' :
                                             selectTrigger?.textContent?.includes('Special') ? 'special_hours' : 'holiday';
                                const note = (document.getElementById('special-note-input') as HTMLInputElement).value;

                                if (!date) return;

                                const newSpecialDates = [...availability.special_dates, {
                                  date,
                                  type: type as any,
                                  note
                                }];

                                updateAvailabilityMutation.mutate({ special_dates: newSpecialDates });
                              }}
                              className="w-full bg-sky-500 hover:bg-sky-600 text-white rounded-xl shadow-lg shadow-sky-500/20"
                            >
                              Add Date
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {availability.special_dates.length === 0 ? (
                    <div className="text-center py-12">
                      <Calendar className="w-12 h-12 text-slate-400 dark:text-slate-500 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No Special Dates</h3>
                      <p className="text-slate-500 dark:text-slate-450">Add holidays or special working hours</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {availability.special_dates.map((specialDate, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-white/40 dark:bg-slate-950/20 border border-slate-200/50 dark:border-white/5 shadow-sm rounded-xl hover:bg-white/70 dark:hover:bg-slate-950/40 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-inner ${
                              specialDate.type === 'holiday' ? 'bg-rose-500/10 border border-rose-500/20' :
                              specialDate.type === 'special_hours' ? 'bg-blue-500/10 border border-blue-500/20' :
                              'bg-slate-500/10 border border-slate-500/20'
                            }`}>
                              <Calendar className={`w-5 h-5 ${
                                specialDate.type === 'holiday' ? 'text-rose-500' :
                                specialDate.type === 'special_hours' ? 'text-blue-500' :
                                'text-slate-500'
                              }`} />
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900 dark:text-white">
                                {new Date(specialDate.date).toLocaleDateString()}
                              </p>
                              <p className="text-sm text-slate-500 dark:text-slate-450">{specialDate.note || 'No description provided'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              className={
                                specialDate.type === 'holiday' ? 'bg-rose-500/10 text-rose-700 dark:text-rose-450 border-rose-500/20' :
                                specialDate.type === 'special_hours' ? 'bg-blue-500/10 text-blue-700 dark:text-blue-450 border-blue-500/20' :
                                'bg-slate-500/10 text-slate-700 dark:text-slate-450 border-slate-500/20'
                              }
                            >
                              {specialDate.type.replace('_', ' ')}
                            </Badge>
                            {isEditing && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const newSpecialDates = availability.special_dates.filter((_, i) => i !== index);
                                  updateAvailabilityMutation.mutate({ special_dates: newSpecialDates });
                                }}
                                className="text-rose-500 hover:text-rose-700 hover:bg-rose-500/10 rounded-md p-1.5"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>

      </div>
    </div>
  );
}
