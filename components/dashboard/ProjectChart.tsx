"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { TrendingUp, Calendar, BarChart3, LineChart, PieChart } from "lucide-react"

interface ProjectChartProps {
  projects: Array<{ 
    id: string
    name: string 
    created_at: string 
    generated_readme: string | null 
  }>
}

type ChartType = "bar" | "line" | "pie"
type TimeRange = "week" | "month" | "quarter" | "year"

export function ProjectChart({ projects }: ProjectChartProps) {
  const [chartType, setChartType] = useState<ChartType>("bar")
  const [timeRange, setTimeRange] = useState<TimeRange>("month")
  const [chartData, setChartData] = useState<Array<{ label: string, value: number, color: string }>>([])

  // Generate random data for demonstration
  const generateChartData = () => {
    const today = new Date()
    const dataPoints = timeRange === "week" ? 7 : timeRange === "month" ? 30 : timeRange === "quarter" ? 12 : 52
    
    // Real projects data for README generation
    const projectsWithReadme = projects.filter(p => p.generated_readme).length
    const projectsWithoutReadme = projects.length - projectsWithReadme
    
    // Generate time-based data
    const timeData = Array.from({ length: dataPoints }, (_, i) => {
      let label = ""
      const value = Math.floor(Math.random() * 10) + 1
      
      if (timeRange === "week") {
        const date = new Date(today)
        date.setDate(today.getDate() - (dataPoints - 1 - i))
        label = date.toLocaleDateString('en-US', { weekday: 'short' })
      } else if (timeRange === "month") {
        const date = new Date(today)
        date.setDate(today.getDate() - (dataPoints - 1 - i))
        label = date.getDate().toString()
      } else if (timeRange === "quarter") {
        label = `Week ${i + 1}`
      } else {
        label = `W${i + 1}`
      }
      
      return {
        label,
        value,
        color: `hsl(${200 + (i * 30) % 160}, 70%, 50%)`
      }
    })

    // Mix real and generated data based on chart type
    if (chartType === "pie") {
      return [
        { label: "With README", value: projectsWithReadme, color: "hsl(142, 70%, 50%)" },
        { label: "Without README", value: projectsWithoutReadme, color: "hsl(0, 70%, 50%)" },
        { label: "AI Generated", value: Math.floor(projectsWithReadme * 0.8), color: "hsl(250, 70%, 50%)" },
        { label: "Manual", value: Math.floor(projectsWithReadme * 0.2), color: "hsl(30, 70%, 50%)" },
      ]
    }

    return timeData
  }

  useEffect(() => {
    setChartData(generateChartData())
  }, [chartType, timeRange, projects])

  const maxValue = Math.max(...chartData.map(d => d.value), 1)
  const totalValue = chartData.reduce((sum, d) => sum + d.value, 0)

  return (
    <Card className="border-border/50 bg-linear-to-br from-card to-background shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-primary/10 p-2">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-xl">Project Analytics</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Select value={chartType} onValueChange={(value: ChartType) => setChartType(value)}>
              <SelectTrigger className="w-28">
                <SelectValue placeholder="Chart Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bar">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    <span>Bar Chart</span>
                  </div>
                </SelectItem>
                <SelectItem value="line">
                  <div className="flex items-center gap-2">
                    <LineChart className="h-4 w-4" />
                    <span>Line Chart</span>
                  </div>
                </SelectItem>
                <SelectItem value="pie">
                  <div className="flex items-center gap-2">
                    <PieChart className="h-4 w-4" />
                    <span>Pie Chart</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={timeRange} onValueChange={(value: TimeRange) => setTimeRange(value)}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Last Week</span>
                  </div>
                </SelectItem>
                <SelectItem value="month">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Last Month</span>
                  </div>
                </SelectItem>
                <SelectItem value="quarter">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Last Quarter</span>
                  </div>
                </SelectItem>
                <SelectItem value="year">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Last Year</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Chart Visualization */}
        <div className="mb-6 h-64">
          {chartType === "bar" && (
            <div className="flex h-full items-end justify-between gap-1 pt-8">
              {chartData.map((item, index) => (
                <div key={index} className="flex flex-col items-center flex-1">
                  <div className="text-xs text-muted-foreground">{item.value}</div>
                  <button
                    onClick={() => console.log(`Clicked ${item.label}: ${item.value}`)}
                    className="group w-full max-w-12 relative flex flex-col items-center"
                  >
                    <div 
                      className="w-8 rounded-t-lg transition-all duration-300 hover:w-10 hover:opacity-90 group-hover:scale-105"
                      style={{
                        height: `${(item.value / maxValue) * 180}px`,
                        backgroundColor: item.color,
                      }}
                    />
                    <div className="mt-2 text-xs text-muted-foreground">{item.label}</div>
                    <div className="invisible absolute -top-8 rounded bg-popover px-2 py-1 text-xs text-popover-foreground shadow-lg group-hover:visible">
                      {item.label}: {item.value} projects
                    </div>
                  </button>
                </div>
              ))}
            </div>
          )}
          
          {chartType === "line" && (
            <div className="relative h-full">
              <svg width="100%" height="100%" className="overflow-visible">
                {/* Grid lines */}
                <line x1="0" y1="0" x2="100%" y2="0" stroke="var(--border)" strokeWidth="1" />
                <line x1="0" y1="50%" x2="100%" y2="50%" stroke="var(--border)" strokeWidth="1" />
                <line x1="0" y1="100%" x2="100%" y2="100%" stroke="var(--border)" strokeWidth="1" />
                
                {/* Line path */}
                <polyline
                  points={chartData.map((item, i) => 
                    `${(i / (chartData.length - 1)) * 100}%,${100 - (item.value / maxValue) * 100}`
                  ).join(' ')}
                  fill="none"
                  stroke="var(--primary)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                
                {/* Data points */}
                {chartData.map((item, i) => (
                  <g key={i}>
                    <circle
                      cx={`${(i / (chartData.length - 1)) * 100}%`}
                      cy={`${100 - (item.value / maxValue) * 100}%`}
                      r="6"
                      fill="var(--primary)"
                      className="cursor-pointer transition-all hover:r-8"
                      onClick={() => console.log(`Clicked ${item.label}: ${item.value}`)}
                    />
                    <text
                      x={`${(i / (chartData.length - 1)) * 100}%`}
                      y="105%"
                      textAnchor="middle"
                      className="fill-muted-foreground text-xs"
                    >
                      {item.label}
                    </text>
                    <text
                      x={`${(i / (chartData.length - 1)) * 100}%`}
                      y={`${95 - (item.value / maxValue) * 100}%`}
                      textAnchor="middle"
                      className="fill-foreground text-xs font-medium"
                    >
                      {item.value}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          )}
          
          {chartType === "pie" && (
            <div className="flex h-full items-center">
              <div className="relative h-48 w-48">
                <svg width="100%" height="100%" viewBox="0 0 100 100" className="overflow-visible">
                  {(() => {
                    let cumulativeAngle = 0
                    return chartData.map((item, i) => {
                      const angle = (item.value / totalValue) * 360
                      const largeArcFlag = angle > 180 ? 1 : 0
                      const x1 = 50 + 40 * Math.cos((cumulativeAngle * Math.PI) / 180)
                      const y1 = 50 + 40 * Math.sin((cumulativeAngle * Math.PI) / 180)
                      const x2 = 50 + 40 * Math.cos(((cumulativeAngle + angle) * Math.PI) / 180)
                      const y2 = 50 + 40 * Math.sin(((cumulativeAngle + angle) * Math.PI) / 180)
                      
                      const path = `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2} Z`
                      
                      // Calculate label position
                      const midAngle = cumulativeAngle + angle / 2
                      const labelX = 50 + 55 * Math.cos((midAngle * Math.PI) / 180)
                      const labelY = 50 + 55 * Math.sin((midAngle * Math.PI) / 180)
                      
                      cumulativeAngle += angle
                      
                      return (
                        <g key={i}>
                          <path
                            d={path}
                            fill={item.color}
                            className="cursor-pointer transition-opacity hover:opacity-80"
                            onClick={() => console.log(`Clicked ${item.label}: ${item.value}`)}
                          />
                          <text
                            x={labelX}
                            y={labelY}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            className="fill-background text-xs font-medium"
                          >
                            {Math.round((item.value / totalValue) * 100)}%
                          </text>
                        </g>
                      )
                    })
                  })()}
                </svg>
              </div>
              
              <div className="ml-8 flex-1 space-y-3">
                {chartData.map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm font-medium">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">{item.value}</span>
                      <span className="text-xs text-muted-foreground">
                        ({Math.round((item.value / totalValue) * 100)}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Stats Summary */}
        <div className="grid grid-cols-2 gap-4 border-t border-border/50 pt-4 md:grid-cols-4">
          <div className="rounded-lg bg-muted/30 p-3">
            <div className="text-sm text-muted-foreground">Total Projects</div>
            <div className="text-2xl font-bold">{projects.length}</div>
          </div>
          <div className="rounded-lg bg-muted/30 p-3">
            <div className="text-sm text-muted-foreground">With README</div>
            <div className="text-2xl font-bold text-green-600">
              {projects.filter(p => p.generated_readme).length}
            </div>
          </div>
          <div className="rounded-lg bg-muted/30 p-3">
            <div className="text-sm text-muted-foreground">Avg/Month</div>
            <div className="text-2xl font-bold">
              {Math.round(projects.length / 12)}
            </div>
          </div>
          <div className="rounded-lg bg-muted/30 p-3">
            <div className="text-sm text-muted-foreground">Completion Rate</div>
            <div className="text-2xl font-bold text-blue-600">
              {projects.length > 0 
                ? `${Math.round((projects.filter(p => p.generated_readme).length / projects.length) * 100)}%` 
                : "0%"}
            </div>
          </div>
        </div>
        
        {/* Refresh/Interaction */}
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Hover over chart elements for details • Click to interact
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setChartData(generateChartData())}
          >
            Refresh Data
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}