import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Lightbulb, TrendingDown } from 'lucide-react';
import { useState } from 'react';

interface Recommendation {
  id: string;
  scene: string;
  timestamp: string;
  category: string;
  severity: 'high' | 'medium' | 'low';
  currentText: string;
  issue: string;
  suggestions: Array<{
    text: string;
    ratingImpact: string;
    explanation: string;
  }>;
  applied?: boolean;
}

interface RecommendationsPanelProps {
  recommendations: Recommendation[];
  onApplyRecommendation: (recommendationId: string, suggestionIndex: number) => void;
  targetRating: string;
}

export const RecommendationsPanel = ({
  recommendations,
  onApplyRecommendation,
  targetRating,
}: RecommendationsPanelProps) => {
  const [expandedRec, setExpandedRec] = useState<string | null>(null);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-destructive text-destructive-foreground';
      case 'medium':
        return 'bg-warning text-warning-foreground';
      case 'low':
        return 'bg-info text-info-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const categoryLabels: Record<string, string> = {
    violence: 'Насилие',
    profanity: 'Нецензурная лексика',
    sexual_content: 'Сексуальный контент',
    drugs_alcohol: 'Наркотики/Алкоголь',
    fear_elements: 'Элементы страха',
  };

  const categoryIcons: Record<string, string> = {
    violence: '⚔️',
    profanity: '🗣️',
    sexual_content: '❤️',
    drugs_alcohol: '🍺',
    fear_elements: '😱',
  };

  const toggleExpand = (id: string) => {
    setExpandedRec(expandedRec === id ? null : id);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Рекомендации по улучшению</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Целевой рейтинг: <Badge variant="outline">{targetRating}</Badge>
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Найдено рекомендаций</p>
          <p className="text-2xl font-bold">{recommendations.length}</p>
        </div>
      </div>

      {recommendations.length === 0 ? (
        <Card className="glass-panel p-12 text-center">
          <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Отличная работа!</h3>
          <p className="text-muted-foreground">
            Сценарий уже соответствует целевому рейтингу {targetRating}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {recommendations.map((rec) => (
            <Card
              key={rec.id}
              className={`glass-panel p-6 transition-all ${
                rec.applied ? 'opacity-60 border-success' : ''
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{categoryIcons[rec.category]}</span>
                  <div>
                    <h3 className="font-semibold flex items-center gap-2">
                      {categoryLabels[rec.category]}
                      <Badge className={getSeverityColor(rec.severity)}>
                        {rec.severity === 'high' && 'Высокий приоритет'}
                        {rec.severity === 'medium' && 'Средний приоритет'}
                        {rec.severity === 'low' && 'Низкий приоритет'}
                      </Badge>
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {rec.scene} • {rec.timestamp}
                    </p>
                  </div>
                </div>
                {rec.applied && (
                  <Badge className="bg-success text-success-foreground">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Применено
                  </Badge>
                )}
              </div>

              <div className="space-y-3">
                <div className="glass-panel p-4 rounded-lg border-l-4 border-l-destructive">
                  <div className="flex items-start gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-destructive mt-0.5" />
                    <p className="text-sm font-medium">Проблема:</p>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{rec.issue}</p>
                  <p className="text-sm font-mono bg-muted/50 p-2 rounded">
                    "{rec.currentText}"
                  </p>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleExpand(rec.id)}
                  className="w-full"
                >
                  <Lightbulb className="w-4 h-4 mr-2" />
                  {expandedRec === rec.id ? 'Скрыть варианты' : `Показать ${rec.suggestions.length} варианта исправления`}
                </Button>

                {expandedRec === rec.id && (
                  <div className="space-y-3 mt-3">
                    {rec.suggestions.map((suggestion, idx) => (
                      <div
                        key={idx}
                        className="glass-panel p-4 rounded-lg border-l-4 border-l-success hover:bg-muted/30 transition-all"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <Badge variant="outline" className="text-xs">
                            <TrendingDown className="w-3 h-3 mr-1" />
                            {suggestion.ratingImpact}
                          </Badge>
                        </div>
                        <p className="text-sm font-mono bg-muted/50 p-2 rounded mb-2">
                          "{suggestion.text}"
                        </p>
                        <p className="text-xs text-muted-foreground mb-3">
                          {suggestion.explanation}
                        </p>
                        <Button
                          size="sm"
                          onClick={() => onApplyRecommendation(rec.id, idx)}
                          disabled={rec.applied}
                          className="w-full"
                        >
                          {rec.applied ? 'Уже применено' : 'Применить это исправление'}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
