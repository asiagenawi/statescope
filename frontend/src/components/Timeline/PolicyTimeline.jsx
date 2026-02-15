import { useState } from 'react'
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, LabelList } from 'recharts'
import { useTrends } from '../../hooks/useTrends'
import FilterBar from './FilterBar'
import CategoryBreakdown from './CategoryBreakdown'

function PolicyTimeline() {
  const [filters, setFilters] = useState({})
  const { data: timeline, loading: timelineLoading } = useTrends('timeline', filters)
  const { data: topics, loading: topicsLoading } = useTrends('topics', filters)

  return (
    <div className="trends-container">
      <FilterBar filters={filters} onFilterChange={setFilters} />

      <div className="chart-section">
        <h3 className="chart-title">Policy Introductions by Year</h3>
          {timelineLoading ? (
            <p className="chart-message">Loading...</p>
          ) : !timeline.length ? (
            <p className="chart-message">No data for current filters.</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={timeline} margin={{ top: 24, right: 20, bottom: 5, left: 0 }}>
                <XAxis
                  dataKey="year"
                  tick={{ fontSize: 13, fill: '#4A4A4A' }}
                  axisLine={{ stroke: '#E8E4DF' }}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(42, 157, 143, 0.06)' }}
                  contentStyle={{ borderRadius: 6, border: '1px solid #E8E4DF' }}
                />
                <Bar dataKey="count" fill="#2A9D8F" radius={[4, 4, 0, 0]} barSize={48} name="Policies">
                  <LabelList dataKey="count" position="top" style={{ fontSize: 13, fontWeight: 700, fill: '#2A9D8F' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <CategoryBreakdown data={topics} loading={topicsLoading} />
    </div>
  )
}

export default PolicyTimeline
