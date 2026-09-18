import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList,
} from 'recharts'
import ChartTooltip from './ChartTooltip'

const SERIES = '#184f95'

/**
 * Topics ranked by how many policies touch them. Horizontal because the topic
 * names are long -- rotated axis labels are an anti-pattern.
 */
function CategoryBreakdown({ data }) {
  if (!data.length) return <p className="chart-empty">No topics match these filters.</p>

  return (
    <ResponsiveContainer width="100%" height={Math.max(220, data.length * 30)}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 32, bottom: 4, left: 8 }}
        barCategoryGap="26%"
      >
        <XAxis type="number" hide allowDecimals={false} />
        <YAxis
          type="category"
          dataKey="name"
          tickLine={false}
          axisLine={false}
          tick={{ fill: '#56554d', fontSize: 12 }}
          width={150}
        />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(24,79,149,0.06)' }} />
        <Bar dataKey="count" fill={SERIES} radius={[0, 4, 4, 0]} maxBarSize={18} isAnimationActive={false}>
          <LabelList dataKey="count" position="right" fill="#56554d" fontSize={12} offset={8} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export default CategoryBreakdown
