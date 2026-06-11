<script setup>
import { onMounted, ref } from 'vue';
import { getTickets, supprimerTicket, getCoutTicket } from '@/api/glpi';

const tickets = ref([]);
const coutsTicket = ref([])
const loadingCouts = ref(false)
const ticketSelectionne = ref(null)
const loading = ref(true)

const prioriteLabels = { 1: 'Très basse', 2: 'Basse', 3: 'Moyenne', 4: 'Haute', 5: 'Très haute', 6: 'Majeure' }
const prioriteColors = { 1: '#6b7280', 2: '#3b82f6', 3: '#f59e0b', 4: '#ef4444', 5: '#7c3aed', 6: '#7c3aed' }

const listeTicket = async () => {
  try {
    const ListeTicket = await getTickets()
    tickets.value = ListeTicket.filter(t => t.is_deleted === false)
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const voirFiche = async (ticket) => {
  ticketSelectionne.value = ticket
  coutsTicket.value = []
  
  if (ticket.costs?.length > 0) {
    loadingCouts.value = true
    try {
      coutsTicket.value = await getCoutTicket(ticket.id)
    } catch (e) {
      console.error(e)
    } finally {
      loadingCouts.value = false
    }
  }
}

const fermerFiche = () => {
  ticketSelectionne.value = null
  coutsTicket.value = []
}

const SupprimerTicket = async (id) => {
  if (!confirm('Confirmer la suppression ?')) return
  try {
    await supprimerTicket(id)
    await listeTicket()
    if (ticketSelectionne.value?.id === id) fermerFiche()
  } catch (error) {
    console.error(error)
  }
}

const formatDate = (date) => date ? new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'

onMounted(() => listeTicket())
</script>

<template>
  <div class="tickets-page">
    <div class="page-header">
      <div>
        <h1>Tickets</h1>
        <p class="subtitle">{{ tickets.length }} ticket(s) actif(s)</p>
      </div>
      <router-link to="/Front/CreateTicket" class="btn-primary">➕ Nouveau ticket</router-link>
    </div>

    <div class="content-layout" :class="{ 'with-fiche': ticketSelectionne }">

      <!-- Liste tickets -->
      <div class="card">
        <div v-if="loading" class="empty">Chargement...</div>
        <div v-else-if="tickets.length === 0" class="empty">Aucun ticket</div>
        <table v-else class="ticket-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Titre</th>
              <th>Statut</th>
              <th>Type</th>
              <th>Priorité</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="ticket in tickets" :key="ticket.id"
              :class="{ active: ticketSelectionne?.id === ticket.id }"
              @click="voirFiche(ticket)">
              <td class="id-cell">#{{ ticket.id }}</td>
              <td class="title-cell">{{ ticket.name }}</td>
              <td><span class="status-badge">{{ ticket.status.name }}</span></td>
              <td>{{ ticket.type === 1 ? 'Incident' : 'Demande' }}</td>
              <td>
                <span class="priority-dot" :style="{ background: prioriteColors[ticket.priority] }"></span>
                {{ prioriteLabels[ticket.priority] }}
              </td>
              <td class="date-cell">{{ formatDate(ticket.date_creation) }}</td>
              <td @click.stop>
                <button class="btn-icon btn-danger" @click="SupprimerTicket(ticket.id)" title="Supprimer">🗑️</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Fiche ticket -->
      <div v-if="ticketSelectionne" class="fiche-card">
        <div class="fiche-header">
          <h3>Ticket #{{ ticketSelectionne.id }}</h3>
          <button class="btn-close" @click="fermerFiche">✕</button>
        </div>
        <div class="fiche-body">
          <div class="fiche-title">{{ ticketSelectionne.name }}</div>
          <div class="fiche-content">{{ ticketSelectionne.content }}</div>

          <div class="fiche-grid">
            <div class="fiche-item">
              <span class="fiche-label">Statut</span>
              <span class="status-badge">{{ ticketSelectionne.status.name }}</span>
            </div>
            <div class="fiche-item">
              <span class="fiche-label">Type</span>
              <span>{{ ticketSelectionne.type === 1 ? 'Incident' : 'Demande' }}</span>
            </div>
            <div class="fiche-item">
              <span class="fiche-label">Priorité</span>
              <span>{{ prioriteLabels[ticketSelectionne.priority] }}</span> 
            </div>
            <div class="fiche-item">
              <span class="fiche-label">Demandeur</span>
              <span>{{ ticketSelectionne.team.filter(t => t.role === 'requester').map(t => t.display_name).join(', ') || '-' }}</span>
            </div>

            <div class="fiche-item">
              <span class="fiche-label">Assigné à</span>
              <span>{{ ticketSelectionne.team.filter(t => t.role === 'assigned').map(t => t.display_name).join(', ') || '-' }}</span>
            </div>
            <div class="fiche-item full">
              <span class="fiche-label">Date création</span>
              <span>{{ formatDate(ticketSelectionne.date_creation) }}</span>
            </div>
            <!-- Coûts -->
          <div class="fiche-section">
            <span class="fiche-label">Coûts</span>
            <div v-if="loadingCouts" class="couts-empty">Chargement...</div>
            <div v-else-if="coutsTicket.length === 0" class="couts-empty">Aucun coût</div>
            <div v-else class="couts-list">
              <div v-for="cout in coutsTicket" :key="cout.id" class="cout-row">
                <div class="cout-details">
                  <p><span v-if="cout.cost_time">🕐 Temps : {{ cout.cost_time }} €</span></p>
                  <span v-if="cout.cost_fixed">📌 Fixe : {{ cout.cost_fixed }} €</span>
                </div>
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tickets-page { padding: 0; }

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-header h1 { font-size: 24px; font-weight: 700; color: #1e2a3a; }
.subtitle { color: #6b7280; font-size: 14px; margin-top: 4px; }

.btn-primary {
  background: #1e2a3a;
  color: #fff;
  padding: 10px 18px;
  border-radius: 8px;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: background 0.2s;
}
.btn-primary:hover { background: #2d3f54; }

/* Layout */
.content-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  transition: all 0.3s;
}
.content-layout.with-fiche {
  grid-template-columns: 1fr 360px;
}

/* Card */
.card {
  background: #fff;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  overflow: hidden;
}

.empty { padding: 40px; text-align: center; color: #9ca3af; }

/* Table */
.ticket-table {
  width: 100%;
  border-collapse: collapse;
}

.ticket-table th {
  text-align: left;
  padding: 12px 16px;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #6b7280;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

.ticket-table td {
  padding: 12px 16px;
  font-size: 14px;
  color: #374151;
  border-bottom: 1px solid #f3f4f6;
}

.ticket-table tr:hover td { background: #f9fafb; cursor: pointer; }
.ticket-table tr.active td { background: #eff6ff; }

.id-cell { color: #9ca3af; font-size: 13px; }
.title-cell { font-weight: 500; color: #1e2a3a; }
.date-cell { font-size: 13px; color: #6b7280; }

/* Badges */
.status-badge {
  background: #dbeafe;
  color: #1d4ed8;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.priority-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 6px;
}

/* Boutons */
.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 16px;
  transition: background 0.2s;
}
.btn-danger:hover { background: #fee2e2; }

/* Fiche */
.fiche-card {
  background: #fff;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  height: fit-content;
  position: sticky;
  top: 0;
}

.fiche-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.fiche-header h3 { font-size: 15px; font-weight: 600; color: #1e2a3a; }

.btn-close {
  background: none;
  border: none;
  cursor: pointer;
  color: #9ca3af;
  font-size: 16px;
  padding: 4px 8px;
  border-radius: 6px;
}
.btn-close:hover { background: #f3f4f6; color: #374151; }

.fiche-body { padding: 20px; }

.fiche-title {
  font-size: 16px;
  font-weight: 600;
  color: #1e2a3a;
  margin-bottom: 8px;
}

.fiche-content {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 20px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 6px;
  line-height: 1.6;
}

.fiche-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.fiche-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.fiche-item.full { grid-column: span 2; }

.fiche-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #9ca3af;
}

.fiche-section { margin-top: 16px; }

.couts-loading, .couts-empty {
  font-size: 13px;
  color: #6b7280;
  margin-top: 6px;
}

.couts-list { display: flex; flex-direction: column; gap: 8px; margin-top: 6px; }

.cout-row {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 10px 14px;
}

.cout-name { font-size: 13px; font-weight: 600; color: #1e2a3a; }

.cout-details {
  display: flex;
  gap: 12px;
  margin-top: 4px;
  flex-wrap: wrap;
}

.cout-details span { font-size: 12px; color: #4b5563; }
</style>