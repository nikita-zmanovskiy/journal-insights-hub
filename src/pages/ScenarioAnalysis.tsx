import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ParentsGuideSection } from '@/components/analysis/ParentsGuideSection';
import { SceneTimeline } from '@/components/analysis/SceneTimeline';
import { SceneEditor } from '@/components/analysis/SceneEditor';
import { ViolationCharts } from '@/components/analysis/ViolationCharts';
import { VersionComparison } from '@/components/analysis/VersionComparison';
import { TimelineStatistics } from '@/components/analysis/TimelineStatistics';
import { RecommendationsPanel } from '@/components/analysis/RecommendationsPanel';

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
  scenes?: Array<{
    id: string;
    title: string;
    timestamp: string;
    duration: string;
    violations: string[];
    severity: 'None' | 'Mild' | 'Moderate' | 'Severe';
    text: string;
  }>;
  detailed_violations?: Array<{
    category: string;
    severity: 'None' | 'Mild' | 'Moderate' | 'Severe';
    count: number;
    percentage: number;
    episodes: Array<{
      scene: string;
      description: string;
      timestamp: string;
      isFalsePositive?: boolean;
    }>;
  }>;
}

const ScenarioAnalysis = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [analysisReport, setAnalysisReport] = useState<AnalysisReport | null>(null);
  const [selectedScene, setSelectedScene] = useState<any>(null);
  const [violations, setViolations] = useState<any[]>([]);
  const [versions, setVersions] = useState<any[]>([]);
  const [timelineData, setTimelineData] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [targetRating, setTargetRating] = useState('12+');
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
        
        // Process violations for Parents Guide
        if (data.statistics?.violations) {
          const processedViolations = Object.entries(data.statistics.violations).map(([key, count]) => {
            const totalScenes = data.scenes?.length || 100;
            const percentage = ((count as number) / totalScenes) * 100;
            
            let severity: 'None' | 'Mild' | 'Moderate' | 'Severe' = 'None';
            if (percentage === 0) severity = 'None';
            else if (percentage < 10) severity = 'Mild';
            else if (percentage < 25) severity = 'Moderate';
            else severity = 'Severe';

            return {
              category: key,
              severity,
              count: count as number,
              percentage,
              episodes: data.detailed_violations?.[key] || [],
            };
          });
        setViolations(processedViolations);
        }
        
        // Add version to comparison
        const newVersion = {
          id: `version-${Date.now()}`,
          name: file.name,
          uploadDate: new Date().toLocaleString('ru-RU'),
          rating: data.overall_rating,
          statistics: data.statistics,
        };
        setVersions(prev => [...prev, newVersion]);
        
        // Generate timeline data
        generateTimelineData(data);
        
        // Generate recommendations
        generateRecommendations(data);

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

  const handleToggleFalsePositive = (category: string, episodeIndex: number) => {
    setViolations(prev =>
      prev.map(v => {
        if (v.category === category) {
          const newEpisodes = [...v.episodes];
          newEpisodes[episodeIndex] = {
            ...newEpisodes[episodeIndex],
            isFalsePositive: !newEpisodes[episodeIndex].isFalsePositive,
          };
          return { ...v, episodes: newEpisodes };
        }
        return v;
      })
    );
  };

  const handleSaveScene = (sceneId: string, newText: string) => {
    setAnalysisReport(prev => {
      if (!prev?.scenes) return prev;
      return {
        ...prev,
        scenes: prev.scenes.map(s => (s.id === sceneId ? { ...s, text: newText } : s)),
      };
    });
  };

  const handleReanalyzeScene = async (sceneId: string, text: string) => {
    toast({
      title: 'Переанализ сцены',
      description: 'Отправка запроса на переанализ...',
    });
    // API call would go here
  };
  
  const generateTimelineData = (data: AnalysisReport) => {
    // Generate timeline data points (every 5 minutes for a 2-hour movie)
    const dataPoints = [];
    const totalMinutes = 120; // 2 hours
    const interval = 5;
    
    for (let i = 0; i <= totalMinutes; i += interval) {
      const hours = Math.floor(i / 60);
      const minutes = i % 60;
      const timestamp = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      
      // Simulate distribution of violations across timeline
      const progress = i / totalMinutes;
      dataPoints.push({
        timestamp,
        time: i,
        violence: Math.floor(Math.random() * 5 * (1 + progress)),
        profanity: Math.floor(Math.random() * 4 * (1 + progress)),
        sexual_content: Math.floor(Math.random() * 3),
        drugs_alcohol: Math.floor(Math.random() * 3),
        fear_elements: Math.floor(Math.random() * 4 * (1 + progress)),
        total: 0,
      });
      
      const lastPoint = dataPoints[dataPoints.length - 1];
      lastPoint.total = lastPoint.violence + lastPoint.profanity + 
                        lastPoint.sexual_content + lastPoint.drugs_alcohol + 
                        lastPoint.fear_elements;
    }
    
    setTimelineData(dataPoints);
  };
  
  const generateRecommendations = (data: AnalysisReport) => {
    const recs = [
      {
        id: 'rec-1',
        scene: 'Сцена 2',
        timestamp: '00:04:15',
        category: 'profanity',
        severity: 'high' as const,
        currentText: 'Герой использует грубые выражения в адрес противника',
        issue: 'Прямое использование нецензурной лексики повышает рейтинг до 18+',
        suggestions: [
          {
            text: 'Герой использует резкие выражения в адрес противника',
            ratingImpact: 'Снижение до 16+',
            explanation: 'Замена нецензурной лексики на эмоционально окрашенные, но допустимые слова',
          },
          {
            text: 'Герой выражает недовольство действиями противника',
            ratingImpact: 'Снижение до 12+',
            explanation: 'Полное переформулирование без эмоционально резких выражений',
          },
        ],
      },
      {
        id: 'rec-2',
        scene: 'Сцена 5',
        timestamp: '00:15:30',
        category: 'violence',
        severity: 'high' as const,
        currentText: 'Подробное описание драки с детализацией ударов и ран',
        issue: 'Графическое описание насилия не подходит для аудитории младше 18 лет',
        suggestions: [
          {
            text: 'Происходит столкновение, камера показывает общий план без детализации',
            ratingImpact: 'Снижение до 16+',
            explanation: 'Показ конфликта без графических деталей насилия',
          },
          {
            text: 'Намек на физическое столкновение, основной акцент на эмоциях персонажей',
            ratingImpact: 'Снижение до 12+',
            explanation: 'Переход от физического к эмоциональному конфликту',
          },
        ],
      },
      {
        id: 'rec-3',
        scene: 'Сцена 8',
        timestamp: '00:28:45',
        category: 'drugs_alcohol',
        severity: 'medium' as const,
        currentText: 'Герой пьет алкоголь и демонстрирует признаки опьянения',
        issue: 'Демонстрация употребления алкоголя требует возрастного ограничения',
        suggestions: [
          {
            text: 'Герой держит бокал, но не показывается процесс употребления',
            ratingImpact: 'Снижение до 12+',
            explanation: 'Присутствие алкоголя без акцента на его употреблении',
          },
          {
            text: 'Герой сидит в баре с безалкогольным напитком',
            ratingImpact: 'Снижение до 6+',
            explanation: 'Полная замена алкоголя на безалкогольную альтернативу',
          },
        ],
      },
    ];
    
    setRecommendations(recs);
  };
  
  const handleRemoveVersion = (versionId: string) => {
    setVersions(prev => prev.filter(v => v.id !== versionId));
    toast({
      title: 'Версия удалена',
      description: 'Версия успешно удалена из сравнения',
    });
  };
  
  const handleApplyRecommendation = (recommendationId: string, suggestionIndex: number) => {
    setRecommendations(prev =>
      prev.map(rec =>
        rec.id === recommendationId ? { ...rec, applied: true } : rec
      )
    );
    
    toast({
      title: 'Рекомендация применена',
      description: 'Изменения сохранены. Не забудьте переанализировать сценарий.',
    });
  };

  const handleExportReport = () => {
    if (!analysisReport) return;
    
    const reportData = {
      filename: analysisReport.filename,
      rating: analysisReport.overall_rating,
      summary: analysisReport.summary,
      statistics: analysisReport.statistics,
      violations: violations.filter(v => !v.episodes.every((e: any) => e.isFalsePositive)),
      exportDate: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analysis-report-${analysisReport.filename}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Отчёт экспортирован',
      description: 'Файл успешно сохранён',
    });
  };

  const handleLoadDemo = () => {
    const demoData: AnalysisReport = {
      file_id: 'demo-001',
      filename: 'demo-scenario.pdf',
      overall_rating: '16+',
      summary: 'Сценарий содержит умеренное количество нарушений, включая сцены насилия и использование ненормативной лексики. Рекомендуется возрастное ограничение 16+.',
      statistics: {
        total_sentences: 450,
        problematic_sentences: 67,
        problematic_percentage: 14.9,
        violations: {
          violence: 23,
          profanity: 18,
          sexual_content: 8,
          drugs_alcohol: 12,
          fear_elements: 6,
        },
      },
      scenes: [
        {
          id: 'scene-1',
          title: 'Сцена 1: Открытие',
          timestamp: '00:00:00',
          duration: '3:24',
          violations: [],
          severity: 'None',
          text: 'Главный герой просыпается в своей квартире. Солнечный свет проникает через окна.',
        },
        {
          id: 'scene-2',
          title: 'Сцена 2: Конфликт',
          timestamp: '00:03:24',
          duration: '5:12',
          violations: ['Насилие', 'Нецензурная лексика'],
          severity: 'Moderate',
          text: 'Происходит драка в баре. Персонажи используют грубые выражения.',
        },
        {
          id: 'scene-3',
          title: 'Сцена 3: Размышления',
          timestamp: '00:08:36',
          duration: '2:45',
          violations: ['Алкоголь'],
          severity: 'Mild',
          text: 'Герой пьет виски и размышляет о произошедшем.',
        },
      ],
      detailed_violations: [
        {
          category: 'violence',
          severity: 'Moderate' as const,
          count: 23,
          percentage: 5.1,
          episodes: [
            {
              scene: 'Сцена 2',
              description: 'Драка в баре с нанесением телесных повреждений',
              timestamp: '00:04:15',
            },
            {
              scene: 'Сцена 5',
              description: 'Перестрелка между главными героями и антагонистами',
              timestamp: '00:15:30',
            },
          ],
        },
        {
          category: 'profanity',
          severity: 'Mild' as const,
          count: 18,
          percentage: 4.0,
          episodes: [
            {
              scene: 'Сцена 2',
              description: 'Использование нецензурной лексики в диалоге',
              timestamp: '00:05:20',
            },
          ],
        },
        {
          category: 'sexual_content',
          severity: 'Mild' as const,
          count: 8,
          percentage: 1.8,
          episodes: [
            {
              scene: 'Сцена 8',
              description: 'Намеки на интимные отношения без явного показа',
              timestamp: '00:28:45',
            },
          ],
        },
        {
          category: 'drugs_alcohol',
          severity: 'Mild' as const,
          count: 12,
          percentage: 2.7,
          episodes: [
            {
              scene: 'Сцена 3',
              description: 'Употребление алкоголя главным героем',
              timestamp: '00:09:10',
            },
          ],
        },
        {
          category: 'fear_elements',
          severity: 'Mild' as const,
          count: 6,
          percentage: 1.3,
          episodes: [
            {
              scene: 'Сцена 10',
              description: 'Напряженная сцена преследования в темном переулке',
              timestamp: '00:35:20',
            },
          ],
        },
      ],
    };

    setAnalysisReport(demoData);
    setViolations(demoData.detailed_violations || []);
    
    toast({
      title: 'Демо-данные загружены',
      description: 'Вы можете просмотреть пример анализа сценария',
    });
  };

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case '0+':
        return 'text-success';
      case '6+':
        return 'text-warning';
      case '12+':
      case '16+':
        return 'text-destructive/80';
      case '18+':
        return 'text-destructive';
      default:
        return 'text-muted-foreground';
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
                className="w-full px-3 py-2 bg-muted rounded-lg text-foreground"
              />
              {file && (
                <p className="text-sm text-muted-foreground">
                  {file.name} — {Math.round(file.size / 1024)} KB
                </p>
              )}

              <button
                onClick={handleUpload}
                disabled={!file || loading}
                className="w-full px-4 py-2 bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 transition-all"
              >
                {loading ? 'Анализ...' : 'Загрузить и анализировать'}
              </button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">или</span>
                </div>
              </div>
              
              <button
                onClick={handleLoadDemo}
                disabled={loading}
                className="w-full px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg transition-all disabled:opacity-50"
              >
                📊 Загрузить демо-данные
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
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-semibold">Общий обзор</h2>
                    <Button onClick={handleExportReport} variant="outline">
                      📥 Экспортировать отчёт
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="glass-panel rounded-lg p-4">
                      <p className="text-sm text-muted-foreground">Общий рейтинг</p>
                      <p className={`text-3xl font-bold ${getRatingColor(analysisReport.overall_rating)}`}>
                        {analysisReport.overall_rating}
                      </p>
                    </div>
                    <div className="glass-panel rounded-lg p-4">
                      <p className="text-sm text-muted-foreground">Проблемные сцены</p>
                      <p className="text-3xl font-bold">
                        {analysisReport.statistics.problematic_sentences}
                      </p>
                    </div>
                    <div className="glass-panel rounded-lg p-4">
                      <p className="text-sm text-muted-foreground">Процент нарушений</p>
                      <p className="text-3xl font-bold">
                        {analysisReport.statistics.problematic_percentage.toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  <div className="glass-panel rounded-lg p-4">
                    <p className="text-sm text-muted-foreground mb-2">Краткое описание</p>
                    <p className="text-base">{analysisReport.summary}</p>
                  </div>
                </div>

                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="grid w-full grid-cols-7 h-auto flex-wrap">
                    <TabsTrigger value="overview">Обзор</TabsTrigger>
                    <TabsTrigger value="parents-guide">Parents Guide</TabsTrigger>
                    <TabsTrigger value="timeline">Временная шкала</TabsTrigger>
                    <TabsTrigger value="charts">Графики</TabsTrigger>
                    <TabsTrigger value="chronometry">Хронометраж</TabsTrigger>
                    <TabsTrigger value="comparison">Сравнение версий</TabsTrigger>
                    <TabsTrigger value="recommendations">Рекомендации</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-4">
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
                  </TabsContent>

                  <TabsContent value="parents-guide">
                    <ParentsGuideSection
                      violations={violations}
                      onToggleFalsePositive={handleToggleFalsePositive}
                    />
                  </TabsContent>

                  <TabsContent value="timeline" className="space-y-4">
                    {selectedScene ? (
                      <SceneEditor
                        scene={selectedScene}
                        onClose={() => setSelectedScene(null)}
                        onSave={handleSaveScene}
                        onReanalyze={handleReanalyzeScene}
                      />
                    ) : (
                      <SceneTimeline
                        scenes={analysisReport.scenes || []}
                        onSceneClick={setSelectedScene}
                      />
                    )}
                  </TabsContent>

                  <TabsContent value="charts">
                    <ViolationCharts
                      data={Object.entries(analysisReport.statistics.violations).map(([key, count]) => ({
                        category: key,
                        count: count as number,
                        percentage: ((count as number) / analysisReport.statistics.total_sentences) * 100,
                      }))}
                    />
                  </TabsContent>

                  <TabsContent value="chronometry">
                    <TimelineStatistics
                      data={timelineData}
                      totalDuration="02:00:00"
                    />
                  </TabsContent>

                  <TabsContent value="comparison">
                    <VersionComparison
                      versions={versions}
                      onRemoveVersion={handleRemoveVersion}
                    />
                  </TabsContent>

                  <TabsContent value="recommendations" className="space-y-4">
                    <div className="glass-panel p-4 rounded-lg flex items-center gap-4">
                      <label className="text-sm font-medium whitespace-nowrap">
                        Целевой рейтинг:
                      </label>
                      <Input
                        type="text"
                        value={targetRating}
                        onChange={(e) => setTargetRating(e.target.value)}
                        className="max-w-[100px]"
                        placeholder="12+"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => generateRecommendations(analysisReport)}
                      >
                        Обновить рекомендации
                      </Button>
                    </div>
                    
                    <RecommendationsPanel
                      recommendations={recommendations}
                      onApplyRecommendation={handleApplyRecommendation}
                      targetRating={targetRating}
                    />
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScenarioAnalysis;
