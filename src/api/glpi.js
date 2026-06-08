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
  const response = await api.get('/Assistance/Ticket?filter=is_deleted==false')
  return response.data
}
export const getCoutTicket = async (ticketId) => {
  const response = await api.get(`/Assistance/Ticket/${ticketId}/Cost`)
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
  const assetsResponse = await api.get('/Assets');
  const assets = assetsResponse.data;

  // Endpoints supplémentaires à afficher
  const supplementaires = [
    { href: '/Assets/PDU', name: 'PDU' },
    { href: '/Assets/Enclosure', name: 'Enclosure' },
    { href: '/Assets/PassiveDCEquipment', name: 'PassiveDCEquipment' },
    { href: '/Assets/Cable', name: 'Cable' },
    { href: '/Assets/Software', name: 'Software' },
    { href: '/Assets/Rack', name: 'Rack' },
  ]

  return [...assets, ...supplementaires]
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
  '/Assets/PDU',
  '/Assets/Enclosure', 
  '/Assets/PassiveDCEquipment', 
  '/Assets/Cable',
  '/Assets/Software',
  '/Assets/Rack',

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
    const response = await api.get(`${endpoint}?filter=is_deleted==false`)
    const elements = response.data
    if (!elements || elements.length === 0) return

    const sessionToken = await initLegacySession()
    const legacyEndpoint = endpoint.split('/').pop() // ex: 'Computer', 'Ticket'

    await Promise.all(
      elements.map(el => 
        axios.delete(`${LEGACY_URL}/${legacyEndpoint}/${el.id}`, {
          headers: {
            'Session-Token': sessionToken,
            'App-Token': APP_TOKEN,
          },
          data: { force_purge: 1 }
        })
      )
    )
  } catch (error) {
    console.warn(`Impossible de réinitialiser ${endpoint}:`, error.message)
  }
}
// Réinitialisation complète
// Users de base GLPI à ne pas supprimer
const USERS_BASE = ['glpi', 'tech', 'normal', 'post-only', 'glpi-system']

export const reinitialiserDonnees = async () => {
  // Supprimer les données métier
  for (const endpoint of ENDPOINTS_A_REINITIALISER) {
    await supprimerTout(endpoint)
  }

  // Supprimer les users créés (pas les users de base)
  try {
    const sessionToken = await initLegacySession()
    const response = await axios.get(`${LEGACY_URL}/User`, {
      headers: { 'Session-Token': sessionToken, 'App-Token': APP_TOKEN }
    })
    
    const usersASupprimer = response.data.filter(u => !USERS_BASE.includes(u.name))
    
    await Promise.all(
      usersASupprimer.map(u =>
        axios.delete(`${LEGACY_URL}/User/${u.id}`, {
          headers: { 'Session-Token': sessionToken, 'App-Token': APP_TOKEN },
          data: { force_purge: 1 }
        })
      )
    )
  } catch(e) {
    console.warn('Erreur suppression users:', e.message)
  }
}

//IMPORT DONNEES
// Créer ou récupérer un dropdown
export const getOrCreateDropdown = async (type, name) => {
  if (!name) return null
  
  const sessionToken = await initLegacySession()
  const headers = {
    'Session-Token': sessionToken,
    'App-Token': APP_TOKEN,
    'Content-Type': 'application/json'
  }

  // Chercher si existe déjà
  const response = await axios.get(`${LEGACY_URL}/${type}?searchText[name]=${encodeURIComponent(name)}`, { headers })
  if (response.data && Array.isArray(response.data) && response.data.length > 0) {
    return response.data[0].id
  }
  
  // Créer si n'existe pas
  const created = await axios.post(`${LEGACY_URL}/${type}`, { input: { name } }, { headers })
  return created.data.id
}

// Créer un utilisateur
export const creerUser = async (nom) => {
  if (!nom || nom.trim() === '') return null
  
  const sessionToken = await initLegacySession()
  
  // Transformer "Rakoto Jean" en name="rakoto_jean", firstname="Jean", realname="Rakoto"
  const parts = nom.trim().split(' ')
  const realname = parts[0]
  const firstname = parts.slice(1).join(' ') || realname
  const username = nom.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')

  // Vérifier si l'utilisateur existe déjà
  const check = await axios.get(`${LEGACY_URL}/User?searchText[name]=${username}`, {
    headers: { 'Session-Token': sessionToken, 'App-Token': APP_TOKEN }
  })
  if (check.data && Array.isArray(check.data) && check.data.length > 0) {
    return check.data[0].id
  }

  // Créer l'utilisateur
  const response = await axios.post(`${LEGACY_URL}/User`, {
    input: {
      name: username,
      realname,
      firstname,
      password: 'Password123!',
      password2: 'Password123!'
    }
  }, {
    headers: {
      'Session-Token': sessionToken,
      'App-Token': APP_TOKEN,
      'Content-Type': 'application/json'
    }
  })
  return response.data.id
}

// Créer un asset
// Types qui n'ont pas de modèle dans GLPI
const TYPES_SANS_MODELE = ['Cable', 'Socket', 'Appliance', 'Software', 'SoftwareLicense', 'Certificate']

export const creerAsset = async (asset) => {
  const itemType = asset.Item_Type
  console.log('Création asset:', itemType, asset.Name)

  try {
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
  } catch(e) {
    console.error('Erreur creerAsset:', itemType, asset.Name, e.response?.data || e.message)
    throw e
  }
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