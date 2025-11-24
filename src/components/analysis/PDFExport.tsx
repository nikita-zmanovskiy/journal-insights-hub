import { Button } from '@/components/ui/button';
import { FileDown } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { toast } from 'sonner';

interface PDFExportProps {
  report: any;
  violations: any[];
  chartsRef?: React.RefObject<HTMLDivElement>;
  timelineRef?: React.RefObject<HTMLDivElement>;
}

export const PDFExport = ({ report, violations, chartsRef, timelineRef }: PDFExportProps) => {
  const generatePDF = async () => {
    try {
      toast.info('Генерация PDF отчёта...');
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
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

      // Статистика нарушений
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

      // Добавляем графики если есть
      if (chartsRef?.current) {
        pdf.addPage();
        yPosition = 20;
        pdf.setFontSize(16);
        pdf.text('Визуализация нарушений', 20, yPosition);
        yPosition += 10;

        try {
          const canvas = await html2canvas(chartsRef.current, {
            scale: 2,
            logging: false,
            backgroundColor: '#ffffff'
          });
          const imgData = canvas.toDataURL('image/png');
          const imgWidth = pageWidth - 40;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          
          if (yPosition + imgHeight > pageHeight - 20) {
            pdf.addPage();
            yPosition = 20;
          }
          
          pdf.addImage(imgData, 'PNG', 20, yPosition, imgWidth, imgHeight);
          yPosition += imgHeight + 10;
        } catch (error) {
          console.error('Ошибка при добавлении графиков:', error);
        }
      }

      // Добавляем хронологию если есть
      if (timelineRef?.current) {
        pdf.addPage();
        yPosition = 20;
        pdf.setFontSize(16);
        pdf.text('Хронология нарушений', 20, yPosition);
        yPosition += 10;

        try {
          const canvas = await html2canvas(timelineRef.current, {
            scale: 2,
            logging: false,
            backgroundColor: '#ffffff'
          });
          const imgData = canvas.toDataURL('image/png');
          const imgWidth = pageWidth - 40;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          
          if (yPosition + imgHeight > pageHeight - 20) {
            pdf.addPage();
            yPosition = 20;
          }
          
          pdf.addImage(imgData, 'PNG', 20, yPosition, imgWidth, imgHeight);
        } catch (error) {
          console.error('Ошибка при добавлении хронологии:', error);
        }
      }

      // Детальные нарушения
      if (violations && violations.length > 0) {
        pdf.addPage();
        yPosition = 20;
        pdf.setFontSize(16);
        pdf.text('Детальный список нарушений', 20, yPosition);
        yPosition += 10;
        pdf.setFontSize(10);

        violations.slice(0, 20).forEach((violation, index) => {
          if (yPosition > pageHeight - 40) {
            pdf.addPage();
            yPosition = 20;
          }
          
          pdf.setFontSize(11);
          pdf.text(`${index + 1}. ${categoryLabels[violation.category] || violation.category}`, 20, yPosition);
          yPosition += 6;
          pdf.setFontSize(9);
          pdf.text(`Серьезность: ${violation.severity}`, 25, yPosition);
          yPosition += 5;
          const splitText = pdf.splitTextToSize(`Текст: ${violation.text}`, pageWidth - 50);
          pdf.text(splitText, 25, yPosition);
          yPosition += splitText.length * 5 + 5;
        });
      }

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
