import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass" style={{ padding: '10px', fontSize: '0.875rem' }}>
        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Size: <span style={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>{label}</span></p>
        <p style={{ margin: 0, color: 'var(--accent)' }}>Actual: <span style={{ fontWeight: 'bold' }}>{payload[0].value.toFixed(4)} ms</span></p>
        {payload[1] && (
          <p style={{ margin: 0, color: 'var(--success)' }}>Ideal: <span style={{ fontWeight: 'bold' }}>{payload[1].value.toFixed(4)} ms</span></p>
        )}
      </div>
    );
  }
  return null;
};

export default function ResultsChart({ data, theoreticalData }) {
  if (!data || data.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-secondary)' }}>
        Run a benchmark to see the visualization.
      </div>
    );
  }

  // Inject theoretical data if available
  const chartData = data.map(d => {
    const point = { ...d };
    if (theoreticalData && theoreticalData.fn && theoreticalData.c !== null) {
      point.ideal_time_ms = theoreticalData.fn(d.size) * theoreticalData.c;
    }
    return point;
  });

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={chartData}
        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
        <XAxis 
          dataKey="size" 
          stroke="var(--text-secondary)"
          tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
          tickMargin={10}
        />
        <YAxis 
          stroke="var(--text-secondary)"
          tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
          tickFormatter={(val) => val.toFixed(2)}
          width={60}
        />
        <Tooltip content={<CustomTooltip />} />
        <Line 
          type="monotone" 
          dataKey="time_ms" 
          name="Actual Time"
          stroke="var(--accent)" 
          strokeWidth={3}
          dot={{ r: 4, fill: 'var(--accent)', strokeWidth: 0 }}
          activeDot={{ r: 6, fill: 'var(--text-primary)' }}
          animationDuration={1500}
        />
        {theoreticalData && theoreticalData.fn && (
          <Line 
            type="monotone" 
            dataKey="ideal_time_ms" 
            name="Ideal Theory"
            stroke="var(--success)" 
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            activeDot={false}
            animationDuration={1500}
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}
