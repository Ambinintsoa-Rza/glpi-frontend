<script setup>
import { onMounted, ref, computed } from 'vue'
import { getTickets, getCoutTicket, newTicket as creerTicket, getUsers, changerStatutTicket, getElements, associerElementTicket, api } from '@/api/glpi'
import { getKanbanConfig, getSuperCouts, creerSuperCout } from '@/api/backend'

const tickets = ref([])
const loading = ref(true)
const ticketSelectionne = ref(null)
const coutsTicket = ref([])
const loadingCouts = ref(false)

// Nouveau ref
const superCoutMontant = ref('')
const superCoutCommentaire = ref('')
const superCoutsTicket = ref([])

// Dialog création
const showCreateDialog = ref(false)
const createColonne = ref(1)
const nouveauTitre = ref('')
const nouvelleDescription = ref('')
const techniciens = ref([])
const technicienSelectionne = ref('')   

const nouveauType = ref(1)
const nouvellePriorite = ref(3)
const elementsDisponibles = ref([])
const elementsSelectionnes = ref([])

const TYPE_OPTIONS = [
  { value: 1, label: 'Incident' },
  { value: 2, label: 'Demande' }
]

const PRIORITY_OPTIONS = [
  { value: 1, label: 'Très basse' },
  { value: 2, label: 'Basse' },
  { value: 3, label: 'Moyenne' },
  { value: 4, label: 'Haute' },
  { value: 5, label: 'Très haute' }
]

const coutTotal = computed(() => {
  return coutsTicket.value.reduce((total, cout) => {
    const tauxHoraire = parseFloat(cout.cost_time) || 0
    const tempsHeures = (parseFloat(cout.duration) || 0) / 3600
    const coutTemps = tauxHoraire * tempsHeures
    const coutFixe = parseFloat(cout.cost_fixed) || 0
    return total + coutTemps + coutFixe
  }, 0)
})

// Dialog changement statut
const showStatusDialog = ref(false)
const ticketEnDeplacement = ref(null)
const nouveauStatut = ref(null)
const commentaireResolution = ref('')

//const STATUS_ID_MAP = { new: 1, progress: 2, closed: 6 }

const COLONNES = ref([
  { id: 'new',      label: 'Nouveau',    statusId: 1, color: '#dbeafe', headerColor: '#3b82f6', labelMalgache: 'Vaovao' },
  { id: 'progress', label: 'In Progress', statusId: 2, color: '#fef3c7', headerColor: '#f59e0b', labelMalgache: 'Efa manao' },
  { id: 'closed',   label: 'Terminé',    statusId: 6, color: '#dcfce7', headerColor: '#22c55e', labelMalgache: 'Vita' },
])

const ticketsParColonne = (statusId) => tickets.value.filter(t => t.status.id === statusId)

// Drag & drop
const ticketDragged = ref(null)

const onDragStart = (ticket) => {
  ticketDragged.value = ticket
}

const onDrop = (colonne) => {
  if (!ticketDragged.value) return
  if (ticketDragged.value.status.id === colonne.statusId) return

  ticketEnDeplacement.value = ticketDragged.value
  nouveauStatut.value = colonne
  commentaireResolution.value = ''
  superCoutMontant.value = ''
  superCoutCommentaire.value = ''
  showStatusDialog.value = true
  ticketDragged.value = null
}

const onDragOver = (e) => e.preventDefault()

// Changer le statut
const confirmerChangementStatut = async () => {
  try {
    await changerStatutTicket(ticketEnDeplacement.value.id, nouveauStatut.value.statusId, {
      technicienId: technicienSelectionne.value || null,
      solution: commentaireResolution.value || null
    })

    // Enregistrer le super coût si statut "Terminé" et montant renseigné
    if (nouveauStatut.value.statusId === 6 && superCoutMontant.value) {
      await creerSuperCout({
        ticketId: ticketEnDeplacement.value.id,
        montant: parseFloat(superCoutMontant.value),
        commentaire: superCoutCommentaire.value || null
      })
    }

    await listeTicket()
    showStatusDialog.value = false
    technicienSelectionne.value = ''
    superCoutMontant.value = ''
    superCoutCommentaire.value = ''
  } catch(e) {
    console.error(e)
  }
}

// Voir fiche
const voirFiche = async (ticket) => {
  ticketSelectionne.value = ticket
  coutsTicket.value = []
  if (ticket.costs?.length > 0) {
    loadingCouts.value = true
    try {
      coutsTicket.value = await getCoutTicket(ticket.id)
    } catch(e) { console.error(e) }
    finally { loadingCouts.value = false }
  }
}

