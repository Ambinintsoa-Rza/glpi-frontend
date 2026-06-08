import axios from 'axios'
import { api, initLegacySession } from './glpi'

const LEGACY_URL = 'http://localhost:8081/apirest.php'
const APP_TOKEN = 'GS8GfXrlMOZqTgwRS6BmK644RZmJev2hTi9rGYxp'

const TYPES_SANS_MODELE = ['Cable', 'Socket', 'Appliance', 'Software', 'SoftwareLicense', 'Certificate']

export const getOrCreateDropdown = async (type, name) => {
  if (!name) return null
  
  const sessionToken = await initLegacySession()
  const headers = {
    'Session-Token': sessionToken,
    'App-Token': APP_TOKEN,
    'Content-Type': 'application/json'
  }

  const response = await axios.get(`${LEGACY_URL}/${type}?searchText[name]=${encodeURIComponent(name)}`, { headers })
  if (response.data && Array.isArray(response.data) && response.data.length > 0) {
    return response.data[0].id
  }
  
  const created = await axios.post(`${LEGACY_URL}/${type}`, { input: { name } }, { headers })
  return created.data.id
}

export const creerUser = async (nom) => {
  if (!nom || nom.trim() === '') return null
  
  const sessionToken = await initLegacySession()
  const parts = nom.trim().split(' ')
  const realname = parts[0]
  const firstname = parts.slice(1).join(' ') || realname
  const username = nom.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')

  const check = await axios.get(`${LEGACY_URL}/User?searchText[name]=${username}`, {
    headers: { 'Session-Token': sessionToken, 'App-Token': APP_TOKEN }
  })
  if (check.data && Array.isArray(check.data) && check.data.length > 0) {
    return check.data[0].id
  }

  const response = await axios.post(`${LEGACY_URL}/User`, {
    input: { name: username, realname, firstname, password: 'Password123!', password2: 'Password123!' }
  }, {
    headers: { 'Session-Token': sessionToken, 'App-Token': APP_TOKEN, 'Content-Type': 'application/json' }
  })
  return response.data.id
}

export const creerAsset = async (asset) => {
  const itemType = asset.Item_Type
  const aUnModele = !TYPES_SANS_MODELE.includes(itemType)

  const [status_id, location_id, manufacturer_id, model_id, user_id] = await Promise.all([
    getOrCreateDropdown('State', asset.Status),
    getOrCreateDropdown('Location', asset.Location),
    getOrCreateDropdown('Manufacturer', asset.Manufacturer),
    aUnModele ? getOrCreateDropdown(`${itemType}Model`, asset.Model) : Promise.resolve(null),
    asset.User ? creerUser(asset.User) : Promise.resolve(null),
  ])

  const payload = {
    name: asset.Name,
    otherserial: asset.Inventory_Number,
    status: status_id,
    location: location_id,
    manufacturer: manufacturer_id,
    ...(model_id && { model: model_id }),
    ...(user_id && { user: user_id }),
  }

  const response = await api.post(`/Assets/${itemType}`, payload)
  return { ...response.data, originalName: asset.Name, type: itemType }
}

export const creerCoutTicket = async (ticketId, cout) => {
  const sessionToken = await initLegacySession()
  await axios.post(`${LEGACY_URL}/TicketCost`, {
    input: {
      tickets_id: ticketId,
      actiontime: cout.Duration_second,
      cost_time: parseFloat(cout.Time_Cost.replace(',', '.')),
      cost_fixed: parseFloat(cout.Fixed_Cost)
    }
  }, {
    headers: { 'Session-Token': sessionToken, 'App-Token': APP_TOKEN, 'Content-Type': 'application/json' }
  })
}

export const uploadDocumentAsset = async (assetName, imageFile) => {
  const sessionToken = await initLegacySession()
  const extension = imageFile.name.split('.').pop().toLowerCase()
  const mimeType = extension === 'png' ? 'image/png' : 'image/jpeg'
  const file = new File([imageFile], imageFile.name, { type: mimeType })
  
  const formData = new FormData()
  formData.append('uploadManifest', JSON.stringify({ input: { name: assetName, _filename: [file.name] } }))
  formData.append('filename[0]', file, file.name)

  const response = await axios.post(`${LEGACY_URL}/Document`, formData, {
    headers: { 'Session-Token': sessionToken, 'App-Token': APP_TOKEN }
  })
  return response.data
}