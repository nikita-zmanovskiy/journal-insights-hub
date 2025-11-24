import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Filter, X, Search } from 'lucide-react';

interface SceneFilterProps {
  scenes: any[];
  onFilterChange: (filteredScenes: any[]) => void;
}

export const SceneFilter = ({ scenes, onFilterChange }: SceneFilterProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedViolations, setSelectedViolations] = useState<string[]>([]);

  const violations = Array.from(new Set(scenes.flatMap(s => s.violations || [])));

  const categoryLabels: Record<string, string> = {
    violence: 'Насилие',
    profanity: 'Нецензурная лексика',
    sexual_content: 'Сексуальный контент',
    drugs_alcohol: 'Наркотики/Алкоголь',
    fear_elements: 'Элементы страха',
  };

  const applyFilters = () => {
    let filtered = scenes;

    if (searchQuery) {
      filtered = filtered.filter(scene =>
        scene.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        scene.text?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedViolations.length > 0) {
      filtered = filtered.filter(scene =>
        scene.violations?.some((v: string) => selectedViolations.includes(v))
      );
    }

    onFilterChange(filtered);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedViolations([]);
    onFilterChange(scenes);
  };

  const toggleViolation = (violation: string) => {
    if (selectedViolations.includes(violation)) {
      setSelectedViolations(selectedViolations.filter(v => v !== violation));
    } else {
      setSelectedViolations([...selectedViolations, violation]);
    }
  };

  return (
    <Card className="glass-panel p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5" />
          <h2 className="text-2xl font-bold">Фильтры и поиск</h2>
        </div>
        <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-2">
          <X className="w-4 h-4" />
          Сбросить
        </Button>
      </div>

      <div className="space-y-6">
        <div>
          <Label htmlFor="search">Поиск по тексту</Label>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Введите текст для поиска..."
              className="pl-10"
            />
          </div>
        </div>

        {violations.length > 0 && (
          <div>
            <Label className="mb-3 block">Типы нарушений</Label>
            <div className="flex flex-wrap gap-2">
              {violations.map((violation) => (
                <Badge
                  key={violation}
                  variant={selectedViolations.includes(violation) ? 'default' : 'outline'}
                  className="cursor-pointer transition-all hover:scale-105"
                  onClick={() => toggleViolation(violation)}
                >
                  {categoryLabels[violation] || violation}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <Button onClick={applyFilters} className="w-full">
          Применить фильтры
        </Button>
      </div>
    </Card>
  );
};
