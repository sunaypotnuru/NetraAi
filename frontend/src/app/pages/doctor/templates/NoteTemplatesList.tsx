import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import {
  Plus, Search, Filter, Edit, Trash2, Copy, FileText,
  Calendar, User, Clock, Star, MoreVertical, Eye,
  AlertTriangle, CheckCircle, BookOpen, Stethoscope, TrendingUp
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import api from '@/lib/api';

interface NoteTemplate {
  id: string;
  title: string;
  description: string;
  category: 'consultation' | 'follow-up' | 'diagnosis' | 'procedure' | 'discharge' | 'referral';
  format: 'soap' | 'narrative' | 'structured';
  content: string;
  tags: string[];
  is_favorite: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
  created_by: string;
}

interface NoteTemplatesResponse {
  templates: NoteTemplate[];
  total: number;
  categories: Array<{
    category: string;
    count: number;
  }>;
  popular_tags: string[];
}

export default function NoteTemplatesList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [formatFilter, setFormatFilter] = useState('all');
  const [sortBy, setSortBy] = useState('updated_at');

  const { data: templatesData, isLoading, refetch } = useQuery({
    queryKey: ['doctor-note-templates', searchTerm, categoryFilter, formatFilter, sortBy],
    queryFn: async (): Promise<NoteTemplatesResponse> => {
      const params: Record<string, string> = { sort_by: sortBy };
      if (searchTerm) params.search = searchTerm;
      if (categoryFilter !== 'all') params.category = categoryFilter;
      if (formatFilter !== 'all') params.format = formatFilter;

      const response = await api.get<NoteTemplatesResponse>('/api/v1/doctor/templates/notes', { params });
      return response.data;
    }
  });

  // Delete template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: async (templateId: string) => {
      await api.delete(`/api/v1/doctor/templates/notes/${templateId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-note-templates'] });
      toast.success('Template deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete template');
    }
  });

  // Duplicate template mutation
  const duplicateTemplateMutation = useMutation({
    mutationFn: async (templateId: string) => {
      const response = await api.post<NoteTemplate>(`/api/v1/doctor/templates/notes/${templateId}/duplicate`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-note-templates'] });
      toast.success('Template duplicated successfully');
    },
    onError: () => {
      toast.error('Failed to duplicate template');
    }
  });

  // Toggle favorite mutation
  const toggleFavoriteMutation = useMutation({
    mutationFn: async ({ templateId, isFavorite }: { templateId: string; isFavorite: boolean }) => {
      await api.patch(`/api/v1/doctor/templates/notes/${templateId}/favorite`, { is_favorite: !isFavorite });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-note-templates'] });
    }
  });

  const handleDeleteTemplate = (templateId: string) => {
    deleteTemplateMutation.mutate(templateId);
  };

  const handleDuplicateTemplate = (templateId: string) => {
    duplicateTemplateMutation.mutate(templateId);
  };

  const handleToggleFavorite = (templateId: string, isFavorite: boolean) => {
    toggleFavoriteMutation.mutate({ templateId, isFavorite });
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'consultation': return <Stethoscope className="w-4 h-4" />;
      case 'follow-up': return <Calendar className="w-4 h-4" />;
      case 'diagnosis': return <FileText className="w-4 h-4" />;
      case 'procedure': return <BookOpen className="w-4 h-4" />;
      case 'discharge': return <CheckCircle className="w-4 h-4" />;
      case 'referral': return <User className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'consultation': return 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20';
      case 'follow-up': return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20';
      case 'diagnosis': return 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/20';
      case 'procedure': return 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20';
      case 'discharge': return 'bg-teal-500/10 text-teal-700 dark:text-teal-400 border border-teal-500/20';
      case 'referral': return 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20';
      default: return 'bg-slate-500/10 text-slate-700 dark:text-slate-400 border border-slate-550/20';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-4 md:px-6 bg-transparent">
        <div className="max-w-7xl mx-auto space-y-8">
          <Skeleton className="w-[300px] h-[40px] bg-slate-200/50 dark:bg-slate-800/50" />
          <div className="flex gap-4">
            <Skeleton className="w-[200px] h-[40px] bg-slate-200/50 dark:bg-slate-800/50" />
            <Skeleton className="w-[150px] h-[40px] bg-slate-200/50 dark:bg-slate-800/50" />
            <Skeleton className="w-[150px] h-[40px] bg-slate-200/50 dark:bg-slate-800/50" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Skeleton key={i} className="h-[200px] rounded-2xl bg-slate-200/50 dark:bg-slate-800/50" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!templatesData) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-4 md:px-6 bg-transparent">
        <div className="max-w-7xl mx-auto text-center py-16 bg-white/70 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 shadow-xl rounded-2xl">
          <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Unable to Load Templates</h2>
          <p className="text-slate-500 dark:text-slate-450 mb-6">There was an error loading your note templates.</p>
          <Button onClick={() => refetch()} className="bg-sky-500 hover:bg-sky-600 text-white rounded-xl shadow-lg shadow-sky-500/20 border-0">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const { templates, total, categories } = templatesData;

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 md:px-6 bg-transparent">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Note Templates</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your clinical note templates for efficient, accurate documentation</p>
          </div>
          <Button
            onClick={() => navigate('/doctor/templates/notes/new')}
            className="bg-sky-500 hover:bg-sky-600 text-white rounded-xl shadow-lg shadow-sky-500/20 border-0 self-start md:self-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Template
          </Button>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-white/60 dark:bg-slate-900/40 backdrop-blur border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-6 shadow-lg shadow-slate-100/5 dark:shadow-none hover:-translate-y-0.5 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-450 uppercase tracking-wider mb-1">Total Templates</p>
                <p className="text-3xl font-extrabold text-slate-900 dark:text-white">{total}</p>
              </div>
              <div className="w-12 h-12 bg-sky-500/10 rounded-xl flex items-center justify-center border border-sky-500/20 shadow-inner">
                <FileText className="w-6 h-6 text-sky-500" />
              </div>
            </div>
          </Card>

          <Card className="bg-white/60 dark:bg-slate-900/40 backdrop-blur border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-6 shadow-lg shadow-slate-100/5 dark:shadow-none hover:-translate-y-0.5 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-450 uppercase tracking-wider mb-1">Categories</p>
                <p className="text-3xl font-extrabold text-slate-900 dark:text-white">{categories.length}</p>
              </div>
              <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20 shadow-inner">
                <BookOpen className="w-6 h-6 text-emerald-500" />
              </div>
            </div>
          </Card>

          <Card className="bg-white/60 dark:bg-slate-900/40 backdrop-blur border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-6 shadow-lg shadow-slate-100/5 dark:shadow-none hover:-translate-y-0.5 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-450 uppercase tracking-wider mb-1">Favorites</p>
                <p className="text-3xl font-extrabold text-slate-900 dark:text-white">
                  {templates.filter(t => t.is_favorite).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center border border-amber-500/20 shadow-inner">
                <Star className="w-6 h-6 text-amber-500 fill-amber-500/20" />
              </div>
            </div>
          </Card>

          <Card className="bg-white/60 dark:bg-slate-900/40 backdrop-blur border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-6 shadow-lg shadow-slate-100/5 dark:shadow-none hover:-translate-y-0.5 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-450 uppercase tracking-wider mb-1">Most Used</p>
                <p className="text-3xl font-extrabold text-slate-900 dark:text-white">
                  {Math.max(...templates.map(t => t.usage_count), 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center border border-purple-500/20 shadow-inner">
                <TrendingUp className="w-6 h-6 text-purple-500" />
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 shadow-xl rounded-2xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500 w-4 h-4" />
                <Input
                  placeholder="Search note templates by name, tags, description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white/50 dark:bg-slate-950/40 border-slate-200/50 dark:border-slate-800/50 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex flex-wrap sm:flex-nowrap gap-3">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full sm:w-[180px] bg-white/50 dark:bg-slate-950/40 border-slate-200/50 dark:border-slate-800/50 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-slate-900 dark:text-white">
                    <div className="flex items-center gap-2">
                      <Filter className="w-3.5 h-3.5 text-slate-500" />
                      <SelectValue placeholder="Category" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl">
                    <SelectItem value="all" className="focus:bg-slate-100 dark:focus:bg-slate-800/50 rounded-lg">All Categories</SelectItem>
                    <SelectItem value="consultation" className="focus:bg-slate-100 dark:focus:bg-slate-800/50 rounded-lg">Consultation</SelectItem>
                    <SelectItem value="follow-up" className="focus:bg-slate-100 dark:focus:bg-slate-800/50 rounded-lg">Follow-up</SelectItem>
                    <SelectItem value="diagnosis" className="focus:bg-slate-100 dark:focus:bg-slate-800/50 rounded-lg">Diagnosis</SelectItem>
                    <SelectItem value="procedure" className="focus:bg-slate-100 dark:focus:bg-slate-800/50 rounded-lg">Procedure</SelectItem>
                    <SelectItem value="discharge" className="focus:bg-slate-100 dark:focus:bg-slate-800/50 rounded-lg">Discharge</SelectItem>
                    <SelectItem value="referral" className="focus:bg-slate-100 dark:focus:bg-slate-800/50 rounded-lg">Referral</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={formatFilter} onValueChange={setFormatFilter}>
                  <SelectTrigger className="w-full sm:w-[150px] bg-white/50 dark:bg-slate-950/40 border-slate-200/50 dark:border-slate-800/50 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-slate-900 dark:text-white">
                    <SelectValue placeholder="Format" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl">
                    <SelectItem value="all" className="focus:bg-slate-100 dark:focus:bg-slate-800/50 rounded-lg">All Formats</SelectItem>
                    <SelectItem value="soap" className="focus:bg-slate-100 dark:focus:bg-slate-800/50 rounded-lg">SOAP</SelectItem>
                    <SelectItem value="narrative" className="focus:bg-slate-100 dark:focus:bg-slate-800/50 rounded-lg">Narrative</SelectItem>
                    <SelectItem value="structured" className="focus:bg-slate-100 dark:focus:bg-slate-800/50 rounded-lg">Structured</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full sm:w-[160px] bg-white/50 dark:bg-slate-950/40 border-slate-200/50 dark:border-slate-800/50 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-slate-900 dark:text-white">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl">
                    <SelectItem value="updated_at" className="focus:bg-slate-100 dark:focus:bg-slate-800/50 rounded-lg">Recently Updated</SelectItem>
                    <SelectItem value="created_at" className="focus:bg-slate-100 dark:focus:bg-slate-800/50 rounded-lg">Recently Created</SelectItem>
                    <SelectItem value="usage_count" className="focus:bg-slate-100 dark:focus:bg-slate-800/50 rounded-lg">Most Used</SelectItem>
                    <SelectItem value="title" className="focus:bg-slate-100 dark:focus:bg-slate-800/50 rounded-lg">Alphabetical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Templates Grid */}
        {templates.length === 0 ? (
          <Card className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 shadow-xl rounded-2xl overflow-hidden p-12 text-center">
            <CardContent className="p-0">
              <FileText className="w-16 h-16 text-slate-400 dark:text-slate-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Templates Found</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md mx-auto">
                {searchTerm || categoryFilter !== 'all' || formatFilter !== 'all'
                  ? 'We couldn\'t find any templates matching your filters. Try adjusting them or clear the search query.'
                  : 'Start compiling your templates library to standardise and speed up clinical note-taking.'
                }
              </p>
              <Button
                onClick={() => navigate('/doctor/templates/notes/new')}
                className="bg-sky-500 hover:bg-sky-600 text-white rounded-xl shadow-lg shadow-sky-500/20 border-0"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Note Template
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template, index) => (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 rounded-2xl flex flex-col justify-between h-full overflow-hidden group">
                  <CardHeader className="p-6 pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex flex-wrap gap-1.5 items-center">
                          <Badge className={`${getCategoryColor(template.category)} border-0 text-xs px-2.5 py-0.5 rounded-lg font-medium flex items-center gap-1`}>
                            {getCategoryIcon(template.category)}
                            <span className="capitalize">{template.category}</span>
                          </Badge>
                          <Badge className="bg-slate-500/10 text-slate-700 dark:text-slate-350 border border-slate-500/20 text-xs px-2 py-0.5 rounded-lg uppercase tracking-wider font-semibold">
                            {template.format}
                          </Badge>
                        </div>
                        <CardTitle className="text-lg font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-sky-500 dark:group-hover:text-sky-400 transition-colors mt-2">
                          {template.title}
                        </CardTitle>
                        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                          {template.description || 'No description provided.'}
                        </p>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800/50 rounded-lg">
                            <MoreVertical className="w-4 h-4 text-slate-500" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-1 min-w-[160px]">
                          <DropdownMenuItem onClick={() => navigate(`/doctor/templates/notes/${template.id}`)} className="focus:bg-slate-100 dark:focus:bg-slate-800/50 rounded-lg flex items-center px-2.5 py-2 text-slate-700 dark:text-slate-200 cursor-pointer">
                            <Eye className="w-4 h-4 mr-2 text-slate-550" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/doctor/templates/notes/edit/${template.id}`)} className="focus:bg-slate-100 dark:focus:bg-slate-800/50 rounded-lg flex items-center px-2.5 py-2 text-slate-700 dark:text-slate-200 cursor-pointer">
                            <Edit className="w-4 h-4 mr-2 text-slate-550" />
                            Edit Settings
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicateTemplate(template.id)} className="focus:bg-slate-100 dark:focus:bg-slate-800/50 rounded-lg flex items-center px-2.5 py-2 text-slate-700 dark:text-slate-200 cursor-pointer">
                            <Copy className="w-4 h-4 mr-2 text-slate-550" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleToggleFavorite(template.id, template.is_favorite)}
                            className="focus:bg-slate-100 dark:focus:bg-slate-800/50 rounded-lg flex items-center px-2.5 py-2 text-slate-700 dark:text-slate-200 cursor-pointer"
                          >
                            <Star className={`w-4 h-4 mr-2 ${template.is_favorite ? 'fill-amber-500 text-amber-500' : 'text-slate-400'}`} />
                            {template.is_favorite ? 'Remove Favorite' : 'Mark Favorite'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-slate-200/50 dark:bg-slate-800/50 my-1" />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <div className="flex items-center px-2.5 py-2 text-rose-600 hover:bg-rose-500/10 rounded-lg cursor-pointer text-sm font-medium">
                                <Trash2 className="w-4 h-4 mr-2" />
                                <span>Delete</span>
                              </div>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-slate-900 dark:text-white font-extrabold text-xl">Delete Note Template?</AlertDialogTitle>
                                <AlertDialogDescription className="text-slate-500 dark:text-slate-400 mt-2">
                                  Are you sure you want to delete <strong className="text-slate-800 dark:text-slate-200">"{template.title}"</strong>? This action will remove the layout permanently. Clinical notes referencing this will not be damaged.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter className="mt-6 gap-2">
                                <AlertDialogCancel className="border-slate-200 dark:border-slate-800 rounded-xl">Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteTemplate(template.id)}
                                  className="bg-rose-550 hover:bg-rose-600 text-white rounded-xl shadow-lg shadow-rose-500/20 border-0"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>

                  <CardContent className="p-6 pt-0 space-y-4">
                    {/* Tags */}
                    {template.tags.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 pt-2">
                        {template.tags.slice(0, 3).map((tag, tagIndex) => (
                          <Badge key={tagIndex} className="bg-slate-100/50 dark:bg-slate-950/40 text-slate-600 dark:text-slate-400 border border-slate-200/50 dark:border-slate-850/50 text-xs px-2 py-0.5 rounded-lg">
                            {tag}
                          </Badge>
                        ))}
                        {template.tags.length > 3 && (
                          <Badge className="bg-slate-100/50 dark:bg-slate-950/40 text-slate-655 dark:text-slate-400 border border-slate-200/50 dark:border-slate-850/50 text-xs px-2 py-0.5 rounded-lg font-medium">
                            +{template.tags.length - 3} more
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <div className="h-6" /> // spacer to align grids nicely
                    )}

                    <div className="h-[1px] w-full bg-slate-200/50 dark:bg-slate-800/50" />

                    {/* Stats */}
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-450">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{new Date(template.updated_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5 text-slate-400" />
                          <span>{template.usage_count} uses</span>
                        </div>
                      </div>
                      {template.is_favorite && (
                        <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2.5 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-slate-600 dark:text-slate-300 border-slate-200/60 dark:border-slate-800/80 bg-white/40 dark:bg-slate-900/30 backdrop-blur rounded-xl hover:bg-slate-100 dark:hover:bg-slate-850"
                        onClick={() => navigate(`/doctor/templates/notes/${template.id}`)}
                      >
                        <Eye className="w-4 h-4 mr-1.5" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 bg-sky-500 hover:bg-sky-600 text-white rounded-xl shadow-lg shadow-sky-500/20 border-0"
                        onClick={() => navigate(`/doctor/templates/notes/edit/${template.id}`)}
                      >
                        <Edit className="w-4 h-4 mr-1.5" />
                        Edit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
