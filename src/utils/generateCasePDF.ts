import { jsPDF } from 'jspdf';
import { format } from 'date-fns';

interface CaseData {
  case_number: string;
  title: string;
  plaintiff: string;
  defendant: string;
  category: string;
  status: string;
  description?: string;
  created_at: string;
  verdict?: string;
  next_hearing_date?: string;
}

interface Transcript {
  speaker_name: string;
  speaker_role: string;
  message: string;
  created_at: string;
}

interface Evidence {
  file_name: string;
  file_type: string;
  provided_by: string;
  description?: string;
  ai_analysis?: string;
  created_at: string;
}

interface GeneratePDFParams {
  caseData: CaseData;
  transcripts: Transcript[];
  evidence: Evidence[];
}

export const generateCasePDF = ({ caseData, transcripts, evidence }: GeneratePDFParams): void => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = 20;

  // Helper function to add new page if needed
  const checkPageBreak = (requiredHeight: number) => {
    if (y + requiredHeight > doc.internal.pageSize.getHeight() - 20) {
      doc.addPage();
      y = 20;
    }
  };

  // Helper to add text with word wrap
  const addWrappedText = (text: string, fontSize: number, isBold = false) => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    const lines = doc.splitTextToSize(text, contentWidth);
    checkPageBreak(lines.length * fontSize * 0.4);
    doc.text(lines, margin, y);
    y += lines.length * fontSize * 0.4 + 4;
  };

  // Header
  doc.setFillColor(30, 58, 138); // Dark blue
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('eNyayaSetu', margin, 18);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Digital Bridge of Justice', margin, 26);
  doc.setFontSize(9);
  doc.text(`Generated: ${format(new Date(), 'PPpp')}`, margin, 34);
  
  y = 55;
  doc.setTextColor(0, 0, 0);

  // Case Title Section
  doc.setFillColor(245, 245, 245);
  doc.rect(margin, y - 5, contentWidth, 30, 'F');
  doc.setDrawColor(30, 58, 138);
  doc.setLineWidth(0.5);
  doc.rect(margin, y - 5, contentWidth, 30, 'S');
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`Case No: ${caseData.case_number}`, margin + 5, y + 5);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(caseData.title, margin + 5, y + 15);
  y += 35;

  // Case Details Section
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('CASE DETAILS', margin, y);
  y += 8;
  
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, margin + contentWidth, y);
  y += 8;

  const details = [
    ['Plaintiff', caseData.plaintiff],
    ['Defendant', caseData.defendant],
    ['Category', caseData.category],
    ['Status', caseData.status.toUpperCase()],
    ['Filed On', format(new Date(caseData.created_at), 'PPP')],
  ];

  if (caseData.next_hearing_date) {
    details.push(['Next Hearing', format(new Date(caseData.next_hearing_date), 'PPP')]);
  }

  doc.setFontSize(10);
  details.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(`${label}:`, margin, y);
    doc.setFont('helvetica', 'normal');
    doc.text(value || 'N/A', margin + 45, y);
    y += 6;
  });
  
  y += 5;

  // Description
  if (caseData.description) {
    checkPageBreak(30);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('CASE DESCRIPTION', margin, y);
    y += 8;
    doc.line(margin, y, margin + contentWidth, y);
    y += 8;
    addWrappedText(caseData.description, 10);
    y += 5;
  }

  // Verdict Section
  if (caseData.verdict) {
    checkPageBreak(40);
    doc.setFillColor(34, 197, 94);
    doc.rect(margin, y, contentWidth, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('VERDICT', margin + 5, y + 6);
    y += 12;
    doc.setTextColor(0, 0, 0);
    addWrappedText(caseData.verdict, 11);
    y += 5;
  }

  // Evidence Section
  if (evidence.length > 0) {
    checkPageBreak(30);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`EVIDENCE (${evidence.length} items)`, margin, y);
    y += 8;
    doc.line(margin, y, margin + contentWidth, y);
    y += 8;

    evidence.forEach((item, index) => {
      checkPageBreak(25);
      doc.setFillColor(250, 250, 250);
      const boxHeight = item.ai_analysis ? 30 : 18;
      doc.rect(margin, y - 3, contentWidth, boxHeight, 'F');
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`${index + 1}. ${item.file_name}`, margin + 3, y + 3);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(
        `Type: ${item.file_type} | Provided by: ${item.provided_by} | ${format(new Date(item.created_at), 'PP')}`,
        margin + 3,
        y + 10
      );
      
      if (item.ai_analysis) {
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        const analysisLines = doc.splitTextToSize(`AI Analysis: ${item.ai_analysis}`, contentWidth - 10);
        doc.text(analysisLines.slice(0, 2), margin + 3, y + 17);
        doc.setTextColor(0, 0, 0);
      }
      
      y += boxHeight + 5;
    });
    y += 5;
  }

  // Transcript Section
  if (transcripts.length > 0) {
    checkPageBreak(30);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`COURT TRANSCRIPT (${transcripts.length} entries)`, margin, y);
    y += 8;
    doc.line(margin, y, margin + contentWidth, y);
    y += 8;

    transcripts.forEach((entry) => {
      checkPageBreak(20);
      
      // Role color coding
      let roleColor: [number, number, number] = [0, 0, 0];
      if (entry.speaker_role.toLowerCase().includes('judge')) {
        roleColor = [30, 58, 138]; // Blue
      } else if (entry.speaker_role.toLowerCase().includes('prosecutor')) {
        roleColor = [220, 38, 38]; // Red
      } else if (entry.speaker_role.toLowerCase().includes('defence')) {
        roleColor = [22, 163, 74]; // Green
      }

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...roleColor);
      doc.text(`[${entry.speaker_role.toUpperCase()}] ${entry.speaker_name}`, margin, y);
      
      doc.setTextColor(150, 150, 150);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(format(new Date(entry.created_at), 'HH:mm:ss'), pageWidth - margin - 20, y);
      
      y += 5;
      doc.setTextColor(0, 0, 0);
      addWrappedText(entry.message, 10);
      y += 3;
    });
  }

  // Footer on each page
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFillColor(30, 58, 138);
    doc.rect(0, pageHeight - 15, pageWidth, 15, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text(
      `Page ${i} of ${totalPages} | eNyayaSetu - Digital Bridge of Justice | Confidential Legal Document`,
      margin,
      pageHeight - 6
    );
  }

  // Save the PDF
  doc.save(`Case_${caseData.case_number}_Summary.pdf`);
};
