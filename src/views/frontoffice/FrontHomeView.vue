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
    <p>Liste des elements</p>
    <p>Type :
        <select v-model="typeSelectionne" @change="chargerItems">
            <option value="">-- Choisir un type --</option>
            <option v-for="element in elements" :key="element.itemtype" :value="element.href">{{ element.name }}</option>
        </select>
    </p>
    <input v-model="rechercheNom" placeholder="Nom">
    <input v-model="rechercheSerial" placeholder="Numéro de série">
    <input v-model="rechercheEntite" placeholder="Entité">
    <table border>
    <thead>
        <tr>
            <th>ID</th>
            <th>Nom</th>
            <th>Serial</th>
            <th>Entité</th>
        </tr>
    </thead>

    <tbody>
        <tr v-for="item in itemsFiltres" :key="item.id">
            <td>{{ item.id }}</td>
            <td>{{ item.name }}</td>
            <td>{{ item.serial }}</td>
            <td>{{ item.entity?.name }}</td>
        </tr>
    </tbody>
</table>

</template>