<template>
  <div class="login">
    <h2>Connexion GLPI</h2>
    <input v-model="username" placeholder="Identifiant" />
    <input v-model="password" type="password" placeholder="Mot de passe" />
    <button @click="handleLogin">Se connecter</button>
    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const username = ref('')
const password = ref('')
const error = ref('')
const router = useRouter()
const authStore = useAuthStore()

const handleLogin = async () => {
  try {
    await authStore.login(username.value, password.value)
    router.push('/home')
  } catch (e) {
    error.value = 'Identifiants incorrects'
  }
}
</script>