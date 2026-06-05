import { defineStore } from 'pinia'
import { login, logout } from '../api/glpi'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('glpi_token') || null,
    isAuthenticated: !!localStorage.getItem('glpi_token')
  }),

  actions: {
    async login(username, password) {
      const data = await login(username, password)
      this.token = data.access_token
      this.isAuthenticated = true
    },

    logout() {
      logout()
      this.token = null
      this.isAuthenticated = false
    }
  }
})