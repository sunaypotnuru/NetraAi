import { z } from "zod";

/**
 * Clinical Note Schema
 * Structured SOAP format for clinical documentation
 */
export const clinicalNoteSchema = z.object({
  patient_id: z.string().uuid("Invalid patient ID"),
  appointment_id: z.string().uuid("Invalid appointment ID").optional(),
  note_type: z.enum(["soap", "progress", "consultation", "general", "critical"]),
  subjective: z.string().min(1, "Subjective notes are required"),
  objective: z.string().min(1, "Objective findings are required"),
  assessment: z.string().min(1, "Assessment is required"),
  plan: z.string().min(1, "Plan is required"),
  is_ai_generated: z.boolean(),
  diagnosis: z.string().optional(),
  follow_up_date: z.string().optional(),
});

export type ClinicalNoteValues = z.infer<typeof clinicalNoteSchema>;

/**
 * Consultation Submission Schema
 * Used when finalizing a consultation session
 */
export const consultationSchema = z.object({
  appointment_id: z.string().uuid("Invalid appointment ID"),
  patient_id: z.string().uuid("Invalid patient ID"),
  clinical_notes: clinicalNoteSchema,
  status: z.enum(["completed", "cancelled", "no_show"]).default("completed"),
  referral_needed: z.boolean().default(false),
  referral_specialty: z.string().optional(),
});

export type ConsultationValues = z.infer<typeof consultationSchema>;

/**
 * Vital Log Schema
 */
export const vitalLogSchema = z.object({
  patient_id: z.string().uuid(),
  tracker_type: z.string(),
  value: z.union([z.number(), z.string()]),
  unit: z.string(),
  notes: z.string().optional(),
});

export type VitalLogValues = z.infer<typeof vitalLogSchema>;
