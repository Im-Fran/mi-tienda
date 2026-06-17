import { useState } from "react"
import { useParams } from "react-router-dom"
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts"
import type { PieLabelRenderProps } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/shared/PageHeader"
import { LoadingSpinner } from "@/components/shared/LoadingSpinner"
import { ErrorState } from "@/components/shared/ErrorState"
import { useStatsSummary, useTopProducts, useOrdersByStatus, useRevenueOverTime } from "@/hooks/useStats"
import { useStoreSettings } from "@/hooks/useStores"
import { formatCurrency } from "@/lib/utils"

const CHART_COLORS = ["#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd", "#ddd6fe", "#ede9fe", "#f5f3ff"]

function renderPieLabel(props: PieLabelRenderProps): string {
  const name = String(props.name ?? "")
  const percent = typeof props.percent === "number" ? props.percent : 0
  return `${name.slice(0, 12)} (${(percent * 100).toFixed(0)}%)`
}

export function StatsPage() {
  const { storeId } = useParams<{ storeId: string }>()
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [params, setParams] = useState<{ from?: string; to?: string }>({})

  const { data: settings } = useStoreSettings(storeId!)
  const { data: summary, isLoading: loadingSummary, isError } = useStatsSummary(storeId!, params)
  const { data: topProducts, isLoading: loadingTop } = useTopProducts(storeId!, params)
  const { data: byStatus, isLoading: loadingStatus } = useOrdersByStatus(storeId!, params)
  const { data: revenue, isLoading: loadingRevenue } = useRevenueOverTime(storeId!, params)

  const symbol = settings?.currencySymbol ?? "$"
  const decimals = settings?.decimalPlaces ?? 2

  function applyFilters() {
    setParams({ from: from || undefined, to: to || undefined })
  }

  if (isError) return <ErrorState message="Failed to load stats" />

  return (
    <div>
      <PageHeader title="Statistics" />

      {/* Date range */}
      <div className="flex items-end gap-3 mb-6">
        <div className="space-y-1">
          <Label>From</Label>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" />
        </div>
        <div className="space-y-1">
          <Label>To</Label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" />
        </div>
        <Button onClick={applyFilters} variant="outline">Apply</Button>
        <Button variant="ghost" onClick={() => { setFrom(""); setTo(""); setParams({}) }}>Clear</Button>
      </div>

      {/* KPI Cards */}
      {loadingSummary ? (
        <LoadingSpinner className="py-8" />
      ) : summary ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-bold">{formatCurrency(summary.totalRevenue, symbol, decimals)}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-bold">{summary.totalOrders}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Avg Order Value</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-bold">{formatCurrency(summary.averageOrderValue, symbol, decimals)}</p></CardContent>
          </Card>
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue over time */}
        <Card>
          <CardHeader><CardTitle className="text-base">Revenue Over Time</CardTitle></CardHeader>
          <CardContent>
            {loadingRevenue ? <LoadingSpinner className="py-8" /> : (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={revenue?.data ?? []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v: number) => formatCurrency(v, symbol, 0)} />
                  <Tooltip formatter={(v) => formatCurrency(v as number, symbol, decimals)} />
                  <Line type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Orders by status */}
        <Card>
          <CardHeader><CardTitle className="text-base">Orders by Status</CardTitle></CardHeader>
          <CardContent>
            {loadingStatus ? <LoadingSpinner className="py-8" /> : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={byStatus?.data ?? []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="status" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Top products */}
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Top Products by Revenue</CardTitle></CardHeader>
          <CardContent>
            {loadingTop ? <LoadingSpinner className="py-8" /> : (
              <div className="flex items-center gap-8">
                <ResponsiveContainer width="50%" height={240}>
                  <PieChart>
                    <Pie
                      data={topProducts?.products ?? []}
                      dataKey="totalRevenue"
                      nameKey="productName"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      label={renderPieLabel}
                    >
                      {(topProducts?.products ?? []).map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => formatCurrency(v as number, symbol, decimals)} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {(topProducts?.products ?? []).map((p, i) => (
                    <div key={p.productId} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                        <span className="truncate max-w-32">{p.productName}</span>
                      </div>
                      <span className="text-muted-foreground">{formatCurrency(p.totalRevenue, symbol, decimals)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
