<template>
  <section class="page">
    <div class="head">
      <div>
        <h1 class="h1">{{ tp('Sales Report') }}</h1>
        <p class="sub">{{ tp('Overview of sales and revenue') }}</p>
      </div>
      <div class="headActions">
        <div class="ranges" role="group" :aria-label="tp('Period')">
          <button
            v-for="d in rangeOptions"
            :key="d"
            type="button"
            :class="['chip', { active: days === d }]"
            :aria-pressed="days === d ? 'true' : 'false'"
            @click="days = d"
          >
            {{ tp('Last {n} days').replace('{n}', d) }}
          </button>
        </div>
        <button class="btnGhost" type="button" :disabled="loading" @click="load">
          <AppIcon name="refresh" :size="18" />{{ tp('Refresh') }}
        </button>
        <button class="btnPrimary" type="button" :disabled="loading || !!error" @click="exportReport">
          <AppIcon name="download" :size="18" />{{ tp('Export Report') }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="kpis" aria-busy="true">
      <div v-for="n in 4" :key="n" class="kpi skeleton" />
    </div>
    <div v-else-if="error" class="error">{{ tp(error) }}</div>

    <template v-else>
      <div class="kpis">
        <div class="kpi">
          <span class="kpiIcon"><AppIcon name="receipt" :size="22" /></span>
          <div class="kpiLabel">{{ tp('Total orders') }}</div>
          <div class="kpiValue">{{ totals.orders }}</div>
        </div>
        <div class="kpi">
          <span class="kpiIcon"><AppIcon name="cash" :size="22" /></span>
          <div class="kpiLabel">{{ tp('Gross revenue') }}</div>
          <div class="kpiValue" dir="ltr">{{ format(totals.revenue) }}</div>
        </div>
        <div class="kpi">
          <span class="kpiIcon"><AppIcon name="dashboard" :size="22" /></span>
          <div class="kpiLabel">{{ tp('Avg order value') }}</div>
          <div class="kpiValue" dir="ltr">{{ format(totals.avg) }}</div>
        </div>
        <div class="kpi">
          <span class="kpiIcon good"><AppIcon name="check" :size="22" /></span>
          <div class="kpiLabel">{{ tp('Delivered revenue') }}</div>
          <div class="kpiValue" dir="ltr">{{ format(deliveredRevenue) }}</div>
        </div>
      </div>

      <div class="card">
        <div class="cardHead">
          <h2 class="cardTitle">{{ tp('Daily revenue') }}</h2>
          <span class="hint">{{ tp('Last {n} days').replace('{n}', days) }}</span>
        </div>
        <p v-if="!chartDays.length" class="empty">{{ tp('No sales in this period') }}</p>
        <div v-else class="chart" role="img" :aria-label="tp('Daily revenue')">
          <div v-for="d in chartDays" :key="d.day" class="barCol" :title="`${formatDay(d.day)} — ${format(d.revenue)} · ${d.orders}`">
            <div class="bar" :style="{ height: `${Math.max(4, (d.revenue / maxRevenue) * 100)}%` }" />
            <span class="barLabel">{{ shortDay(d.day) }}</span>
          </div>
        </div>
      </div>

      <div class="twoCol">
        <div class="card">
          <div class="cardHead">
            <h2 class="cardTitle">{{ tp('Daily Sales Summary') }}</h2>
          </div>
          <p v-if="!rangeRows.length" class="empty">{{ tp('No sales in this period') }}</p>
          <div v-else class="tableWrap">
            <table class="table">
              <thead>
                <tr>
                  <th>{{ tp('Date') }}</th>
                  <th class="num">{{ tp('Orders') }}</th>
                  <th class="num">{{ tp('Revenue') }}</th>
                  <th class="num">{{ tp('Avg value') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="r in rangeRows" :key="r.day">
                  <td dir="ltr" class="dateCell">{{ formatDay(r.day) }}</td>
                  <td class="num strong">{{ r.orders }}</td>
                  <td class="num strong" dir="ltr">{{ format(r.revenue) }}</td>
                  <td class="num muted" dir="ltr">{{ format(r.avgValue) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="card">
          <div class="cardHead">
            <h2 class="cardTitle">{{ tp('Order Status Breakdown') }}</h2>
          </div>
          <ul class="statusList">
            <li v-for="s in statusRows" :key="s.status" class="statusRow">
              <div class="statusTop">
                <span class="statusName"><span class="dot" :style="{ background: s.color }" />{{ statusLabel(s.status) }}</span>
                <span class="statusNums">
                  <strong>{{ s.orders }}</strong> {{ tp('orders') }} · <span dir="ltr">{{ format(s.revenue) }}</span>
                </span>
              </div>
              <div class="track"><div class="fill" :style="{ width: `${s.share}%`, background: s.color }" /></div>
            </li>
          </ul>
        </div>
      </div>
    </template>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { api } from '../../api/client'
import { useCurrency } from '../../composables/useCurrency'
import { useI18n } from '../../i18n'
import AppIcon from '../../components/AppIcon.vue'

const { tp, statusLabel } = useI18n()
const { format } = useCurrency()

const rangeOptions = [7, 30, 60]
const days = ref(30)
const loading = ref(false)
const error = ref(null)
const daily = ref([])
const breakdown = ref([])

// The order lifecycle used everywhere in the system.
const STATUSES = ['Placed', 'Processing', 'Shipped', 'Delivered', 'Cancelled']
const STATUS_COLORS = {
  Placed: '#8a8273',
  Processing: '#b45309',
  Shipped: '#b8914f',
  Delivered: '#1f7a4d',
  Cancelled: '#9a2a16',
}

function dayKey(day) {
  return String(day || '').slice(0, 10)
}

// Rows inside the selected period, newest first.
const rangeRows = computed(() => {
  const since = new Date()
  since.setHours(0, 0, 0, 0)
  since.setDate(since.getDate() - (days.value - 1))
  const sinceKey = since.toISOString().slice(0, 10)
  return (Array.isArray(daily.value) ? daily.value : [])
    .filter((r) => dayKey(r.day) >= sinceKey)
    .sort((a, b) => dayKey(b.day).localeCompare(dayKey(a.day)))
})

// Oldest → newest for the chart.
const chartDays = computed(() => [...rangeRows.value].reverse())
const maxRevenue = computed(() => Math.max(1, ...chartDays.value.map((d) => Number(d.revenue) || 0)))

const totals = computed(() => {
  let orders = 0
  let revenue = 0
  for (const r of rangeRows.value) {
    orders += Number(r.orders) || 0
    revenue += Number(r.revenue) || 0
  }
  return { orders, revenue, avg: orders ? revenue / orders : 0 }
})

function normalizeStatus(raw) {
  const s = String(raw || '').toLowerCase()
  if (s.includes('cancel')) return 'Cancelled'
  if (s.includes('deliver') || s.includes('complete')) return 'Delivered'
  if (s.includes('ship')) return 'Shipped'
  if (s.includes('process')) return 'Processing'
  return 'Placed'
}

const statusRows = computed(() => {
  const acc = Object.fromEntries(STATUSES.map((s) => [s, { orders: 0, revenue: 0 }]))
  for (const row of breakdown.value || []) {
    const s = normalizeStatus(row.orderStatus)
    acc[s].orders += Number(row.orders) || 0
    acc[s].revenue += Number(row.revenue) || 0
  }
  const total = Object.values(acc).reduce((n, x) => n + x.orders, 0) || 1
  return STATUSES.map((s) => ({ status: s, ...acc[s], share: Math.round((acc[s].orders / total) * 100), color: STATUS_COLORS[s] }))
})

const deliveredRevenue = computed(() => statusRows.value.find((s) => s.status === 'Delivered')?.revenue || 0)

function formatDay(day) {
  return dayKey(day)
}

function shortDay(day) {
  const k = dayKey(day)
  return k ? `${k.slice(8, 10)}/${k.slice(5, 7)}` : ''
}

async function load() {
  loading.value = true
  error.value = null
  try {
    const res = await api.get('/api/admin/reports/sales', { params: { dailyLimit: 90 } })
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

// PDF export in the brand colors (black + gold). Text stays in English because the
// built-in PDF fonts have no Arabic letters.
function exportReport() {
  const INK = [20, 20, 20]
  const GOLD = [184, 145, 79]
  const GOLD_TEXT = [133, 101, 42]
  const MUTED = [107, 100, 89]
  const BORDER = [236, 230, 218]
  const SOFT = [250, 248, 244]

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const now = new Date()
  const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

  doc.setFillColor(...INK)
  doc.rect(0, 0, pageW, 28, 'F')
  doc.setFillColor(...GOLD)
  doc.rect(0, 28, pageW, 1.2, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(255, 255, 255)
  doc.text('Al-Wakeel Al-Shamel', 14, 12)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...GOLD)
  doc.text(`Sales Report · Last ${days.value} days`, 14, 19)
  doc.setTextColor(207, 199, 184)
  doc.text(`Generated: ${dateStr} at ${timeStr}`, pageW - 14, 19, { align: 'right' })

  const kpis = [
    { label: 'Total Orders', value: String(totals.value.orders) },
    { label: 'Gross Revenue', value: format(totals.value.revenue) },
    { label: 'Avg Order Value', value: format(totals.value.avg) },
    { label: 'Delivered Revenue', value: format(deliveredRevenue.value) },
  ]
  const boxW = (pageW - 28 - 9) / 4
  kpis.forEach((k, i) => {
    const x = 14 + i * (boxW + 3)
    const y = 35
    doc.setFillColor(...SOFT)
    doc.setDrawColor(...BORDER)
    doc.roundedRect(x, y, boxW, 22, 3, 3, 'FD')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(...MUTED)
    doc.text(k.label.toUpperCase(), x + boxW / 2, y + 8, { align: 'center' })
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12.5)
    doc.setTextColor(...INK)
    doc.text(k.value, x + boxW / 2, y + 17, { align: 'center' })
  })

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...GOLD_TEXT)
  doc.text('Daily Sales Summary', 14, 69)

  const tableStyle = {
    styles: { fontSize: 9, cellPadding: 3.5, textColor: INK, lineColor: BORDER, lineWidth: 0.1 },
    headStyles: { fillColor: INK, textColor: 255, fontStyle: 'bold', fontSize: 8.5 },
    alternateRowStyles: { fillColor: SOFT },
    margin: { left: 14, right: 14, bottom: 18 },
  }

  autoTable(doc, {
    ...tableStyle,
    startY: 73,
    head: [['Date', 'Orders', 'Revenue', 'Avg Value']],
    body: rangeRows.value.length
      ? rangeRows.value.map((r) => [formatDay(r.day), String(r.orders), format(r.revenue), format(r.avgValue)])
      : [['No sales in this period', '', '', '']],
    columnStyles: {
      0: { halign: 'left' },
      1: { halign: 'center', fontStyle: 'bold' },
      2: { halign: 'center', fontStyle: 'bold' },
      3: { halign: 'center', textColor: MUTED },
    },
  })

  const afterDaily = doc.lastAutoTable.finalY + 10
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...GOLD_TEXT)
  doc.text('Order Status Breakdown', 14, afterDaily)

  const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]
  autoTable(doc, {
    ...tableStyle,
    startY: afterDaily + 4,
    head: [['Status', 'Orders', 'Share', 'Revenue']],
    body: statusRows.value.map((s) => [s.status, String(s.orders), `${s.share}%`, format(s.revenue)]),
    columnStyles: {
      0: { halign: 'left', fontStyle: 'bold', cellPadding: { left: 8, top: 3.5, bottom: 3.5, right: 3.5 } },
      1: { halign: 'center' },
      2: { halign: 'center', textColor: MUTED },
      3: { halign: 'center' },
    },
    didDrawCell(data) {
      if (data.section === 'body' && data.column.index === 0) {
        const s = statusRows.value[data.row.index]
        if (!s) return
        doc.setFillColor(...hex(s.color))
        doc.circle(data.cell.x + 4, data.cell.y + data.cell.height / 2, 1.4, 'F')
      }
    },
  })

  // Footer with the right page numbers on every page.
  const pages = doc.getNumberOfPages()
  const pageH = doc.internal.pageSize.getHeight()
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i)
    doc.setDrawColor(...BORDER)
    doc.line(14, pageH - 12, pageW - 14, pageH - 12)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(...MUTED)
    doc.text('Al-Wakeel Al-Shamel — Confidential', 14, pageH - 7)
    doc.text(`Page ${i} of ${pages}`, pageW - 14, pageH - 7, { align: 'right' })
  }

  doc.save(`sales-report-${now.toISOString().slice(0, 10)}.pdf`)
}

onMounted(load)
</script>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 14px;
}
.h1 {
  margin: 0;
  font-size: 30px;
  font-weight: 800;
}
.sub {
  margin: 6px 0 0;
  color: var(--text);
}
.headActions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}
.ranges {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.chip {
  border: 0;
  padding: 8px 14px;
  border-radius: 999px;
  background: var(--sand-2);
  color: var(--ink);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}
.chip.active {
  background: var(--ink);
  color: #fff;
}
.btnPrimary,
.btnGhost {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 42px;
  padding: 0 14px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
}
.btnPrimary {
  border: 0;
  background: var(--ink);
  color: #fff;
}
.btnGhost {
  border: 1px solid var(--border-strong);
  background: #fff;
  color: var(--ink);
}
.btnPrimary:disabled,
.btnGhost:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.kpis {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 14px;
}
.kpi {
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 18px;
  display: grid;
  gap: 6px;
  min-width: 0;
}
.kpiIcon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: var(--sand);
  color: var(--gold-text);
  display: grid;
  place-items: center;
}
.kpiIcon.good {
  background: #e6f2ec;
  color: var(--success);
}
.kpiLabel {
  font-size: 13px;
  color: var(--text);
}
.kpiValue {
  font-family: var(--font-head);
  font-size: 24px;
  font-weight: 800;
  color: var(--ink);
  overflow-wrap: anywhere;
}
.skeleton {
  height: 128px;
  background: linear-gradient(90deg, #f1ece2 25%, #f8f4ec 37%, #f1ece2 63%);
  background-size: 400% 100%;
  animation: shimmer 1.4s ease infinite;
}
@keyframes shimmer {
  0% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0 50%;
  }
}

