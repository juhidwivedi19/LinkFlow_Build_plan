import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ArrowUpRight } from 'lucide-react'

const analyticsData = [
  { date: 'Sep 19', clicks: 4200, previous: 3100 },
  { date: 'Sep 22', clicks: 5100, previous: 3700 },
  { date: 'Sep 25', clicks: 4600, previous: 3900 },
  { date: 'Sep 28', clicks: 6800, previous: 4200 },
  { date: 'Oct 01', clicks: 5900, previous: 4500 },
  { date: 'Oct 04', clicks: 8100, previous: 5200 },
  { date: 'Oct 07', clicks: 7300, previous: 4800 },
  { date: 'Oct 10', clicks: 9600, previous: 6100 },
  { date: 'Oct 13', clicks: 8400, previous: 5700 },
  { date: 'Oct 16', clicks: 11200, previous: 6800 },
  { date: 'Oct 18', clicks: 10400, previous: 7200 },
]

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null

  const current = payload.find((item) => item.dataKey === 'clicks')
  const previous = payload.find((item) => item.dataKey === 'previous')

  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip-date">{label}</p>

      {current && (
        <div className="chart-tooltip-row">
          <span className="chart-tooltip-dot current-dot" />
          <span>Total clicks</span>
          <strong>{current.value.toLocaleString()}</strong>
        </div>
      )}

      {previous && (
        <div className="chart-tooltip-row">
          <span className="chart-tooltip-dot previous-dot" />
          <span>Previous period</span>
          <strong>{previous.value.toLocaleString()}</strong>
        </div>
      )}
    </div>
  )
}

export default function ClickAnalyticsChart() {
  return (
    <div className="click-chart">
      <div className="chart-summary">
        <div>
          <span className="chart-summary-label">Total clicks</span>
          <div className="chart-summary-value">248,392</div>
        </div>

        <div className="chart-comparison">
          <span className="chart-comparison-badge">
            <ArrowUpRight size={14} />
            18.6%
          </span>
          <span className="chart-comparison-caption">vs. previous period</span>
        </div>
      </div>

      <div className="chart-legend">
        <span>
          <span className="legend-dot legend-current" />
          Current period
        </span>
        <span>
          <span className="legend-dot legend-previous" />
          Previous period
        </span>
      </div>

      <div className="chart-canvas">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={analyticsData}
            margin={{ top: 12, right: 8, left: -12, bottom: 0 }}
          >
            <defs>
              <linearGradient id="clickGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#34d399" stopOpacity={0.24} />
                <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              stroke="#27272a"
              strokeDasharray="3 5"
              vertical={false}
            />

            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#71717a', fontSize: 10 }}
              tickMargin={12}
              minTickGap={22}
            />

            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#71717a', fontSize: 10 }}
              tickFormatter={(value) =>
                value >= 1000 ? `${value / 1000}k` : value
              }
              tickMargin={8}
              width={43}
            />

            <Tooltip
              content={<CustomTooltip />}
              cursor={{ stroke: '#52525b', strokeDasharray: '4 4' }}
            />

            <Area
              type="monotone"
              dataKey="previous"
              stroke="#52525b"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              fill="transparent"
              dot={false}
              activeDot={{ r: 3, fill: '#71717a', stroke: '#111113' }}
              animationDuration={700}
            />

            <Area
              type="monotone"
              dataKey="clicks"
              stroke="#34d399"
              strokeWidth={2.5}
              fill="url(#clickGradient)"
              dot={false}
              activeDot={{
                r: 4,
                fill: '#34d399',
                stroke: '#111113',
                strokeWidth: 2,
              }}
              animationDuration={1000}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}