<template>
  <section class="page">
    <div class="head">
      <div>
        <h1 class="h1">Sales Report</h1>
        <p class="sub">Overview of sales and revenue</p>
      </div>
      <div class="headActions">
        <button class="btnGhost" type="button" :disabled="loading" @click="load">Refresh</button>
        <button class="btnPrimary" type="button" @click="exportReport">Export Report</button>
      </div>
    </div>

    <div v-if="loading" class="muted">Loading...</div>
    <div v-else-if="error" class="error">{{ error }}</div>

    <div v-else class="grid">
      <div class="kpi">
        <div class="kpiLabel">Total orders</div>
        <div class="kpiValue">{{ totals.orders }}</div>
      </div>
      <div class="kpi">
        <div class="kpiLabel">Gross revenue</div>
        <div class="kpiValue">{{ format(totals.revenue) }}</div>
      </div>
      <div class="kpi">
        <div class="kpiLabel">Avg order value</div>
        <div class="kpiValue">{{ format(totals.avg) }}</div>
      </div>
      <div class="kpi">
        <div class="kpiLabel">Completed revenue</div>
        <div class="kpiValue green">{{ format(bucket.Completed.revenue) }}</div>
      </div>
    </div>

    <div v-if="!loading && !error" class="card">
      <div class="cardHead">
        <span class="docIcon" aria-hidden="true">▦</span>
        <div class="cardTitle">Daily Sales Summary</div>
      </div>

      <div class="tableWrap">
        <table class="table">
          <thead>
            <tr>
              <th>Date</th>
              <th class="c">Orders</th>
              <th class="c">Revenue</th>
              <th class="c">Avg value</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in dailySorted" :key="r.day">
              <td class="mono">{{ formatDay(r.day) }}</td>
              <td class="c strong">{{ r.orders }}</td>
              <td class="c strong">{{ format(r.revenue) }}</td>
              <td class="c mutedTd">{{ format(r.avgValue) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="!loading && !error" class="card">
      <div class="breakTitle">Order Status Breakdown</div>
      <div class="breakGrid">
        <div v-for="label in ['Pending', 'Confirmed', 'Completed', 'Cancelled']" :key="label" class="breakCard">
          <div class="breakLabel">{{ label }}</div>
          <div class="breakCount">{{ bucket[label].orders }} orders</div>
          <div class="breakRev">{{ format(bucket[label].revenue) }}</div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { api } from '../../api/client'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { useCurrency } from '../../composables/useCurrency'

const { format } = useCurrency()
const loading = ref(false)
const error = ref(null)
const daily = ref([])
const breakdown = ref([])

const dailySorted = computed(() => {
  const rows = Array.isArray(daily.value) ? daily.value : []
  return [...rows].sort((a, b) => String(b.day).localeCompare(String(a.day)))
})

function normStatus(s) {
  return String(s || '').trim().toLowerCase()
}

function bucketFor(raw) {
  const s = normStatus(raw)
  if (s.includes('cancel')) return 'Cancelled'
  if (s.includes('complete') || s.includes('deliver')) return 'Completed'
  if (s.includes('confirm') || s.includes('placed') || s.includes('process') || s.includes('ship')) return 'Confirmed'
  if (s.includes('pending') || s.includes('credit')) return 'Pending'
  return 'Confirmed'
}

const bucket = computed(() => {
  const base = {
    Pending: { orders: 0, revenue: 0 },
    Confirmed: { orders: 0, revenue: 0 },
    Completed: { orders: 0, revenue: 0 },
    Cancelled: { orders: 0, revenue: 0 },
  }

  for (const row of breakdown.value || []) {
    const b = bucketFor(row.orderStatus)
    base[b].orders += Number(row.orders) || 0
    base[b].revenue += Number(row.revenue) || 0
  }

  return base
})

const totals = computed(() => {
  let orders = 0
  let revenue = 0
  for (const row of dailySorted.value) {
    orders += Number(row.orders) || 0
    revenue += Number(row.revenue) || 0
  }
  const avg = orders === 0 ? 0 : revenue / orders
  return { orders, revenue, avg }
})

function formatDay(day) {
  const s = String(day || '')
  if (!s) return ''
  if (s.length >= 10) return s.slice(0, 10)
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return s
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

async function load() {
  loading.value = true
  error.value = null
  try {
    const res = await api.get('/api/admin/reports/sales', { params: { dailyLimit: 60 } })
    daily.value = res.data?.daily ?? res.data?.Daily ?? []
    breakdown.value = res.data?.statusBreakdown ?? res.data?.StatusBreakdown ?? []
  } catch (e) {
    const data = e?.response?.data
    if (typeof data === 'string') error.value = data
    else if (data?.title) error.value = data.title
    else error.value = 'Failed to load report'
  } finally {
    loading.value = false
  }
}

function exportReport() {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const now = new Date()
  const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

  // ── Header bar ──────────────────────────────────────────────────
  doc.setFillColor(15, 23, 42)
  doc.rect(0, 0, pageW, 28, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(255, 255, 255)
  doc.text('Al-Wakeel Al-Shamel', 14, 12)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(148, 163, 184)
  doc.text('Sales Report', 14, 19)
  doc.text(`Generated: ${dateStr} at ${timeStr}`, pageW - 14, 19, { align: 'right' })

  // ── KPI summary boxes ────────────────────────────────────────────
  const kpis = [
    { label: 'Total Orders', value: String(totals.value.orders) },
    { label: 'Gross Revenue', value: format(totals.value.revenue) },
    { label: 'Avg Order Value', value: format(totals.value.avg) },
    { label: 'Completed Revenue', value: format(bucket.value.Completed.revenue) },
  ]
  const boxW = (pageW - 28 - 9) / 4
  kpis.forEach((k, i) => {
    const x = 14 + i * (boxW + 3)
    const y = 34
    doc.setFillColor(248, 250, 252)
    doc.setDrawColor(226, 232, 240)
    doc.roundedRect(x, y, boxW, 22, 3, 3, 'FD')

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(100, 116, 139)
    doc.text(k.label.toUpperCase(), x + boxW / 2, y + 8, { align: 'center' })

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.setTextColor(15, 23, 42)
    doc.text(k.value, x + boxW / 2, y + 17, { align: 'center' })
  })

  // ── Daily Sales table ────────────────────────────────────────────
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(15, 23, 42)
  doc.text('Daily Sales Summary', 14, 68)

  autoTable(doc, {
    startY: 72,
    head: [['Date', 'Orders', 'Revenue', 'Avg Value']],
    body: dailySorted.value.map((r) => [
      formatDay(r.day),
      String(r.orders),
      format(r.revenue),
      format(r.avgValue),
    ]),
    styles: { fontSize: 9, cellPadding: 4, textColor: [30, 41, 59] },
    headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold', fontSize: 8.5 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { halign: 'left', font: 'courier' },
      1: { halign: 'center', fontStyle: 'bold' },
      2: { halign: 'center', fontStyle: 'bold' },
      3: { halign: 'center', textColor: [100, 116, 139] },
    },
    margin: { left: 14, right: 14 },
  })

  // ── Status Breakdown table ───────────────────────────────────────
  const afterDaily = doc.lastAutoTable.finalY + 10
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(15, 23, 42)
  doc.text('Order Status Breakdown', 14, afterDaily)

  const statusColors = {
    Pending: [245, 158, 11],
    Confirmed: [37, 99, 235],
    Completed: [4, 120, 87],
    Cancelled: [180, 35, 24],
  }
  autoTable(doc, {
    startY: afterDaily + 4,
    head: [['Status', 'Orders', 'Revenue']],
    body: ['Pending', 'Confirmed', 'Completed', 'Cancelled'].map((label) => [
      label,
      String(bucket.value[label].orders),
      format(bucket.value[label].revenue),
    ]),
    styles: { fontSize: 9, cellPadding: 4, textColor: [30, 41, 59] },
    headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold', fontSize: 8.5 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { halign: 'left', fontStyle: 'bold' },
      1: { halign: 'center' },
      2: { halign: 'center' },
    },
    didDrawCell(data) {
      if (data.section === 'body' && data.column.index === 0) {
        const label = data.cell.text[0]
        const [r, g, b] = statusColors[label] ?? [100, 116, 139]
        doc.setFillColor(r, g, b)
        doc.circle(data.cell.x + 3.5, data.cell.y + data.cell.height / 2, 1.5, 'F')
      }
    },
    margin: { left: 14, right: 14 },
  })

  // ── Footer ───────────────────────────────────────────────────────
  const pageH = doc.internal.pageSize.getHeight()
  doc.setDrawColor(226, 232, 240)
  doc.line(14, pageH - 12, pageW - 14, pageH - 12)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(148, 163, 184)
  doc.text('Al-Wakeel Al-Shamel — Confidential', 14, pageH - 7)
  doc.text(`Page 1`, pageW - 14, pageH - 7, { align: 'right' })

  doc.save(`sales-report-${now.toISOString().slice(0, 10)}.pdf`)
}

onMounted(load)
</script>

<style scoped>
.page {
  display: grid;
  gap: 14px;
}
.head {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 12px;
}
.headActions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}
.h1 {
  margin: 0;
  font-size: 30px;
  font-weight: 950;
  letter-spacing: -0.8px;
  color: var(--text-h);
}
.sub {
  margin: 6px 0 0;
  color: var(--text);
}

.grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}
@media (max-width: 980px) {
  .grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 520px) {
  .grid {
    grid-template-columns: 1fr;
  }
}

