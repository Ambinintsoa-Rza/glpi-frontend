<template>
  <div>
    <h2>Import de fichier</h2>
    <input type="file" @change="handleFile" accept=".json,.csv" />
    <button @click="importData" :disabled="!fileData">Importer</button>
    <pre v-if="fileData">{{ fileData }}</pre>
    <p v-if="message">{{ message }}</p>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const fileData = ref(null)
const message = ref('')

const handleFile = (event) => {
  const file = event.target.files[0]
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      fileData.value = JSON.parse(e.target.result)
    } catch {
      fileData.value = e.target.result
    }
  }
  reader.readAsText(file)
}

const importData = async () => {
  message.value = `Fichier importé : ${JSON.stringify(fileData.value).substring(0, 100)}...`
}
</script>