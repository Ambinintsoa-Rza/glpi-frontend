<script setup>
import { ref, onMounted } from 'vue'
import { getKanbanConfig, updateKanbanConfig } from '@/api/backend'

const DEFAULTS = [
  { statusId: 'new',      label: 'Nouveau',    couleur: '#dbeafe', couleurHeader: '#3b82f6', labelMalgache: 'Vaovao' },
  { statusId: 'progress', label: 'In Progress', couleur: '#fef3c7', couleurHeader: '#f59e0b', labelMalgache: 'Efa manao' },
  { statusId: 'closed',   label: 'Terminé',    couleur: '#dcfce7', couleurHeader: '#22c55e', labelMalgache: 'Vita' },
]

const configs = ref(DEFAULTS.map(d => ({ ...d })))
const saving = ref(false)
const saved = ref(false)

onMounted(async () => {
  try {
    const { data } = await getKanbanConfig()
    if (data.length > 0) {
      configs.value = DEFAULTS.map(def => {
        const fromDb = data.find(d => d.statusId === def.statusId)
        return fromDb ? { ...def, ...fromDb } : { ...def }
      })
    }
  } catch (e) {
    console.error(e)
  }
})

const sauvegarder = async () => {
  saving.value = true
  try {
    await Promise.all(
      configs.value.map(c => updateKanbanConfig(c.statusId, c))
    )
    saved.value = true
    setTimeout(() => saved.value = false, 2000)
  } catch (e) {
    console.error(e)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="params-page">
    <div class="page-header">
      <h1>Paramètres Kanban</h1>
      <p class="subtitle">Personnalisez les couleurs et les labels en malgache</p>
    </div>

    <div v-if="saved" class="alert alert-success">✓ Sauvegardé avec succès !</div>

    <div class="configs-grid">
      <div v-for="config in configs" :key="config.statusId" class="card">
        <div class="card-header" :style="{ background: config.couleurHeader }">
          <span class="col-title">{{ config.label }}</span>
          <span class="preview-badge" :style="{ background: config.couleur, color: '#374151' }">
            {{ config.labelMalgache || '...' }}
          </span>
        </div>

        <div class="card-body">
          <div class="form-group">
            <label>Label en malgache</label>
            <input v-model="config.labelMalgache" type="text" :placeholder="config.label" />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Couleur de fond</label>
              <div class="color-input-wrapper">
                <input type="color" v-model="config.couleur" class="color-picker" />
                <input type="text" v-model="config.couleur" class="color-text" />
              </div>
            </div>

            <div class="form-group">
              <label>Couleur header</label>
              <div class="color-input-wrapper">
                <input type="color" v-model="config.couleurHeader" class="color-picker" />
                <input type="text" v-model="config.couleurHeader" class="color-text" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <button class="btn-primary" @click="sauvegarder" :disabled="saving">
      {{ saving ? '⏳ Sauvegarde...' : '💾 Sauvegarder' }}
    </button>
  </div>
</template>

<style scoped>
.params-page { padding: 0; }
.page-header { margin-bottom: 24px; }
.page-header h1 { font-size: 24px; font-weight: 700; color: #1e2a3a; }
.subtitle { color: #6b7280; font-size: 14px; margin-top: 4px; }

.alert-success {
  background: #dcfce7; color: #166534;
  border: 1px solid #bbf7d0;
  padding: 12px 16px; border-radius: 8px;
  margin-bottom: 20px; font-size: 14px;
}

.configs-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.card { border-radius: 10px; border: 1px solid #e5e7eb; overflow: hidden; background: #fff; }

.card-header {
  padding: 14px 18px;
  display: flex; justify-content: space-between; align-items: center;
  color: #fff;
}

.col-title { font-weight: 600; font-size: 15px; }

.preview-badge {
  padding: 3px 10px; border-radius: 12px;
  font-size: 12px; font-weight: 500;
}

.card-body { padding: 16px; display: flex; flex-direction: column; gap: 12px; }

.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group label { font-size: 12px; font-weight: 500; color: #6b7280; text-transform: uppercase; letter-spacing: 0.4px; }
.form-group input[type="text"] {
  padding: 8px 12px; border: 1px solid #d1d5db;
  border-radius: 8px; font-size: 14px; outline: none;
}
.form-group input[type="text"]:focus { border-color: #4a9eff; }

.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

.color-input-wrapper { display: flex; gap: 8px; align-items: center; }

.color-picker {
  width: 40px; height: 36px;
  border: 1px solid #d1d5db; border-radius: 6px;
  padding: 2px; cursor: pointer; background: #fff;
}

.color-text { flex: 1; padding: 8px 10px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 13px; }

.btn-primary {
  background: #1e2a3a; color: #fff;
  border: none; padding: 12px 28px;
  border-radius: 8px; cursor: pointer;
  font-size: 14px; font-weight: 500;
}
.btn-primary:hover:not(:disabled) { background: #2d3f54; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
</style>