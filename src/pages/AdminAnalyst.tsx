import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Upload, ArrowLeft, BarChart3, TrendingUp, Users, Star } from 'lucide-react';

const AdminAnalyst = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setContent(text);
      setTitle(file.name);
      toast({
        title: 'Файл загружен',
        description: 'Сценарий успешно загружен',
      });
    };
    reader.readAsText(file);
  };

  const analyzeScenario = async () => {
    if (!content.trim() || !title.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Заполните название и текст сценария',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    // Simulate analysis (replace with actual AI analysis)
    const mockAnalysis = {
      ageRating: '16+',
      sentiment: 'Позитивный',
      themes: ['Приключения', 'Дружба', 'Саморазвитие'],
      characters: Math.floor(Math.random() * 10) + 3,
      scenes: Math.floor(Math.random() * 20) + 10,
      duration: Math.floor(Math.random() * 60) + 30,
      score: Math.floor(Math.random() * 30) + 70,
    };

    // Save to database
    const { error } = await supabase
      .from('scenarios')
      .insert([
        {
          user_id: user?.id,
          title,
          content,
          analysis_data: mockAnalysis,
        },
      ]);

    if (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить анализ',
        variant: 'destructive',
      });
    } else {
      setAnalysisResult(mockAnalysis);
      toast({
        title: 'Анализ завершен',
        description: 'Результаты успешно сохранены',
      });
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Назад к чату
          </Button>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Анализ сценариев
          </h1>
          <div className="w-24" />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle>Загрузить сценарий</CardTitle>
              <CardDescription>Загрузите файл или введите текст вручную</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Название</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Введите название сценария"
                  className="bg-muted/50"
                />
              </div>

              <div>
                <Label htmlFor="file-upload">Загрузить файл</Label>
                <Input
                  id="file-upload"
                  type="file"
                  accept=".txt,.pdf,.doc,.docx"
                  onChange={handleFileUpload}
                  className="bg-muted/50"
                />
              </div>

              <div>
                <Label htmlFor="content">Текст сценария</Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Или введите текст сценария здесь..."
                  className="min-h-[300px] bg-muted/50"
                />
              </div>

              <Button
                onClick={analyzeScenario}
                disabled={loading}
                className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90"
              >
                <BarChart3 className="mr-2 h-4 w-4" />
                {loading ? 'Анализ...' : 'Анализировать'}
              </Button>
            </CardContent>
          </Card>

          {analysisResult && (
            <div className="space-y-4 animate-fade-in">
              <Card className="glass-panel">
                <CardHeader>
                  <CardTitle>Результаты анализа</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="glass-panel rounded-lg p-4">
                      <p className="text-sm text-muted-foreground">Возрастной рейтинг</p>
                      <p className="text-2xl font-bold text-primary">{analysisResult.ageRating}</p>
                    </div>
                    <div className="glass-panel rounded-lg p-4">
                      <p className="text-sm text-muted-foreground">Оценка</p>
                      <p className="text-2xl font-bold text-primary">{analysisResult.score}/100</p>
                    </div>
                    <div className="glass-panel rounded-lg p-4">
                      <p className="text-sm text-muted-foreground">Персонажи</p>
                      <p className="text-2xl font-bold">{analysisResult.characters}</p>
                    </div>
                    <div className="glass-panel rounded-lg p-4">
                      <p className="text-sm text-muted-foreground">Сцены</p>
                      <p className="text-2xl font-bold">{analysisResult.scenes}</p>
                    </div>
                  </div>

                  <div className="glass-panel rounded-lg p-4">
                    <p className="text-sm text-muted-foreground mb-2">Настроение</p>
                    <p className="text-lg font-semibold">{analysisResult.sentiment}</p>
                  </div>

                  <div className="glass-panel rounded-lg p-4">
                    <p className="text-sm text-muted-foreground mb-2">Темы</p>
                    <div className="flex flex-wrap gap-2">
                      {analysisResult.themes.map((theme: string, i: number) => (
                        <span
                          key={i}
                          className="px-3 py-1 rounded-full bg-primary/20 text-primary text-sm"
                        >
                          {theme}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="glass-panel rounded-lg p-4">
                    <p className="text-sm text-muted-foreground mb-2">Прогнозируемая длительность</p>
                    <p className="text-lg font-semibold">{analysisResult.duration} минут</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-panel">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Рекомендации
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <Star className="h-4 w-4 text-primary mt-0.5" />
                      <span>Отличная структура повествования</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Star className="h-4 w-4 text-primary mt-0.5" />
                      <span>Хорошо развитые персонажи</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Star className="h-4 w-4 text-primary mt-0.5" />
                      <span>Рекомендуется усилить конфликт в середине</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminAnalyst;
