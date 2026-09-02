import auth from '@react-native-firebase/auth';
import firestore, { type FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { env } from '../../../shared/config/env';
import type { CreatePersonInput, VaultPerson } from '../domain/types';
import { VaultError } from './vaultErrors';

type RelationshipDoc = {
  userId: string;
  personName: string;
  relationshipType: string;
  dates: { birthday?: { month: number; day: number } };
  contactChannel: { whatsapp?: string };
  autoSendEnabled: { birthday?: boolean };
  createdAt: FirebaseFirestoreTypes.Timestamp | null;
  updatedAt: FirebaseFirestoreTypes.Timestamp | null;
};

let mockStore: VaultPerson[] = [];

function timestampToIso(
  value: FirebaseFirestoreTypes.Timestamp | null | undefined,
  fallback: string,
): string {
  if (!value || typeof value.toDate !== 'function') {
    return fallback;
  }
  return value.toDate().toISOString();
}

function requireUid(): string {
  const uid = auth().currentUser?.uid;
  if (!uid) {
    throw new VaultError('NOT_AUTHENTICATED', 'Sign in to use your Vault.');
  }
  return uid;
}

function mapDoc(id: string, data: RelationshipDoc): VaultPerson {
  const fallback = new Date().toISOString();
  return {
    id,
    userId: data.userId,
    personName: data.personName,
    relationshipType: data.relationshipType as VaultPerson['relationshipType'],
    birthday: data.dates?.birthday ?? null,
    whatsapp: data.contactChannel?.whatsapp ?? null,
    autoSendBirthday: Boolean(data.autoSendEnabled?.birthday),
    createdAt: timestampToIso(data.createdAt, fallback),
    updatedAt: timestampToIso(data.updatedAt, fallback),
  };
}

function toFirestorePayload(
  uid: string,
  input: CreatePersonInput,
): Omit<RelationshipDoc, 'createdAt' | 'updatedAt'> {
  return {
    userId: uid,
    personName: input.personName,
    relationshipType: input.relationshipType,
    dates: input.birthday ? { birthday: input.birthday } : {},
    contactChannel: input.whatsapp ? { whatsapp: input.whatsapp } : {},
    autoSendEnabled: { birthday: input.autoSendBirthday },
  };
}

export function subscribeVaultPeople(
  onChange: (people: VaultPerson[]) => void,
  onError?: (error: Error) => void,
): () => void {
  const uid = requireUid();

  if (env.useMockAuth) {
    const sync = () => {
      onChange(mockStore.filter((person) => person.userId === uid));
    };
    sync();
    const interval = setInterval(sync, 500);
    return () => clearInterval(interval);
  }

  return firestore()
    .collection('relationships')
    .where('userId', '==', uid)
    .onSnapshot(
      (snapshot) => {
        const people = snapshot.docs.map((doc) =>
          mapDoc(doc.id, doc.data() as RelationshipDoc),
        );
        people.sort((a, b) => a.personName.localeCompare(b.personName));
        onChange(people);
      },
      (error) => {
        onError?.(error);
      },
    );
}

export async function createVaultPerson(input: CreatePersonInput): Promise<VaultPerson> {
  const uid = requireUid();
  const now = new Date().toISOString();

  if (env.useMockAuth) {
    const person: VaultPerson = {
      id: `mock-${Date.now()}`,
      userId: uid,
      personName: input.personName,
      relationshipType: input.relationshipType,
      birthday: input.birthday,
      whatsapp: input.whatsapp,
      autoSendBirthday: input.autoSendBirthday,
      createdAt: now,
      updatedAt: now,
    };
    mockStore = [...mockStore, person];
    return person;
  }

  try {
    const payload = toFirestorePayload(uid, input);
    const docRef = await firestore()
      .collection('relationships')
      .add({
        ...payload,
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });

    return {
      id: docRef.id,
      userId: uid,
      personName: input.personName,
      relationshipType: input.relationshipType,
      birthday: input.birthday,
      whatsapp: input.whatsapp,
      autoSendBirthday: input.autoSendBirthday,
      createdAt: now,
      updatedAt: now,
    };
  } catch (error) {
    if (error instanceof VaultError) throw error;
    throw new VaultError('NETWORK', 'Could not save person. Check your connection.');
  }
}

export async function deleteVaultPerson(personId: string): Promise<void> {
  requireUid();

  if (env.useMockAuth) {
    mockStore = mockStore.filter((person) => person.id !== personId);
    return;
  }

  try {
    await firestore().collection('relationships').doc(personId).delete();
  } catch {
    throw new VaultError('NETWORK', 'Could not delete person.');
  }
}

export async function setVaultPersonAutoSendBirthday(
  personId: string,
  enabled: boolean,
): Promise<void> {
  requireUid();

  if (env.useMockAuth) {
    mockStore = mockStore.map((person) =>
      person.id === personId
        ? { ...person, autoSendBirthday: enabled, updatedAt: new Date().toISOString() }
        : person,
    );
    return;
  }

  try {
    await firestore().collection('relationships').doc(personId).update({
      'autoSendEnabled.birthday': enabled,
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });
  } catch {
    throw new VaultError('NETWORK', 'Could not update auto-send.');
  }
}
