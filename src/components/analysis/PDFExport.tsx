import { Button } from '@/components/ui/button';
import { FileDown } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { toast } from 'sonner';

interface PDFExportProps {
  report: any;
  violations: any[];
}

export const PDFExport = ({ report, violations }: PDFExportProps) => {
  const generatePDF = async () => {
    try {
      toast.info('Генерация PDF отчёта...');
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      let yPosition = 20;

      // Заголовок
      pdf.setFontSize(20);
      pdf.text('Отчёт по анализу сценария', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;

      // Общая информация
      pdf.setFontSize(12);
      pdf.text(`Возрастной рейтинг: ${report.rating}`, 20, yPosition);
      yPosition += 10;
      pdf.text(`Общее количество сцен: ${report.statistics.total_sentences}`, 20, yPosition);
      yPosition += 10;
      pdf.text(`Проблемных сцен: ${report.statistics.problematic_sentences}`, 20, yPosition);
      yPosition += 15;

      // Статистика
      pdf.setFontSize(14);
      pdf.text('Статистика нарушений:', 20, yPosition);
      yPosition += 10;
      pdf.setFontSize(10);

      const categoryLabels: Record<string, string> = {
        violence: 'Насилие',
        profanity: 'Нецензурная лексика',
        sexual_content: 'Сексуальный контент',
        drugs_alcohol: 'Наркотики/Алкоголь',
        fear_elements: 'Элементы страха',
      };

      Object.entries(report.statistics.violations).forEach(([key, value]) => {
        pdf.text(`${categoryLabels[key]}: ${value}`, 25, yPosition);
        yPosition += 7;
      });

      // Сохранение
      pdf.save(`scenario-report-${report.rating}-${Date.now()}.pdf`);
      toast.success('PDF отчёт успешно сгенерирован!');
    } catch (error) {
      console.error('Ошибка генерации PDF:', error);
      toast.error('Ошибка при генерации PDF отчёта');
    }
  };

  return (
    <Button onClick={generatePDF} variant="outline" className="gap-2">
      <FileDown className="w-4 h-4" />
      Экспорт PDF
    </Button>
  );
};
