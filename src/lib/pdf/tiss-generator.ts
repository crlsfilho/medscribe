import { jsPDF } from "jspdf";
import { TussProcedure } from "@/types/active-agent";

interface TissFormData {
  patientName: string;
  patientAge?: number;
  patientSex?: string;
  procedures: TussProcedure[];
  cidCode?: string;
  cidDescription?: string;
  clinicalIndication: string;
  urgency: "routine" | "urgent" | "emergency";
  requestDate: string;
  doctorName?: string;
  doctorCrm?: string;
  clinicName?: string;
}

/**
 * Generate a TISS form PDF
 */
export function generateTissPDF(data: TissFormData): Blob {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 15;

  // Helper function to add text with word wrap
  const addWrappedText = (
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight = 5
  ): number => {
    const lines = doc.splitTextToSize(text, maxWidth);
    doc.text(lines, x, y);
    return y + lines.length * lineHeight;
  };

  // Title
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("GUIA DE SOLICITACAO DE SP/SADT", pageWidth / 2, yPos, {
    align: "center",
  });
  yPos += 8;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("(Servicos Profissionais / Servico Auxiliar de Diagnostico e Terapia)", pageWidth / 2, yPos, {
    align: "center",
  });
  yPos += 10;

  // Registry box
  doc.setDrawColor(0);
  doc.setLineWidth(0.3);
  doc.rect(10, yPos, pageWidth - 20, 20);

  doc.setFontSize(7);
  doc.text("1 - Registro ANS", 12, yPos + 4);
  doc.setFontSize(9);
  doc.text("_______________", 12, yPos + 10);

  doc.setFontSize(7);
  doc.text("2 - Numero da Guia no Prestador", 80, yPos + 4);
  doc.setFontSize(9);
  const guiaNumber = `${Date.now().toString().slice(-8)}`;
  doc.text(guiaNumber, 80, yPos + 10);

  doc.setFontSize(7);
  doc.text("3 - Data da Solicitacao", 140, yPos + 4);
  doc.setFontSize(9);
  doc.text(data.requestDate, 140, yPos + 10);

  yPos += 25;

  // Beneficiary data section
  doc.setFillColor(240, 240, 240);
  doc.rect(10, yPos, pageWidth - 20, 7, "F");
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("DADOS DO BENEFICIARIO", pageWidth / 2, yPos + 5, { align: "center" });
  yPos += 10;

  doc.rect(10, yPos, pageWidth - 20, 25);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);

  doc.text("4 - Numero da Carteira", 12, yPos + 4);
  doc.text("_______________________", 12, yPos + 10);

  doc.text("5 - Validade da Carteira", 70, yPos + 4);
  doc.text("___/___/_____", 70, yPos + 10);

  doc.text("6 - Nome", 12, yPos + 16);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(data.patientName.toUpperCase(), 30, yPos + 16);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  if (data.patientAge) {
    doc.text(`Idade: ${data.patientAge} anos`, 140, yPos + 16);
  }
  if (data.patientSex) {
    const sexLabel = data.patientSex === "M" ? "Masculino" : data.patientSex === "F" ? "Feminino" : data.patientSex;
    doc.text(`Sexo: ${sexLabel}`, 170, yPos + 16);
  }

  yPos += 30;

  // Requesting provider section
  doc.setFillColor(240, 240, 240);
  doc.rect(10, yPos, pageWidth - 20, 7, "F");
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("DADOS DO CONTRATADO SOLICITANTE", pageWidth / 2, yPos + 5, { align: "center" });
  yPos += 10;

  doc.rect(10, yPos, pageWidth - 20, 20);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);

  doc.text("7 - Codigo na Operadora", 12, yPos + 4);
  doc.text("_______________", 12, yPos + 10);

  doc.text("8 - Nome do Contratado", 70, yPos + 4);
  doc.text(data.clinicName || "___________________________", 70, yPos + 10);

  doc.text("9 - Nome do Profissional Solicitante", 12, yPos + 14);
  doc.text(data.doctorName || "___________________________", 70, yPos + 14);

  doc.text("10 - Conselho", 140, yPos + 4);
  doc.text("CRM", 140, yPos + 10);

  doc.text("11 - Numero", 160, yPos + 4);
  doc.text(data.doctorCrm || "_______", 160, yPos + 10);

  doc.text("12 - UF", 185, yPos + 4);
  doc.text("__", 185, yPos + 10);

  yPos += 25;

  // Request details section
  doc.setFillColor(240, 240, 240);
  doc.rect(10, yPos, pageWidth - 20, 7, "F");
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("DADOS DA SOLICITACAO / PROCEDIMENTOS SOLICITADOS", pageWidth / 2, yPos + 5, { align: "center" });
  yPos += 10;

  // Urgency
  doc.rect(10, yPos, pageWidth - 20, 10);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text("13 - Carater do Atendimento:", 12, yPos + 6);

  const urgencyLabel = data.urgency === "emergency" ? "Emergencia" : data.urgency === "urgent" ? "Urgencia" : "Eletivo";
  doc.setFont("helvetica", "bold");
  doc.text(urgencyLabel, 55, yPos + 6);

  yPos += 12;

  // Procedures table header
  doc.setFillColor(220, 220, 220);
  doc.rect(10, yPos, pageWidth - 20, 8, "F");
  doc.setLineWidth(0.3);
  doc.rect(10, yPos, pageWidth - 20, 8);

  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text("Tab", 12, yPos + 5);
  doc.text("Codigo do Procedimento", 25, yPos + 5);
  doc.text("Descricao", 70, yPos + 5);
  doc.text("Qtd", 175, yPos + 5);
  doc.text("Via", 188, yPos + 5);

  yPos += 8;

  // Procedures rows
  doc.setFont("helvetica", "normal");
  data.procedures.forEach((proc) => {
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    doc.rect(10, yPos, pageWidth - 20, 8);

    doc.setFontSize(7);
    doc.text(proc.table, 12, yPos + 5);
    doc.text(proc.code || "-", 25, yPos + 5);

    // Truncate description if too long
    const maxDescLength = 55;
    const desc = proc.description.length > maxDescLength
      ? proc.description.slice(0, maxDescLength) + "..."
      : proc.description;
    doc.text(desc, 70, yPos + 5);

    doc.text(String(proc.quantity), 175, yPos + 5);
    doc.text("U", 188, yPos + 5);

    yPos += 8;
  });

  yPos += 5;

  // CID section
  doc.rect(10, yPos, pageWidth - 20, 15);
  doc.setFontSize(7);
  doc.text("21 - Indicacao Clinica:", 12, yPos + 5);
  if (data.clinicalIndication) {
    doc.setFontSize(8);
    yPos = addWrappedText(data.clinicalIndication, 12, yPos + 10, pageWidth - 25, 4);
  }

  yPos += 8;

  doc.rect(10, yPos, pageWidth - 20, 10);
  doc.setFontSize(7);
  doc.text("22 - CID-10 Principal:", 12, yPos + 6);
  if (data.cidCode) {
    doc.setFont("helvetica", "bold");
    doc.text(`${data.cidCode} - ${data.cidDescription || ""}`, 50, yPos + 6);
  }

  yPos += 15;

  // Signatures area
  if (yPos > 240) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text("23 - Data de Autorizacao", 12, yPos);
  doc.text("___/___/_____", 12, yPos + 5);

  yPos += 15;

  // Signature lines
  doc.line(15, yPos, 85, yPos);
  doc.text("Assinatura do Beneficiario ou Responsavel", 20, yPos + 4);

  doc.line(110, yPos, 195, yPos);
  doc.text("Assinatura do Profissional Solicitante", 120, yPos + 4);

  yPos += 15;

  // Footer disclaimer
  doc.setFontSize(6);
  doc.setTextColor(100);
  doc.text(
    "Documento gerado automaticamente pelo sistema MedScribe. Conteudo assistido por IA - verificar dados antes do uso.",
    pageWidth / 2,
    yPos,
    { align: "center" }
  );

  return doc.output("blob");
}
