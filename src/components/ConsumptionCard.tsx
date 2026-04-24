import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, LabelList, Cell } from "recharts";

interface DailyConsumption {
  day: string;
  fullDay: string;
  value: number; // in GB
}

interface ConsumptionCardProps {
  data?: DailyConsumption[];
}

const mockData: DailyConsumption[] = [
  { day: "SEG", fullDay: "Segunda-feira", value: 21 },
  { day: "TER", fullDay: "Terça-feira", value: 45 },
  { day: "QUA", fullDay: "Quarta-feira", value: 68 },
  { day: "QUI", fullDay: "Quinta-feira", value: 34 },
  { day: "SEX", fullDay: "Sexta-feira", value: 52 },
  { day: "SAB", fullDay: "Sábado", value: 41 },
  { day: "DOM", fullDay: "Domingo", value: 28 },
];

export function ConsumptionCard({ data = mockData }: ConsumptionCardProps) {
  const totalConsumption = data.reduce((acc, curr) => acc + curr.value, 0);
  const maxDay = data.reduce((max, curr) => (curr.value > max.value ? curr : max), data[0]);

  return (
    <div className="bg-card rounded-2xl p-5 shadow-soft border border-border">
      <h2 className="text-[#0f172a] font-bold text-lg mb-6">Consumo Semanal</h2>
      
      <div className="h-48 w-full mb-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0f172a" stopOpacity={1} /> {/* Azul Marinho */}
                <stop offset="100%" stopColor="#22d3ee" stopOpacity={1} /> {/* Azul Ciano */}
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="day" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }} 
              dy={10}
            />
            <Tooltip 
              cursor={{ fill: 'rgba(15, 23, 42, 0.05)' }} 
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' }}
              formatter={(value: number) => [`${value} GB`, 'Consumo']}
              labelStyle={{ color: '#0f172a', fontWeight: 'bold', marginBottom: '4px' }}
            />
            <Bar dataKey="value" radius={[6, 6, 6, 6]} barSize={28}>
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill="url(#colorValue)" />
              ))}
              <LabelList 
                dataKey="value" 
                position="top" 
                formatter={(val: number) => `${val}GB`} 
                style={{ fontSize: '11px', fill: '#0f172a', fontWeight: 'bold' }}
                offset={8}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="pt-4 border-t border-border mt-2">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Consumo total nesta semana: <strong className="text-[#0f172a] font-bold">{totalConsumption} GB</strong>. <br />
          Seu dia de maior consumo foi <strong className="text-[#0f172a] font-bold">{maxDay.fullDay}</strong>.
        </p>
      </div>
    </div>
  );
}