.kpi {
  border: 1px solid var(--border);
  border-radius: 14px;
  background: #fff;
  padding: 14px;
  box-shadow: var(--shadow-sm);
}
.kpiLabel {
  color: var(--muted);
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.02em;
}
.kpiValue {
  margin-top: 8px;
  font-size: 26px;
  font-weight: 950;
  letter-spacing: -0.7px;
  color: var(--text-h);
}
.kpiValue.green {
  color: #047857;
}

.card {
  border: 1px solid var(--border);
  border-radius: 14px;
  background: #fff;
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}
.cardHead {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 14px 10px;
}
.docIcon {
  width: 34px;
  height: 34px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  border: 1px solid var(--border);
  color: var(--brand-blue);
  font-weight: 950;
  background: rgba(37, 99, 235, 0.08);
}
.cardTitle {
  font-weight: 950;
  color: var(--text-h);
}

.tableWrap {
  overflow: auto;
}
.table {
  width: 100%;
  border-collapse: collapse;
  min-width: 860px;
}
thead th {
  text-align: left;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted);
  font-weight: 900;
  padding: 12px 14px;
  background: #f8fafc;
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
}
tbody td {
  padding: 12px 14px;
  border-bottom: 1px solid #eef2f7;
}
.c {
  text-align: center;
}
.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
}
.strong {
  font-weight: 950;
  color: var(--text-h);
}
.mutedTd {
  color: var(--text);
  font-weight: 700;
}

