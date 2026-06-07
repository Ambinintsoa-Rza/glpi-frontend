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