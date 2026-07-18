import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Sparkles, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { clinicalNoteSchema, type ClinicalNoteValues } from "@/lib/schemas";
import SOAPEditor from "./SOAPEditor";
import { useState } from "react";
import { aiAPI } from "@/lib/api";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n";

interface ClinicalNoteFormProps {
  patientId: string;
  patientName: string;
  appointmentId?: string;
  onSubmit: (data: ClinicalNoteValues) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export default function ClinicalNoteForm({
  patientId,
  patientName,
  appointmentId,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: ClinicalNoteFormProps) {
  const { t } = useTranslation();
  const [isAIEnhancing, setIsAIEnhancing] = useState(false);

  const form = useForm<ClinicalNoteValues>({
    resolver: zodResolver(clinicalNoteSchema),
    defaultValues: {
      patient_id: patientId,
      appointment_id: appointmentId,
      note_type: "soap",
      subjective: "",
      objective: "",
      assessment: "",
      plan: "",
      is_ai_generated: false,
    },
  });

  const notes = {
    subjective: form.watch("subjective"),
    objective: form.watch("objective"),
    assessment: form.watch("assessment"),
    plan: form.watch("plan"),
  };

  const handleSOAPChange = (newNotes: typeof notes) => {
    form.setValue("subjective", newNotes.subjective);
    form.setValue("objective", newNotes.objective);
    form.setValue("assessment", newNotes.assessment);
    form.setValue("plan", newNotes.plan);
  };

  const handleAIEnhance = async () => {
    const combinedNotes = `
      Subjective: ${notes.subjective}
      Objective: ${notes.objective}
      Assessment: ${notes.assessment}
      Plan: ${notes.plan}
    `.trim();

    if (!combinedNotes || combinedNotes.length < 10) {
      toast.error(t("clinical.form.ai_min_chars", "Please enter more details for AI to structure."));
      return;
    }

    setIsAIEnhancing(true);
    try {
      const res = await aiAPI.doctorScribe({
        consultation_notes: combinedNotes,
        patient_name: patientName,
        doctor_name: "Doctor",
      });

      if (res.data?.soap_parts) {
        toast.success(t("clinical.form.ai_success", "Notes refined by AI scribe."));
        handleSOAPChange(res.data.soap_parts);
        
        if (res.data.soap_parts.follow_up) {
           // Optionally do something with follow_up
        }
        
        form.setValue("is_ai_generated", true);
      } else if (res.data?.soap_note) {
        // Legacy fallback
        form.setValue("assessment", res.data.soap_note);
        form.setValue("is_ai_generated", true);
      }
    } catch (error) {
      toast.error(t("clinical.form.ai_error", "Failed to refine notes with AI."));
    } finally {
      setIsAIEnhancing(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            {t("clinical.form.title", "Clinical Encounter Note")}
          </h2>
          <p className="text-sm text-slate-500">
            {t("clinical.form.subtitle", "Recording encounter for")} {patientName}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAIEnhance}
            disabled={isAIEnhancing || isSubmitting}
            className="text-amber-600 border-amber-200 hover:bg-amber-50"
          >
            {isAIEnhancing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            {t("clinical.form.ai_scribe", "AI Scribe")}
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>{t("clinical.form.note_type", "Encounter Type")}</Label>
            <select
              {...form.register("note_type")}
              className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="soap">SOAP Note</option>
              <option value="progress">Progress Note</option>
              <option value="consultation">Consultation</option>
              <option value="general">General Check-up</option>
              <option value="critical">Critical Finding</option>
            </select>
            {form.formState.errors.note_type && (
              <p className="text-xs text-red-500">{form.formState.errors.note_type.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>{t("clinical.form.diagnosis", "Primary Diagnosis (ICD-10)")}</Label>
            <input
              {...form.register("diagnosis")}
              placeholder="e.g. E11.9 (Type 2 Diabetes)"
              className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <SOAPEditor notes={notes} onChange={handleSOAPChange} />
        
        {(form.formState.errors.subjective || form.formState.errors.objective || form.formState.errors.assessment || form.formState.errors.plan) && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-lg">
            <p className="text-xs text-red-600 font-medium">
              {t("clinical.form.validation_error", "Please fill in all SOAP sections to continue.")}
            </p>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          <X className="w-4 h-4 mr-2" />
          {t("common.cancel", "Cancel")}
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          {t("clinical.form.save", "Save Record")}
        </Button>
      </div>
    </form>
  );
}
