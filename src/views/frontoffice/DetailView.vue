<script setup>
import { ref, onMounted, computed } from 'vue'
import { getElements, api, getCoutTicket, getTicketsByItem, getItemsCountByTicket } from '@/api/glpi'
import { getSuperCouts, getCoutsReouverture } from '@/api/backend'

const loading = ref(true)
const lignes = ref([])

const calculerCoutTicket = (couts) => {
  return couts.reduce((total, cout) => {
    const tauxHoraire = parseFloat(cout.cost_time) || 0
    const tempsHeures = (parseFloat(cout.duration) || 0) / 3600
    const coutTemps = tauxHoraire * tempsHeures
    const coutFixe = parseFloat(cout.cost_fixed) || 0
    return total + coutTemps + coutFixe
  }, 0)
}

const charger = async () => {
  loading.value = true
  try {
    // 1. Récupérer tous les éléments Computer/Monitor/Phone
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
    const elements = resultats.flat().filter(el => ['Computer', 'Monitor', 'Phone'].includes(el.type))

    // 2. Pour chaque élément, récupérer ses tickets associés et calculer les coûts
    const resultatsFinaux = await Promise.all(
      elements.map(async (el) => {
        let superCoutTotal = 0
        let coutTotal = 0
        let coutReouvertureTotal = 0

        try {
          const itemTickets = await getTicketsByItem(el.type, el.id)

          for (const it of itemTickets) {
            const ticketId = it.tickets_id

            // Nombre total d'éléments associés à ce ticket (pour la division)
            const nbElements = await getItemsCountByTicket(ticketId)
            const diviseur = nbElements > 0 ? nbElements : 1

            // Coûts GLPI (temps + fixe)
            try {
              const couts = await getCoutTicket(ticketId)
              const coutTicket = calculerCoutTicket(couts)
              coutTotal += coutTicket / diviseur
            } catch (e) { /* pas de coûts */ }

            // Super coûts
            try {
              const { data } = await getSuperCouts(ticketId)
              const superCoutTicket = data.reduce((sum, sc) => sum + (parseFloat(sc.montant) || 0), 0)
              superCoutTotal += superCoutTicket / diviseur
            } 
            catch (e) { /* pas de super coûts */ }

            try {
                const { data } = await getCoutsReouverture(ticketId)
                const coutReouvertureTicket = data.reduce((sum, cr) => sum + (parseFloat(cr.montant) || 0), 0)
                coutReouvertureTotal += coutReouvertureTicket / diviseur
            } catch (e) { /* pas de coûts réouverture */ }

          }
        } catch (e) {
          console.error(`Erreur pour ${el.type} ${el.id}:`, e)
        }

        return {
          ...el,
          superCout: superCoutTotal,
          coutTotal: coutTotal,
          coutReouverture : coutReouvertureTotal,
          coutTotalAvecSuper: coutTotal + superCoutTotal + coutReouvertureTotal
        }
      })
    )

    lignes.value = resultatsFinaux
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const groupesParType = computed(() => {
  const parType = {}
  for (const ligne of lignes.value) {
    if (!parType[ligne.type]) {
      parType[ligne.type] = { type: ligne.type, superCout: 0, coutTotal: 0, coutReouverture: 0, coutTotalAvecSuper: 0, nb: 0 }
    }
    parType[ligne.type].superCout += ligne.superCout
    parType[ligne.type].coutTotal += ligne.coutTotal
    parType[ligne.type].coutReouverture += ligne.coutReouverture
    parType[ligne.type].coutTotalAvecSuper += ligne.coutTotalAvecSuper
    parType[ligne.type].nb += 1
  }
  return Object.values(parType)
})

onMounted(charger)
</script>

<template>
  <div class="couts-elements-page">
    <div class="page-header">
      <h1>Coûts par élément</h1>
      <p class="subtitle">Répartition des coûts GLPI et super coûts par équipement</p>
    </div>

    <div v-if="loading" class="loading">Chargement...</div>

    <div v-else class="card">
      <table class="table">
        <thead>
          <tr>
            <th>Élément</th>
            <th>Super coût</th>
            <th>Coût total</th>
            <th>Cout reouverture</th>
            <th>Coût total + super coûts</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="ligne in lignes" :key="`${ligne.type}-${ligne.id}`">
            <td>
              <span class="type-badge">{{ ligne.type }}</span>
              {{ ligne.name }}
            </td>
            <td>{{ ligne.superCout.toFixed(2) }} €</td>
            <td>{{ ligne.coutTotal.toFixed(2) }} €</td>
            <td>{{ ligne.coutReouverture.toFixed(2) }} €</td>
            <td><strong>{{ ligne.coutTotalAvecSuper.toFixed(2) }} €</strong></td>
          </tr>
          <tr v-if="lignes.length === 0">
            <td colspan="4" class="empty">Aucun élément</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Tableau regroupé par type -->
    <div class="card" style="margin-top: 16px">
      <table class="table">
        <thead>
          <tr>
            <th>Type</th>
            <th>Nb éléments</th>
            <th>Super coût</th>
            <th>Coût total</th>
            <th>Cout reouverture</th>
            <th>Coût total + super coûts</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="groupe in groupesParType" :key="groupe.type">
            <td><span class="type-badge">{{ groupe.type }}</span></td>
            <td>{{ groupe.nb }}</td>
            <td>{{ groupe.superCout.toFixed(2) }} €</td>
            <td>{{ groupe.coutTotal.toFixed(2) }} €</td>
            <td>{{ groupe.coutReouverture.toFixed(2) }} €</td>
            <td><strong>{{ groupe.coutTotalAvecSuper.toFixed(2) }} €</strong></td>
          </tr>
        </tbody>
      </table>
    </div>
</template>

<style scoped>
.couts-elements-page { padding: 0; }
.page-header { margin-bottom: 24px; }
.page-header h1 { font-size: 24px; font-weight: 700; color: #1e2a3a; }
.subtitle { color: #6b7280; font-size: 14px; margin-top: 4px; }

.loading, .empty { padding: 40px; text-align: center; color: #6b7280; }

.card {
  background: #fff;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  overflow: hidden;
}

.table { width: 100%; border-collapse: collapse; }
.table th, .table td {
  padding: 12px 16px;
  text-align: left;
  font-size: 14px;
  border-bottom: 1px solid #f0f0f0;
}
.table th { background: #f9fafb; font-weight: 600; color: #374151; }

.type-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 12px;
  font-weight: 500;
  margin-right: 6px;
}
</style>