import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

// Validated categorical slots 1 & 2 (dataviz reference palette).
const BAR_COLOR = "#2a78d6";
const LINE_COLOR = "#eb6834";

function ChartTooltip({ active, payload, label, format }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs shadow-md">
      <p className="mb-1 font-semibold text-gray-900">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="flex items-center gap-2 text-gray-600">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          {p.name}: <span className="font-medium text-gray-900">{format(p.value)}</span>
        </p>
      ))}
    </div>
  );
}

function Legend({ bar, line }) {
  return (
    <div className="flex items-center gap-4 text-xs text-gray-500">
      <span className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-sm" style={{ background: BAR_COLOR }} />
        {bar.name}
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-0.5 w-3 rounded" style={{ background: LINE_COLOR }} />
        {line.name}
      </span>
    </div>
  );
}

/**
 * Bar + line on ONE shared y-axis — both series must be the same unit (counts, or rupees).
 * bar / line: { key, name }
 */
export default function ComboChart({ title, subtitle, data, bar, line, format, axisFormat = format, loading }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-gray-400">{subtitle}</p>}
        </div>
        <Legend bar={bar} line={line} />
      </div>

      <div className="mt-4 h-72">
        {loading ? (
          <div className="h-full w-full animate-pulse rounded-lg bg-gray-100" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap="25%">
              <CartesianGrid vertical={false} stroke="#EEEAF2" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={{ stroke: "#DCD7E6" }}
                tick={{ fontSize: 11, fill: "#5A557F" }}
                interval="preserveStartEnd"
                minTickGap={16}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "#5A557F" }}
                tickFormatter={axisFormat}
                allowDecimals={false}
                width={56}
              />
              <Tooltip content={<ChartTooltip format={format} />} cursor={{ fill: "#F4F3FA" }} />
              <Bar dataKey={bar.key} name={bar.name} fill={BAR_COLOR} radius={[4, 4, 0, 0]} maxBarSize={28} />
              <Line
                dataKey={line.key}
                name={line.name}
                type="monotone"
                stroke={LINE_COLOR}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, stroke: "#fff", strokeWidth: 2 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
