import axios from 'axios'

const GLPI_URL = 'http://localhost:8081/api.php/v2'
const CLIENT_ID = '8e5643c893eb080174bf7f11817f5ead61942c94a76d0f9fd57b42f19d1ee197'
const CLIENT_SECRET = 'bb456712151222f6921b8ebf53266758ddf17150947cfc584d8a0818602858f6'

const LEGACY_URL = 'http://localhost:8081/apirest.php'
const APP_TOKEN = 'GS8GfXrlMOZqTgwRS6BmK644RZmJev2hTi9rGYxp'

export const api = axios.create({
  baseURL: GLPI_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Intercepteur pour ajouter le token automatiquement
api.interceptors.request.use(config => {
  const token = localStorage.getItem('glpi_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Initialiser session legacy
export const initLegacySession = async () => {
  const response = await axios.get(`${LEGACY_URL}/initSession`, {
    headers: {
      'Authorization': 'Basic Z2xwaTpnbHBp',
      'App-Token': APP_TOKEN
    }
  })
  return response.data.session_token
}

export const login = async (username, password) => {
  const response = await axios.post('http://localhost:8081/api.php/token', {
    grant_type: 'password',
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    username,
    password,
    scope: 'api'
  })
  localStorage.setItem('glpi_token', response.data.access_token)
  localStorage.setItem('glpi_refresh_token', response.data.refresh_token)
  return response.data
}

export const logout = () => {
  localStorage.removeItem('glpi_token')
  localStorage.removeItem('glpi_refresh_token')
}

//recuperer la liste des clients
export const getUsers = async() => {
    const response = await api.get('/Administration/User');
    return response.data
}

//recuperer la liste des tickets
export const getTickets = async() => {
  const response = await api.get('/Assistance/Ticket');
  return response.data
}

//nouveau ticket
export const newTicket = async (titre, description, type = 1, status = 1, priority = 3) => {
  const response = await api.post('/Assistance/Ticket', {
    name: titre,
    content: description,
    type,
    status,
    priority
  })
  return response.data
}

//supprimer ticket
export const supprimerTicket = async(id) => {
  const response = await api.delete(`/Assistance/Ticket/${id}`);
  return response.data; 
}


//recuperer les elements
export const getElements = async() => {
  const response = await api.get('/Assets');
  return response.data;
}

export const countElements = async (href) => {
  const response = await api.get(`${href}?filter=is_deleted==false`)
  const contentRange = response.headers['content-range']
  if (contentRange) {
    const total = contentRange.split('/')[1]
    return parseInt(total) || 0
  }
  return 0
}

//recuperer avec parametre endpoint
export const getItems = async(href) => {
  const response = await api.get(`${href}?filter=is_deleted==false`)
  if (!response.data || response.data.length === 0) return []
  return response.data
}

// Associer un élément à un ticket
export const associerElementTicket = async (ticketId, itemtype, itemId) => {
  const sessionToken = await initLegacySession()
  const response = await axios.post(`${LEGACY_URL}/Item_Ticket`, {
    input: {
      tickets_id: ticketId,
      itemtype: itemtype,
      items_id: itemId
    }
  }, {
    headers: {
      'Session-Token': sessionToken,
      'App-Token': APP_TOKEN,
      'Content-Type': 'application/json'
    }
  })
  return response.data
}


//REINITIALISATION DONNEES
const ENDPOINTS_A_REINITIALISER = [
  // 1. D'abord les tickets/problèmes/changements (ils référencent les éléments)
  '/Assistance/Ticket',
  '/Assistance/Problem',
  '/Assistance/Change',
  
  // 2. Ensuite les éléments du parc
  '/Assets/Computer',
  '/Assets/Monitor',
  '/Assets/Printer',
  '/Assets/Phone',
  '/Assets/Peripheral',
  '/Assets/NetworkEquipment',
  '/Assets/SoftwareLicense',
  '/Assets/Certificate',
  '/Assets/Appliance',
  '/Assets/Unmanaged',

  // 3. Enfin la gestion et les outils
  '/Management/Supplier',
  '/Management/Contact',
  '/Management/Contract',
  '/Management/Document',
  '/Management/Budget',
  '/Tools/Reminder',
  '/Tools/RSSFeed',
]

// Supprimer tous les éléments d'un endpoint
const supprimerTout = async (endpoint) => {
  try {
    const response = await api.get(endpoint)
    const elements = response.data
    if (!elements || elements.length === 0) return
    await Promise.all(
      elements.map(el => api.delete(`${endpoint}/${el.id}`))
    )
  } catch (error) {
    console.warn(`Impossible de réinitialiser ${endpoint}:`, error.message)
    // On continue même si un endpoint échoue
  }
}

// Réinitialisation complète
export const reinitialiserDonnees = async () => {
  for (const endpoint of ENDPOINTS_A_REINITIALISER) {
    await supprimerTout(endpoint)
  }
}

//IMPORT DONNEES
// Créer ou récupérer un dropdown
export const getOrCreateDropdown = async (type, name) => {
  if (!name) return null
  
  // Chercher si existe déjà
  const response = await api.get(`/Dropdowns/${type}?filter=name==${name}`)
  if (response.data && response.data.length > 0) {
    return response.data[0].id
  }
  
  // Créer si n'existe pas
  const created = await api.post(`/Dropdowns/${type}`, { name })
  return created.data.id
}

// Créer un asset
export const creerAsset = async (asset) => {
  const itemType = asset.Item_Type

  const [
    status_id,
    location_id,
    manufacturer_id,
    model_id
  ] = await Promise.all([
    getOrCreateDropdown('State', asset.Status),
    getOrCreateDropdown('Location', asset.Location),
    getOrCreateDropdown('Manufacturer', asset.Manufacturer),
    getOrCreateDropdown(`${itemType}Model`, asset.Model),
  ])

  const payload = {
    name: asset.Name,
    otherserial: asset.Inventory_Number,
    status: status_id,
    location: location_id,
    manufacturer: manufacturer_id,
    model: model_id,
  }

  const response = await api.post(`/Assets/${itemType}`, payload)
  return { ...response.data, originalName: asset.Name, type: itemType }
}

// Créer un coût de ticket (via legacy)
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
    headers: {
      'Session-Token': sessionToken,
      'App-Token': APP_TOKEN,
      'Content-Type': 'application/json'
    }
  })
}

//UPLOAD IMAGE
export const uploadDocumentAsset = async (assetName, imageFile) => {
  const sessionToken = await initLegacySession()
  
  const extension = imageFile.name.split('.').pop().toLowerCase()
  const mimeType = extension === 'png' ? 'image/png' : 
                   extension === 'jpg' || extension === 'jpeg' ? 'image/jpeg' : 
                   'image/png'
  
  const file = new File([imageFile], imageFile.name, { type: mimeType })
  
  const formData = new FormData()
  formData.append('uploadManifest', JSON.stringify({
    input: {
      name: assetName,
      _filename: [file.name]
    }
  }))
  formData.append('filename[0]', file, file.name)

  const response = await axios.post(`${LEGACY_URL}/Document`, formData, {
    headers: {
      'Session-Token': sessionToken,
      'App-Token': APP_TOKEN,
    }
  })
  return response.data
}

export default api