import { StyleSheet } from 'react-native';
import { Text } from './Text';
import { Screen } from './Screen';
import { colors, typography } from '../theme/tokens';

type Props = {
  title: string;
  message: string;
};

export function PlaceholderTabScreen({ title, message }: Props) {
  return (
    <Screen title={title} subtitle={message} scroll={false}>
      <Text style={styles.body}>Coming in a later Phase 4 slice.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    marginTop: 24,
    fontSize: typography.sizeMd,
    color: colors.muted,
  },
});