.card {
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 22px;
  padding: 18px 20px;
  min-width: 0;
}
.cardHead {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 12px;
}
.cardTitle {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
}
.hint {
  font-size: 13px;
  color: var(--text);
}
.empty {
  margin: 0;
  padding: 28px 0;
  text-align: center;
  color: var(--text);
}

.chart {
  height: 200px;
  display: flex;
  align-items: stretch;
  gap: 6px;
  overflow-x: auto;
  padding-bottom: 4px;
}
.barCol {
  flex: 1 0 22px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
  gap: 6px;
}
.bar {
  width: 100%;
  max-width: 34px;
  border-radius: 8px 8px 3px 3px;
  background: var(--gold);
}
.barCol:hover .bar {
  background: var(--ink);
}
.barLabel {
  font-size: 10px;
  color: var(--muted);
  white-space: nowrap;
  direction: ltr;
}

.twoCol {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
  gap: 18px;
  align-items: start;
}
.tableWrap {
  overflow-x: auto;
  border: 1px solid var(--border);
  border-radius: 14px;
}
.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}
.table th {
  background: var(--ink);
  color: #fff;
  font-weight: 600;
  font-size: 13px;
  padding: 10px 12px;
  text-align: start;
  white-space: nowrap;
}
.table td {
  padding: 10px 12px;
  border-top: 1px solid var(--border);
  color: var(--ink);
}
.table tbody tr:nth-child(even) td {
  background: var(--bg);
}
.num {
  text-align: center !important;
}
.dateCell {
  text-align: start;
  white-space: nowrap;
}
.strong {
  font-weight: 600;
}
.muted {
  color: var(--text) !important;
}

.statusList {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 14px;
}
.statusTop {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 6px;
  margin-bottom: 6px;
}
.statusName {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: var(--ink);
}
.dot {
  width: 10px;
  height: 10px;
  border-radius: 5px;
}
.statusNums {
  font-size: 13px;
  color: var(--text);
}
.statusNums strong {
  color: var(--ink);
}
.track {
  height: 8px;
  border-radius: 4px;
  background: var(--sand-2);
  overflow: hidden;
}
.fill {
  height: 100%;
  border-radius: 4px;
}
.error {
  color: var(--danger);
  background: rgba(154, 42, 22, 0.06);
  border: 1px solid rgba(154, 42, 22, 0.2);
  padding: 10px 12px;
  border-radius: 12px;
}

@media (max-width: 900px) {
  .twoCol {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 560px) {
  .h1 {
    font-size: 26px;
  }
  .kpis {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .kpiValue {
    font-size: 19px;
  }
}
</style>
