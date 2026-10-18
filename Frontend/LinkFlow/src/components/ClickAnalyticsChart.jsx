import { useEffect, useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { getLinkAnalytics } from '../api/analytics.api'

function formatChartDate(value) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return String(value)
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null

  const current = payload.find((item) => item.dataKey === 'clicks')

  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip-date">{label}</p>

      {current && (
        <div className="chart-tooltip-row">
          <span className="chart-tooltip-dot current-dot" />
          <span>Total clicks</span>
          <strong>{Number(current.value).toLocaleString()}</strong>
        </div>
      )}
    </div>
  )
}

export default function ClickAnalyticsChart({ linkId }) {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function fetchAnalytics() {
      if (!linkId) {
        setAnalytics(null)
        setError('')
        setLoading(false)
        return
      }

      setLoading(true)
      setError('')

      try {
        const response = await getLinkAnalytics(linkId)

        if (cancelled) return

        // apiRequest may return the response envelope or its data.
        const result = response?.data ?? response

        setAnalytics(result)
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Failed to load analytics.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchAnalytics()

    return () => {
      cancelled = true
    }
  }, [linkId])

  if (!linkId) {
    return (
      <div className="click-chart">
        <p>Select a link to view its analytics.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="click-chart">
        <p>Loading analytics...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="click-chart">
        <p role="alert">{error}</p>
      </div>
    )
  }

  const analyticsData = (analytics?.overTime ?? []).map((item) => ({
    date: formatChartDate(item.date),
    clicks: Number(item.clicks) || 0,
  }))

  return (
    <div className="click-chart">
      <div className="chart-summary">
        <div>
          <span className="chart-summary-label">Total clicks</span>
          <div className="chart-summary-value">
            {(Number(analytics?.totalClicks) || 0).toLocaleString()}
          </div>
        </div>
      </div>

      {analyticsData.length === 0 ? (
        <div className="chart-canvas">
          <p>No click data available for this link yet.</p>
        </div>
      ) : (
        <>
          <div className="chart-legend">
            <span>
              <span className="legend-dot legend-current" />
              Clicks
            </span>
          </div>

          <div className="chart-canvas">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={analyticsData}
                margin={{ top: 12, right: 8, left: -12, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id="clickGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
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
                    value >= 1000
                      ? `${Number((value / 1000).toFixed(1))}k`
                      : value
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
        </>
      )}
    </div>
  )
}