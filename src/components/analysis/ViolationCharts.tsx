import { Card } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface ViolationData {
  category: string;
  count: number;
  percentage: number;
}

interface ViolationChartsProps {
  data: ViolationData[];
}

export const ViolationCharts = ({ data }: ViolationChartsProps) => {
  const COLORS = [
    'hsl(0, 72%, 51%)',     // red
    'hsl(25, 95%, 53%)',    // orange
    'hsl(45, 93%, 47%)',    // yellow
    'hsl(174, 72%, 56%)',   // cyan/teal
    'hsl(280, 65%, 60%)',   // purple
  ];

  const categoryLabels: Record<string, string> = {
    violence: 'Насилие',
    profanity: 'Нецензурная лексика',
    sexual_content: 'Сексуальный контент',
    drugs_alcohol: 'Наркотики/Алкоголь',
    fear_elements: 'Элементы страха',
  };

  const chartData = data.map(item => ({
    ...item,
    name: categoryLabels[item.category] || item.category,
  }));

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="glass-panel p-6">
        <h3 className="text-xl font-semibold mb-4">Распределение по категориям</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="name"
              stroke="hsl(var(--foreground))"
              fontSize={12}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis stroke="hsl(var(--foreground))" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '0.5rem',
              }}
            />
            <Legend />
            <Bar dataKey="count" fill="hsl(var(--primary))" name="Количество нарушений" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card className="glass-panel p-6">
        <h3 className="text-xl font-semibold mb-4">Процентное соотношение</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="count"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '0.5rem',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
};
