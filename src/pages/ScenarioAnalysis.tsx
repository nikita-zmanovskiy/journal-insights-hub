import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const API_URL = 'http://158.160.98.70:8000';

interface AnalysisReport {
  file_id: string;
  filename: string;
  overall_rating: string;
  summary: string;
  statistics: {
    total_sentences: number;
    problematic_sentences: number;
    problematic_percentage: number;
    violations: {
      violence: number;
      profanity: number;
      sexual_content: number;
      drugs_alcohol: number;
      fear_elements: number;
    };
  };
}

const ScenarioAnalysis = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [analysisReport, setAnalysisReport] = useState<AnalysisReport | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      toast({
        title: 'Файл выбран',
        description: `${selectedFile.name} — ${Math.round(selectedFile.size / 1024)} KB`,
      });
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: 'Ошибка',
        description: 'Выберите файл для анализа',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    setProgress(10);

    try {
      const formData = new FormData();
      formData.append('file', file);

      setProgress(30);
      const response = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        body: formData,
      });

      setProgress(70);
      const data = await response.json();

      if (data.status === 'done') {
        setAnalysisReport(data);
        setProgress(100);

        await supabase.from('scenarios').insert([
          {
            user_id: user?.id,
            title: file.name,
            content: await file.text(),
            analysis_data: data,
          },
        ]);

        toast({
          title: 'Анализ завершён',
          description: 'Результаты успешно сохранены',
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось выполнить анализ',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setTimeout(() => setProgress(0), 500);
    }
  };

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case '0+':
        return 'text-green-500';
      case '6+':
        return 'text-yellow-500';
      case '12+':
      case '16+':
        return 'text-orange-500';
      case '18+':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => navigate('/')}
            className="px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
          >
            ← Назад к чату
          </button>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Детальный анализ сценариев
          </h1>
          <div className="w-24" />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="glass-panel rounded-lg p-6 lg:col-span-1">
            <h2 className="text-xl font-semibold mb-4">Загрузка файла</h2>
            <div className="space-y-4">
              <input
                type="file"
                accept=".txt,.pdf,.docx"
                onChange={handleFileChange}
                className="w-full px-3 py-2 bg-muted rounded-lg"
              />
              {file && (
                <p className="text-sm text-muted-foreground">
                  {file.name} — {Math.round(file.size / 1024)} KB
                </p>
              )}

              <button
                onClick={handleUpload}
                disabled={!file || loading}
                className="w-full px-4 py-2 bg-gradient-to-r from-primary to-accent rounded-lg hover:opacity-90 disabled:opacity-50"
              >
                {loading ? 'Анализ...' : 'Загрузить и анализировать'}
              </button>

              {progress > 0 && (
                <div className="space-y-2">
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    {progress < 30 && 'Загрузка файла...'}
                    {progress >= 30 && progress < 70 && 'Анализ текста...'}
                    {progress >= 70 && progress < 100 && 'Обработка результатов...'}
                    {progress === 100 && 'Завершено!'}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2">
            {!analysisReport ? (
              <div className="glass-panel rounded-lg p-12 text-center">
                <h3 className="text-xl font-semibold mb-2">Загрузите сценарий для анализа</h3>
                <p className="text-muted-foreground">
                  Выберите файл и нажмите кнопку "Загрузить и анализировать"
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="glass-panel rounded-lg p-6">
                  <h2 className="text-2xl font-semibold mb-4">Общий обзор</h2>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="glass-panel rounded-lg p-4">
                      <p className="text-sm text-muted-foreground">Общий рейтинг</p>
                      <p className={`text-3xl font-bold ${getRatingColor(analysisReport.overall_rating)}`}>
                        {analysisReport.overall_rating}
                      </p>
                    </div>
                    <div className="glass-panel rounded-lg p-4">
                      <p className="text-sm text-muted-foreground">Проблемные</p>
                      <p className="text-3xl font-bold">
                        {analysisReport.statistics.problematic_sentences} /{' '}
                        {analysisReport.statistics.total_sentences}
                      </p>
                    </div>
                  </div>

                  <div className="glass-panel rounded-lg p-4">
                    <p className="text-sm text-muted-foreground mb-2">Краткое описание</p>
                    <p className="text-base">{analysisReport.summary}</p>
                  </div>
                </div>

                <div className="glass-panel rounded-lg p-6">
                  <h2 className="text-2xl font-semibold mb-4">Детализация нарушений</h2>
                  <div className="space-y-3">
                    {Object.entries(analysisReport.statistics.violations).map(([key, value]) => {
                      const labels: Record<string, string> = {
                        violence: 'Насилие',
                        profanity: 'Ненормативная лексика',
                        sexual_content: 'Сексуальный контент',
                        drugs_alcohol: 'Наркотики/Алкоголь',
                        fear_elements: 'Элементы страха',
                      };
                      const total = Math.max(...Object.values(analysisReport.statistics.violations), 1);
                      return (
                        <div key={key} className="glass-panel rounded-lg p-3">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium">{labels[key]}</span>
                            <span className="text-lg font-bold">{value}</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-primary to-accent"
                              style={{
                                width: `${(value / total) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScenarioAnalysis;
