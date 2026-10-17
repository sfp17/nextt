'use client';

// The ONLY client code on the dashboard. It receives already-aggregated numbers
// (8 neighbourhood totals, 30 daily counts), never the orders themselves.
//
// Chart rules followed here:
// - one series, so one colour (berbere) and no legend box: the heading names it
// - a fixed-height container that includes the axis, so nothing shifts when it draws
// - thin marks: bars ≤ 22 px with a 4 px rounded end, a 2 px line
// - one axis per chart; recessive grid; values in ink colours, never the series colour
// - a tooltip on hover/focus, and the same numbers in a table below each chart
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { etb, etbCompact } from '@/lib/format';
import { useTheme } from '@/lib/theme';

// One palette per theme. The dark series red (#e5534b) was checked with the
// palette validator against the dark background (lightness, chroma, ≥ 3:1 contrast).
const PALETTES = {
  light: { series: '#b3261e', ink: '#231a15', inkSoft: '#5c514a', grid: '#e7e1d8', surface: '#ffffff', cursor: 'rgba(35, 26, 21, 0.05)' },
  dark: { series: '#e5534b', ink: '#f3ece6', inkSoft: '#cdc1b7', grid: '#3a302a', surface: '#16110e', cursor: 'rgba(243, 236, 230, 0.06)' },
};
function useChartColors() {
  const theme = useTheme();
  const c = PALETTES[theme === 'dark' ? 'dark' : 'light'];
  return { SERIES: c.series, INK: c.ink, INK_SOFT: c.inkSoft, GRID: c.grid, SURFACE: c.surface, CURSOR: c.cursor, tick: { fill: c.inkSoft, fontSize: 12 } };
}

/** Round tick values (0, 10K, 20K …) instead of whatever 4 equal slices of the max give. */
function niceTicks(max, target = 4) {
  if (!max) return [0];
  const raw = max / target;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw);
  return Array.from({ length: Math.ceil(max / step) + 1 }, (_, i) => i * step);
}

function TooltipBox({ active, payload, label, format }) {
  const { SERIES } = useChartColors();
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <strong>{label}</strong>
      <span>
        <i aria-hidden="true" style={{ background: SERIES }} />
        {format(payload[0].value)}
      </span>
    </div>
  );
}

export function RevenueChart({ data, label }) {
  const { SERIES, INK, INK_SOFT, GRID, CURSOR, tick } = useChartColors();
  const height = 36 + data.length * 34; // rows + the axis band, fixed before it draws
  const ticks = niceTicks(Math.max(...data.map((d) => d.revenue)));
  return (
    <div className="chart-box" style={{ height }} role="img" aria-label={label}>
      <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 520, height }}>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 44, bottom: 4, left: 4 }} accessibilityLayer={false}>
          <CartesianGrid horizontal={false} stroke={GRID} />
          <XAxis
            type="number"
            tickFormatter={(v) => etbCompact(v)}
            tick={tick}
            ticks={ticks}
            domain={[0, ticks.at(-1)]}
            axisLine={false}
            tickLine={false}
            height={28}
          />
          <YAxis type="category" dataKey="area" tick={{ ...tick, fill: INK }} width={84} axisLine={{ stroke: GRID }} tickLine={false} />
          <Tooltip
            cursor={{ fill: CURSOR }}
            content={<TooltipBox format={(v) => etb(v)} />}
          />
          <Bar dataKey="revenue" name="Revenue" fill={SERIES} barSize={20} radius={[0, 4, 4, 0]} isAnimationActive={false}>
            <LabelList dataKey="revenue" position="right" formatter={(v) => etbCompact(v, { unit: false })} fill={INK_SOFT} fontSize={12} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function OrdersLineChart({ data, label }) {
  const { SERIES, INK, INK_SOFT, GRID, SURFACE, tick } = useChartColors();
  const lastIndex = data.length - 1;
  return (
    <div className="chart-box" style={{ height: 280 }} role="img" aria-label={label}>
      <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 520, height: 280 }}>
        <LineChart data={data} margin={{ top: 16, right: 24, bottom: 4, left: 0 }} accessibilityLayer={false}>
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis dataKey="label" tick={tick} interval={6} axisLine={{ stroke: GRID }} tickLine={false} height={28} />
          <YAxis
            allowDecimals={false}
            tick={tick}
            width={44}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v}`}
            label={{ value: 'orders', angle: -90, position: 'insideLeft', fill: INK_SOFT, fontSize: 12, dy: 20 }}
          />
          <Tooltip
            cursor={{ stroke: INK_SOFT, strokeDasharray: '3 3' }}
            content={<TooltipBox format={(v) => `${v} ${v === 1 ? 'order' : 'orders'}`} />}
          />
          <Line
            type="linear" // monotone curves overshoot between days and invent values
            dataKey="orders"
            name="Orders"
            stroke={SERIES}
            strokeWidth={2}
            isAnimationActive={false}
            // Mark only today's point, labelled; every other value is in the tooltip/table.
            dot={(p) =>
              p.index === lastIndex ? (
                <g key="last">
                  <circle cx={p.cx} cy={p.cy} r={5} fill={SERIES} stroke={SURFACE} strokeWidth={2} />
                  <text x={p.cx - 8} y={p.cy - 10} textAnchor="end" fill={INK} fontSize={12} fontWeight={600}>
                    Today so far: {p.value}
                  </text>
                </g>
              ) : (
                <g key={p.index} />
              )
            }
            activeDot={{ r: 5, fill: SERIES, stroke: SURFACE, strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
