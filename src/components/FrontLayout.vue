<script setup>
</script>

<template>
  <div class="front-layout">
    <!-- Sidebar frontoffice -->
    <aside class="front-sidebar">
      <div class="front-logo">
        <span>🎫 Helpdesk</span>
      </div>

      <nav class="front-nav">
        <router-link to="/Front/Home" class="front-nav-item">
          <span>🏠</span> Accueil
        </router-link>
        <router-link to="/Front/CreateTicket" class="front-nav-item">
          <span>➕</span> Nouveau ticket
        </router-link>
      </nav>
    </aside>

    <!-- Contenu -->
    <div class="front-main-wrapper">
      <header class="front-topbar">
        <h1 class="front-title">Portail Helpdesk</h1>
      </header>
      <main class="front-content">
        <slot />
      </main>
    </div>
  </div>
</template>

<style scoped>
* { box-sizing: border-box; margin: 0; padding: 0; }

.front-layout {
  display: flex;
  height: 100vh;
  font-family: 'Segoe UI', sans-serif;
  background: #f4f6f9;
}

.front-sidebar {
  width: 240px;
  background: #2c5f8a;
  color: #fff;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.front-logo {
  padding: 24px 20px;
  font-size: 18px;
  font-weight: 700;
  border-bottom: 1px solid #3a7ab5;
}

.front-nav {
  flex: 1;
  padding: 16px 0;
}

.front-nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  color: #cde4f5;
  text-decoration: none;
  font-size: 14px;
  transition: all 0.2s;
  border-left: 3px solid transparent;
}

.front-nav-item:hover {
  background: #3a7ab5;
  color: #fff;
}

.front-nav-item.router-link-active {
  background: #3a7ab5;
  color: #fff;
  border-left-color: #90cdf4;
}

.front-topbar {
  background: #fff;
  padding: 0 24px;
  height: 60px;
  display: flex;
  align-items: center;
  border-bottom: 1px solid #e0e6ed;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.front-title {
  font-size: 16px;
  font-weight: 600;
  color: #2c5f8a;
}

.front-main-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.front-content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}
</style>