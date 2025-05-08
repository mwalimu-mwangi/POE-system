import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface TrendsChartProps {
  title: string;
  description?: string;
  data: any[];
  dataKeys: Array<{
    key: string;
    name: string;
    color: string;
  }>;
  xAxisKey: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
}

export function TrendsChart({
  title,
  description,
  data,
  dataKeys,
  xAxisKey,
  xAxisLabel,
  yAxisLabel
}: TrendsChartProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis 
                dataKey={xAxisKey} 
                label={xAxisLabel ? { value: xAxisLabel, position: 'insideBottom', offset: -15 } : undefined}
              />
              <YAxis 
                label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft', offset: 0 } : undefined}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  borderRadius: '0.5rem',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                  border: '1px solid rgb(229, 231, 235)'
                }}
              />
              <Legend />
              {dataKeys.map((dataKey, index) => (
                <Bar 
                  key={dataKey.key}
                  dataKey={dataKey.key} 
                  name={dataKey.name}
                  fill={dataKey.color}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