.breakTitle {
  padding: 14px 14px 6px;
  font-weight: 950;
  color: var(--text-h);
}
.breakGrid {
  padding: 10px 14px 14px;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}
@media (max-width: 980px) {
  .breakGrid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
.breakCard {
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 12px;
  background: #fff;
}
.breakLabel {
  color: var(--muted);
  font-size: 12px;
  font-weight: 900;
}
.breakCount {
  margin-top: 8px;
  font-size: 20px;
  font-weight: 950;
  color: var(--text-h);
  letter-spacing: -0.4px;
}
.breakRev {
  margin-top: 6px;
  color: var(--text);
  font-weight: 750;
}

.btnPrimary {
  border: 0;
  cursor: pointer;
  background: var(--brand-blue);
  color: #fff;
  padding: 10px 12px;
  border-radius: 12px;
  font-weight: 950;
  box-shadow: var(--shadow-sm);
}
.btnGhost {
  border: 1px solid var(--border);
  background: #fff;
  padding: 10px 12px;
  border-radius: 12px;
  font-weight: 900;
  cursor: pointer;
  color: var(--text-h);
}

.muted {
  color: var(--text);
}
.error {
  color: #b42318;
  background: rgba(180, 35, 24, 0.08);
  border: 1px solid rgba(180, 35, 24, 0.2);
  padding: 10px 12px;
  border-radius: 12px;
}
</style>
