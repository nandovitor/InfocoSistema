import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { User } from '../types';

export const generatePdfReport = async (
    reportContentId: string, 
    user: User | null, 
    period: string,
    department: string
) => {
  const reportElement = document.getElementById(reportContentId);
  if (!reportElement) {
    console.error("Elemento de conteúdo do relatório não encontrado!");
    return;
  }

  // Show the element temporarily to render it correctly
  reportElement.style.display = 'block';
  reportElement.style.position = 'absolute';
  reportElement.style.left = '-9999px';
  reportElement.style.top = '-9999px';
  reportElement.style.width = '1024px'; // Define a fixed width for consistent rendering
  
  try {
    const canvas = await html2canvas(reportElement, {
        scale: 2, // Higher scale for better quality
        useCORS: true,
        logging: false,
    });
    
    // Hide the element again after capture
    reportElement.style.display = 'none';

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = imgWidth / imgHeight;
    
    const finalImgWidth = pdfWidth - 20; // with margin
    const finalImgHeight = finalImgWidth / ratio;
    
    // Add header
    pdf.setFontSize(18);
    pdf.setTextColor(44, 62, 80); // #2c3e50
    pdf.text("Relatório de Desempenho - Infoco Gestão Pública", pdfWidth / 2, 20, { align: 'center' });

    // Add metadata
    pdf.setFontSize(10);
    pdf.setTextColor(100);
    pdf.text(`Gerado por: ${user?.name || 'N/D'}`, 10, 30);
    pdf.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 10, 35);
    pdf.text(`Período: ${period}`, 10, 40);
    pdf.text(`Departamento: ${department || 'Todos'}`, 10, 45);

    // Add a line separator
    pdf.setDrawColor(224, 224, 224);
    pdf.line(10, 50, pdfWidth - 10, 50);

    // Add content image
    let currentHeight = 55;
    if (finalImgHeight > (pdfHeight - currentHeight - 10)) {
        console.warn("O conteúdo do relatório é muito longo para uma única página, considere dividi-lo.");
    }
    pdf.addImage(imgData, 'PNG', 10, currentHeight, finalImgWidth, finalImgHeight);
    
    // Add footer
    const pageCount = pdf.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(150);
        pdf.text(
            `Página ${i} de ${pageCount}`,
            pdfWidth - 10,
            pdfHeight - 10,
            { align: 'right' }
        );
    }

    pdf.save(`relatorio_infoco_${new Date().toISOString().split('T')[0]}.pdf`);
  } catch(e) {
      console.error("Erro ao gerar PDF", e);
      reportElement.style.display = 'none';
  }
};