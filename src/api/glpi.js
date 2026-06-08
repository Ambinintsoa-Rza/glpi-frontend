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
