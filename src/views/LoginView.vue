<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const username = ref('glpi')
const password = ref('glpi')
const error = ref('')

const router = useRouter()
const authStore = useAuthStore()

const handleLogin = async () => {
  error.value = ''

  try {
    await authStore.login(username.value, password.value)
    router.push('/home')
  } catch (e) {
    error.value = 'Identifiants incorrects'
  }
}
</script>
<template>
  <div class="login-page">
    <div class="login-card">

      <div class="login-header">
        <h1>Connexion GLPI</h1>
      </div>

      <div class="form-group">
        <label>Identifiant</label>
        <input
          v-model="username"
          type="text"
          placeholder="Entrez votre identifiant"
        />
      </div>

      <div class="form-group">
        <label>Mot de passe</label>
        <input
          v-model="password"
          type="password"
          placeholder="Entrez votre mot de passe"
          @keyup.enter="handleLogin"
        />
      </div>

      <button
        class="btn-login"
        @click="handleLogin"
      >
        Se connecter
      </button>

      <router-link
        to="/Front/Home"
        class="front-link"
      >
        Accéder au FrontOffice
      </router-link>

      <div
        v-if="error"
        class="alert-error"
      >
        {{ error }}
      </div>

    </div>
  </div>
</template>



<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: transparent;
  padding: 20px;
}

.login-card {
  width: 100%;
  max-width: 420px;
  background: rgba(255, 255, 255, 0.92);
  border-radius: 14px;
  padding: 32px;
  border: 1px solid var(--color-border);
  box-shadow: var(--color-shadow);
}

.login-header {
  text-align: center;
  margin-bottom: 28px;
}

.login-header h1 {
  margin: 0;
  font-size: 24px;
  color: var(--color-text);
  font-weight: 700;
}

.form-group {
  display: flex;
  flex-direction: column;
  margin-bottom: 18px;
}

.form-group label {
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text);
}

.form-group input {
  padding: 12px 14px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.2s;
  background: #fff;
}

.form-group input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(92, 169, 106, 0.14);
}

.btn-login {
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 8px;
  background: linear-gradient(180deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-login:hover {
  filter: brightness(1.02);
}

.front-link {
  display: block;
  text-align: center;
  margin-top: 18px;
  text-decoration: none;
  color: var(--color-primary-dark);
  font-size: 14px;
  font-weight: 500;
}

.front-link:hover {
  text-decoration: underline;
}

.alert-error {
  margin-top: 18px;
  padding: 12px;
  border-radius: 8px;
  background: var(--color-danger-soft);
  color: #8d3232;
  border: 1px solid #e7bcbc;
  text-align: center;
  font-size: 14px;
}
</style>