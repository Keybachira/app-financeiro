import { useLocalSearchParams } from 'expo-router';

import { MovementEditor } from '../../src/features/movements/MovementEditor';

export default function NewMovementScreen() {
  const { type } = useLocalSearchParams<{ type?: string }>();

  return (
    <MovementEditor
      movement={null}
      initialType={type === 'income' ? 'income' : 'expense'}
    />
  );
}