const fermerFiche = () => {
  ticketSelectionne.value = null
  coutsTicket.value = []
}

// Créer ticket
const ouvrirCreateDialog = (statusId) => {
  createColonne.value = statusId
  nouveauTitre.value = ''
  nouvelleDescription.value = ''
  nouveauType.value = 1
  nouvellePriorite.value = 3
  elementsSelectionnes.value = []
  showCreateDialog.value = true
}

const confirmerCreation = async () => {
  if (!nouveauTitre.value.trim()) return
  try {
    const ticket = await creerTicket(nouveauTitre.value, nouvelleDescription.value, nouveauType.value, createColonne.value, nouvellePriorite.value)
    await Promise.all(
      elementsSelectionnes.value.map(el => associerElementTicket(ticket.id, el.type, el.id))
    )
    await listeTicket()
    showCreateDialog.value = false
  } catch(e) { console.error(e) }
}

const toggleElement = (el) => {
  const idx = elementsSelectionnes.value.findIndex(e => e.id === el.id && e.type === el.type)
  idx === -1 ? elementsSelectionnes.value.push(el) : elementsSelectionnes.value.splice(idx, 1)
}

const estSelectionne = (el) => elementsSelectionnes.value.some(e => e.id === el.id && e.type === el.type)

const listeTicket = async () => {
  try {
    const liste = await getTickets()
    tickets.value = liste.filter(t => t.is_deleted === false)
  } catch(e) { console.error(e) }
  finally { loading.value = false }
}

const formatDate = (date) => date ? new Date(date).toLocaleDateString('fr-FR', {
  day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
}) : '-'

const prioriteLabels = { 1: 'Très basse', 2: 'Basse', 3: 'Moyenne', 4: 'Haute', 5: 'Très haute' }

onMounted(async () => {
  await listeTicket()
  techniciens.value = await getUsers()
  
  try {
    const { data } = await getKanbanConfig()
    if (data.length > 0) {
      COLONNES.value = COLONNES.value.map(col => {
        const fromDb = data.find(d => d.statusId === col.id)
        if (!fromDb) return col
        return {
          ...col,
          color: fromDb.couleur,
          headerColor: fromDb.couleurHeader,
          labelMalgache: fromDb.labelMalgache
        }
      })
    }
  } catch (e) {
    console.error(e)
  }

const types = await getElements()
const resultats = await Promise.all(
  types.map(async (type) => {
    const response = await api.get(`${type.href}?filter=is_deleted==false`)
    return response.data.map(el => ({
      id: el.id,
      name: el.name,
      type: type.href.split('/').pop()
    }))
  })
)
elementsDisponibles.value = resultats
  .flat()
  .filter(el => ['Computer', 'Monitor', 'Phone'].includes(el.type))
})
</script>

