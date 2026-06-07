<script setup>
import { ref, onMounted } from 'vue'
import { getAssetsLocaux } from '@/api/backend'

const assetsLocaux = ref([])

onMounted(async () => {
  const response = await getAssetsLocaux()
  assetsLocaux.value = response.data
})
</script>

<template>
  <div>
    <h2>Assets locaux (SQLite)</h2>
    <ul>
      <li v-for="a in assetsLocaux" :key="a.id">{{ a.name }} - {{ a.type }}</li>
    </ul>
  </div>
</template>