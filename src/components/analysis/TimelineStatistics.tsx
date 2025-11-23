import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface TimelineDataPoint {
  timestamp: string;
  time: number;
  violence: number;
  profanity: number;
  sexual_content: number;
  drugs_alcohol: number;
  fear_elements: number;
  total: number;
}

interface TimelineStatisticsProps {
  data: TimelineDataPoint[];
  totalDuration: string;
}

export const TimelineStatistics = ({ data, totalDuration }: TimelineStatisticsProps) => {
  const categoryLabels: Record<string, string> = {
    violence: 'Насилие',
    profanity: 'Нецензурная лексика',
    sexual_content: 'Сексуальный контент',
    drugs_alcohol: 'Наркотики/Алкоголь',
    fear_elements: 'Элементы страха',
  };

  const COLORS = {
    violence: 'hsl(0, 72%, 51%)',
    profanity: 'hsl(25, 95%, 53%)',
    sexual_content: 'hsl(280, 65%, 60%)',
    drugs_alcohol: 'hsl(45, 93%, 47%)',
    fear_elements: 'hsl(174, 72%, 56%)',
  };

  const maxViolations = Math.max(...data.map(d => d.total), 1);
  
  const heatmapData = data.map(point => ({
    ...point,
    intensity: (point.total / maxViolations) * 100,
  }));

  const getIntensityColor = (intensity: number) => {
    if (intensity === 0) return 'bg-success/20';
    if (intensity < 25) return 'bg-warning/30';
    if (intensity < 50) return 'bg-warning/60';
    if (intensity < 75) return 'bg-destructive/60';
    return 'bg-destructive';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Статистика по хронометражу</h2>
        <Badge variant="outline">Общая длительность: {totalDuration}</Badge>
      </div>

      <Card className="glass-panel p-6">
        <h3 className="text-lg font-semibold mb-4">Распределение нарушений по времени</h3>
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="timestamp"
              stroke="hsl(var(--foreground))"
              fontSize={12}
            />
            <YAxis stroke="hsl(var(--foreground))" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '0.5rem',
              }}
              labelFormatter={(value) => `Время: ${value}`}
            />
            <Legend
              formatter={(value) => categoryLabels[value] || value}
            />
            <Area
              type="monotone"
              dataKey="violence"
              stackId="1"
              stroke={COLORS.violence}
              fill={COLORS.violence}
              fillOpacity={0.6}
            />
            <Area
              type="monotone"
              dataKey="profanity"
              stackId="1"
              stroke={COLORS.profanity}
              fill={COLORS.profanity}
              fillOpacity={0.6}
            />
            <Area
              type="monotone"
              dataKey="sexual_content"
              stackId="1"
              stroke={COLORS.sexual_content}
              fill={COLORS.sexual_content}
              fillOpacity={0.6}
            />
            <Area
              type="monotone"
              dataKey="drugs_alcohol"
              stackId="1"
              stroke={COLORS.drugs_alcohol}
              fill={COLORS.drugs_alcohol}
              fillOpacity={0.6}
            />
            <Area
              type="monotone"
              dataKey="fear_elements"
              stackId="1"
              stroke={COLORS.fear_elements}
              fill={COLORS.fear_elements}
              fillOpacity={0.6}
            />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      <Card className="glass-panel p-6">
        <h3 className="text-lg font-semibold mb-4">Тепловая карта интенсивности</h3>
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground mb-2">
            <span>00:00</span>
            <span>{totalDuration}</span>
          </div>
          <div className="grid grid-cols-20 gap-1">
            {heatmapData.map((point, idx) => (
              <div
                key={idx}
                className={`h-12 rounded-sm transition-all cursor-pointer hover:scale-105 ${getIntensityColor(point.intensity)}`}
                title={`${point.timestamp}: ${point.total} нарушений`}
              />
            ))}
          </div>
          <div className="flex justify-between items-center mt-4">
            <span className="text-xs text-muted-foreground">Интенсивность:</span>
            <div className="flex gap-2 items-center">
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-success/20 rounded" />
                <span className="text-xs">Низкая</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-warning/60 rounded" />
                <span className="text-xs">Средняя</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-destructive rounded" />
                <span className="text-xs">Высокая</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
