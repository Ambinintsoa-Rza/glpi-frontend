import { trouverTicketParRef } from '@/api/import'
import { getItemsByTicket } from '@/api/glpi'
import { creerCouts, getDernierCout, supprimerDernierCout } from '@/api/backend'

export async function traiterMouvement(ref, mouvement, valeurRaw) {

  const mouvementNormalise = mouvement.trim().toLowerCase()
  const valeur = parseFloat(String(valeurRaw).replace(',', '.'))

  const ticketTrouve = await trouverTicketParRef(`[${ref}]`)

  if (!ticketTrouve) {
    throw new Error(`Ticket [${ref}] introuvable`)
  }

  const ticketId = ticketTrouve.id

  // CLOSE
  if (mouvementNormalise === 'close') {

    if (isNaN(valeur)) {
      throw new Error(`Valeur invalide pour close`)
    }

    const items = await getItemsByTicket(ticketId)

    const nb = items.length || 1
    const groupe = new Date().toISOString()
    const montantParItem = valeur / nb

    const couts = items.length > 0
      ? items.map(it => ({
          ticketId,
          typeCout: 'supercout',
          montant: montantParItem,
          itemType: it.itemtype,
          itemId: it.items_id,
          groupe
        }))
      : [{
          ticketId,
          typeCout: 'supercout',
          montant: valeur,
          itemType: null,
          itemId: null,
          groupe
        }]

    await creerCouts(couts)

    return `Ticket [${ref}] : super coût ${valeur}€ enregistré`
  }

  // OPEN
  if (mouvementNormalise === 'open') {

    if (isNaN(valeur)) {
      throw new Error(`Valeur invalide pour open`)
    }

    const { data: dernierData } =
      await getDernierCout(ticketId, 'supercout')

    if (dernierData.length === 0) {
      throw new Error(`Aucun super coût existant`)
    }

    const totalDernierSuperCout =
      dernierData.reduce((s, c) => s + c.montant, 0)

    const montantReouverture =
      totalDernierSuperCout * valeur / 100

    const items = await getItemsByTicket(ticketId)

    const nb = items.length || 1
    const groupe = new Date().toISOString()
    const montantParItem = montantReouverture / nb

    const couts = items.length > 0
      ? items.map(it => ({
          ticketId,
          typeCout: 'reouverture',
          montant: montantParItem,
          itemType: it.itemtype,
          itemId: it.items_id,
          groupe
        }))
      : [{
          ticketId,
          typeCout: 'reouverture',
          montant: montantReouverture,
          itemType: null,
          itemId: null,
          groupe
        }]

    await creerCouts(couts)

    return `Ticket [${ref}] : réouverture ${valeur}%`
  }

  // CANCEL
  if (mouvementNormalise === 'cancel') {

    const { data: dernierData } =
      await getDernierCout(ticketId, 'supercout')

    if (dernierData.length === 0) {
      throw new Error(`Aucun super coût à annuler`)
    }

    await supprimerDernierCout(ticketId, 'supercout')

    return `Ticket [${ref}] : dernier super coût annulé`
  }

  throw new Error(`Mouvement inconnu : ${mouvement}`)
}