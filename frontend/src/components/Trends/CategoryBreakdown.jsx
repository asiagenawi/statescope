import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList,
} from 'recharts'
import ChartTooltip from './ChartTooltip'
import { useTheme } from '../../hooks/useTheme'

/**
 * Topics ranked by how many policies touch them. Horizontal because the topic
 * names are long -- rotated axis labels are an anti-pattern.
 */
function CategoryBreakdown({ data }) {
  const { palette } = useTheme()
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
          tick={{ fill: palette.labelText, fontSize: 12 }}
          width={150}
        />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(127,127,127,0.10)' }} />
        <Bar dataKey="count" fill={palette.seriesStrong} radius={[0, 4, 4, 0]} maxBarSize={18} isAnimationActive={false}>
          <LabelList dataKey="count" position="right" fill={palette.labelText} fontSize={12} offset={8} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export default CategoryBreakdown
