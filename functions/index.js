const { onCall, HttpsError } = require('firebase-functions/v2/https')
const { initializeApp } = require('firebase-admin/app')
const { getFirestore, FieldValue } = require('firebase-admin/firestore')

initializeApp()
const db = getFirestore()

// Región: debe coincidir con la del cliente (lib/firebase.js -> getFunctions).
const REGION = 'us-central1'

// Canje seguro de una invitación. Corre con Admin SDK (saltea las reglas), así
// que el cliente NO puede auto-agregarse a cuidadores[] sin pasar por acá.
// Valida: sesión, código existe, no usado, no vencido; recién ahí agrega el uid.
exports.canjearInvite = onCall({ region: REGION }, async (request) => {
  const uid = request.auth && request.auth.uid
  if (!uid) {
    throw new HttpsError('unauthenticated', 'Tenés que iniciar sesión.')
  }

  const code = String((request.data && request.data.code) || '')
    .trim()
    .toUpperCase()
  if (!code) {
    throw new HttpsError('invalid-argument', 'Falta el código.')
  }

  const inviteRef = db.doc(`invites/${code}`)

  const babyId = await db.runTransaction(async (tx) => {
    const inviteSnap = await tx.get(inviteRef)
    if (!inviteSnap.exists) {
      throw new HttpsError('not-found', 'El código no existe.')
    }
    const inv = inviteSnap.data()
    if (inv.usado) {
      throw new HttpsError('failed-precondition', 'Ese código ya fue usado.')
    }
    const expMs = inv.expiraEn && inv.expiraEn.toMillis ? inv.expiraEn.toMillis() : 0
    if (expMs && expMs < Date.now()) {
      throw new HttpsError('failed-precondition', 'El código venció. Pedí uno nuevo.')
    }

    const babyRef = db.doc(`babies/${inv.babyId}`)
    const babySnap = await tx.get(babyRef)
    if (!babySnap.exists) {
      throw new HttpsError('not-found', 'El bebé ya no existe.')
    }

    // Ya está adentro: no falla, devuelve el babyId igual (idempotente).
    tx.update(babyRef, { cuidadores: FieldValue.arrayUnion(uid) })
    tx.update(inviteRef, {
      usado: true,
      usadoPor: uid,
      usadoEn: FieldValue.serverTimestamp(),
    })
    return inv.babyId
  })

  return { babyId }
})
