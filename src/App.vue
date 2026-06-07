<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppLayout from '@/components/AppLayout.vue'
import FrontLayout from '@/components/FrontLayout.vue'

const route = useRoute()

const isBack = computed(() => route.meta.requiresAuth)
const isFront = computed(() => route.path.startsWith('/Front'))
</script>

<template>
  <AppLayout v-if="isBack">
    <router-view />
  </AppLayout>
  <FrontLayout v-else-if="isFront">
    <router-view />
  </FrontLayout>
  <router-view v-else />
</template>