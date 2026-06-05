<template>
  <div>
    <h2>Tableau de bord</h2>
    <button @click="authStore.logout(); $router.push('/login')">Déconnexion</button>
    <button @click="resetData">Réinitialiser les données</button>
    <router-link to="/import">Importer un fichier</router-link>
    <router-link to="/client">Liste des clients</router-link>
    <p v-if="message">{{ message }}</p>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import api from '../api/glpi'

const authStore = useAuthStore()
const message = ref('')

const resetData = async () => {
  if (confirm('Confirmer la réinitialisation ?')) {
    localStorage.removeItem('glpi_token')
    localStorage.removeItem('glpi_refresh_token')
    message.value = 'Données réinitialisées'
  }
}
</script>