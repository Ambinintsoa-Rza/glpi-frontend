<template>
  <div class="login-page">
    <div class="login-card">

      <div class="login-header">
        <div class="logo-circle">🔐</div>
        <h1>Connexion GLPI</h1>
        <p>Connectez-vous pour accéder à l'application</p>
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
        🌐 Accéder au FrontOffice
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
  error.value = ''

  try {
    await authStore.login(username.value, password.value)
    router.push('/home')
  } catch (e) {
    error.value = 'Identifiants incorrects'
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(
    135deg,
    #f8fafc 0%,
    #eef4ff 100%
  );
  padding: 20px;
}

.login-card {
  width: 100%;
  max-width: 420px;
  background: white;
  border-radius: 16px;
  padding: 32px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
}

.login-header {
  text-align: center;
  margin-bottom: 28px;
}

.logo-circle {
  width: 70px;
  height: 70px;
  margin: 0 auto 16px;
  border-radius: 50%;
  background: #eff6ff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30px;
}

.login-header h1 {
  margin: 0;
  font-size: 24px;
  color: #1e2a3a;
  font-weight: 700;
}

.login-header p {
  margin-top: 8px;
  color: #6b7280;
  font-size: 14px;
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
  color: #374151;
}

.form-group input {
  padding: 12px 14px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.2s;
}

.form-group input:focus {
  outline: none;
  border-color: #4a9eff;
  box-shadow: 0 0 0 3px rgba(74, 158, 255, 0.15);
}

.btn-login {
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 8px;
  background: #1e2a3a;
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-login:hover {
  background: #2d3f54;
}

.front-link {
  display: block;
  text-align: center;
  margin-top: 18px;
  text-decoration: none;
  color: #2563eb;
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
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #fecaca;
  text-align: center;
  font-size: 14px;
}
</style>