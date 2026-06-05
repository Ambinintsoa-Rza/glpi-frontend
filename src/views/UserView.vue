<script setup>
import { ref, onMounted } from 'vue';
import { getUsers } from '@/api/glpi';

const listClient = ref([]);

const chargerUtilisateurs = async() => {
    const users = await getUsers();
    listClient.value = users;
    console.log(users)
}


onMounted(() => {
    chargerUtilisateurs();
});
</script>

<template>
    Liste des clients :
    <table border="1">
        <thead>
            <tr>
                <th>id</th>
                <th>nom</th>
                <th>actif</th>
            </tr>
        </thead>
        <tbody>
            <tr v-for="users in listClient" :key="users.id">
                <td>{{ users.id }}</td>
                <td>{{ users.username }}</td>
                <td>{{ users.is_active ? 'oui' : 'non' }}</td>
            </tr>
        </tbody>
    </table>
    <router-link to="/ticketCreate">nouveau ticket</router-link>
</template>