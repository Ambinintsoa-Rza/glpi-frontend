<script setup>
import { newTicket, getElements, api, associerElementTicket } from '@/api/glpi';
import { reactive, ref, onMounted } from 'vue';

const formulaire = reactive({
    titre:'',
    description:''
});

//nouveau ticket
const nouveauTicket = async () => {
  try {
    const ticket = await newTicket(formulaire.titre, formulaire.description)
    
    // Associer les éléments sélectionnés
    await Promise.all(
      elementsSelectionnes.value.map(el => 
        associerElementTicket(ticket.id, el.type, el.id)
      )
    )
    
    console.log('Ticket créé avec éléments associés !')
    
    // Reset formulaire
    formulaire.titre = ''
    formulaire.description = ''
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
            const response = await api.get(type.href)
            return response.data.map(el => ({
                id: el.id,
                name: el.name,
                type: type.href.split('/').pop()
            }))
        })
    )
    elementsDisponibles.value = resultats.flat()
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
    <h2>nouveau ticket</h2>
    <p><input v-model="formulaire.titre" type="text" placeholder="titre"></p>
    <textarea v-model="formulaire.description" placeholder="description"></textarea>
    <p><button @click="nouveauTicket">nouveau ticket</button></p>
    <br>
    <table border>
    <thead>
        <tr>
            <th>Sélectionner</th>
            <th>Type</th>
            <th>Nom</th>
        </tr>
    </thead>
    <tbody>
        <tr v-for="el in elementsDisponibles" :key="`${el.type}-${el.id}`">
            <td>
                <input 
                    type="checkbox"
                    :checked="estSelectionne(el)"
                    @change="toggleElement(el)"
                />
            </td>
            <td>{{ el.type }}</td>
            <td>{{ el.name }}</td>
        </tr>
    </tbody>
</table>

<div v-if="elementsSelectionnes.length > 0">
    <h4>Éléments sélectionnés :</h4>
    <ul>
        <li v-for="el in elementsSelectionnes" :key="`${el.type}-${el.id}`">
            {{ el.type }} - {{ el.name }}
        </li>
    </ul>
</div>
</template>