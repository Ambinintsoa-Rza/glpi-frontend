import axios from 'axios'

const backend = axios.create({
  baseURL: 'http://localhost:8090/api',
  headers: {
    'Content-Type': 'application/json'
  }
})

// Assets SQLite
export const getAssetsLocaux = () => backend.get('/assets')
export const creerAssetLocal = (asset) => backend.post('/assets', asset)
export const modifierAssetLocal = (id, asset) => backend.put(`/assets/${id}`, asset)
export const supprimerAssetLocal = (id) => backend.delete(`/assets/${id}`)

// Kanban config
export const getKanbanConfig = () => backend.get('/kanban-config')
export const updateKanbanConfig = (statusId, config) => backend.put(`/kanban-config/${statusId}`, config)

// Super coûts
export const getSuperCouts = (ticketId) => backend.get(`/super-couts/${ticketId}`)
export const creerSuperCout = (data) => backend.post('/super-couts', data)
export const supprimerDernierSuperCout = (ticketId) => backend.delete(`/super-couts/dernier/${ticketId}`)

//reouverture
export const getCoutsReouverture = (ticketId) => backend.get(`/cout-reouverture/${ticketId}`)
export const creerCoutReouverture = (data) => backend.post('/cout-reouverture', data)