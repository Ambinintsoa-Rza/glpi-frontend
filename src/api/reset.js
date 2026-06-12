import axios from 'axios'
import { api, initLegacySession } from './glpi'

const LEGACY_URL = 'http://localhost:8081/apirest.php'
//const APP_TOKEN = 'GS8GfXrlMOZqTgwRS6BmK644RZmJev2hTi9rGYxp'
const APP_TOKEN = 'YYOqmp6AoAatgWk9EdRAEUGyMipVKtNpPn60ZbjT';

const USERS_BASE = ['glpi', 'tech', 'normal', 'post-only', 'glpi-system']

const ENDPOINTS_A_REINITIALISER = [
  '/Assistance/Ticket',
  '/Assistance/Problem',
  '/Assistance/Change',
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
  '/Management/Supplier',
  '/Management/Contact',
  '/Management/Contract',
  '/Management/Document',
  '/Management/Budget',
  '/Tools/Reminder',
  '/Tools/RSSFeed',
]

const supprimerTout = async (endpoint, onLog) => {
  try {
    const response = await api.get(`${endpoint}?filter=is_deleted==false`)
    const elements = response.data
    if (!elements || elements.length === 0) {
      onLog?.(`Rien à supprimer : ${endpoint}`, 'info')
      return
    }

    const sessionToken = await initLegacySession()
    const legacyEndpoint = endpoint.split('/').pop()

    await Promise.all(
      elements.map(el =>
        axios.delete(`${LEGACY_URL}/${legacyEndpoint}/${el.id}`, {
          headers: { 'Session-Token': sessionToken, 'App-Token': APP_TOKEN },
          data: { force_purge: 1 }
        })
      )
    )
    onLog?.(`✓ ${elements.length} élément(s) supprimé(s) : ${legacyEndpoint}`, 'success')
  } catch (error) {
    onLog?.(`Erreur ${endpoint}: ${error.message}`, 'error')
  }
}


export const reinitialiserDonnees = async (onLog) => {
  for (const endpoint of ENDPOINTS_A_REINITIALISER) {
    await supprimerTout(endpoint, onLog)
  }

  try {
    const sessionToken = await initLegacySession()
    const response = await axios.get(`${LEGACY_URL}/User`, {
      headers: { 'Session-Token': sessionToken, 'App-Token': APP_TOKEN }
    })

    const usersASupprimer = response.data.filter(u => !USERS_BASE.includes(u.name))

    if (usersASupprimer.length === 0) {
      onLog?.('Aucun utilisateur à supprimer', 'info')
    } else {
      await Promise.all(
        usersASupprimer.map(u =>
          axios.delete(`${LEGACY_URL}/User/${u.id}`, {
            headers: { 'Session-Token': sessionToken, 'App-Token': APP_TOKEN },
            data: { force_purge: 1 }
          })
        )
      )
      onLog?.(`✓ ${usersASupprimer.length} utilisateur(s) supprimé(s)`, 'success')
    }
  } catch(e) {
    onLog?.(`Erreur suppression users: ${e.message}`, 'error')
  }
}