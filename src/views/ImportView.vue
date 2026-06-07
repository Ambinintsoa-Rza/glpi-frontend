<script setup>
import JSZip from 'jszip'
import { ref } from 'vue'
import Papa from 'papaparse'
import { creerAsset, newTicket, associerElementTicket, creerCoutTicket, uploadDocumentAsset } from '@/api/glpi'

const message = ref('')
const loading = ref(false)
const logs = ref([])

const STATUS_MAP = {
  'New': 1,
  'Validation': 2,
  'Assigned': 3,
  'Planified' : 4,
  'Pending': 5,
  'Solved' : 6,
  'Closed' : 7
}

const PRIORITY_MAP = {
  'Very Low': 1,
  'Low': 2,
  'Medium': 3,
  'High': 4,
  'Very High': 5,
  'Major' : 6
}

const TYPE_MAP = {
  'Incident': 1,
  'Request': 2,
  'Demande': 2
}

const parseCsv = (file) => {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      delimiter: ';',
      skipEmptyLines: true,
      complete: (result) => resolve(result.data)
    })
  })
}

// Fichiers
const assetsFile = ref(null)
const ticketsFile = ref(null)
const coutsFile = ref(null)

const importer = async () => {
  if (!assetsFile.value || !ticketsFile.value || !coutsFile.value) {
    message.value = 'Veuillez sélectionner les 3 fichiers CSV'
    return
  }

  loading.value = true
  logs.value = []

  try {
    // 1. Parser les CSV
    const assets = await parseCsv(assetsFile.value)
    const tickets = await parseCsv(ticketsFile.value)
    const couts = await parseCsv(coutsFile.value)

    logs.value.push('CSV parsés avec succès')

    // 2. Créer les assets et garder un map nom -> {id, type}
    const assetsMap = {}
    for (const asset of assets) {
      try {
        const created = await creerAsset(asset)
        assetsMap[asset.Name] = { id: created.id, type: asset.Item_Type }
        logs.value.push(`Asset créé : ${asset.Name}`)
      } catch (e) {
        logs.value.push(`Erreur asset ${asset.Name}: ${e.message}`)
      }
    }

    // 3. Créer les tickets
    const ticketsMap = {} // Ref_Ticket -> id
    for (const ticket of tickets) {
      try {
        const created = await newTicket(
          ticket.Titre,
          ticket.Description,
          TYPE_MAP[ticket.Type] || 1,
          STATUS_MAP[ticket.Status] || 1,
          PRIORITY_MAP[ticket.Priority] || 3
        )
        ticketsMap[ticket.Ref_Ticket] = created.id
        logs.value.push(`Ticket créé : ${ticket.Titre}`)

        // 4. Associer les assets au ticket
        const items = JSON.parse(ticket.Items || '[]')
        for (const itemName of items) {
          const asset = assetsMap[itemName]
          if (asset) {
            await associerElementTicket(created.id, asset.type, asset.id)
            logs.value.push(`Asset ${itemName} associé au ticket ${ticket.Ref_Ticket}`)
          }
        }
      } catch (e) {
        logs.value.push(`Erreur ticket ${ticket.Titre}: ${e.message}`)
      }
    }

    // 5. Créer les coûts
    for (const cout of couts) {
      try {
        const ticketId = ticketsMap[cout.Num_Ticket]
        if (ticketId) {
          await creerCoutTicket(ticketId, cout)
          logs.value.push(`Coût ajouté au ticket ${cout.Num_Ticket}`)
        }
      } catch (e) {
        logs.value.push(`Erreur coût ticket ${cout.Num_Ticket}: ${e.message}`)
      }
    }

    message.value = 'Import terminé avec succès !'

  } catch (error) {
    message.value = 'Erreur lors de l\'import'
    console.error(error)
  } finally {
    loading.value = false
  }
}

//upload image 
const zipFile = ref(null)

const convertirEnJpeg = (blob, nomFichier) => {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0)
      canvas.toBlob((jpegBlob) => {
        const nomJpeg = nomFichier.replace(/\.png$/i, '.jpg')
        const file = new File([jpegBlob], nomJpeg, { type: 'image/jpeg' })
        URL.revokeObjectURL(url)
        resolve(file)
      }, 'image/jpeg', 0.9)
    }
    img.src = url
  })
}

const testerUpload = async () => {
  const zip = await JSZip.loadAsync(zipFile.value)
  const fichiers = Object.keys(zip.files).filter(f => !zip.files[f].dir && !f.startsWith('__MACOSX'))
  
  for (const fichier of fichiers) {
    const blob = await zip.files[fichier].async('blob')
    const nomFichier = fichier.split('/').pop()
    const extension = nomFichier.split('.').pop().toLowerCase()
    
    let file
    if (extension === 'png') {
      file = await convertirEnJpeg(blob, nomFichier)
    } else {
      file = new File([blob], nomFichier, { type: 'image/jpeg' })
    }
    
    const assetName = nomFichier.replace(/\.(png|jpg|jpeg)$/i, '')
    
    try {
      const result = await uploadDocumentAsset(assetName, file)
      console.log('Upload:', result)
    } catch (e) {
      console.error('Erreur upload:', e)
    }
  }
}
</script>

<template>
  <div>
    <h2>Import de données</h2>

    <div>
      <p>
        <label>Assets CSV : </label>
        <input type="file" accept=".csv" @change="assetsFile = $event.target.files[0]" />
      </p>
      <p>
        <label>Tickets CSV : </label>
        <input type="file" accept=".csv" @change="ticketsFile = $event.target.files[0]" />
      </p>
      <p>
        <label>Coûts CSV : </label>
        <input type="file" accept=".csv" @change="coutsFile = $event.target.files[0]" />
      </p>
      <p>
        <input type="file" accept=".zip" @change="zipFile = $event.target.files[0]" />
        <button @click="testerUpload">Tester upload image</button>
      </p>
    </div>

    <button @click="importer" :disabled="loading">
      {{ loading ? 'Import en cours...' : 'Importer' }}
    </button>

    <p v-if="message">{{ message }}</p>

    <div v-if="logs.length > 0">
      <h3>Logs :</h3>
      <ul>
        <li v-for="(log, i) in logs" :key="i">{{ log }}</li>
      </ul>
    </div>
  </div>
</template>