import { useLocalSearchParams } from 'expo-router';

import { EditorMovimento } from '../../src/features/movimentos/EditorMovimento';

export default function NewMovementScreen() {
  const { type } = useLocalSearchParams<{ type?: string }>();

  return (
    <EditorMovimento
      movement={null}
      initialType={type === 'income' ? 'income' : 'expense'}
    />
  );
}
