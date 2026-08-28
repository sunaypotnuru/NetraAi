import React from 'react';
import { motion } from 'motion/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router';
import {
  ArrowLeft, Save, Eye, FileText, Plus, X, Star,
  BookOpen, Stethoscope, Calendar, User, CheckCircle,
  AlertTriangle, Copy, Trash2, RotateCcw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import api from '@/lib/api';

interface NoteTemplate {
  id?: string;
  title: string;
  description: string;
  category: 'consultation' | 'follow-up' | 'diagnosis' | 'procedure' | 'discharge' | 'referral';
  format: 'soap' | 'narrative' | 'structured';
  content: string;
  tags: string[];
  is_favorite: boolean;
  usage_count?: number;
  created_at?: string;
  updated_at?: string;
}

interface SOAPTemplate {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

const SOAP_TEMPLATE: SOAPTemplate = {
  subjective: "Chief Complaint:\n\nHistory of Present Illness:\n\nReview of Systems:\n\nPast Medical History:\n\nMedications:\n\nAllergies:\n\nSocial History:",
  objective: "Vital Signs:\n- Temperature: \n- Blood Pressure: \n- Heart Rate: \n- Respiratory Rate: \n- Oxygen Saturation: \n\nPhysical Examination:\n- General Appearance: \n- HEENT: \n- Cardiovascular: \n- Respiratory: \n- Abdomen: \n- Neurological: \n- Extremities: \n\nLaboratory/Diagnostic Results:",
  assessment: "Primary Diagnosis:\n\nDifferential Diagnosis:\n\nClinical Impression:",
  plan: "Treatment Plan:\n\nMedications:\n\nFollow-up:\n\nPatient Education:\n\nReferrals:\n\nReturn Precautions:"
};

const CATEGORY_OPTIONS = [
  { value: 'consultation', label: 'Consultation', icon: Stethoscope },
  { value: 'follow-up', label: 'Follow-up', icon: Calendar },
  { value: 'diagnosis', label: 'Diagnosis', icon: FileText },
  { value: 'procedure', label: 'Procedure', icon: BookOpen },
  { value: 'discharge', label: 'Discharge', icon: CheckCircle },
  { value: 'referral', label: 'Referral', icon: User }
];

const FORMAT_OPTIONS = [
  { value: 'soap', label: 'SOAP Format', description: 'Subjective, Objective, Assessment, Plan' },
  { value: 'narrative', label: 'Narrative', description: 'Free-form narrative documentation' },
  { value: 'structured', label: 'Structured', description: 'Custom structured format' }
];

export default function CreateEditNoteTemplate() {
  const navigate = useNavigate();
  const { templateId } = useParams();
  const queryClient = useQueryClient();
  const isEditing = Boolean(templateId);

  const [activeTab, setActiveTab] = React.useState('editor');
  const [template, setTemplate] = React.useState<NoteTemplate>({
    title: '',
    description: '',
    category: 'consultation',
    format: 'soap',
    content: '',
    tags: [],
    is_favorite: false
  });

  const [soapContent, setSoapContent] = React.useState<SOAPTemplate>(SOAP_TEMPLATE);
  const [newTag, setNewTag] = React.useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = React.useState(false);

  const { data: existingTemplate, isLoading } = useQuery({
    queryKey: ['note-template', templateId],
    queryFn: async (): Promise<NoteTemplate> => {
      const response = await api.get<NoteTemplate>(`/api/v1/doctor/templates/notes/${templateId}`);
      return response.data;
    },
    enabled: isEditing
  });

  // Load template data when editing
  React.useEffect(() => {
    if (existingTemplate) {
      setTemplate(existingTemplate);

      // Parse SOAP content if format is SOAP
      if (existingTemplate.format === 'soap') {
        try {
          const parsed = JSON.parse(existingTemplate.content);
          setSoapContent(parsed);
        } catch {
          // If parsing fails, use default SOAP template
          setSoapContent(SOAP_TEMPLATE);
        }
      }
    }
  }, [existingTemplate]);

  // Track unsaved changes
  React.useEffect(() => {
    if (existingTemplate) {
      const hasChanges = JSON.stringify(template) !== JSON.stringify(existingTemplate);
      setHasUnsavedChanges(hasChanges);
    } else {
      const hasContent = !!(template.title || template.description || template.content || template.tags.length > 0);
      setHasUnsavedChanges(hasContent);
    }
  }, [template, existingTemplate]);

  const saveTemplateMutation = useMutation({
    mutationFn: async (templateData: NoteTemplate) => {
      if (isEditing) {
        const response = await api.put<NoteTemplate>(`/api/v1/doctor/templates/notes/${templateId}`, templateData);
        return response.data;
      } else {
        const response = await api.post<NoteTemplate>('/api/v1/doctor/templates/notes', templateData);
        return response.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-note-templates'] });
      queryClient.invalidateQueries({ queryKey: ['note-template', templateId] });
      toast.success(`Template ${isEditing ? 'updated' : 'created'} successfully`);
      setHasUnsavedChanges(false);
      navigate('/doctor/templates/notes');
    },
    onError: () => {
      toast.error(`Failed to ${isEditing ? 'update' : 'create'} template`);
    }
  });

  const handleSave = () => {
    if (!template.title.trim()) {
      toast.error('Please enter a template title');
      return;
    }

    let contentToSave = template.content;

    // For SOAP format, stringify the SOAP content
    if (template.format === 'soap') {
      contentToSave = JSON.stringify(soapContent);
    }

    saveTemplateMutation.mutate({
      ...template,
      content: contentToSave
    });
  };

  const handleFormatChange = (newFormat: string) => {
    setTemplate(prev => ({ ...prev, format: newFormat as any }));

    // Reset content when changing format
    if (newFormat === 'soap') {
      setSoapContent(SOAP_TEMPLATE);
    } else {
      setTemplate(prev => ({ ...prev, content: '' }));
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !template.tags.includes(newTag.trim())) {
      setTemplate(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTemplate(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSOAPChange = (section: keyof SOAPTemplate, value: string) => {
    setSoapContent(prev => ({
      ...prev,
      [section]: value
    }));
  };

  const resetTemplate = () => {
    if (isEditing && existingTemplate) {
      setTemplate(existingTemplate);
      if (existingTemplate.format === 'soap') {
        try {
          const parsed = JSON.parse(existingTemplate.content);
          setSoapContent(parsed);
        } catch {
          setSoapContent(SOAP_TEMPLATE);
        }
      }
    } else {
      setTemplate({
        title: '',
        description: '',
        category: 'consultation',
        format: 'soap',
        content: '',
        tags: [],
        is_favorite: false
      });
      setSoapContent(SOAP_TEMPLATE);
    }
    setHasUnsavedChanges(false);
  };

  if (isLoading && isEditing) {
    return (
      <div className="min-h-screen pt-3 pb-12 px-4 md:px-6 bg-transparent">
        <div className="max-w-7xl mx-auto space-y-8">
          <Skeleton className="w-[300px] h-[40px] bg-slate-200/50 dark:bg-slate-800/50" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-[400px] rounded-2xl bg-slate-200/50 dark:bg-slate-800/50" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-[200px] rounded-2xl bg-slate-200/50 dark:bg-slate-800/50" />
              <Skeleton className="h-[150px] rounded-2xl bg-slate-200/50 dark:bg-slate-800/50" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-3 pb-12 px-4 md:px-6 bg-transparent">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/doctor/templates/notes')}
              className="p-2 hover:bg-white/20 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-200 rounded-xl"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {isEditing ? 'Edit Template' : 'Create Note Template'}
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">
                {isEditing
                  ? 'Update your clinical note template settings'
                  : 'Create a new template for efficient clinical documentation'
                }
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 md:gap-3">
            {hasUnsavedChanges && (
              <Button
                variant="outline"
                onClick={resetTemplate}
                className="text-slate-600 dark:text-slate-300 border-slate-200/60 dark:border-slate-800/80 bg-white/40 dark:bg-slate-900/30 backdrop-blur rounded-xl hover:bg-slate-100 dark:hover:bg-slate-850"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => setActiveTab('preview')}
              className="text-slate-600 dark:text-slate-300 border-slate-200/60 dark:border-slate-800/80 bg-white/40 dark:bg-slate-900/30 backdrop-blur rounded-xl hover:bg-slate-100 dark:hover:bg-slate-850"
            >
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
            <Button
              onClick={handleSave}
              disabled={saveTemplateMutation.isPending}
              className="bg-sky-500 hover:bg-sky-600 text-white rounded-xl shadow-lg shadow-sky-500/20 border-0"
            >
              <Save className="w-4 h-4 mr-2" />
              {saveTemplateMutation.isPending
                ? (isEditing ? 'Updating...' : 'Creating...')
                : (isEditing ? 'Update Template' : 'Create Template')
              }
            </Button>
          </div>
        </motion.div>

        {/* Unsaved Changes Warning */}
        {hasUnsavedChanges && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 rounded-xl flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
              <p className="text-sm font-medium">
                You have unsaved changes. Don't forget to save your template before exiting.
              </p>
            </div>
          </motion.div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Editor Section */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 p-1 bg-slate-100/80 dark:bg-slate-950/60 backdrop-blur rounded-xl border border-slate-200/30 dark:border-slate-800/30">
                <TabsTrigger
                  value="editor"
                  className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm data-[state=active]:text-slate-900 dark:data-[state=active]:text-white text-slate-500 dark:text-slate-400 font-medium py-2 transition-all"
                >
                  Editor
                </TabsTrigger>
                <TabsTrigger
                  value="preview"
                  className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm data-[state=active]:text-slate-900 dark:data-[state=active]:text-white text-slate-500 dark:text-slate-400 font-medium py-2 transition-all"
                >
                  Preview
                </TabsTrigger>
              </TabsList>

              {/* Editor Tab */}
              <TabsContent value="editor" className="space-y-6 mt-6">
                <Card className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 shadow-xl rounded-2xl overflow-hidden">
                  <CardHeader className="border-b border-slate-200/30 dark:border-slate-800/30 bg-slate-50/50 dark:bg-slate-950/10 py-4 px-6">
                    <CardTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <FileText className="w-5 h-5 text-sky-500" />
                      Template Content
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">

                    {/* Format Selection */}
                    <div className="space-y-3">
                      <Label className="text-sm font-semibold text-slate-800 dark:text-slate-200">Template Format</Label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {FORMAT_OPTIONS.map((format) => (
                          <div
                            key={format.value}
                            className={`p-4 border rounded-xl cursor-pointer transition-all duration-300 relative group flex flex-col justify-between ${
                              template.format === format.value
                                ? 'border-sky-500/50 bg-sky-500/5 dark:bg-sky-500/10 shadow-md shadow-sky-500/5'
                                : 'border-slate-200/60 dark:border-slate-800/60 hover:border-slate-350 dark:hover:border-slate-700 bg-white/40 dark:bg-slate-950/20'
                            }`}
                            onClick={() => handleFormatChange(format.value)}
                          >
                            <div className="space-y-1">
                              <p className="font-semibold text-slate-900 dark:text-white group-hover:text-sky-500 dark:group-hover:text-sky-400 transition-colors">{format.label}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-1">{format.description}</p>
                            </div>
                            <div className="flex justify-end mt-4">
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                template.format === format.value
                                  ? 'border-sky-500 bg-sky-500'
                                  : 'border-slate-300 dark:border-slate-700 group-hover:border-slate-400'
                              }`}>
                                {template.format === format.value && (
                                  <div className="w-2 h-2 bg-white rounded-full" />
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator className="bg-slate-200/50 dark:bg-slate-850/50" />

                    {/* SOAP Format Editor */}
                    {template.format === 'soap' && (
                      <div className="space-y-6">
                        <div className="flex items-center gap-2 mb-4 bg-slate-50/50 dark:bg-slate-950/30 p-3 rounded-xl border border-slate-200/40 dark:border-slate-850/40">
                          <Stethoscope className="w-5 h-5 text-sky-500" />
                          <div className="text-sm">
                            <span className="font-semibold text-slate-900 dark:text-white">SOAP Standard Note Setup</span>
                            <span className="text-slate-500 dark:text-slate-450 block text-xs mt-0.5">Edit individual clinical sections below.</span>
                          </div>
                        </div>

                        {/* Subjective */}
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-600 dark:text-sky-400 text-xs font-bold flex items-center justify-center shadow-inner">S</span>
                            Subjective
                          </Label>
                          <Textarea
                            placeholder="Patient's chief complaint, history of present illness, review of systems..."
                            value={soapContent.subjective}
                            onChange={(e) => handleSOAPChange('subjective', e.target.value)}
                            className="min-h-[140px] resize-none bg-white/50 dark:bg-slate-950/40 border-slate-200/50 dark:border-slate-800/50 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-slate-900 dark:text-white"
                          />
                        </div>

                        {/* Objective */}
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center justify-center shadow-inner">O</span>
                            Objective
                          </Label>
                          <Textarea
                            placeholder="Vital signs, physical examination findings, laboratory results..."
                            value={soapContent.objective}
                            onChange={(e) => handleSOAPChange('objective', e.target.value)}
                            className="min-h-[140px] resize-none bg-white/50 dark:bg-slate-950/40 border-slate-200/50 dark:border-slate-800/50 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-slate-900 dark:text-white"
                          />
                        </div>

                        {/* Assessment */}
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-655 dark:text-purple-400 text-xs font-bold flex items-center justify-center shadow-inner">A</span>
                            Assessment
                          </Label>
                          <Textarea
                            placeholder="Primary diagnosis, differential diagnosis, clinical impression..."
                            value={soapContent.assessment}
                            onChange={(e) => handleSOAPChange('assessment', e.target.value)}
                            className="min-h-[120px] resize-none bg-white/50 dark:bg-slate-950/40 border-slate-200/50 dark:border-slate-800/50 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-slate-900 dark:text-white"
                          />
                        </div>

                        {/* Plan */}
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 text-xs font-bold flex items-center justify-center shadow-inner">P</span>
                            Plan
                          </Label>
                          <Textarea
                            placeholder="Treatment plan, medications, follow-up instructions, patient education..."
                            value={soapContent.plan}
                            onChange={(e) => handleSOAPChange('plan', e.target.value)}
                            className="min-h-[140px] resize-none bg-white/50 dark:bg-slate-950/40 border-slate-200/50 dark:border-slate-800/50 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-slate-900 dark:text-white"
                          />
                        </div>
                      </div>
                    )}

                    {/* Narrative/Structured Format Editor */}
                    {template.format !== 'soap' && (
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-slate-800 dark:text-slate-200">Template Content</Label>
                        <Textarea
                          placeholder={`Enter your ${template.format} template content here...`}
                          value={template.content}
                          onChange={(e) => setTemplate(prev => ({ ...prev, content: e.target.value }))}
                          className="min-h-[420px] resize-none bg-white/50 dark:bg-slate-950/40 border-slate-200/50 dark:border-slate-800/50 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-slate-900 dark:text-white font-mono text-sm leading-relaxed p-4"
                        />
                        <p className="text-xs text-slate-500 dark:text-slate-450 mt-2 bg-slate-100/30 dark:bg-slate-950/30 p-2.5 rounded-lg border border-slate-200/20 dark:border-slate-850/20">
                          <strong>Placeholder Syntax:</strong> Use markers like <code className="text-sky-500 font-bold">[PATIENT_NAME]</code>, <code className="text-sky-500 font-bold">[DATE]</code>, or <code className="text-sky-500 font-bold">[CHIEF_COMPLAINT]</code> to parse dynamic tags.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Preview Tab */}
              <TabsContent value="preview" className="space-y-6 mt-6">
                <Card className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 shadow-xl rounded-2xl overflow-hidden">
                  <CardHeader className="border-b border-slate-200/30 dark:border-slate-800/30 bg-slate-50/50 dark:bg-slate-950/10 py-4 px-6">
                    <CardTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Eye className="w-5 h-5 text-sky-500" />
                      Template Preview Mode
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    {template.format === 'soap' ? (
                      <div className="space-y-6">
                        <div className="border-l-4 border-sky-500 pl-4 py-1">
                          <h4 className="font-bold text-slate-900 dark:text-white mb-2 text-sm uppercase tracking-wider">Subjective</h4>
                          <div className="whitespace-pre-wrap text-sm text-slate-655 dark:text-slate-350 bg-slate-550/10 dark:bg-slate-950/30 border border-slate-200/40 dark:border-slate-850/40 p-4 rounded-xl leading-relaxed">
                            {soapContent.subjective || 'No subjective content entered...'}
                          </div>
                        </div>

                        <div className="border-l-4 border-emerald-500 pl-4 py-1">
                          <h4 className="font-bold text-slate-900 dark:text-white mb-2 text-sm uppercase tracking-wider">Objective</h4>
                          <div className="whitespace-pre-wrap text-sm text-slate-655 dark:text-slate-350 bg-slate-550/10 dark:bg-slate-950/30 border border-slate-200/40 dark:border-slate-850/40 p-4 rounded-xl leading-relaxed">
                            {soapContent.objective || 'No objective content entered...'}
                          </div>
                        </div>

                        <div className="border-l-4 border-purple-500 pl-4 py-1">
                          <h4 className="font-bold text-slate-900 dark:text-white mb-2 text-sm uppercase tracking-wider">Assessment</h4>
                          <div className="whitespace-pre-wrap text-sm text-slate-655 dark:text-slate-350 bg-slate-550/10 dark:bg-slate-950/30 border border-slate-200/40 dark:border-slate-850/40 p-4 rounded-xl leading-relaxed">
                            {soapContent.assessment || 'No assessment content entered...'}
                          </div>
                        </div>

                        <div className="border-l-4 border-orange-500 pl-4 py-1">
                          <h4 className="font-bold text-slate-900 dark:text-white mb-2 text-sm uppercase tracking-wider">Plan</h4>
                          <div className="whitespace-pre-wrap text-sm text-slate-655 dark:text-slate-350 bg-slate-550/10 dark:bg-slate-950/30 border border-slate-200/40 dark:border-slate-850/40 p-4 rounded-xl leading-relaxed">
                            {soapContent.plan || 'No plan content entered...'}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap text-sm text-slate-655 dark:text-slate-350 bg-slate-550/10 dark:bg-slate-950/30 border border-slate-200/40 dark:border-slate-850/40 p-5 rounded-xl min-h-[350px] font-mono leading-relaxed">
                        {template.content || 'No content entered...'}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">

            {/* Basic Information */}
            <Card className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 shadow-xl rounded-2xl overflow-hidden">
              <CardHeader className="border-b border-slate-200/30 dark:border-slate-800/30 bg-slate-50/50 dark:bg-slate-950/10 py-4 px-6">
                <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">Template Meta Info</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">

                {/* Title */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-855 dark:text-slate-250">Title *</Label>
                  <Input
                    placeholder="e.g. Annual Health Checkup"
                    value={template.title}
                    onChange={(e) => setTemplate(prev => ({ ...prev, title: e.target.value }))}
                    className="bg-white/50 dark:bg-slate-950/40 border-slate-200/50 dark:border-slate-800/50 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-slate-900 dark:text-white"
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-855 dark:text-slate-250">Description</Label>
                  <Textarea
                    placeholder="Summarize the core clinical workflow of this layout..."
                    value={template.description}
                    onChange={(e) => setTemplate(prev => ({ ...prev, description: e.target.value }))}
                    className="resize-none bg-white/50 dark:bg-slate-950/40 border-slate-200/50 dark:border-slate-800/50 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-slate-900 dark:text-white"
                    rows={3}
                  />
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-855 dark:text-slate-250">Category</Label>
                  <Select
                    value={template.category}
                    onValueChange={(value) => setTemplate(prev => ({ ...prev, category: value as any }))}
                  >
                    <SelectTrigger className="bg-white/50 dark:bg-slate-950/40 border-slate-200/50 dark:border-slate-800/50 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-slate-900 dark:text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl">
                      {CATEGORY_OPTIONS.map((category) => {
                        const Icon = category.icon;
                        return (
                          <SelectItem key={category.value} value={category.value} className="focus:bg-slate-100 dark:focus:bg-slate-800/50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <Icon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                              <span className="text-slate-800 dark:text-slate-200">{category.label}</span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {/* Favorite Toggle */}
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2">
                    <Star className={`w-4 h-4 transition-all ${template.is_favorite ? 'fill-yellow-500 text-yellow-500 scale-110' : 'text-slate-400 dark:text-slate-550'}`} />
                    <Label className="text-sm font-semibold text-slate-855 dark:text-slate-250 cursor-pointer" htmlFor="favorite-switch">Add to Favorites</Label>
                  </div>
                  <Switch
                    id="favorite-switch"
                    checked={template.is_favorite}
                    onCheckedChange={(checked) => setTemplate(prev => ({ ...prev, is_favorite: checked }))}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Tags */}
            <Card className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 shadow-xl rounded-2xl overflow-hidden">
              <CardHeader className="border-b border-slate-200/30 dark:border-slate-800/30 bg-slate-50/50 dark:bg-slate-950/10 py-4 px-6">
                <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">Tags / Indexing</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">

                {/* Add Tag */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter tags..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                    className="bg-white/50 dark:bg-slate-950/40 border-slate-200/50 dark:border-slate-800/50 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-slate-900 dark:text-white"
                  />
                  <Button
                    size="sm"
                    onClick={handleAddTag}
                    className="bg-sky-500 hover:bg-sky-600 text-white rounded-xl shadow-lg shadow-sky-500/20 border-0 flex-shrink-0 px-3"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                {/* Tags List */}
                {template.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {template.tags.map((tag, index) => (
                      <Badge
                        key={index}
                        className="bg-sky-550/10 hover:bg-sky-550/20 text-sky-700 dark:text-sky-400 border border-sky-550/20 dark:border-sky-500/10 flex items-center gap-1.5 py-1 px-2.5 rounded-lg text-xs transition-colors"
                      >
                        <span>{tag}</span>
                        <button
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:text-rose-500 transition-colors p-0.5 rounded-full hover:bg-rose-500/10"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-450 text-center py-4 italic">
                    No tags added yet.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Template Stats (for editing) */}
            {isEditing && existingTemplate && (
              <Card className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 shadow-xl rounded-2xl overflow-hidden">
                <CardHeader className="border-b border-slate-200/30 dark:border-slate-800/30 bg-slate-50/50 dark:bg-slate-950/10 py-4 px-6">
                  <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">Usage Analytics</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-2">
                    <span className="text-sm text-slate-500 dark:text-slate-400">Total Uses</span>
                    <span className="font-bold text-slate-900 dark:text-white">{existingTemplate.usage_count || 0}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-2">
                    <span className="text-sm text-slate-500 dark:text-slate-400">Created At</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {new Date(existingTemplate.created_at!).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500 dark:text-slate-400">Last Modified</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {new Date(existingTemplate.updated_at!).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