<template>
  <div class="kanban-page">
    <div class="page-header">
      <h1>Kanban Tickets</h1>
      <p class="subtitle">Glissez les tickets pour changer leur statut</p>
    </div>

    <div v-if="loading" class="loading">Chargement...</div>

    <div v-else class="kanban-layout" :class="{ 'with-fiche': ticketSelectionne }">

      <!-- Colonnes Kanban -->
      <div class="kanban-board">
        <div
          v-for="colonne in COLONNES"
          :key="colonne.id"
          class="kanban-col"
          :style="{ background: colonne.color }"
          @dragover="onDragOver"
          @drop="onDrop(colonne)"
        >
          <!-- Header colonne -->
          <div class="col-header" :style="{ background: colonne.headerColor }">
            <span class="col-title">{{ colonne.labelMalgache || colonne.label }}</span>
            <span class="col-count">{{ ticketsParColonne(colonne.statusId).length }}</span>
          </div>

          <!-- Tickets -->
          <div class="col-body">
            <div
              v-for="ticket in ticketsParColonne(colonne.statusId)"
              :key="ticket.id"
              class="ticket-card"
              draggable="true"
              @dragstart="onDragStart(ticket)"
              @click="voirFiche(ticket)"
            >
              <div class="ticket-name">{{ ticket.name }}</div>
              <div class="ticket-meta">
                <span class="ticket-priority">{{ prioriteLabels[ticket.priority] }}</span>
                <span class="ticket-type">{{ ticket.type === 1 ? 'Incident' : 'Demande' }}</span>
              </div>
            </div>

            <!-- Ajouter ticket -->
            <button v-if="colonne.id==='new'" class="add-ticket-btn" @click="ouvrirCreateDialog(colonne.statusId)">
              + Ajouter 1 ticket
            </button>
          </div>
        </div>
      </div>

      <!-- Fiche détail -->
      <div v-if="ticketSelectionne" class="fiche-panel">
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
              <span class="fiche-label">Date d'ouverture</span>
              <span>{{ formatDate(ticketSelectionne.date) }}</span>
            </div>
          </div>

          <!-- Coûts -->
          <div v-if="coutsTicket.length > 0" class="fiche-couts">
            <h4>Coûts</h4>
            <div v-for="(cout, i) in coutsTicket" :key="i" class="cout-row">
              <span v-if="cout.cost_time">⏱ {{ ((parseFloat(cout.cost_time) || 0) * (parseFloat(cout.duration) || 0) / 3600).toFixed(2) }}€</span>
              <span v-if="cout.cost_fixed">📌 {{ cout.cost_fixed }}€</span>
            </div>
            <div class="cout-total">💰 Total : <strong>{{ coutTotal.toFixed(2) }} €</strong></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Dialog création ticket -->
    <div v-if="showCreateDialog" class="dialog-overlay" @click.self="showCreateDialog = false">
      <div class="dialog">
        <div class="dialog-header">
          <h3>Nouveau ticket</h3>
          <button class="btn-close" @click="showCreateDialog = false">✕</button>
        </div>
        <div class="dialog-body">
          <div class="form-group">
            <label>Titre *</label>
            <input v-model="nouveauTitre" type="text" placeholder="Titre du ticket" />
          </div>
          <div class="form-group">
            <label>Description</label>
            <textarea v-model="nouvelleDescription" rows="3" placeholder="Description..." />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Type</label>
              <select v-model="nouveauType">
                <option v-for="opt in TYPE_OPTIONS" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
              </select>
            </div>
            <div class="form-group">
              <label>Priorité</label>
              <select v-model="nouvellePriorite">
                <option v-for="opt in PRIORITY_OPTIONS" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
              </select>
            </div>
          </div>

          <!-- Éléments associés -->
          <div class="form-group">
            <label>Équipements associés <span class="count-badge">{{ elementsSelectionnes.length }}</span></label>
            <div class="elements-list">
              <label
                v-for="el in elementsDisponibles"
                :key="`${el.type}-${el.id}`"
                class="element-row"
              >
                <input type="checkbox" :checked="estSelectionne(el)" @change="toggleElement(el)" />
                <span class="type-badge">{{ el.type }}</span>
                <span>{{ el.name }}</span>
              </label>
            </div>
          </div>
        </div>
        <div class="dialog-footer">
          <button class="btn-secondary" @click="showCreateDialog = false">Annuler</button>
          <button class="btn-primary" @click="confirmerCreation">Créer</button>
        </div>
      </div>
    </div>

<!-- Dialog changement statut -->
<div v-if="showStatusDialog" class="dialog-overlay" @click.self="showStatusDialog = false">
  <div class="dialog">
    <div class="dialog-header">
      <h3>Changer le statut</h3>
      <button class="btn-close" @click="showStatusDialog = false">✕</button>
    </div>
    <div class="dialog-body">
      <p>Déplacer <strong>{{ ticketEnDeplacement?.name }}</strong> vers <strong>{{ nouveauStatut?.label }}</strong> ?</p>

      <!-- Champ technicien si on passe à "In progress" -->
      <div v-if="nouveauStatut?.statusId === 2" class="form-group" style="margin-top: 16px">
        <label>Assigner à un technicien</label>
        <select v-model="technicienSelectionne">
          <option value="">-- Choisir un technicien --</option>
          <option v-for="user in techniciens" :key="user.id" :value="user.id">
            {{ user.realname || user.name || user.username }} {{ user.firstname || '' }}
          </option>
        </select>
      </div>

      <!-- Champ commentaire si on passe à "Terminé" -->
      <div v-if="nouveauStatut?.statusId === 6" class="form-group" style="margin-top: 16px">
        <label>Solution / Commentaire de résolution</label>
        <textarea v-model="commentaireResolution" rows="3" placeholder="Décrivez la solution apportée..." />
      </div>

<!-- Super coût si on passe à "Terminé" -->
<div v-if="nouveauStatut?.statusId === 6" class="form-group" style="margin-top: 16px">
  <label>💎 Super coût (optionnel)</label>
  <input v-model="superCoutMontant" type="number" step="0.01" placeholder="Montant en €" />
  <input v-model="superCoutCommentaire" type="text" placeholder="Commentaire (optionnel)" style="margin-top: 8px" />
</div>
    </div>
    <div class="dialog-footer">
      <button class="btn-secondary" @click="showStatusDialog = false">Annuler</button>
      <button class="btn-primary" @click="confirmerChangementStatut">Confirmer</button>
    </div>
  </div>
