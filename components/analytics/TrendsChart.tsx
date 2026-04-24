import React from 'react'

interface TrendsChartProps {
  data: Array<{
    date: string
    sent: number
    opened: number
    clicked: number
  }>
  metrics: {
    delivered: number
    opened: number
    clicked: number
    bounced: number
    complained: number
  }
  sequenceSteps?: number[]
  selectedStep?: number | 'all'
  onStepChange?: (step: number | 'all') => void
}

export const TrendsChart: React.FC<TrendsChartProps> = ({
  data,
  metrics,
  sequenceSteps = [],
  selectedStep = 'all',
  onStepChange,
}) => {
  const maxVal = Math.max(...data.map((d) => Math.max(d.sent, d.opened, d.clicked)), 10)
  const chartHeight = 200
  const chartWidth = 600
  const padding = { top: 20, right: 20, bottom: 30, left: 40 }

  const innerWidth = chartWidth - padding.left - padding.right
  const innerHeight = chartHeight - padding.top - padding.bottom

  const getX = (index: number) => padding.left + (index / Math.max(1, data.length - 1)) * innerWidth
  const getY = (val: number) => padding.top + innerHeight - (val / maxVal) * innerHeight

  const createPath = (key: 'sent' | 'opened' | 'clicked') => {
    if (data.length === 0) return ''
    const points = data.map((d, i) => `${getX(i)},${getY(d[key])}`)
    return `M ${points.join(' L ')}`
  }

  const sentPath = createPath('sent')
  const openedPath = createPath('opened')
  const clickedPath = createPath('clicked')

  const deliveryRate = metrics.delivered > 0 ? 100 : 0
  const openRate = metrics.delivered > 0 ? Math.round((metrics.opened / metrics.delivered) * 100) : 0
  const clickRate = metrics.opened > 0 ? Math.round((metrics.clicked / metrics.opened) * 100) : 0

  return (
    <div className="mb-8">
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-lg text-xs font-medium text-gray-700">
          Delivered {metrics.delivered} ({deliveryRate}%)
        </div>
        <div className="px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-lg text-xs font-medium text-gray-700">
          Opened {metrics.opened} ({openRate}%)
        </div>
        <div className="px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-lg text-xs font-medium text-gray-700">
          Clicked {metrics.clicked} ({clickRate}%)
        </div>
        <div className="px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-lg text-xs font-medium text-gray-700">
          Bounced {metrics.bounced}
        </div>
        <div className="px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-lg text-xs font-medium text-gray-700">
          Complained {metrics.complained}
        </div>
        {sequenceSteps.length > 0 && onStepChange && (
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-gray-500">Sequence step</span>
            <select
              value={selectedStep}
              onChange={(e) =>
                onStepChange(e.target.value === 'all' ? 'all' : Number(e.target.value))
              }
              className="h-8 rounded-md border border-gray-200 bg-white px-2 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="all">All steps</option>
              {sequenceSteps.map((step) => (
                <option key={step} value={step}>
                  Step {step}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="relative w-full overflow-x-auto bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-auto min-w-[500px]"
          preserveAspectRatio="none"
        >
          {/* Grid lines */}
          {[0, 0.5, 1].map((ratio) => (
            <line
              key={ratio}
              x1={padding.left}
              y1={padding.top + innerHeight * ratio}
              x2={chartWidth - padding.right}
              y2={padding.top + innerHeight * ratio}
              stroke="#f3f4f6"
              strokeDasharray="4 4"
              strokeWidth="1"
            />
          ))}

          {/* Y Axis Labels */}
          {[0, 0.5, 1].map((ratio) => (
            <text
              key={ratio}
              x={padding.left - 10}
              y={padding.top + innerHeight * ratio + 4}
              fontSize="10"
              fill="#9ca3af"
              textAnchor="end"
            >
              {Math.round(maxVal * (1 - ratio))}
            </text>
          ))}

          {/* X Axis Labels */}
          {data.map((d, i) => (
            <text
              key={i}
              x={getX(i)}
              y={chartHeight - 10}
              fontSize="10"
              fill="#9ca3af"
              textAnchor="middle"
            >
              {d.date}
            </text>
          ))}

          {/* Lines */}
          <path d={sentPath} fill="none" stroke="#3b82f6" strokeWidth="2" />
          <path d={openedPath} fill="none" stroke="#10b981" strokeWidth="2" />
          <path d={clickedPath} fill="none" stroke="#8b5cf6" strokeWidth="2" />

          {/* Points */}
          {data.length > 0 && (
            <>
              <circle cx={getX(data.length - 1)} cy={getY(data[data.length - 1].sent)} r="4" fill="#3b82f6" />
              <circle cx={getX(data.length - 1)} cy={getY(data[data.length - 1].opened)} r="4" fill="#10b981" />
              <circle cx={getX(data.length - 1)} cy={getY(data[data.length - 1].clicked)} r="4" fill="#8b5cf6" />
            </>
          )}
        </svg>
      </div>
    </div>
  )
}
