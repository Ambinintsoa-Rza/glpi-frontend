<script setup>
import JSZip from 'jszip'
import { ref } from 'vue'
import Papa from 'papaparse'
import { creerAsset, creerCoutTicket, uploadDocumentAsset, trouverTicketParRef } from '@/api/import'
import { newTicket, associerElementTicket, changerStatutFinal } from '@/api/glpi'

const message = ref('')
const messageType = ref('') // success | error
const loading = ref(false)
const loadingImages = ref(false)
const logs = ref([])

const STATUS_MAP = { 'New': 1, 'Validation': 10, 'Assigned': 2,'In progress' : 2, 'In progress(assigned)': 2, 'In progress (assigned)' : 2 ,'In Progress' : 2, 'In Progress(assigned)': 2, 'In Progress (assigned)' : 2, 'Planified': 3, 'Pending': 4, 'Solved': 5, 'Closed': 6 }
const PRIORITY_MAP = { 'Very Low': 1, 'Low': 2, 'Medium': 3, 'High': 4, 'Very High': 5, 'Major': 6, 'Critical' : 6 }
const TYPE_MAP = { 'Incident': 1, 'Request': 2, 'Demande': 2 }

const parseCsv = (file) => new Promise((resolve) => {
  Papa.parse(file, { header: true, delimiter: '', skipEmptyLines: true, complete: (r) => resolve(r.data) })
})

const assetsFile = ref(null)
const ticketsFile = ref(null)
const coutsFile = ref(null)
const zipFile = ref(null)

const addLog = (text, type = 'info') => logs.value.push({ text, type })

const importer = async () => {
  if (!assetsFile.value || !ticketsFile.value || !coutsFile.value) {
    message.value = 'Veuillez sélectionner les 3 fichiers CSV'
    messageType.value = 'error'
    return
  }

  loading.value = true
  logs.value = []
  message.value = ''

  try {
    const assets = await parseCsv(assetsFile.value)
    const tickets = await parseCsv(ticketsFile.value)
    const couts = await parseCsv(coutsFile.value)
    addLog('CSV parsés avec succès ✓', 'success')

    const assetsMap = {}
    for (const asset of assets) {
      try {
        const created = await creerAsset(asset)
        assetsMap[asset.Name] = { id: created.id, type: asset.Item_Type }
        if (created.doublon) {
          addLog(`Asset ignoré (doublon) : ${asset.Name} [${asset.Inventory_Number}]`, 'warning')
        } else {
          addLog(`Asset créé : ${asset.Name}`, 'success')
        }
      } catch (e) {
        addLog(`Erreur asset ${asset.Name}: ${e.message}`, 'error')
      }
    }

    const ticketsMap = {}
    for (const ticket of tickets) {
      try {
        // 🔍 Vérifier doublon
        const existant = await trouverTicketParRef(`[${ticket.Ref_Ticket}]`)
        if (existant) {
          ticketsMap[ticket.Ref_Ticket] = existant.id
          addLog(`Ticket ignoré (doublon) : ${ticket.Ref_Ticket}`, 'warning')
          continue
        }

        const statusFinal = STATUS_MAP[ticket.Status] || 1

        // Toujours créer en "New" pour pouvoir associer les assets sans 400
        const created = await newTicket(`[${ticket.Ref_Ticket}] ${ticket.Titre}`, ticket.Description, TYPE_MAP[ticket.Type] || 1, 1, PRIORITY_MAP[ticket.Priority] || 3)
        ticketsMap[ticket.Ref_Ticket] = created.id
        addLog(`Ticket créé : ${ticket.Titre}`, 'success')

        const items = JSON.parse(ticket.Items || '[]')
        for (const itemName of items) {
          const asset = assetsMap[itemName]
          if (asset) {
            await associerElementTicket(created.id, asset.type, asset.id)
            addLog(`→ Asset ${itemName} associé`, 'info')
          }
        }

        if (statusFinal !== 1) {
          const solution = [5, 6].includes(statusFinal) ? (ticket.Solution || 'Résolu') : null
          await changerStatutFinal(created.id, statusFinal, solution)
        }
      } catch (e) {
        addLog(`Erreur ticket ${ticket.Titre}: ${e.message}`, 'error')
      }
    }

    for (const cout of couts) {
      try {
        const ticketId = ticketsMap[cout.Num_Ticket]
        if (ticketId) {
          await creerCoutTicket(ticketId, cout)
          addLog(`Coût ajouté au ticket ${cout.Num_Ticket}`, 'success')
        }
      } catch (e) {
        addLog(`Erreur coût ticket ${cout.Num_Ticket}: ${e.message}`, 'error')
      }
    }

    message.value = 'Import terminé avec succès !'
    messageType.value = 'success'
  } catch (error) {
    message.value = "Erreur lors de l'import"
    messageType.value = 'error'
    console.error(error)
  } finally {
    loading.value = false
  }
}

const convertirEnJpeg = (blob, nomFichier) => new Promise((resolve) => {
  const url = URL.createObjectURL(blob)
  const img = new Image()
  img.onload = () => {
    const canvas = document.createElement('canvas')
    canvas.width = img.width
    canvas.height = img.height
    canvas.getContext('2d').drawImage(img, 0, 0)
    canvas.toBlob((jpegBlob) => {
      const nomJpeg = nomFichier.replace(/\.png$/i, '.jpg')
      resolve(new File([jpegBlob], nomJpeg, { type: 'image/jpeg' }))
      URL.revokeObjectURL(url)
    }, 'image/jpeg', 0.9)
  }
  img.src = url
})