</div>

  </div>
</template>

<style scoped>
.cout-total {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #e5e7eb;
  font-size: 14px;
  font-weight: 600;
  color: #1e2a3a;
}

.kanban-page { padding: 0; }

.page-header { margin-bottom: 24px; }
.page-header h1 { font-size: 24px; font-weight: 700; color: #1e2a3a; }
.subtitle { color: #6b7280; font-size: 14px; margin-top: 4px; }

.loading { text-align: center; padding: 40px; color: #6b7280; }

/* Layout */
.kanban-layout {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.kanban-board {
  display: flex;
  gap: 16px;
  flex: 1;
  overflow-x: auto;
}

.kanban-layout.with-fiche .kanban-board {
  flex: 1;
}

/* Colonne */
.kanban-col {
  min-width: 260px;
  flex: 1;
  border-radius: 12px;
  overflow: hidden;
  min-height: 400px;
  display: flex;
  flex-direction: column;
}

.col-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  color: #fff;
}

.col-title { font-weight: 600; font-size: 15px; }

.col-count {
  background: rgba(255,255,255,0.3);
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
}

.col-body {
  padding: 12px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* Ticket card */
.ticket-card {
  background: #fff;
  border-radius: 8px;
  padding: 12px;
  cursor: grab;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
  border: 1px solid #e5e7eb;
  transition: box-shadow 0.2s, transform 0.1s;
}

.ticket-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.12);
  transform: translateY(-1px);
}

.ticket-card:active { cursor: grabbing; }

.ticket-name {
  font-size: 14px;
  font-weight: 500;
  color: #1e2a3a;
  margin-bottom: 8px;
}

.ticket-meta {
  display: flex;
  gap: 6px;
}

.ticket-priority, .ticket-type {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  background: #f0f4f8;
  color: #4a5568;
}

/* Bouton ajouter */
.add-ticket-btn {
  background: transparent;
  border: 1px dashed rgba(0,0,0,0.2);
  border-radius: 8px;
  padding: 10px;
  width: 100%;
  cursor: pointer;
  color: rgba(0,0,0,0.5);
  font-size: 13px;
  transition: all 0.2s;
  margin-top: 4px;
}

.add-ticket-btn:hover {
  background: rgba(255,255,255,0.5);
  color: rgba(0,0,0,0.7);
}

/* Fiche panel */
.fiche-panel {
  width: 320px;
  flex-shrink: 0;
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

.fiche-body { padding: 20px; }

.fiche-title { font-size: 16px; font-weight: 600; color: #1e2a3a; margin-bottom: 8px; }

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

.fiche-item { display: flex; flex-direction: column; gap: 4px; }
.fiche-item.full { grid-column: span 2; }

.fiche-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #9ca3af;
}

.status-badge {
  background: #dbeafe;
  color: #1d4ed8;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  display: inline-block;
}

.fiche-couts { margin-top: 16px; }
.fiche-couts h4 { font-size: 13px; color: #6b7280; margin-bottom: 8px; }
.cout-row { display: flex; gap: 12px; font-size: 13px; color: #374151; }

/* Dialogs */
.dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.dialog {
  background: #fff;
  border-radius: 12px;
  width: 440px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.15);
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #f0f0f0;
}

.dialog-header h3 { font-size: 16px; font-weight: 600; color: #1e2a3a; }

.dialog-body { padding: 20px 24px; }

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px 24px;
  border-top: 1px solid #f0f0f0;
}

.form-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px; }
.form-group label { font-size: 13px; font-weight: 500; color: #374151; }
.form-group input, .form-group textarea {
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}
.form-group input:focus, .form-group textarea:focus { border-color: #4a9eff; }

.btn-primary {
  background: #1e2a3a;
  color: #fff;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
}
.btn-primary:hover { background: #2d3f54; }

.btn-secondary {
  background: #f0f4f8;
  color: #374151;
  border: 1px solid #e5e7eb;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
}
.btn-secondary:hover { background: #e5e7eb; }

.btn-close {
  background: none;
  border: none;
  cursor: pointer;
  color: #9ca3af;
  font-size: 16px;
  padding: 4px 8px;
  border-radius: 6px;
}
.btn-close:hover { background: #f3f4f6; }

.form-group select {
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  background: #fff;
  cursor: pointer;
}
.form-group select:focus { border-color: #4a9eff; }

.elements-list {
  max-height: 160px;
  overflow-y: auto;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.element-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 6px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
}

.element-row:hover {
  background: #f1f5f9;
}
</style>