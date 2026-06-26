"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const COLORS: Record<string, string> = {
  superhappy: "#059669",
  happy:      "#34d399",
  neutral:    "#94a3b8",
  sad:        "#38bdf8",
  angry:      "#ef4444",
};

const LABELS: Record<string, string> = {
  superhappy: "🤩 Super happy",
  happy:      "😊 Happy",
  neutral:    "😐 Neutral",
  sad:        "😔 Sad",
  angry:      "😠 Angry",
};

interface Props {
  data: { name: string; value: number }[];
}

export function SentimentChart({ data }: Props) {
  const hasData = data.some((d) => d.value > 0);

  if (!hasData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Sentiment breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-40 text-muted-foreground/40 text-sm">
          Not enough data yet
        </CardContent>
      </Card>
    );
  }

  const filtered = data.filter((d) => d.value > 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Sentiment breakdown (last 30 days)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={filtered}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={3}
              dataKey="value"
            >
              {filtered.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={COLORS[entry.name] ?? "#e5e7eb"}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                fontSize: 12,
                borderRadius: 8,
                border: "1px solid #e5e7eb",
              }}
              formatter={(val, name) => [
                `${val} reviews`,
                LABELS[String(name)] ?? String(name),
              ]}
            />
            <Legend
              formatter={(value) => LABELS[value] ?? value}
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 12 }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}