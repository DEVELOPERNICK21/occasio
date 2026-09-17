import auth from '@react-native-firebase/auth';
import firestore, { type FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { env } from '../../../shared/config/env';
import type { AutoSendPack, CreatePersonInput, VaultPerson } from '../domain/types';
import { VaultError } from './vaultErrors';

type RelationshipDoc = {
  userId: string;
  personName: string;
  relationshipType: string;
  dates: {
    birthday?: { month: number; day: number };
    anniversary?: { month: number; day: number };
  };
  contactChannel: { whatsapp?: string; email?: string };
  autoSendEnabled: { birthday?: boolean; anniversary?: boolean };
  preferredTemplateId?: string | null;
  preferredTemplateType?: string | null;
  photoRefs?: string[];
  defaultMessage?: string;
  fromName?: string | null;
  lastCreationId?: string;
  createdAt: FirebaseFirestoreTypes.Timestamp | null;
  updatedAt: FirebaseFirestoreTypes.Timestamp | null;
};

const EMPTY_AUTO_SEND_PACK: AutoSendPack = {
  preferredTemplateId: null,
  preferredTemplateType: null,
  photoRefs: [],
  defaultMessage: '',
  fromName: null,
};

function mapPack(data: RelationshipDoc): AutoSendPack | null {
  const hasPack =
    data.preferredTemplateId != null ||
    data.preferredTemplateType != null ||
    (data.photoRefs?.length ?? 0) > 0 ||
    data.defaultMessage != null ||
    data.fromName != null;

  if (!hasPack) {
    return null;
  }

  return {
    preferredTemplateId: data.preferredTemplateId ?? null,
    preferredTemplateType: data.preferredTemplateType ?? null,
    photoRefs: data.photoRefs ?? [],
    defaultMessage: data.defaultMessage ?? '',
    fromName: data.fromName ?? null,
  };
}

function packToFirestoreFields(pack: AutoSendPack): Partial<RelationshipDoc> {
  return {
    preferredTemplateId: pack.preferredTemplateId,
    preferredTemplateType: pack.preferredTemplateType,
    photoRefs: pack.photoRefs,
    defaultMessage: pack.defaultMessage,
    fromName: pack.fromName,
  };
}

function mergeAutoSendPack(
  existing: AutoSendPack | null,
  partial: Partial<AutoSendPack>,
): AutoSendPack {
  const base = existing ?? EMPTY_AUTO_SEND_PACK;
  return {
    preferredTemplateId:
      partial.preferredTemplateId !== undefined
        ? partial.preferredTemplateId
        : base.preferredTemplateId,
    preferredTemplateType:
      partial.preferredTemplateType !== undefined
        ? partial.preferredTemplateType
        : base.preferredTemplateType,
    photoRefs: partial.photoRefs !== undefined ? partial.photoRefs : base.photoRefs,
    defaultMessage:
      partial.defaultMessage !== undefined ? partial.defaultMessage : base.defaultMessage,
    fromName: partial.fromName !== undefined ? partial.fromName : base.fromName,
  };
}

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
    anniversary: data.dates?.anniversary ?? null,
    whatsapp: data.contactChannel?.whatsapp ?? null,
    email: data.contactChannel?.email ?? null,
    autoSendBirthday: Boolean(data.autoSendEnabled?.birthday),
    autoSendAnniversary: Boolean(data.autoSendEnabled?.anniversary),
    pack: mapPack(data),
    lastCreationId: data.lastCreationId ?? null,
    createdAt: timestampToIso(data.createdAt, fallback),
    updatedAt: timestampToIso(data.updatedAt, fallback),
  };
}

function toFirestorePayload(
  uid: string,
  input: CreatePersonInput,
): Omit<RelationshipDoc, 'createdAt' | 'updatedAt'> {
  const dates: RelationshipDoc['dates'] = {};
  if (input.birthday) dates.birthday = input.birthday;
  if (input.anniversary) dates.anniversary = input.anniversary;

  const contactChannel: RelationshipDoc['contactChannel'] = {};
  if (input.whatsapp) contactChannel.whatsapp = input.whatsapp;
  if (input.email) contactChannel.email = input.email;

  return {
    userId: uid,
    personName: input.personName,
    relationshipType: input.relationshipType,
    dates,
    contactChannel,
    autoSendEnabled: {
      birthday: input.autoSendBirthday,
      anniversary: input.autoSendAnniversary,
    },
  };
}

function vaultPersonFromInput(
  id: string,
  uid: string,
  input: CreatePersonInput,
  now: string,
): VaultPerson {
  return {
    id,
    userId: uid,
    personName: input.personName,
    relationshipType: input.relationshipType,
    birthday: input.birthday,
    anniversary: input.anniversary,
    whatsapp: input.whatsapp,
    email: input.email,
    autoSendBirthday: input.autoSendBirthday,
    autoSendAnniversary: input.autoSendAnniversary,
    pack: null,
    lastCreationId: null,
    createdAt: now,
    updatedAt: now,
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
    const person = vaultPersonFromInput(`mock-${Date.now()}`, uid, input, now);
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

    return vaultPersonFromInput(docRef.id, uid, input, now);
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

export async function setVaultPersonAutoSendAnniversary(
  personId: string,
  enabled: boolean,
): Promise<void> {
  requireUid();

  if (env.useMockAuth) {
    mockStore = mockStore.map((person) =>
      person.id === personId
        ? { ...person, autoSendAnniversary: enabled, updatedAt: new Date().toISOString() }
        : person,
    );
    return;
  }

  try {
    await firestore().collection('relationships').doc(personId).update({
      'autoSendEnabled.anniversary': enabled,
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });
  } catch {
    throw new VaultError('NETWORK', 'Could not update auto-send.');
  }
}

export async function updateVaultPersonPack(
  personId: string,
  pack: AutoSendPack,
): Promise<void> {
  requireUid();

  if (env.useMockAuth) {
    mockStore = mockStore.map((person) =>
      person.id === personId
        ? { ...person, pack, updatedAt: new Date().toISOString() }
        : person,
    );
    return;
  }

  try {
    await firestore()
      .collection('relationships')
      .doc(personId)
      .update({
        ...packToFirestoreFields(pack),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
  } catch {
    throw new VaultError('NETWORK', 'Could not update auto-send pack.');
  }
}

export async function linkVaultPersonCreation(
  personId: string,
  creationId: string,
  packPartial: Partial<AutoSendPack>,
): Promise<void> {
  requireUid();

  if (env.useMockAuth) {
    mockStore = mockStore.map((person) => {
      if (person.id !== personId) return person;
      return {
        ...person,
        lastCreationId: creationId,
        pack: mergeAutoSendPack(person.pack, packPartial),
        updatedAt: new Date().toISOString(),
      };
    });
    return;
  }

  try {
    const doc = await firestore().collection('relationships').doc(personId).get();
    const existing = mapPack(doc.data() as RelationshipDoc);
    const merged = mergeAutoSendPack(existing, packPartial);

    await firestore()
      .collection('relationships')
      .doc(personId)
      .update({
        lastCreationId: creationId,
        ...packToFirestoreFields(merged),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
  } catch {
    throw new VaultError('NETWORK', 'Could not link creation to person.');
  }
}
