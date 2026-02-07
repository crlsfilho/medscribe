import { jsPDF } from "jspdf";

interface SOAPData {
  subjective: {
    chiefComplaint: string;
    historyPresentIllness: string;
  };
  objective: {
    vitalSigns: string;
    physicalExam: string;
    labResults: string;
  };
  assessment: {
    diagnoses: string[];
    differentials: string[];
  };
  plan: {
    medications: string[];
    procedures: string[];
    instructions: string[];
    followUp: string;
  };
}

interface PatientInfo {
  name: string;
  age?: number | null;
  sex?: string | null;
}

interface ExportData {
  soap: SOAPData;
  patient: PatientInfo;
  date: string;
  doctorName?: string;
}

export interface PrescriptionData {
  patient: PatientInfo;
  medications: { name: string; instructions: string }[];
  date: string;
  doctorName?: string;
}

export interface ExamData {
  patient: PatientInfo;
  exams: string[];
  date: string;
  doctorName?: string;
}

export interface CertificateData {
  patient: PatientInfo;
  days: string;
  cid?: string;
  full_text: string;
  date: string;
  doctorName?: string;
}

export function generateSOAPPDF(data: ExportData): Blob {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;
  const margin = 20;
  const lineHeight = 7;

  // Helper function to add text with word wrap
  const addWrappedText = (text: string, x: number, maxWidth: number) => {
    const lines = doc.splitTextToSize(text, maxWidth);
    lines.forEach((line: string) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, x, y);
      y += lineHeight;
    });
  };

  // Header
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("NOTA CLÍNICA", pageWidth / 2, y, { align: "center" });
  y += 10;

  // Patient info
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Data: ${data.date}`, margin, y);
  y += lineHeight;

  let patientInfo = `Paciente: ${data.patient.name}`;
  if (data.patient.age) patientInfo += ` | Idade: ${data.patient.age} anos`;
  if (data.patient.sex) patientInfo += ` | Sexo: ${data.patient.sex}`;
  doc.text(patientInfo, margin, y);
  y += lineHeight;

  if (data.doctorName) {
    doc.text(`Médico: ${data.doctorName}`, margin, y);
    y += lineHeight;
  }

  // Separator
  y += 5;
  doc.setDrawColor(200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  // SOAP Sections
  const contentWidth = pageWidth - margin * 2;

  // Subjective
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("SUBJETIVO (S)", margin, y);
  y += lineHeight;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  if (data.soap.subjective.chiefComplaint) {
    doc.setFont("helvetica", "bold");
    doc.text("Queixa Principal:", margin, y);
    y += lineHeight;
    doc.setFont("helvetica", "normal");
    addWrappedText(data.soap.subjective.chiefComplaint, margin, contentWidth);
    y += 3;
  }

  if (data.soap.subjective.historyPresentIllness) {
    doc.setFont("helvetica", "bold");
    doc.text("História da Doença Atual:", margin, y);
    y += lineHeight;
    doc.setFont("helvetica", "normal");
    addWrappedText(data.soap.subjective.historyPresentIllness, margin, contentWidth);
    y += 3;
  }

  y += 5;

  // Objective
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("OBJETIVO (O)", margin, y);
  y += lineHeight;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  if (data.soap.objective.vitalSigns) {
    doc.setFont("helvetica", "bold");
    doc.text("Sinais Vitais:", margin, y);
    y += lineHeight;
    doc.setFont("helvetica", "normal");
    addWrappedText(data.soap.objective.vitalSigns, margin, contentWidth);
    y += 3;
  }

  if (data.soap.objective.physicalExam) {
    doc.setFont("helvetica", "bold");
    doc.text("Exame Físico:", margin, y);
    y += lineHeight;
    doc.setFont("helvetica", "normal");
    addWrappedText(data.soap.objective.physicalExam, margin, contentWidth);
    y += 3;
  }

  if (data.soap.objective.labResults) {
    doc.setFont("helvetica", "bold");
    doc.text("Exames Complementares:", margin, y);
    y += lineHeight;
    doc.setFont("helvetica", "normal");
    addWrappedText(data.soap.objective.labResults, margin, contentWidth);
    y += 3;
  }

  y += 5;

  // Assessment
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("AVALIAÇÃO (A)", margin, y);
  y += lineHeight;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  if (data.soap.assessment.diagnoses.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.text("Diagnósticos:", margin, y);
    y += lineHeight;
    doc.setFont("helvetica", "normal");
    data.soap.assessment.diagnoses.forEach((diag) => {
      addWrappedText(`• ${diag}`, margin + 5, contentWidth - 5);
    });
    y += 3;
  }

  if (data.soap.assessment.differentials.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.text("Diagnósticos Diferenciais:", margin, y);
    y += lineHeight;
    doc.setFont("helvetica", "normal");
    data.soap.assessment.differentials.forEach((diag) => {
      addWrappedText(`• ${diag}`, margin + 5, contentWidth - 5);
    });
    y += 3;
  }

  y += 5;

  // Plan
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("PLANO (P)", margin, y);
  y += lineHeight;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  if (data.soap.plan.medications.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.text("Medicamentos:", margin, y);
    y += lineHeight;
    doc.setFont("helvetica", "normal");
    data.soap.plan.medications.forEach((med) => {
      addWrappedText(`• ${med}`, margin + 5, contentWidth - 5);
    });
    y += 3;
  }

  if (data.soap.plan.procedures.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.text("Procedimentos:", margin, y);
    y += lineHeight;
    doc.setFont("helvetica", "normal");
    data.soap.plan.procedures.forEach((proc) => {
      addWrappedText(`• ${proc}`, margin + 5, contentWidth - 5);
    });
    y += 3;
  }

  if (data.soap.plan.instructions.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.text("Orientações:", margin, y);
    y += lineHeight;
    doc.setFont("helvetica", "normal");
    data.soap.plan.instructions.forEach((inst) => {
      addWrappedText(`• ${inst}`, margin + 5, contentWidth - 5);
    });
    y += 3;
  }

  if (data.soap.plan.followUp) {
    doc.setFont("helvetica", "bold");
    doc.text("Retorno:", margin, y);
    y += lineHeight;
    doc.setFont("helvetica", "normal");
    addWrappedText(data.soap.plan.followUp, margin, contentWidth);
  }

  // Footer
  y += 15;
  doc.setFontSize(8);
  doc.setTextColor(128);
  doc.text(
    "Documento gerado por MedScribe - Conteúdo gerado com auxílio de IA, revise antes de usar.",
    pageWidth / 2,
    y,
    { align: "center" }
  );

  return doc.output("blob");
}

export function generateSOAPText(data: ExportData): string {
  let text = "NOTA CLÍNICA\n";
  text += "=".repeat(50) + "\n\n";

  text += `Data: ${data.date}\n`;
  text += `Paciente: ${data.patient.name}`;
  if (data.patient.age) text += ` | Idade: ${data.patient.age} anos`;
  if (data.patient.sex) text += ` | Sexo: ${data.patient.sex}`;
  text += "\n";
  if (data.doctorName) text += `Médico: ${data.doctorName}\n`;
  text += "\n" + "-".repeat(50) + "\n\n";

  text += "SUBJETIVO (S)\n";
  if (data.soap.subjective.chiefComplaint) {
    text += `Queixa Principal: ${data.soap.subjective.chiefComplaint}\n`;
  }
  if (data.soap.subjective.historyPresentIllness) {
    text += `HDA: ${data.soap.subjective.historyPresentIllness}\n`;
  }
  text += "\n";

  text += "OBJETIVO (O)\n";
  if (data.soap.objective.vitalSigns) {
    text += `Sinais Vitais: ${data.soap.objective.vitalSigns}\n`;
  }
  if (data.soap.objective.physicalExam) {
    text += `Exame Físico: ${data.soap.objective.physicalExam}\n`;
  }
  if (data.soap.objective.labResults) {
    text += `Exames: ${data.soap.objective.labResults}\n`;
  }
  text += "\n";

  text += "AVALIAÇÃO (A)\n";
  if (data.soap.assessment.diagnoses.length > 0) {
    text += `Diagnósticos: ${data.soap.assessment.diagnoses.join("; ")}\n`;
  }
  if (data.soap.assessment.differentials.length > 0) {
    text += `DD: ${data.soap.assessment.differentials.join("; ")}\n`;
  }
  text += "\n";

  text += "PLANO (P)\n";
  if (data.soap.plan.medications.length > 0) {
    text += `Medicamentos: ${data.soap.plan.medications.join("; ")}\n`;
  }
  if (data.soap.plan.procedures.length > 0) {
    text += `Procedimentos: ${data.soap.plan.procedures.join("; ")}\n`;
  }
  if (data.soap.plan.instructions.length > 0) {
    text += `Orientações: ${data.soap.plan.instructions.join("; ")}\n`;
  }
  if (data.soap.plan.followUp) {
    text += `Retorno: ${data.soap.plan.followUp}\n`;
  }

  text += "\n" + "-".repeat(50) + "\n";
  text += "Gerado por MedScribe - Conteúdo gerado com IA, revise antes de usar.";

  return text;
}

// --- HELPER FOR COMMON HEADER/FOOTER ---
function addPDFHeader(doc: jsPDF, title: string, data: { patient: PatientInfo; date: string; doctorName?: string }) {
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;
  const margin = 20;

  // Title
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(title.toUpperCase(), pageWidth / 2, y, { align: "center" });
  y += 15;

  // Patient Info Box
  doc.setDrawColor(200);
  doc.setFillColor(245, 247, 250);
  doc.roundedRect(margin, y, pageWidth - (margin * 2), 25, 3, 3, "F");

  y += 7;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Paciente:", margin + 5, y);
  doc.setFont("helvetica", "normal");
  doc.text(data.patient.name, margin + 25, y);

  // Right side info
  doc.setFont("helvetica", "bold");
  doc.text("Data:", pageWidth - margin - 40, y);
  doc.setFont("helvetica", "normal");
  doc.text(data.date, pageWidth - margin - 28, y);

  y += 8;
  if (data.patient.age || data.patient.sex) {
    doc.setFont("helvetica", "bold");
    doc.text("Detalhes:", margin + 5, y);
    doc.setFont("helvetica", "normal");
    let details = "";
    if (data.patient.age) details += `${data.patient.age} anos`;
    if (data.patient.sex) details += ` | Sexo: ${data.patient.sex}`;
    doc.text(details, margin + 25, y);
  }

  return y + 25; // Return next Y position
}

function addPDFFooter(doc: jsPDF, doctorName?: string) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  let y = pageHeight - 40;

  // Signature Line
  doc.setDrawColor(0);
  doc.line(pageWidth / 2 - 40, y, pageWidth / 2 + 40, y);
  y += 5;

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(doctorName || "Médico Responsável", pageWidth / 2, y, { align: "center" });

  // System Footer
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text("Documento gerado digitalmente via MedScribe.", pageWidth / 2, pageHeight - 10, { align: "center" });
  doc.setTextColor(0); // Reset
}

export function generatePrescriptionPDF(data: PrescriptionData): Blob {
  const doc = new jsPDF();
  let y = addPDFHeader(doc, "Receituário Médico", data);
  const margin = 20;

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text("Uso:", margin, y);
  y += 10;

  data.medications.forEach((med, index) => {
    // Medication Name
    doc.setFont("helvetica", "bold");
    doc.text(`${index + 1}. ${med.name}`, margin + 5, y);
    y += 7;

    // Instructions
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(med.instructions, 150);
    doc.text(lines, margin + 10, y);
    y += (lines.length * 6) + 5;
  });

  addPDFFooter(doc, data.doctorName);
  return doc.output("blob");
}

export function generateExamPDF(data: ExamData): Blob {
  const doc = new jsPDF();
  let y = addPDFHeader(doc, "Pedido de Exames", data);
  const margin = 20;

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text("Solicito a realização dos seguintes exames:", margin, y);
  y += 15;

  data.exams.forEach((exam) => {
    doc.circle(margin + 5, y - 1.5, 1, "F");
    doc.text(exam, margin + 10, y);
    y += 8;
  });

  y += 10;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(10);
  doc.text("Justificativa Clínica: Investigação diagnóstica.", margin, y);

  addPDFFooter(doc, data.doctorName);
  return doc.output("blob");
}

export function generateCertificatePDF(data: CertificateData): Blob {
  const doc = new jsPDF();
  let y = addPDFHeader(doc, "Atestado Médico", data);
  const margin = 20;
  const contentWidth = doc.internal.pageSize.getWidth() - (margin * 2);

  y += 20;
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");

  const lines = doc.splitTextToSize(data.full_text, contentWidth);
  doc.text(lines, margin, y);
  y += (lines.length * 8) + 10;

  if (data.cid) {
    doc.setFont("helvetica", "bold");
    doc.text(`CID: ${data.cid}`, margin, y);
  }

  addPDFFooter(doc, data.doctorName);
  return doc.output("blob");
}
