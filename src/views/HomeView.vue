<script setup>
import { onMounted, ref, computed } from 'vue'
import { useAuthStore } from '../stores/auth'
import {getElements, countElements, getTickets} from '../api/glpi'

const authStore = useAuthStore()
const message = ref('')

const resetData = async () => {
  if (confirm('Confirmer la réinitialisation ?')) {
    localStorage.removeItem('glpi_token')
    localStorage.removeItem('glpi_refresh_token')
    message.value = 'Données réinitialisées'
  }
}


//recuperer les elements
const listeElements = ref([]);
const totalElements = ref(0)

const recupererElements = async() => {
  const elements= await getElements();
  console.log(elements)
  listeElements.value = elements;

  //recuperer le count pour chaque type
  const elementsAvecCount = await Promise.all(
    elements.map(async (e) => {
      const count = await countElements(e.href)
      return { ...e, count: parseInt(count) }
    })
  )
  listeElements.value = elementsAvecCount
  totalElements.value = elementsAvecCount.reduce((sum, e) => sum + e.count, 0)
}
console.log(listeElements);


//recuperer les tickets
const tickets = ref([]);

const listeTicket = async() => {
    try {
        const ListeTicket = await getTickets();
        console.log(ListeTicket);
        tickets.value = ListeTicket.filter(
            ticket => ticket.is_deleted === false
        );
    } catch (error) {
        console.error(error)
    }
}

// Détail par status
const ticketsParStatus = computed(() => {
  const groupes = {}
  tickets.value.forEach(t => {
    const label = t.status.name  // c'est un objet !
    groupes[label] = (groupes[label] || 0) + 1
  })
  return Object.entries(groupes).map(([status, count]) => ({ status, count }))
})

// Détail par type
const ticketsParType = computed(() => {
  const typeLabels = {
    1: 'Incident',
    2: 'Demande'
  }
  const groupes = {}
  tickets.value.forEach(t => {
    const label = typeLabels[t.type] || `Type ${t.type}`  // c'est un nombre !
    groupes[label] = (groupes[label] || 0) + 1
  })
  return Object.entries(groupes).map(([type, count]) => ({ type, count }))
})

onMounted(() => {
  recupererElements(),
  listeTicket()
})
</script>

<template>
  <div>
    <h2>Tableau de bord</h2>
    <button @click="authStore.logout(); $router.push('/login')">Déconnexion</button>
    <button @click="resetData">Réinitialiser les données</button>
    <router-link to="/import">Importer un fichier</router-link>
    <router-link to="/client">Liste des clients</router-link>
    <p v-if="message">{{ message }}</p>
    <br>
    <h2>elements</h2>
    <p>nombre d'éléments generale : <strong>{{ totalElements }}</strong></p>
    <table border>
      <thead>
        <tr>
          <th>Type</th>
          <th>Nombre</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="elts in listeElements" :key="elts.href">
          <td>{{ elts.href.split('/').pop() }}</td>
          <td>{{ elts.count }}</td>
        </tr>
      </tbody>
    </table>
    <br>
    <h2>ticket</h2>
    <p>nombre de ticket general : <strong>{{ tickets.length }}  </strong></p>
<h4>Détail par status</h4>
<table border>
  <thead>
    <tr>
      <th>Status</th>
      <th>Nombre</th>
    </tr>
  </thead>
  <tbody>
    <tr v-for="s in ticketsParStatus" :key="s.status">
      <td>{{ s.status }}</td>
      <td>{{ s.count }}</td>
    </tr>
  </tbody>
</table>

<h4>Détail par type</h4>
<table border>
  <thead>
    <tr>
      <th>Type</th>
      <th>Nombre</th>
    </tr>
  </thead>
  <tbody>
    <tr v-for="t in ticketsParType" :key="t.type">
      <td>{{ t.type }}</td>
      <td>{{ t.count }}</td>
    </tr>
  </tbody>
</table>
  </div>
</template>

