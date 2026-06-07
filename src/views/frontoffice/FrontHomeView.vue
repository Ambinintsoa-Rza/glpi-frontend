<script setup>
import { ref, onMounted, computed } from 'vue';
import { getElements, getItems } from '@/api/glpi';
import { login } from '@/api/glpi';

//recuperer les elements
const elements = ref([]);

const listeElements = async() => {
    const elts = await getElements();
    elements.value = elts
}

//filtre multi critere
const typeSelectionne = ref('');
const rechercheNom = ref('');
const rechercheSerial = ref('');
const rechercheEntite = ref('')

const listeItems = ref([]);

const chargerItems = async() => {
    if(!typeSelectionne.value) {
        return;
    }

    const items = await getItems(typeSelectionne.value);
    listeItems.value = items;
}

const itemsFiltres = computed(() => {
    return listeItems.value.filter(item => {

        const matchNom = item.name
            ?.toLowerCase()
            .includes(rechercheNom.value.toLowerCase());

        const matchSerial = item.serial
            ?.toLowerCase()
            .includes(rechercheSerial.value.toLowerCase());

        const matchEntite = item.entity?.name
            ?.toLowerCase()
            .includes(rechercheEntite.value.toLowerCase());

        return matchNom && matchSerial && matchEntite;
    });
});

onMounted(async() => {
    await login("glpi", "glpi"),
    listeElements()
})
</script>

<template>
  <div class="inventory-page">

    <div class="page-header">
      <h1>Inventaire GLPI</h1>
      <p class="subtitle">
        Consultez et recherchez les équipements enregistrés.
      </p>
    </div>

    <div class="card filters-card">
      <div class="card-header">
        <h3>🔍 Recherche d'éléments</h3>
      </div>

      <div class="card-body">

        <div class="form-group">
          <label>Type d'élément</label>
          <select
            v-model="typeSelectionne"
            @change="chargerItems"
          >
            <option value="">-- Choisir un type --</option>
            <option
              v-for="element in elements"
              :key="element.itemtype"
              :value="element.href"
            >
              {{ element.name }}
            </option>
          </select>
        </div>

        <div class="search-grid">
          <input
            v-model="rechercheNom"
            placeholder="🔎 Rechercher par nom"
          />

          <input
            v-model="rechercheSerial"
            placeholder="🔢 Numéro de série"
          />

          <input
            v-model="rechercheEntite"
            placeholder="🏢 Entité"
          />
        </div>

      </div>
    </div>

    <div class="card table-card">

      <div class="card-header">
        <h3>📦 Liste des éléments</h3>
        <span class="count-badge">
          {{ itemsFiltres.length }} résultat(s)
        </span>
      </div>

      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nom</th>
              <th>Numéro de série</th>
              <th>Entité</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="item in itemsFiltres"
              :key="item.id"
            >
              <td>{{ item.id }}</td>
              <td>{{ item.name }}</td>
              <td>{{ item.serial || '-' }}</td>
              <td>{{ item.entity?.name || '-' }}</td>
            </tr>

            <tr v-if="itemsFiltres.length === 0">
              <td colspan="4" class="empty">
                Aucun élément trouvé
              </td>
            </tr>
          </tbody>
        </table>
      </div>

    </div>

    <router-link
      to="/Front/CreateTicket"
      class="create-ticket-btn"
    >
      🎫 Créer un ticket
    </router-link>

  </div>
</template>

<style scoped>
.inventory-page {
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
  margin-bottom: 18px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}

select,
input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
}

select:focus,
input:focus {
  outline: none;
  border-color: #4a9eff;
  box-shadow: 0 0 0 3px rgba(74,158,255,0.15);
}

.search-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
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
  font-size: 14px;
  border-bottom: 1px solid #f3f4f6;
}

tbody tr:hover {
  background: #f9fafb;
}

.empty {
  text-align: center;
  color: #9ca3af;
  padding: 30px;
}

.create-ticket-btn {
  display: inline-block;
  padding: 12px 20px;
  background: #1e2a3a;
  color: white;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 600;
  transition: 0.2s;
}

.create-ticket-btn:hover {
  background: #2d3f54;
}

@media (max-width: 768px) {
  .search-grid {
    grid-template-columns: 1fr;
  }
}
</style>