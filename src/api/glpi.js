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
export const newTicket = async(titre, description) => {
    const response = await api.post('/Assistance/Ticket', {
        name:titre,
        content:description
    });
    return response.data;
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
  const response = await api.get(`${href}?limit=0`)
  const contentRange = response.headers['content-range']
  if (contentRange) {
    const total = contentRange.split('/')[1]
    return parseInt(total) || 0
  }
  return 0
}

//recuperer avec parametre endpoint
export const getItems = async(href) => {
  const response = await api.get(`${href}`);
  return response.data;
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

export default api