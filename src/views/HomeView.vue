<script setup>
import { onMounted, ref, computed } from 'vue'
import { getElements, countElements, getTickets } from '../api/glpi'

const listeElements = ref([])
const totalElements = ref(0)
const tickets = ref([])
const loading = ref(true)

const recupererElements = async () => {
  const elements = await getElements()
  const elementsAvecCount = await Promise.all(
    elements.map(async (e) => {
      const count = await countElements(e.href)
      return { ...e, count: parseInt(count) }
    })
  )
  listeElements.value = elementsAvecCount
  totalElements.value = elementsAvecCount.reduce((sum, e) => sum + e.count, 0)
}

const listeTicket = async () => {
  try {
    const ListeTicket = await getTickets()
    tickets.value = ListeTicket.filter(t => t.is_deleted === false)
  } catch (error) {
    console.error(error)
  }
}

const ticketsParStatus = computed(() => {
  const groupes = {}
  tickets.value.forEach(t => {
    const label = t.status.name
    groupes[label] = (groupes[label] || 0) + 1
  })
  return Object.entries(groupes).map(([status, count]) => ({ status, count }))
})

const ticketsParType = computed(() => {
  const typeLabels = { 1: 'Incident', 2: 'Demande' }
  const groupes = {}
  tickets.value.forEach(t => {
    const label = typeLabels[t.type] || `Type ${t.type}`
    groupes[label] = (groupes[label] || 0) + 1
  })
  return Object.entries(groupes).map(([type, count]) => ({ type, count }))
})

const typeIcons = {
  Computer: '🖥️', Monitor: '🖵', Printer: '🖨️',
  Phone: '📱', NetworkEquipment: '🔌', Peripheral: '🖱️',
  SoftwareLicense: '📄', Certificate: '🔐', Appliance: '📦', 
  Unmanaged: '❓', Enclosure: '🗄️', PDU: '⚡', 
  PassiveDCEquipment: '🔧', Cable: '🔗', Socket: '🔌',
  Rack: '🗃️', Software: '💿',
  Supplier: '🏭', Contact: '👤', Contract: '📋',
  Document: '📄', Budget: '💰'
}

onMounted(async () => {
  await Promise.all([recupererElements(), listeTicket()])
  loading.value = false
})
</script>

<template>
  <div class="dashboard">
    <div class="page-header">
      <h1>Tableau de bord</h1>
      <p class="subtitle">Vue d'ensemble du parc informatique</p>
    </div>

    <div v-if="loading" class="loading">Chargement...</div>

    <div v-else>
      <!-- KPI Cards -->
      <div class="kpi-row">
        <div class="kpi-card">
          <div class="kpi-icon">🖥️</div>
          <div class="kpi-info">
            <span class="kpi-value">{{ totalElements }}</span>
            <span class="kpi-label">Éléments total</span>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon">🎫</div>
          <div class="kpi-info">
            <span class="kpi-value">{{ tickets.length }}</span>
            <span class="kpi-label">Tickets ouverts</span>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon">📊</div>
          <div class="kpi-info">
            <span class="kpi-value">{{ listeElements.length }}</span>
            <span class="kpi-label">Types d'actifs</span>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon">⚠️</div>
          <div class="kpi-info">
            <span class="kpi-value">{{ ticketsParStatus.find(s => s.status === 'Nouveau')?.count || 0 }}</span>
            <span class="kpi-label">Tickets nouveaux</span>
          </div>
        </div>
      </div>

      <!-- Grille principale -->
      <div class="dashboard-grid">

        <!-- Éléments par type -->
        <div class="card">
          <div class="card-header">
            <h3>🖥️ Parc informatique</h3>
          </div>
          <div class="card-body">
            <div class="asset-list">
              <div v-for="elts in listeElements" :key="elts.href" class="asset-row">
                <div class="asset-name">
                  <span>{{ typeIcons[elts.href.split('/').pop()] || '📦' }}</span>
                  {{ elts.href.split('/').pop() }}
                </div>
                <span class="badge">{{ elts.count }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Tickets par status -->
        <div class="card">
          <div class="card-header">
            <h3>🎫 Tickets par statut</h3>
          </div>
          <div class="card-body">
            <div class="asset-list">
              <div v-for="s in ticketsParStatus" :key="s.status" class="asset-row">
                <span class="asset-name">{{ s.status }}</span>
                <span class="badge badge-blue">{{ s.count }}</span>
              </div>
              <div v-if="ticketsParStatus.length === 0" class="empty">Aucun ticket</div>
            </div>
          </div>
        </div>

        <!-- Tickets par type -->
        <div class="card">
          <div class="card-header">
            <h3>📋 Tickets par type</h3>
          </div>
          <div class="card-body">
            <div class="asset-list">
              <div v-for="t in ticketsParType" :key="t.type" class="asset-row">
                <span class="asset-name">{{ t.type }}</span>
                <span class="badge badge-green">{{ t.count }}</span>
              </div>
              <div v-if="ticketsParType.length === 0" class="empty">Aucun ticket</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard { padding: 0; }

.page-header { margin-bottom: 24px; }
.page-header h1 { font-size: 24px; font-weight: 700; color: #1e2a3a; }
.subtitle { color: #6b7280; font-size: 14px; margin-top: 4px; }

.loading { text-align: center; padding: 40px; color: #6b7280; }

/* KPI */
.kpi-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.kpi-card {
  background: #fff;
  border-radius: 10px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  border: 1px solid #e5e7eb;
}

.kpi-icon { font-size: 32px; }

.kpi-info {
  display: flex;
  flex-direction: column;
}

.kpi-value {
  font-size: 28px;
  font-weight: 700;
  color: #1e2a3a;
  line-height: 1;
}

.kpi-label {
  font-size: 12px;
  color: #6b7280;
  margin-top: 4px;
}

/* Grid */
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

/* Card */
.card {
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  border: 1px solid #e5e7eb;
  overflow: hidden;
}

.card-header {
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.card-header h3 {
  font-size: 15px;
  font-weight: 600;
  color: #1e2a3a;
}

.card-body { padding: 8px 0; }

/* Asset list */
.asset-list { display: flex; flex-direction: column; }

.asset-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  border-bottom: 1px solid #f9fafb;
  transition: background 0.15s;
}

.asset-row:hover { background: #f9fafb; }
.asset-row:last-child { border-bottom: none; }

.asset-name {
  font-size: 14px;
  color: #374151;
  display: flex;
  align-items: center;
  gap: 8px;
}

.badge {
  background: #f0f4f8;
  color: #1e2a3a;
  font-size: 12px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 12px;
}

.badge-blue { background: #dbeafe; color: #1d4ed8; }
.badge-green { background: #dcfce7; color: #166534; }

.empty { padding: 20px; text-align: center; color: #9ca3af; font-size: 14px; }
</style>