const importerImages = async () => {
  if (!zipFile.value) {
    message.value = 'Veuillez sélectionner un fichier ZIP'
    messageType.value = 'error'
    return
  }

  loadingImages.value = true
  logs.value = []

  const zip = await JSZip.loadAsync(zipFile.value)
  const fichiers = Object.keys(zip.files).filter(f => !zip.files[f].dir && !f.startsWith('__MACOSX'))

  for (const fichier of fichiers) {
    const blob = await zip.files[fichier].async('blob')
    const nomFichier = fichier.split('/').pop()
    const extension = nomFichier.split('.').pop().toLowerCase()
    const file = extension === 'png' ? await convertirEnJpeg(blob, nomFichier) : new File([blob], nomFichier, { type: 'image/jpeg' })
    const assetName = nomFichier.replace(/\.(png|jpg|jpeg)$/i, '')

    try {
      await uploadDocumentAsset(assetName, file)
      addLog(`Image uploadée : ${assetName}`, 'success')
    } catch (e) {
      addLog(`Erreur image ${assetName}: ${e.message}`, 'error')
    }
  }

  loadingImages.value = false
  message.value = 'Import images terminé !'
  messageType.value = 'success'
}
</script>

<template>
  <div class="import-page">
    <div class="page-header">
      <h1>Import de données</h1>
      <p class="subtitle">Importez vos assets, tickets et images depuis des fichiers CSV/ZIP</p>
    </div>

    <!-- Alert message -->
    <div v-if="message" :class="['alert', messageType === 'success' ? 'alert-success' : 'alert-error']">
      {{ message }}
    </div>

    <div class="import-grid">

      <!-- Import CSV -->
      <div class="card">
        <div class="card-header">
          <h3>📂 Import CSV</h3>
        </div>
        <div class="card-body">
          <div class="file-field">
            <label>Assets</label>
            <div class="file-input-wrapper">
              <input type="file" accept=".csv" @change="assetsFile = $event.target.files[0]" id="assets-file" class="file-input" />
              <label for="assets-file" class="file-label">
                {{ assetsFile ? assetsFile.name : 'Choisir un fichier CSV' }}
              </label>
            </div>
          </div>

          <div class="file-field">
            <label>Tickets</label>
            <div class="file-input-wrapper">
              <input type="file" accept=".csv" @change="ticketsFile = $event.target.files[0]" id="tickets-file" class="file-input" />
              <label for="tickets-file" class="file-label">
                {{ ticketsFile ? ticketsFile.name : 'Choisir un fichier CSV' }}
              </label>
            </div>
          </div>

          <div class="file-field">
            <label>Coûts</label>
            <div class="file-input-wrapper">
              <input type="file" accept=".csv" @change="coutsFile = $event.target.files[0]" id="couts-file" class="file-input" />
              <label for="couts-file" class="file-label">
                {{ coutsFile ? coutsFile.name : 'Choisir un fichier CSV' }}
              </label>
            </div>
          </div>

          <button class="btn-primary" @click="importer" :disabled="loading">
            {{ loading ? '⏳ Import en cours...' : '▶ Lancer l\'import' }}
          </button>
        </div>
      </div>

      <!-- Import Images -->
      <div class="card">
        <div class="card-header">
          <h3>🖼️ Import Images</h3>
        </div>
        <div class="card-body">
          <p class="help-text">Importez un fichier ZIP contenant les images des assets (PNG/JPEG nommés par nom d'asset).</p>

          <div class="file-field">
            <label>Fichier ZIP</label>
            <div class="file-input-wrapper">
              <input type="file" accept=".zip" @change="zipFile = $event.target.files[0]" id="zip-file" class="file-input" />
              <label for="zip-file" class="file-label">
                {{ zipFile ? zipFile.name : 'Choisir un fichier ZIP' }}
              </label>
            </div>
          </div>

          <button class="btn-secondary" @click="importerImages" :disabled="loadingImages">
            {{ loadingImages ? '⏳ Upload en cours...' : '🖼️ Importer les images' }}
          </button>
        </div>
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
.import-page { padding: 0; }

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

.import-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}

.card {
  background: #fff;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  overflow: hidden;
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

.file-field { display: flex; flex-direction: column; gap: 6px; }
.file-field label { font-size: 13px; font-weight: 500; color: #374151; }

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

.help-text { font-size: 13px; color: #6b7280; line-height: 1.6; }

.btn-primary, .btn-secondary {
  padding: 10px 20px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
  width: 100%;
}
.btn-primary { background: #1e2a3a; color: #fff; }
.btn-primary:hover:not(:disabled) { background: #2d3f54; }
.btn-secondary { background: #f0f4f8; color: #1e2a3a; border: 1px solid #e5e7eb; }
.btn-secondary:hover:not(:disabled) { background: #e5e7eb; }
.btn-primary:disabled, .btn-secondary:disabled { opacity: 0.6; cursor: not-allowed; }

/* Logs */
.logs-card { margin-top: 0; }
.log-count { font-size: 12px; color: #6b7280; }

.logs-body {
  max-height: 300px;
  overflow-y: auto;
  padding: 8px 0;
}

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

.log-icon { font-weight: 700; width: 14px; text-align: center; }

.log-warning { color: #d97706; background: #fef3c7; }
</style>