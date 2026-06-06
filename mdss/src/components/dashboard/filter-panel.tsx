'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { CalendarIcon, RotateCcw } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { districts as mockDistricts, facilities as mockFacilities } from '@/lib/mock-data'

interface FilterPanelProps {
  showDisease?: boolean
  showLocation?: boolean
  showFacility?: boolean
  showTimeRange?: boolean
  showDateRange?: boolean
  onFilterChange?: (filters: FilterState) => void
  className?: string
}

export interface FilterState {
  disease?: string
  location?: string
  facility?: string
  timeRange?: string
  startDate?: Date
  endDate?: Date
}

export function FilterPanel({
  showDisease = true,
  showLocation = true,
  showFacility = false,
  showTimeRange = true,
  showDateRange = false,
  onFilterChange,
  className,
}: FilterPanelProps) {
  const [diseases, setDiseases] = useState<Array<{ disease_id: string; disease_name: string }>>([])
  const [loadingDiseases, setLoadingDiseases] = useState(false)

  // Fetch real diseases from API on mount
  useEffect(() => {
    const fetchDiseases = async () => {
      try {
        setLoadingDiseases(true)
        const response = await fetch('/api/admin/diseases/list')
        const data = await response.json()
        if (data.success && data.data) {
          setDiseases(data.data)
        }
      } catch (error) {
        console.error('Failed to fetch diseases:', error)
      } finally {
        setLoadingDiseases(false)
      }
    }

    if (showDisease) {
      fetchDiseases()
    }
  }, [showDisease])

  const handleReset = () => {
    onFilterChange?.({})
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-3', className)}>
      {showDisease && (
        <Select onValueChange={(value) => onFilterChange?.({ disease: value })}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder={loadingDiseases ? "Loading..." : "All Diseases"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Diseases</SelectItem>
            {diseases.map((disease) => (
              <SelectItem key={disease.disease_id} value={disease.disease_id}>
                {disease.disease_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {showLocation && (
        <Select onValueChange={(value) => onFilterChange?.({ location: value })}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Districts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Districts</SelectItem>
            {mockDistricts.map((district) => (
              <SelectItem key={district} value={district.toLowerCase()}>
                {district}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {showFacility && (
        <Select onValueChange={(value) => onFilterChange?.({ facility: value })}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Facilities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Facilities</SelectItem>
            {mockFacilities.map((facility) => (
              <SelectItem key={facility.id} value={facility.id}>
                {facility.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {showTimeRange && (
        <Select onValueChange={(value) => onFilterChange?.({ timeRange: value })}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Time Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="yearly">Yearly</SelectItem>
          </SelectContent>
        </Select>
      )}

      {showDateRange && (
        <>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn('w-[140px] justify-start text-left font-normal')}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                Start Date
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                onSelect={(date) => onFilterChange?.({ startDate: date })}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn('w-[140px] justify-start text-left font-normal')}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                End Date
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                onSelect={(date) => onFilterChange?.({ endDate: date })}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </>
      )}

      <Button variant="ghost" size="icon" onClick={handleReset} title="Reset filters">
        <RotateCcw className="h-4 w-4" />
      </Button>
    </div>
  )
}
