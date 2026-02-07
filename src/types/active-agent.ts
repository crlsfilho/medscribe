// Active Agent Types - Assistente Proativo

export type ActionableItemType = "tiss_form" | "referral_letter" | "follow_up";

export type ActionableItemStatus =
  | "suggested"
  | "accepted"
  | "dismissed"
  | "completed";

// Base interface for all actionable items
export interface ActionableItemBase {
  id: string;
  visitId: string;
  type: ActionableItemType;
  confidence: number; // 0-1
  sourceText: string; // Original text that triggered detection
  status: ActionableItemStatus;
  createdAt: Date;
  completedAt?: Date;
}

// TUSS Procedure code structure
export interface TussProcedure {
  code: string;
  description: string;
  table: string; // "22" for procedures, "18", "19", "20"
  quantity: number;
  matchConfidence: number;
}

// TISS Form metadata
export interface TissMetadata {
  procedureCodes: TussProcedure[];
  cidCode?: string;
  cidDescription?: string;
  urgency: "routine" | "urgent" | "emergency";
  clinicalIndication?: string;
}

// Referral Letter metadata
export interface ReferralMetadata {
  specialty: string;
  specialtyCode?: string;
  reason: string;
  clinicalSummary: string;
  urgency: "routine" | "preferential" | "urgent";
}

// Follow-up Appointment metadata
export interface FollowUpMetadata {
  suggestedDate: Date;
  parsedExpression: string; // e.g., "15 dias", "1 mes"
  reason: string;
  availableSlots?: AppointmentSlot[];
}

export interface AppointmentSlot {
  id: string;
  startTime: Date;
  endTime: Date;
}

// Union type for all metadata types
export type ActionableItemMetadata =
  | TissMetadata
  | ReferralMetadata
  | FollowUpMetadata;

// Full actionable item with typed metadata
export interface ActionableItem extends ActionableItemBase {
  metadata: ActionableItemMetadata;
}

// Specific typed versions
export interface TissActionableItem extends ActionableItemBase {
  type: "tiss_form";
  metadata: TissMetadata;
}

export interface ReferralActionableItem extends ActionableItemBase {
  type: "referral_letter";
  metadata: ReferralMetadata;
}

export interface FollowUpActionableItem extends ActionableItemBase {
  type: "follow_up";
  metadata: FollowUpMetadata;
}

// Detection results from AI
export interface DetectedProcedure {
  name: string;
  urgency: "routine" | "urgent" | "emergency";
  quantity?: number;
  sourceText: string;
}

export interface DetectedReferral {
  specialty: string;
  reason: string;
  urgency: "routine" | "preferential" | "urgent";
  sourceText: string;
}

export interface DetectedFollowUp {
  timeExpression: string;
  reason: string;
  sourceText: string;
}

export interface DetectionResult {
  procedures: DetectedProcedure[];
  referrals: DetectedReferral[];
  followUps: DetectedFollowUp[];
}

// TUSS Code from database
export interface TussCode {
  id: string;
  code: string;
  description: string;
  table: string;
  category?: string;
  synonyms?: string[];
}

// TISS Form data for PDF generation
export interface TissFormData {
  // Beneficiary data (patient)
  patientName: string;
  patientCpf?: string;
  patientBirthDate?: string;
  healthInsuranceNumber?: string;
  healthInsuranceName?: string;
  healthInsuranceAnsCode?: string;

  // Requesting provider data (doctor/clinic)
  doctorName: string;
  doctorCrm: string;
  doctorCrmUf: string;
  clinicName?: string;
  clinicCnes?: string;

  // Request details
  requestDate: string;
  urgency: "routine" | "urgent" | "emergency";
  procedures: TussProcedure[];
  cidCode?: string;
  cidDescription?: string;
  clinicalIndication: string;

  // Guia type
  guiaType: "SP/SADT" | "Consulta" | "Internacao";
}

// API Response types
export interface DetectActionableItemsResponse {
  items: ActionableItem[];
  visitId: string;
}

export interface UpdateActionableItemRequest {
  status?: ActionableItemStatus;
}

export interface ExecuteActionableItemResponse {
  success: boolean;
  pdfUrl?: string;
  appointmentId?: string;
  error?: string;
}
