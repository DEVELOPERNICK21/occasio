import { useEffect, useState } from 'react';
import { Linking } from 'react-native';
import { useNavigation, type NavigationProp } from '@react-navigation/native';
import type { RootStackParamList } from '../../../shared/navigation/types';
import { useCreateDraftContext } from '../../create/application/CreateDraftContext';
import type { VaultPerson } from '../../vault/domain/types';
import { parseWidgetLink, type WidgetLink } from '../domain/widgetLinks';

type Input = {
  people: VaultPerson[];
  /** Auth and Vault have finished loading, so a person lookup is trustworthy. */
  ready: boolean;
};

/** A cold start by widget tap reports the same initial URL again on remount. */
let initialUrlHandled = false;

/**
 * Widget taps arrive as `occasio://…` links. A tap on a person starts a card
 * for them (the widget says "Make a card"); everything else opens a screen.
 */
export function useWidgetLinks({ people, ready }: Input): void {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { startQuickCreate, startWish } = useCreateDraftContext();
  const [pending, setPending] = useState<WidgetLink | null>(null);

  useEffect(() => {
    if (!initialUrlHandled) {
      initialUrlHandled = true;
      void Linking.getInitialURL().then((url) => {
        const link = parseWidgetLink(url);
        if (link) {
          setPending(link);
        }
      });
    }
    const sub = Linking.addEventListener('url', ({ url }) => {
      const link = parseWidgetLink(url);
      if (link) {
        setPending(link);
      }
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!pending || !ready) {
      return;
    }
    setPending(null);

    // Reset the Create stack instead of pushing: a tap while a card is half
    // made must not leave old screens underneath, and Back should land on Create home.
    const toAddPhotos = () =>
      navigation.navigate('MainTabs', {
        screen: 'CreateTab',
        params: {
          state: {
            index: 1,
            routes: [{ name: 'CreateHome' }, { name: 'AddPhotos' }],
          },
        },
      });

    switch (pending.kind) {
      case 'quick_create':
        startQuickCreate();
        toAddPhotos();
        return;
      case 'card': {
        const person = people.find((p) => p.id === pending.personId);
        if (!person) {
          // Deleted since the widget last updated, or signed out: still start a card.
          startQuickCreate();
          toAddPhotos();
          return;
        }
        if (pending.occasion === 'anniversary') {
          startWish({
            templateType: 'anniversary',
            recipientName: person.personName,
          });
        } else {
          startQuickCreate(person.personName);
        }
        toAddPhotos();
        return;
      }
      case 'vault':
        navigation.navigate('MainTabs', {
          screen: 'VaultTab',
          params: { screen: 'VaultList' },
        });
        return;
      case 'add_person':
        navigation.navigate('MainTabs', {
          screen: 'VaultTab',
          params: { screen: 'AddPerson', params: {} },
        });
        return;
    }
  }, [pending, ready, people, navigation, startQuickCreate, startWish]);
}
