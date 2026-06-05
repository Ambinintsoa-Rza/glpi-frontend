import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import HomeView from '../views/HomeView.vue'
import ImportView from '../views/ImportView.vue'
import UserView from '@/views/UserView.vue'
import TicketCreate from '@/views/TicketCreate.vue'

const routes = [
  { path: '/', redirect: '/home' },
  { path: '/login', component: LoginView },
  {
    path: '/home',
    component: HomeView,
    meta: { requiresAuth: true }
  },
  {
    path: '/import',
    component: ImportView,
    meta: { requiresAuth: true }
  },
  //liste client
  {
    path: '/client',
    component: UserView,
    meta: { requiresAuth: true }
  },
  //nouveau ticket
  {
    path: '/ticketCreate',
    component: TicketCreate,
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('glpi_token')
  if (to.meta.requiresAuth && !token) {
    next('/login')
  } else {
    next()
  }
})

export default router