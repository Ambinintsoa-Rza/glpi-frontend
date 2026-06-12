<script setup>
import { ref, onMounted } from 'vue'
import { getKanbanConfig, updateKanbanConfig } from '@/api/backend'

const DEFAULTS = [
  { statusId: 'new',      label: 'Nouveau',    couleur: '#dff1e2', couleurHeader: '#5ca96a', labelMalgache: 'Vaovao' },
  { statusId: 'progress', label: 'In Progress', couleur: '#eaf6e8', couleurHeader: '#69b676', labelMalgache: 'Efa manao' },
  { statusId: 'closed',   label: 'Terminé',    couleur: '#cfe8d3', couleurHeader: '#4e8d5b', labelMalgache: 'Vita' },
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
    </div>

    <div v-if="saved" class="alert alert-success">Sauvegardé avec succès !</div>

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
      {{ saving ? 'Sauvegarde...' : 'Sauvegarder' }}
    </button>
  </div>
</template>

<style scoped>
.params-page { padding: 0; }
.page-header { margin-bottom: 24px; }
.page-header h1 { font-size: 24px; font-weight: 700; color: var(--color-text); }

.alert-success {
  background: var(--color-primary-soft); color: var(--color-primary-dark);
  border: 1px solid var(--color-border);
  padding: 12px 16px; border-radius: 8px;
  margin-bottom: 20px; font-size: 14px;
}

.configs-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.card { border-radius: 10px; border: 1px solid var(--color-border); overflow: hidden; background: var(--color-surface); }

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
.form-group label { font-size: 12px; font-weight: 500; color: var(--color-muted); text-transform: uppercase; letter-spacing: 0.4px; }
.form-group input[type="text"] {
  padding: 8px 12px; border: 1px solid var(--color-border);
  border-radius: 8px; font-size: 14px; outline: none;
}
.form-group input[type="text"]:focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(92,169,106,0.14); }

.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

.color-input-wrapper { display: flex; gap: 8px; align-items: center; }

.color-picker {
  width: 40px; height: 36px;
  border: 1px solid var(--color-border); border-radius: 6px;
  padding: 2px; cursor: pointer; background: #fff;
}

.color-text { flex: 1; padding: 8px 10px; border: 1px solid var(--color-border); border-radius: 8px; font-size: 13px; }

.btn-primary {
  background: linear-gradient(180deg, var(--color-primary) 0%, var(--color-primary-dark) 100%); color: #fff;
  border: none; padding: 12px 28px;
  border-radius: 8px; cursor: pointer;
  font-size: 14px; font-weight: 500;
}
.btn-primary:hover:not(:disabled) { filter: brightness(1.02); }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
</style>