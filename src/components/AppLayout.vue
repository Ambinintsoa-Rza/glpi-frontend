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
    <aside class="sidebar">
      <div class="sidebar-logo">GLPI App</div>

      <nav class="sidebar-nav">
        <router-link to="/home" class="nav-item">
          Dashboard
        </router-link>

        <router-link to="/ticketList" class="nav-item">
          Tickets
        </router-link>

        <router-link to="/import" class="nav-item">
          Import donnees
        </router-link>
        <router-link to="/reset-data" class="nav-item danger">
          Reinitialiser
        </router-link>
        <router-link to="/Kanban/parametre" class="nav-item">
          Parametres Kanban
        </router-link>
      </nav>

      <div class="sidebar-footer">
        <button @click="logout" class="logout-btn">
          Deconnexion
        </button>
      </div>
    </aside>

    <div class="main-wrapper">
      <header class="topbar">
        <h1 class="page-title">
          <router-link to="/home">GLPI</router-link>
        </h1>
        <div class="topbar-right">
          <span class="user-badge">glpi</span>
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
  min-height: 100vh;
  font-family: 'Segoe UI', sans-serif;
  background: transparent;
  color: var(--color-text);
}

.sidebar {
  width: 240px;
  background: linear-gradient(180deg, #5ca96a 0%, #458554 100%);
  color: #fff;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  box-shadow: inset -1px 0 0 rgba(255, 255, 255, 0.12);
}

.sidebar-logo {
  padding: 24px 20px;
  font-size: 18px;
  font-weight: 700;
  border-bottom: 1px solid rgba(255, 255, 255, 0.14);
  letter-spacing: 0.5px;
}

.sidebar-nav {
  flex: 1;
  padding: 16px 0;
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 10px 20px;
  color: rgba(255, 255, 255, 0.9);
  text-decoration: none;
  font-size: 14px;
  transition: all 0.2s;
  border-left: 3px solid transparent;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
}

.nav-item.router-link-active {
  background: rgba(255, 255, 255, 0.14);
  color: #fff;
  border-left-color: #e9ffe9;
}

.nav-item.danger {
  color: #ffe8e8;
}

.nav-item.danger:hover {
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
}

.sidebar-footer {
  padding: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.14);
}

.logout-btn {
  width: 100%;
  padding: 10px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.18);
  color: #fff;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.logout-btn:hover {
  background: rgba(255, 255, 255, 0.18);
}

.main-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.topbar {
  background: rgba(255, 255, 255, 0.88);
  padding: 0 24px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--color-border);
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  backdrop-filter: blur(8px);
}

.page-title a {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text);
  text-decoration: none;
}

.user-badge {
  background: var(--color-primary-soft);
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 13px;
  color: var(--color-text);
}

.main-content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}
</style>