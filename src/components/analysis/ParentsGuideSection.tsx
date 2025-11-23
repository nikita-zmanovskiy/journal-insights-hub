import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

interface Violation {
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
}

interface ParentsGuideSectionProps {
  violations: Violation[];
  onToggleFalsePositive: (category: string, episodeIndex: number) => void;
}

export const ParentsGuideSection = ({ violations, onToggleFalsePositive }: ParentsGuideSectionProps) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'None':
        return 'bg-success/20 text-success border-success/30';
      case 'Mild':
        return 'bg-warning/20 text-warning border-warning/30';
      case 'Moderate':
        return 'bg-destructive/20 text-destructive border-destructive/30';
      case 'Severe':
        return 'bg-destructive/30 text-destructive border-destructive/50';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      violence: '⚔️',
      profanity: '🗣️',
      sexual_content: '❤️',
      drugs_alcohol: '🍺',
      fear_elements: '😱',
    };
    return icons[category] || '⚠️';
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      violence: 'Насилие',
      profanity: 'Ненормативная лексика',
      sexual_content: 'Сексуальный контент',
      drugs_alcohol: 'Наркотики и Алкоголь',
      fear_elements: 'Элементы страха',
    };
    return labels[category] || category;
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Parents Guide - Детализация</h2>
      
      {violations.map((violation) => (
        <Card key={violation.category} className="glass-panel p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{getCategoryIcon(violation.category)}</span>
              <div>
                <h3 className="text-xl font-semibold">{getCategoryLabel(violation.category)}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={getSeverityColor(violation.severity)}>
                    {violation.severity}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {violation.count} эпизодов ({violation.percentage.toFixed(1)}% сцен)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {violation.episodes.length > 0 && (
            <div className="space-y-3 mt-4">
              <h4 className="text-sm font-medium text-muted-foreground">Найденные эпизоды:</h4>
              {violation.episodes.map((episode, idx) => (
                <div
                  key={idx}
                  className={`glass-panel p-4 rounded-lg border-l-4 transition-all ${
                    episode.isFalsePositive
                      ? 'border-l-muted opacity-50'
                      : 'border-l-primary'
                  }`}
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-mono text-muted-foreground">
                          {episode.scene}
                        </span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">{episode.timestamp}</span>
                        {episode.isFalsePositive && (
                          <Badge variant="outline" className="text-xs">
                            Ложное срабатывание
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm">{episode.description}</p>
                    </div>
                    <button
                      onClick={() => onToggleFalsePositive(violation.category, idx)}
                      className="px-3 py-1 text-xs rounded-md bg-muted hover:bg-muted/80 transition-colors whitespace-nowrap"
                    >
                      {episode.isFalsePositive ? 'Вернуть' : 'Ложное'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
};
