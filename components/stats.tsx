"use client"

import * as React from "react"
import { Database, Cloud, Cpu, Zap, Globe, Shield } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from 'react-i18next'

async function fetchStats() {
  const response = await fetch('/api/stats')
  if (!response.ok) throw new Error('Failed to fetch stats')
  return response.json()
}

export function Stats() {
  const { t } = useTranslation()
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['stats'],
    queryFn: fetchStats,
    refetchInterval: 30000,
  })
  
  const defaultStats = {
    totalFiles: 0,
    totalSize: '0 MB',
    uptime: '99.9%',
    databases: 5,
    activeUploads: 0,
    countries: 1,
  }
  
  const stats = data?.data || defaultStats
  
  const statItems = [
    {
      label: t('stats.total_files'),
      value: stats.totalFiles.toLocaleString(),
      icon: Database,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      label: t('stats.total_size'),
      value: stats.totalSize,
      icon: Cloud,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      label: t('stats.uptime'),
      value: stats.uptime,
      icon: Cpu,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      label: t('stats.databases'),
      value: stats.databases,
      icon: Database,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      label: t('stats.active_uploads'),
      value: stats.activeUploads,
      icon: Zap,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
    {
      label: t('stats.countries'),
      value: stats.countries,
      icon: Globe,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-100',
    },
  ]
  
  if (isLoading) {
    return (
      <div className="my-8">
        <h3 className="mb-4 text-lg font-semibold">{t('stats.title')}</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-8 w-24 rounded bg-muted" />
                <div className="mt-2 h-4 w-16 rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }
  
  if (error) {
    return null
  }
  
  return (
    <div className="my-8">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-lg font-semibold">{t('stats.title')}</h3>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Shield className="h-4 w-4" />
          <span>{t('stats.real_time')}</span>
        </div>
      </div>
      
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statItems.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label} className="transition-all hover:shadow-md">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                  <div className={`rounded-lg ${stat.bgColor} p-2`}>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
      
      <div className="mt-6 rounded-lg border p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">{t('stats.system_status')}</p>
            <p className="text-sm text-muted-foreground">
              {t('stats.all_systems_operational')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-success" />
            <span className="text-sm font-medium text-success">
              {t('stats.online')}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}