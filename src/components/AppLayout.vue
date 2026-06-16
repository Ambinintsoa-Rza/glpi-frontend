<script setup>
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

const logout = () => {
  authStore.logout()
  router.push('/login')
}
</script>

<template>
  <div class="app-layout">
    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="sidebar-logo">
        <span>🖥️ GLPI App</span>
      </div>

      <nav class="sidebar-nav">
        <p class="nav-section">Tableau de bord</p>
        <router-link to="/home" class="nav-item">
          <span>📊</span> Dashboard
        </router-link>

        <p class="nav-section">Assistance</p>
        <router-link to="/ticketList" class="nav-item">
          <span>🎫</span> Tickets
        </router-link>
        <!-- <router-link to="/Front/CreateTicket" class="nav-item">
          <span>➕</span> Nouveau ticket
        </router-link> -->

        <!-- <p class="nav-section">Parc</p>
        <router-link to="/client" class="nav-item">
          <span>👥</span> Utilisateurs
        </router-link> -->

        <p class="nav-section">Administration</p>
        <router-link to="/import" class="nav-item">
          <span>📂</span> Import données
        </router-link>
        <router-link to="/reset-data" class="nav-item danger">
          <span>🗑️</span> Réinitialiser
        </router-link>
        <router-link to="/Kanban/parametre" class="nav-item">
          <span>⚙️</span>Paramètres Kanban
        </router-link>
        <router-link to="/ImportSQLite" class="nav-item">
          <span>🗄️</span> Import SQLite
        </router-link>
      </nav>

      <div class="sidebar-footer">
        <button @click="logout" class="logout-btn">
          <span>🚪</span> Déconnexion
        </button>
      </div>
    </aside>

    <!-- Contenu principal -->
    <div class="main-wrapper">
      <header class="topbar">
        <h1 class="page-title">
          <router-link to="/home">GLPI Frontend</router-link>
        </h1>
        <div class="topbar-right">
          <span class="user-badge">👤 glpi</span>
        </div>
      </header>

      <main class="main-content">
        <slot />
      </main>
    </div>
  </div>
</template>

<style scoped>
* { box-sizing: border-box; margin: 0; padding: 0; }

.app-layout {
  display: flex;
  height: 100vh;
  font-family: 'Segoe UI', sans-serif;
  background: #f4f6f9;
}

/* Sidebar */
.sidebar {
  width: 240px;
  background: #1e2a3a;
  color: #fff;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.sidebar-logo {
  padding: 24px 20px;
  font-size: 18px;
  font-weight: 700;
  border-bottom: 1px solid #2d3f54;
  letter-spacing: 0.5px;
}

.sidebar-nav {
  flex: 1;
  padding: 16px 0;
  overflow-y: auto;
}

.nav-section {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #6b8097;
  padding: 16px 20px 6px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 20px;
  color: #a8bfd0;
  text-decoration: none;
  font-size: 14px;
  transition: all 0.2s;
  border-left: 3px solid transparent;
}

.nav-item:hover {
  background: #2d3f54;
  color: #fff;
}

.nav-item.router-link-active {
  background: #2d3f54;
  color: #fff;
  border-left-color: #4a9eff;
}

.nav-item.danger {
  color: #e57373;
}

.nav-item.danger:hover {
  background: #3a2020;
  color: #ff6b6b;
}

.sidebar-footer {
  padding: 16px;
  border-top: 1px solid #2d3f54;
}

.logout-btn {
  width: 100%;
  padding: 10px;
  background: transparent;
  border: 1px solid #2d3f54;
  color: #a8bfd0;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
}

.logout-btn:hover {
  background: #2d3f54;
  color: #fff;
}

/* Topbar */
.main-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.topbar {
  background: #fff;
  padding: 0 24px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #e0e6ed;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.page-title a {
  font-size: 16px;
  font-weight: 600;
  color: #1e2a3a;
  text-decoration: none;
}

.user-badge {
  background: #f0f4f8;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 13px;
  color: #4a5568;
}

/* Contenu */
.main-content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}
</style>