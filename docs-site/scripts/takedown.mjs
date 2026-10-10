#!/usr/bin/env node
/**
 * Disable a shared card (DMCA takedown or abuse report).
 *
 *   FIREBASE_SERVICE_ACCOUNT_JSON="$(cat key.json)" node scripts/takedown.mjs <slug> "<reason>"
 *
 * The link stops working immediately (expiresAt is set to now), the reason and
 * time are recorded on the card, and a row is added to `takedowns` so repeat
 * infringers can be counted. If the card has an owner, their uid is printed.
 * Nothing is deleted, so a counter-notice can be honoured by restoring the card
 * (set expiresAt back and remove `takedownAt`).
 */
import { cert, initializeApp } from 'firebase-admin/app';
import { FieldValue, Timestamp, getFirestore } from 'firebase-admin/firestore';

const [slug, ...reasonParts] = process.argv.slice(2);
const reason = reasonParts.join(' ').trim();
if (!slug || !/^[a-z0-9]{6,32}$/.test(slug) || !reason) {
  console.error('usage: takedown.mjs <slug> "<reason, e.g. DMCA notice 2026-10-09 from X>"');
  process.exit(1);
}
const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
if (!raw) {
  console.error('Set FIREBASE_SERVICE_ACCOUNT_JSON.');
  process.exit(1);
}

initializeApp({ credential: cert(JSON.parse(raw)), projectId: 'occasio-app-dev' });
const db = getFirestore();

const snap = await db.collection('creations').where('shareSlug', '==', slug).limit(1).get();
if (snap.empty) {
  console.error(`No card with slug "${slug}".`);
  process.exit(2);
}
const ref = snap.docs[0].ref;
const owner = snap.docs[0].data().userId ?? null;
const history = await db.collection('user_creations').doc(ref.id).get();
const ownerUid = owner ?? history.data()?.userId ?? null;

await ref.update({
  expiresAt: Timestamp.now(),
  takedownAt: FieldValue.serverTimestamp(),
  takedownReason: reason,
});
await db.collection('takedowns').add({
  slug,
  creationId: ref.id,
  ownerUid,
  reason,
  at: FieldValue.serverTimestamp(),
});

let strikes = 0;
if (ownerUid) {
  strikes = (await db.collection('takedowns').where('ownerUid', '==', ownerUid).get()).size;
}
console.log(`Disabled ${slug} (${ref.id}).`);
console.log(ownerUid ? `Owner ${ownerUid} now has ${strikes} takedown(s).${strikes >= 3 ? ' Repeat-infringer threshold reached: close the account.' : ''}` : 'Card has no owner account (guest).');
