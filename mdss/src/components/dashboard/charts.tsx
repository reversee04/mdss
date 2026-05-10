'use client'

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

const chartColors = {
  primary: '#006cbf',
  secondary: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  purple: '#8b5cf6',
  cyan: '#06b6d4',
}

interface LineChartProps {
  title: string
  description?: string
  labels: string[]
  datasets: {
    label: string
    data: number[]
    borderColor?: string
    backgroundColor?: string
  }[]
}

export function LineChart({ title, description, labels, datasets }: LineChartProps) {
  const colors = Object.values(chartColors)
  
  const data = {
    labels,
    datasets: datasets.map((ds, i) => ({
      ...ds,
      borderColor: ds.borderColor || colors[i % colors.length],
      backgroundColor: ds.backgroundColor || `${colors[i % colors.length]}20`,
      fill: true,
      tension: 0.3,
    })),
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <Line data={data} options={options} />
        </div>
      </CardContent>
    </Card>
  )
}

interface BarChartProps {
  title: string
  description?: string
  labels: string[]
  datasets: {
    label: string
    data: number[]
    backgroundColor?: string
  }[]
  horizontal?: boolean
}

export function BarChart({ title, description, labels, datasets, horizontal = false }: BarChartProps) {
  const colors = Object.values(chartColors)
  
  const data = {
    labels,
    datasets: datasets.map((ds, i) => ({
      ...ds,
      backgroundColor: ds.backgroundColor || colors[i % colors.length],
    })),
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: horizontal ? ('y' as const) : ('x' as const),
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <Bar data={data} options={options} />
        </div>
      </CardContent>
    </Card>
  )
}

interface PieChartProps {
  title: string
  description?: string
  labels: string[]
  data: number[]
  doughnut?: boolean
}

export function PieChart({ title, description, labels, data, doughnut = false }: PieChartProps) {
  const colors = Object.values(chartColors)
  
  const chartData = {
    labels,
    datasets: [
      {
        data,
        backgroundColor: colors.slice(0, data.length),
        borderWidth: 2,
        borderColor: '#ffffff',
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
      },
    },
  }

  const ChartComponent = doughnut ? Doughnut : Pie

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ChartComponent data={chartData} options={options} />
        </div>
      </CardContent>
    </Card>
  )
}
