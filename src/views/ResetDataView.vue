<script setup>
import { reinitialiserDonnees } from '@/api/glpi'
import { ref } from 'vue'

const message = ref('')
const loading = ref(false)

const reinitialiser = async () => {
  if (!confirm('Confirmer la réinitialisation ? Cette action est irréversible !')) return
  
  loading.value = true
  try {
    await reinitialiserDonnees()
    message.value = 'Données réinitialisées avec succès !'
  } catch (error) {
    message.value = 'Erreur lors de la réinitialisation'
    console.error(error)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div>
    <h2>Réinitialisation des données</h2>
    <p>Cette action supprimera tous les tickets et éléments créés.</p>
    <button @click="reinitialiser" :disabled="loading">
      {{ loading ? 'En cours...' : 'Réinitialiser' }}
    </button>
    <p v-if="message">{{ message }}</p>
    <p><router-link to="/import-data">Importer des donnees</router-link></p>
  </div>
</template>