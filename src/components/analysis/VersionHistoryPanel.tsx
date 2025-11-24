import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

interface VersionHistoryItem {
  id: string;
  timestamp: string;
  content: string;
  rating: string;
  changes: string;
}

interface VersionHistoryPanelProps {
  versions: VersionHistoryItem[];
  onRestore: (versionId: string) => void;
}

export const VersionHistoryPanel = ({ versions, onRestore }: VersionHistoryPanelProps) => {
  const handleRestore = (versionId: string) => {
    if (confirm('Вы уверены, что хотите восстановить эту версию?')) {
      onRestore(versionId);
      toast.success('Версия успешно восстановлена');
    }
  };

  if (versions.length === 0) {
    return (
      <Card className="glass-panel p-8 text-center">
        <History className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">История изменений пуста</h3>
        <p className="text-muted-foreground">
          Начните редактировать сценарий, чтобы отслеживать изменения
        </p>
      </Card>
    );
  }

  return (
    <Card className="glass-panel p-6">
      <div className="flex items-center gap-2 mb-6">
        <History className="w-5 h-5" />
        <h2 className="text-2xl font-bold">История изменений</h2>
        <Badge variant="outline">{versions.length} версий</Badge>
      </div>

      <ScrollArea className="h-[600px] pr-4">
        <div className="space-y-4">
          {versions.map((version, index) => (
            <Card key={version.id} className="glass-panel p-4 border-border">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={index === 0 ? 'default' : 'outline'}>
                      {index === 0 ? 'Текущая версия' : `Версия ${versions.length - index}`}
                    </Badge>
                    <Badge className="bg-primary/20 text-primary">
                      {version.rating}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {new Date(version.timestamp).toLocaleString('ru-RU')}
                  </p>
                </div>
              </div>

              <p className="text-sm mb-4 text-foreground/80">{version.changes}</p>

              {index !== 0 && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleRestore(version.id)}
                  className="gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Восстановить
                </Button>
              )}
            </Card>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
};
