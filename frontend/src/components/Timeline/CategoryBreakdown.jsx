import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts'

function CategoryBreakdown({ data, loading }) {
  if (loading) return <p className="chart-message">Loading...</p>
  if (!data.length) return <p className="chart-message">No data for current filters.</p>

  const filtered = data.filter(d => d.count > 0).sort((a, b) => b.count - a.count)
  const maxCount = filtered.length > 0 ? filtered[0].count : 0

  return (
    <div className="chart-section">
      <h3 className="chart-title">Policies by Topic</h3>
      <ResponsiveContainer width="100%" height={Math.max(250, filtered.length * 40)}>
        <BarChart data={filtered} layout="vertical" margin={{ left: 130, right: 40, top: 5, bottom: 5 }}>
          <XAxis type="number" allowDecimals={false} hide />
          <YAxis
            type="category"
            dataKey="name"
            width={120}
            tick={{ fontSize: 13, fill: '#4A4A4A' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: 'rgba(42, 157, 143, 0.06)' }}
            contentStyle={{ borderRadius: 6, border: '1px solid #E8E4DF' }}
          />
          <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={24} cursor="pointer">
            {filtered.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.count === maxCount ? '#2A9D8F' : 'rgba(42, 157, 143, 0.35)'}
              />
            ))}
            <LabelList dataKey="count" position="right" style={{ fontSize: 12, fontWeight: 600, fill: '#4A4A4A' }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default CategoryBreakdown
