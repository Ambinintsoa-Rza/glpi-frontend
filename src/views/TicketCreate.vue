<script setup>
import { onMounted, reactive, ref } from 'vue';
import { newTicket, getTickets, supprimerTicket } from '@/api/glpi';

const formulaire = reactive({
    titre:'',
    description:''
});

//nouveau ticket
const nouveauTicket = async() => {
     try {
        const ticket = await newTicket(formulaire.titre, formulaire.description);
        await listeTicket();
        console.log(ticket);
     } catch (error) {
        console.error(error);
     }
}

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
    <h2>nouveau ticket</h2>
    <p><input v-model="formulaire.titre" type="text" placeholder="titre"></p>
    <textarea v-model="formulaire.description" placeholder="description"></textarea>
    <p><button @click="nouveauTicket">nouveau ticket</button></p>
    <br>
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
                <td><button @click="SupprimerTicket(ticket.id)">Supprimer</button></td>
            </tr>
        </tbody>
    </table>
</template>