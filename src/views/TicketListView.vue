<script setup>
import { onMounted, ref } from 'vue';
import { getTickets, supprimerTicket } from '@/api/glpi';


//recuperer la liste des tickets
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

// Fiche ticket sélectionné
const ticketSelectionne = ref(null)

const voirFiche = (ticket) => {
  ticketSelectionne.value = ticket
}

const fermerFiche = () => {
  ticketSelectionne.value = null
}

//supprimer ticket
const SupprimerTicket = async(id) => {
    try {
        await supprimerTicket(id);
        await listeTicket();
    } catch (error) {
        console.error(error);
    }
}

onMounted(() => {
    listeTicket();
});

</script>

<template>
    <h2>liste des tickets</h2>
    <table border>
        <thead>
            <tr>
                <th>id</th>
                <th>titre</th>
                <th>description</th>
                <th>action</th>
            </tr>
        </thead>
        <tbody>
            <tr v-for="ticket in tickets" :key="ticket.id">
                <td>{{ ticket.id }}</td>
                <td>{{ ticket.name }}</td>
                <td>{{ ticket.content }}</td>
                <td>
                    <button @click="voirFiche(ticket)">Voir</button>
                    <button @click="SupprimerTicket(ticket.id)">Supprimer</button>
                </td>
            </tr>
        </tbody>
    </table>

    <!-- Fiche ticket -->
    <div v-if="ticketSelectionne" style="border: 1px solid black; padding: 16px; margin-top: 16px;">
        <h3>Fiche Ticket #{{ ticketSelectionne.id }}</h3>
        <table border>
            <tr>
                <th>Titre</th>
                <td>{{ ticketSelectionne.name }}</td>
            </tr>
            <tr>
                <th>Description</th>
                <td>{{ ticketSelectionne.content }}</td>
            </tr>
            <tr>
                <th>Status</th>
                <td>{{ ticketSelectionne.status.name }}</td>
            </tr>
            <tr>
                <th>Type</th>
                <td>{{ ticketSelectionne.type === 1 ? 'Incident' : 'Demande' }}</td>
            </tr>
            <tr>
                <th>Priorité</th>
                <td>{{ ticketSelectionne.priority }}</td>
            </tr>
            <tr>
                <th>Date création</th>
                <td>{{ ticketSelectionne.date_creation }}</td>
            </tr>
            <tr>
                <th>Demandeur</th>
                <td>{{ ticketSelectionne.user_recipient?.name }}</td>
            </tr>
        </table>
        <button @click="fermerFiche">Fermer</button>
    </div>
</template>