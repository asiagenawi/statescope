import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList,
} from 'recharts'
import ChartTooltip from './ChartTooltip'

const SERIES = '#3987e5'

/**
 * Policies introduced per year. One series, so the panel title names it and no
 * legend is needed; values are direct-labelled rather than read off the axis.
 */
function PolicyTimeline({ data }) {
  if (!data.length) return <p className="chart-empty">No dated policies match these filters.</p>

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 18, right: 8, bottom: 4, left: -18 }} barCategoryGap="28%">
        <CartesianGrid vertical={false} stroke="#e8e6de" strokeDasharray="0" />
        <XAxis
          dataKey="year"
          tickLine={false}
          axisLine={{ stroke: '#cfcdc2' }}
          tick={{ fill: '#85837a', fontSize: 12 }}
          dy={4}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={{ fill: '#85837a', fontSize: 12 }}
          allowDecimals={false}
          width={44}
        />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(57,135,229,0.07)' }} />
        <Bar dataKey="count" fill={SERIES} radius={[4, 4, 0, 0]} maxBarSize={64} isAnimationActive={false}>
          <LabelList dataKey="count" position="top" fill="#56554d" fontSize={12} offset={8} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export default PolicyTimeline
