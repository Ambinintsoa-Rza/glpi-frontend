<script setup>
import { newTicket, getElements, api, associerElementTicket } from '@/api/glpi';
import { reactive, ref, onMounted } from 'vue';

const formulaire = reactive({
  titre: '',
  description: '',
  type: 1,
  status: 1,
  priority: 3
})

const TYPE_OPTIONS = [
  { value: 1, label: 'Incident' },
  { value: 2, label: 'Demande' }
]

const STATUS_OPTIONS = [
  { value: 1, label: 'Nouveau' },
  { value: 10, label: 'En attente de validation' },
  { value: 2, label: 'Attribué' },
  { value: 3, label: 'Planifié' },
  { value: 4, label: 'En attente' },
  { value: 5, label: 'Résolu' },
  { value: 6, label: 'Clôturé' }
]

const PRIORITY_OPTIONS = [
  { value: 1, label: 'Très basse' },
  { value: 2, label: 'Basse' },
  { value: 3, label: 'Moyenne' },
  { value: 4, label: 'Haute' },
  { value: 5, label: 'Très haute' },
  { value: 6, label: 'Majeure' }
]

//nouveau ticket
const nouveauTicket = async () => {
  try {
    const ticket = await newTicket(
      formulaire.titre,
      formulaire.description,
      formulaire.type,
      formulaire.status,
      formulaire.priority
    )
    await Promise.all(
      elementsSelectionnes.value.map(el =>
        associerElementTicket(ticket.id, el.type, el.id)
      )
    )
    formulaire.titre = ''
    formulaire.description = ''
    formulaire.type = 1
    formulaire.status = 1
    formulaire.priority = 3
    elementsSelectionnes.value = []
  } catch (error) {
    console.error(error)
  }
}

const elementsDisponibles = ref([])
const elementsSelectionnes = ref([])

const recupererElements = async () => {
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
    elementsDisponibles.value = resultats
    .flat()
    .filter(el => el.type === 'Computer' || el.type === "Monitor" || el.type === "Phone")
    console.log(elementsDisponibles.value)
}

const toggleElement = (element) => {
    const index = elementsSelectionnes.value.findIndex(
        e => e.id === element.id && e.type === element.type
    )
    if (index === -1) {
        elementsSelectionnes.value.push(element)
    } else {
        elementsSelectionnes.value.splice(index, 1)
    }
}

const estSelectionne = (element) => {
    return elementsSelectionnes.value.some(
        e => e.id === element.id && e.type === element.type
    )
}

onMounted(() => {
  recupererElements()
})
</script>

<template>
  <div class="ticket-page">

    <div class="page-header">
      <h1>Création d'un ticket</h1>
      <p class="subtitle">
        Déclarez un incident ou une demande et associez des équipements.
      </p>
    </div>

    <!-- Formulaire -->
    <div class="card">
      <div class="card-header">
        <h3>🎫 Informations du ticket</h3>
      </div>

      <div class="card-body">

        <div class="form-group">
          <label>Titre</label>
          <input
            v-model="formulaire.titre"
            type="text"
            placeholder="Titre du ticket"
          />
        </div>

        <div class="form-group">
          <label>Description</label>
          <textarea
            v-model="formulaire.description"
            rows="5"
            placeholder="Décrivez le problème ou la demande"
          />
        </div>

        <div class="form-row">
  <div class="form-group">
    <label>Type</label>
    <select v-model="formulaire.type">
      <option v-for="opt in TYPE_OPTIONS" :key="opt.value" :value="opt.value">
        {{ opt.label }}
      </option>
    </select>
  </div>

  <div class="form-group">
    <label>Statut</label>
    <select v-model="formulaire.status">
      <option v-for="opt in STATUS_OPTIONS" :key="opt.value" :value="opt.value">
        {{ opt.label }}
      </option>
    </select>
  </div>

  <div class="form-group">
    <label>Priorité</label>
    <select v-model="formulaire.priority">
      <option v-for="opt in PRIORITY_OPTIONS" :key="opt.value" :value="opt.value">
        {{ opt.label }}
      </option>
    </select>
  </div>
</div>

        <button
          class="btn-primary"
          @click="nouveauTicket"
        >
          🎫 Créer le ticket
        </button>

      </div>
    </div>

    <!-- Liste des éléments -->
    <div class="card">
      <div class="card-header">
        <h3>📦 Équipements disponibles</h3>

        <span class="count-badge">
          {{ elementsSelectionnes.length }} sélectionné(s)
        </span>
      </div>

      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Sélection</th>
              <th>Type</th>
              <th>Nom</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="el in elementsDisponibles"
              :key="`${el.type}-${el.id}`"
            >
              <td>
                <input
                  type="checkbox"
                  :checked="estSelectionne(el)"
                  @change="toggleElement(el)"
                />
              </td>

              <td>
                <span class="type-badge">
                  {{ el.type }}
                </span>
              </td>

              <td>{{ el.name }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Résumé -->
    <div
      v-if="elementsSelectionnes.length > 0"
      class="card"
    >
      <div class="card-header">
        <h3>✅ Éléments associés</h3>
      </div>

      <div class="card-body">
        <ul class="selected-list">
          <li
            v-for="el in elementsSelectionnes"
            :key="`${el.type}-${el.id}`"
          >
            <strong>{{ el.type }}</strong>
            — {{ el.name }}
          </li>
        </ul>
      </div>
    </div>

  </div>
</template>

<style scoped>
.ticket-page {
  padding: 0;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h1 {
  font-size: 24px;
  font-weight: 700;
  color: #1e2a3a;
}

.subtitle {
  margin-top: 4px;
  color: #6b7280;
  font-size: 14px;
}

.card {
  background: white;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  overflow: hidden;
  margin-bottom: 20px;
}

.card-header {
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  font-size: 15px;
  font-weight: 600;
  color: #1e2a3a;
}

.card-body {
  padding: 20px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}

input[type="text"],
textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  resize: vertical;
}

input[type="text"]:focus,
textarea:focus {
  outline: none;
  border-color: #4a9eff;
  box-shadow: 0 0 0 3px rgba(74,158,255,0.15);
}

.btn-primary {
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 8px;
  background: #1e2a3a;
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: .2s;
}

.btn-primary:hover {
  background: #2d3f54;
}

.count-badge {
  background: #eff6ff;
  color: #2563eb;
  padding: 5px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
}

.table-wrapper {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead {
  background: #f9fafb;
}

th {
  text-align: left;
  padding: 14px;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
}

td {
  padding: 14px;
  border-bottom: 1px solid #f3f4f6;
  font-size: 14px;
}

tbody tr:hover {
  background: #f9fafb;
}

.type-badge {
  background: #f3f4f6;
  color: #374151;
  padding: 4px 8px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
}

.selected-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.selected-list li {
  padding: 10px 12px;
  border-radius: 8px;
  background: #f8fafc;
  margin-bottom: 8px;
  border: 1px solid #e5e7eb;
}

input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

@media (max-width: 768px) {
  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 16px;
}
</style>