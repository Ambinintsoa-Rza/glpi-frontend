import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import HomeView from '../views/HomeView.vue'
import ImportView from '../views/ImportView.vue'
import UserView from '@/views/UserView.vue'
import TicketListView from '@/views/TicketListView.vue'
import FrontHomeView from '@/views/frontoffice/FrontHomeView.vue'
import TicketCreateView from '@/views/frontoffice/TicketCreateView.vue'
import ResetDataView from '@/views/ResetDataView.vue'
import BackView from '@/views/backend/BackView.vue'
import TicketKanbanView from '@/views/frontoffice/TicketKanbanView.vue'

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
  //liste ticket
  {
    path: '/ticketList',
    component: TicketListView,
    meta: { requiresAuth: true }
  },
  //reset data
  {
    path: '/reset-data',
    component: ResetDataView,
    meta : { requiresAuth: true }
  },
  //import data
  {
    path : '/import-data',
    component: ImportView,
    meta : { requiresAuth: true}
  },

  //frontoffice
  {
    path: '/Front/Home',
    component: FrontHomeView
  },
  //creation ticket
  {
    path: '/Front/CreateTicket',
    component: TicketCreateView
  },
  //liste ticket format kanban
  {
    path: '/Front/TicketKanban',
    component: TicketKanbanView
  },

  //backend
  {
    path: '/Back',
    component : BackView
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