<script setup>
import { reinitialiserDonnees } from '@/api/reset'
import { ref } from 'vue'

const message = ref('')
const loading = ref(false)

const logs = ref([])
const addLog = (text, type = 'info') => logs.value.push({ text, type })

const reinitialiser = async () => {
  if (!confirm('Confirmer la réinitialisation ? Cette action est irréversible !')) return

  loading.value = true
  logs.value = []
  message.value = ''

  try {
    await reinitialiserDonnees(addLog)
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
  <div class="reset-page">

    <div class="page-header">
      <h1>Réinitialisation des données</h1>
    </div>

    <!-- Message -->
    <div
      v-if="message"
      :class="[
        'alert',
        message.includes('succès')
          ? 'alert-success'
          : 'alert-error'
      ]"
    >
      {{ message }}
    </div>

    <div class="card danger-card">
      <div class="card-header">
        <h3>Zone sensible</h3>
      </div>

      <div class="card-body">
        <div class="warning-box">
          <h4>Attention</h4>
          <p>
            Cette action supprimera définitivement :
          </p>

          <ul>
            <li>Tous les tickets créés</li>
            <li>Tous les coûts associés</li>
            <li>Toutes les relations tickets/assets</li>
          </ul>

          <p class="warning-text">
            Cette opération est irréversible.
          </p>
        </div>

        <button
          class="btn-danger"
          @click="reinitialiser"
          :disabled="loading"
        >
          {{ loading ? 'Réinitialisation...' : 'Réinitialiser les données' }}
        </button>
      <div v-if="logs.length > 0" class="logs-body">
        <div v-for="(log, i) in logs" :key="i" :class="['log-item', `log-${log.type}`]">
          {{ log.text }}
        </div>
      </div>

        <router-link
          to="/import-data"
          class="back-link"
        >
          Retour à l'importation
        </router-link>
      </div>
    </div>

  </div>
</template>

<style scoped>
.reset-page {
  padding: 0;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h1 {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-text);
}

/* Alertes */
.alert {
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-size: 14px;
  font-weight: 500;
}

.alert-success {
  background: #dcfce7;
  color: #166534;
  border: 1px solid #bbf7d0;
}

.alert-error {
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

/* Carte */
.card {
  background: var(--color-surface);
  border-radius: 10px;
  border: 1px solid var(--color-border);
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  overflow: hidden;
}

.danger-card {
  max-width: 700px;
}

.card-header {
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.card-header h3 {
  font-size: 15px;
  font-weight: 600;
  color: #991b1b;
}

.card-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Zone d'avertissement */
.warning-box {
  background: #fff5f5;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 16px;
}

.warning-box h4 {
  color: #991b1b;
  margin-bottom: 10px;
  font-size: 15px;
}

.warning-box p,
.warning-box li {
  color: #7f1d1d;
  font-size: 14px;
}

.warning-box ul {
  margin: 10px 0;
  padding-left: 20px;
}

.warning-text {
  font-weight: 600;
  margin-top: 10px;
}

/* Bouton danger */
.btn-danger {
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 8px;
  background: #dc2626;
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-danger:hover:not(:disabled) {
  background: #b91c1c;
}

.btn-danger:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Lien retour */
.back-link {
  text-decoration: none;
  color: var(--color-primary-dark);
  font-size: 14px;
  font-weight: 500;
  text-align: center;
}

.back-link:hover {
  text-decoration: underline;
}

.logs-body {
  max-height: 250px;
  overflow-y: auto;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 4px 0;
}
.log-item { display: flex; align-items: center; gap: 10px; padding: 7px 14px; font-size: 13px; border-bottom: 1px solid #f9fafb; }
.log-success { color: #166534; background: #f0fdf4; }
.log-error { color: #991b1b; background: #fff5f5; }
.log-info { color: #374151; }
.log-icon { font-weight: 700; width: 14px; text-align: center; }
</style>