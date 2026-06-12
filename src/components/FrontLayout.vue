<script setup>
</script>

<template>
  <div class="front-layout">
    <aside class="front-sidebar">
      <div class="front-logo">Helpdesk</div>

      <nav class="front-nav">
        <router-link to="/Front/Home" class="front-nav-item">
          Accueil
        </router-link>
        <router-link to="/Front/CreateTicket" class="front-nav-item">
          Nouveau ticket
        </router-link>
        <router-link to="/Front/TicketKanban" class="front-nav-item">
          Tickets
        </router-link>
        <router-link to="/Detail" class="front-nav-item">
        <span>🎫</span>Details
        </router-link>
      </nav>
    </aside>

    <div class="front-main-wrapper">
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
  min-height: 100vh;
  font-family: 'Segoe UI', sans-serif;
  background: transparent;
  color: var(--color-text);
}

.front-sidebar {
  width: 240px;
  background: linear-gradient(180deg, #6cba78 0%, #4e8d5b 100%);
  color: #fff;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  box-shadow: inset -1px 0 0 rgba(255, 255, 255, 0.12);
}

.front-logo {
  padding: 24px 20px;
  font-size: 18px;
  font-weight: 700;
  border-bottom: 1px solid rgba(255, 255, 255, 0.14);
}

.front-nav {
  flex: 1;
  padding: 16px 0;
}

.front-nav-item {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  color: rgba(255, 255, 255, 0.9);
  text-decoration: none;
  font-size: 14px;
  transition: all 0.2s;
  border-left: 3px solid transparent;
}

.front-nav-item:hover {
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
}

.front-nav-item.router-link-active {
  background: rgba(255, 255, 255, 0.14);
  color: #fff;
  border-left-color: #e9ffe9;
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