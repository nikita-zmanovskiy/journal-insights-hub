import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface Scene {
  id: string;
  title: string;
  timestamp: string;
  violations: string[];
  severity: string;
  text: string;
}

interface SceneEditorProps {
  scene: Scene | null;
  onClose: () => void;
  onSave: (sceneId: string, newText: string) => void;
  onReanalyze: (sceneId: string, text: string) => void;
}

export const SceneEditor = ({ scene, onClose, onSave, onReanalyze }: SceneEditorProps) => {
  const [editedText, setEditedText] = useState(scene?.text || '');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [violationThreshold] = useState(5); // Порог нарушений для уведомления

  useEffect(() => {
    // Проверка на превышение порога нарушений
    if (scene && scene.violations.length > violationThreshold) {
      toast.warning(`Внимание! В сцене обнаружено ${scene.violations.length} нарушений, что превышает установленный порог (${violationThreshold}).`, {
        duration: 5000,
      });
    }
  }, [scene, violationThreshold]);

  if (!scene) return null;

  const handleSave = () => {
    onSave(scene.id, editedText);
    toast.success('Изменения сохранены');
    onClose();
  };

  const handleReanalyze = async () => {
    setIsAnalyzing(true);
    toast.info('Начинается переанализ сцены...');
    try {
      await onReanalyze(scene.id, editedText);
      toast.success('Анализ завершён');
    } catch (error) {
      toast.error('Ошибка при анализе сцены');
    }
    setIsAnalyzing(false);
  };

  return (
    <Card className="glass-panel p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-2xl font-bold">{scene.title}</h2>
          <div className="flex gap-2 mt-2">
            <Badge variant="outline">{scene.timestamp}</Badge>
            {scene.violations.map((v, idx) => (
              <Badge key={idx}>{v}</Badge>
            ))}
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          ✕
        </Button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Текст сцены</label>
          <Textarea
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            className="min-h-[300px] font-mono text-sm"
            placeholder="Редактируйте текст сцены..."
          />
        </div>

        <div className="flex gap-3">
          <Button onClick={handleSave} className="flex-1">
            Сохранить изменения
          </Button>
          <Button
            onClick={handleReanalyze}
            disabled={isAnalyzing}
            variant="outline"
            className="flex-1"
          >
            {isAnalyzing ? 'Анализ...' : 'Переанализировать'}
          </Button>
        </div>
      </div>
    </Card>
  );
};
