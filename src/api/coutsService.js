import { trouverTicketParRef } from '@/api/import'
import { getItemsByTicket, changerStatutTicket } from '@/api/glpi'
import { creerCouts, getDernierCout, supprimerDernierCout, getPremierCout, getTousCouts } from '@/api/backend'

const STATUS = {
  NEW: 1,
  PROGRESS: 2,
  CLOSED: 6
}   

export const MODE_LABELS = {
    1: 'dernier supercout',
    2: 'premier supercout',
    3: 'moyenne supercout',
    4: 'somme supercout'
}

export async function calculerBaseReouverture(ticketId, mode) {
    const modeNum =parseInt(mode) || 1

    if(modeNum === 1)
    {
        const {data} = await getDernierCout(ticketId, 'supercout')
        if(data.length === 0) throw new Error ('aucun supercout existant')
        return data.reduce((s,c) => s + c.montant, 0)
    }

        if(modeNum === 2)
    {
        const {data} = await getPremierCout(ticketId, 'supercout')
        if(data.length === 0) throw new Error ('aucun supercout existant')
        return data.reduce((s,c) => s + c.montant, 0)
    }

        if(modeNum === 3)
    {
        const {data} = await getTousCouts(ticketId, 'supercout')
        if(data.length === 0) throw new Error ('aucun supercout existant')

        const parGroupe = {}
        for(const c of data) {
            parGroupe[c.groupe] = (parGroupe[c.groupe] || 0) + c.montant
        }
        const totaux = Object.values(parGroupe)
        return totaux.reduce((s,v) => s + v, 0) / totaux.length
    }

        if(modeNum === 4)
    {
        const {data} = await getTousCouts(ticketId, 'supercout')
        if(data.length === 0) throw new Error ('aucun supercout existant')

        const parGroupe = {}
        for(const c of data) {
            parGroupe[c.groupe] = (parGroupe[c.groupe] || 0) + c.montant
        }
        return Object.values(parGroupe).reduce((s,v) => s + v, 0)
    }
}

export async function traiterMouvement(ref, mouvement, valeurRaw, mode) {

  const mouvementNormalise = mouvement.trim().toLowerCase()
  const valeur = parseFloat(String(valeurRaw).replace(',', '.'))

  const ticketTrouve = await trouverTicketParRef(`[${ref}]`)

  if (!ticketTrouve) {
    throw new Error(`Ticket [${ref}] introuvable`)
  }

  const ticketId = ticketTrouve.id

  // CLOSE
  if (mouvementNormalise === 'close') {

    await changerStatutTicket(ticketId, STATUS.CLOSED)

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
          groupe,
          mode: null
        }))
      : [{
          ticketId,
          typeCout: 'supercout',
          montant: valeur,
          itemType: null,
          itemId: null,
          groupe,
          mode : null
        }]

    await creerCouts(couts)

    return `Ticket [${ref}] : super coût ${valeur}€ enregistré`
  }

// OPEN — remplacer le calcul manuel par calculerBaseReouverture
if (mouvementNormalise === 'open') {
  await changerStatutTicket(ticketId, STATUS.PROGRESS)
  if (isNaN(valeur)) throw new Error('Valeur invalide pour open')

  const base = await calculerBaseReouverture(ticketId, mode)  // ← utilise le mode
  const montantReouverture = base * valeur / 100

  const items = await getItemsByTicket(ticketId)
  const nb = items.length || 1
  const groupe = new Date().toISOString()
  const montantParItem = montantReouverture / nb

  const couts = items.length > 0
    ? items.map(it => ({
        ticketId, typeCout: 'reouverture',
        montant: montantParItem,
        itemType: it.itemtype, itemId: it.items_id,
        groupe, mode: parseInt(mode)
      }))
    : [{ ticketId, typeCout: 'reouverture', montant: montantReouverture, itemType: null, itemId: null, groupe, mode: parseInt(mode) }]

  await creerCouts(couts)
  return `Ticket [${ref}] : réouverture ${valeur}% de ${base.toFixed(2)}€ (mode ${mode}) = ${montantReouverture.toFixed(2)}€`
}

  // CANCEL
  if (mouvementNormalise === 'cancel') {

    const { data: dernierData } =
      await getDernierCout(ticketId, 'supercout')

    if (dernierData.length === 0) {
      throw new Error(`Aucun super coût à annuler`)
    }

    await supprimerDernierCout(ticketId, 'supercout')

      // 3. Remettre le statut en PROGRESS
    await changerStatutTicket(ticketId, 2)

    return `Ticket [${ref}] : dernier super coût annulé`
  }

  throw new Error(`Mouvement inconnu : ${mouvement}`)
}

export async function traiterCloture(ticketId, montant, commentaire) {
    if(!montant) return

    const items = await getItemsByTicket(ticketId)
    const nb = items.length || 1
    const groupe = new Date().toISOString()
    const montantParItem = parseFloat(montant) / nb

    const couts = items.length > 0
        ? items.map(it => ({
            ticketId,
            typeCout:'supercout',
            montant: montantParItem,
            itemType:it.itemtype, 
            itemId: it.items_id,
            groupe,
            mode: null,
            commentaire: commentaire || null
        }))
        :[{
            ticketId,
            typeCout:'supercout',
            montant: parseFloat(montant),
            itemType:null, 
            itemId: null,
            groupe,
            mode: null,
            commentaire: commentaire || null
        }]

        await creerCouts(couts)
        return `super cout ${montant} € enregistré`
    
}

export async function traiterReouvertureKanban(ticketId, pourcentage, mode, supprimerDernier) {
    if(supprimerDernier) {
        await supprimerDernierCout(ticketId, 'supercout')
    }

    if(!pourcentage) return

    const base = await calculerBaseReouverture(ticketId, mode)
    const montantReouverture = base * parseFloat(pourcentage) / 100

    const items = await getItemsByTicket(ticketId)
    const nb = items.length || 1
    const groupe = new Date().toISOString()
    const montantParItem = montantReouverture / nb

    const couts = items.length > 0
            ? items.map(it => ({
            ticketId,
            typeCout:'reouverture',
            montant: montantParItem,
            itemType:it.itemtype, 
            itemId: it.items_id,
            groupe,
            mode: parseInt(mode)
        }))
        :[{
            ticketId,
            typeCout:'reouverture',
            montant: montantReouverture,
            itemType:null, 
            itemId: null,
            groupe,
            mode: parseInt(mode)
        }]

        await creerCouts(couts)
        return `reouverture ${pourcentage} de ${base.toFixed(2)}€ = ${montantReouverture.toFixed(2)}€`
}