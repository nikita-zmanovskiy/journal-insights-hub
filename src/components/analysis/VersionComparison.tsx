import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, TrendingDown, TrendingUp } from 'lucide-react';

interface Version {
  id: string;
  name: string;
  uploadDate: string;
  rating: string;
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

interface VersionComparisonProps {
  versions: Version[];
  onRemoveVersion: (versionId: string) => void;
}

export const VersionComparison = ({ versions, onRemoveVersion }: VersionComparisonProps) => {
  const getRatingColor = (rating: string) => {
    switch (rating) {
      case '0+':
        return 'bg-success text-success-foreground';
      case '6+':
        return 'bg-warning text-warning-foreground';
      case '12+':
      case '16+':
        return 'bg-destructive/80 text-destructive-foreground';
      case '18+':
        return 'bg-destructive text-destructive-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getRatingValue = (rating: string) => {
    return parseInt(rating.replace('+', ''));
  };

  const compareVersions = (v1: Version, v2: Version) => {
    const rating1 = getRatingValue(v1.rating);
    const rating2 = getRatingValue(v2.rating);
    const diff = rating2 - rating1;
    
    return {
      diff,
      improved: diff < 0,
      worsened: diff > 0,
      unchanged: diff === 0,
    };
  };

  const categoryLabels: Record<string, string> = {
    violence: 'Насилие',
    profanity: 'Нецензурная лексика',
    sexual_content: 'Сексуальный контент',
    drugs_alcohol: 'Наркотики/Алкоголь',
    fear_elements: 'Элементы страха',
  };

  if (versions.length === 0) {
    return (
      <Card className="glass-panel p-12 text-center">
        <h3 className="text-xl font-semibold mb-2">Нет версий для сравнения</h3>
        <p className="text-muted-foreground">
          Загрузите несколько версий сценария для сравнения
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Сравнение версий сценария</h2>
        <Badge variant="outline">Всего версий: {versions.length}</Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {versions.map((version, index) => {
          const nextVersion = versions[index + 1];
          const comparison = nextVersion ? compareVersions(version, nextVersion) : null;

          return (
            <div key={version.id} className="space-y-4">
              <Card className="glass-panel p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">{version.name}</h3>
                    <p className="text-sm text-muted-foreground">{version.uploadDate}</p>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={getRatingColor(version.rating)}>
                      {version.rating}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveVersion(version.id)}
                    >
                      ✕
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="glass-panel p-3 rounded-lg">
                      <p className="text-xs text-muted-foreground">Всего сцен</p>
                      <p className="text-xl font-bold">{version.statistics.total_sentences}</p>
                    </div>
                    <div className="glass-panel p-3 rounded-lg">
                      <p className="text-xs text-muted-foreground">Проблемных</p>
                      <p className="text-xl font-bold">
                        {version.statistics.problematic_sentences}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {Object.entries(version.statistics.violations).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-center">
                        <span className="text-sm">{categoryLabels[key]}</span>
                        <Badge variant="outline">{value}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>

              {comparison && (
                <div className="flex items-center justify-center">
                  <div className="glass-panel p-4 rounded-lg flex items-center gap-3">
                    {comparison.improved && (
                      <>
                        <TrendingDown className="w-5 h-5 text-success" />
                        <span className="text-success font-semibold">
                          Улучшение: -{Math.abs(comparison.diff)}
                        </span>
                      </>
                    )}
                    {comparison.worsened && (
                      <>
                        <TrendingUp className="w-5 h-5 text-destructive" />
                        <span className="text-destructive font-semibold">
                          Ухудшение: +{comparison.diff}
                        </span>
                      </>
                    )}
                    {comparison.unchanged && (
                      <>
                        <ArrowRight className="w-5 h-5 text-muted-foreground" />
                        <span className="text-muted-foreground font-semibold">
                          Без изменений
                        </span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
