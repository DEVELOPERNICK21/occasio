import { FloatingFab } from '../../../../shared/ui/FloatingFab';

type Props = {
  onPress: () => void;
};

export function VaultFab({ onPress }: Props) {
  return (
    <FloatingFab
      onPress={onPress}
      accessibilityLabel="Add person to Vault"
    />
  );
}
