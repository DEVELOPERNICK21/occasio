import { SearchPill } from '../../../../shared/ui/SearchPill';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
};

export function VaultSearchField({ value, onChangeText }: Props) {
  return (
    <SearchPill
      value={value}
      onChangeText={onChangeText}
      placeholder="Find someone in your vault..."
    />
  );
}
