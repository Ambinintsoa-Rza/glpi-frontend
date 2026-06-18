<script setup>
import { ref } from 'vue'
import Papa from 'papaparse'
// import { trouverTicketParRef } from '@/api/import'
// import { getItemsByTicket } from '@/api/glpi'
// import { creerCouts, getDernierCout, supprimerDernierCout } from '@/api/backend'
import { traiterMouvement } from '@/api/coutsService'

const fichier = ref(null)
const loading = ref(false)
const logs = ref([])
const message = ref('')
const messageType = ref('')


const addLog = (text, type = 'info') => logs.value.push({ text, type })

const parseCsv = (file) => new Promise((resolve) => {
  Papa.parse(file, { header: true, delimiter: ';', skipEmptyLines: true, complete: (r) => resolve(r.data) })
})

const importer = async () => {
  if (!fichier.value) {
    message.value = 'Veuillez sélectionner un fichier CSV'
    messageType.value = 'error'
    return
  }

  loading.value = true
  logs.value = []
  message.value = ''

  try {
    const lignes = await parseCsv(fichier.value)
    addLog('CSV parsé avec succès ✓', 'success')

for (const ligne of lignes) {

  const ref = ligne.Ticket || ligne.ticket
  const mouvement = ligne.Mouvement || ligne.mouvement
  const valeurRaw = ligne.Valeur ?? ligne.valeur
  const mode = parseInt(ligne.Mode || ligne.mode)

  try {

    const resultat = await traiterMouvement(
      ref,
      mouvement,
      valeurRaw,
      mode
    )

    addLog(resultat, 'success')

  } catch (e) {

    addLog(
      `Ticket [${ref}] : ${e.message}`,
      'error'
    )

  }
}

    message.value = 'Import terminé !'
    messageType.value = 'success'
  } catch (e) {
    message.value = "Erreur lors de l'import"
    messageType.value = 'error'
    console.error(e)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="import-couts-page">
    <div class="page-header">
      <h1>Import des coûts</h1>
      <p class="subtitle">Importez des mouvements de coûts (réouverture, clôture, annulation) via CSV</p>
    </div>

    <div v-if="message" :class="['alert', messageType === 'success' ? 'alert-success' : 'alert-error']">
      {{ message }}
    </div>

    <div class="card">
      <div class="card-header">
        <h3>📂 Import CSV</h3>
      </div>
      <div class="card-body">
        <p class="help-text">
          Format attendu : <code>Ticket;Mouvement;Valeur</code><br>
          — <strong>close</strong> : valeur = montant du super coût<br>
          — <strong>open</strong> : valeur = pourcentage du dernier super coût<br>
          — <strong>cancel</strong> : valeur vide, annule le dernier super coût
        </p>

        <div class="file-field">
          <div class="file-input-wrapper">
            <input type="file" accept=".csv,.txt" @change="fichier = $event.target.files[0]" id="couts-file" class="file-input" />
            <label for="couts-file" class="file-label">
              {{ fichier ? fichier.name : 'Choisir un fichier CSV' }}
            </label>
          </div>
        </div>

        <button class="btn-primary" @click="importer" :disabled="loading">
          {{ loading ? '⏳ Import en cours...' : '▶ Lancer l\'import' }}
        </button>
      </div>
    </div>

    <!-- Logs -->
    <div v-if="logs.length > 0" class="card logs-card">
      <div class="card-header">
        <h3>📋 Logs d'import</h3>
        <span class="log-count">{{ logs.length }} entrée(s)</span>
      </div>
      <div class="logs-body">
        <div v-for="(log, i) in logs" :key="i" :class="['log-item', `log-${log.type}`]">
          <span class="log-icon">{{ log.type === 'success' ? '✓' : log.type === 'error' ? '✗' : log.type === 'warning' ? '⚠' : '→' }}</span>
          {{ log.text }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.import-couts-page { padding: 0; }

.page-header { margin-bottom: 24px; }
.page-header h1 { font-size: 24px; font-weight: 700; color: #1e2a3a; }
.subtitle { color: #6b7280; font-size: 14px; margin-top: 4px; }

.alert {
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-size: 14px;
  font-weight: 500;
}
.alert-success { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
.alert-error { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }

.card {
  background: #fff;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  overflow: hidden;
  margin-bottom: 16px;
}

.card-header {
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.card-header h3 { font-size: 15px; font-weight: 600; color: #1e2a3a; }

.card-body { padding: 20px; display: flex; flex-direction: column; gap: 16px; }

.help-text { font-size: 13px; color: #6b7280; line-height: 1.6; }
.help-text code { background: #f3f4f6; padding: 2px 6px; border-radius: 4px; }

.file-field { display: flex; flex-direction: column; gap: 6px; }
.file-input { display: none; }
.file-input-wrapper { position: relative; }
.file-label {
  display: block;
  padding: 10px 14px;
  border: 1px dashed #d1d5db;
  border-radius: 8px;
  font-size: 13px;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
  background: #f9fafb;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}
.file-label:hover { border-color: #4a9eff; background: #eff6ff; color: #1d4ed8; }

.btn-primary {
  padding: 10px 20px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  background: #1e2a3a;
  color: #fff;
  width: 100%;
}
.btn-primary:hover:not(:disabled) { background: #2d3f54; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

.log-count { font-size: 12px; color: #6b7280; }

.logs-body { max-height: 300px; overflow-y: auto; padding: 8px 0; }

.log-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 20px;
  font-size: 13px;
  border-bottom: 1px solid #f9fafb;
}

.log-success { color: #166534; background: #f0fdf4; }
.log-error { color: #991b1b; background: #fff5f5; }
.log-info { color: #374151; }
.log-warning { color: #d97706; background: #fef3c7; }
.log-icon { font-weight: 700; width: 14px; text-align: center; }
</style>