import { Redirect, useLocalSearchParams } from 'expo-router';

/** Compatibilidade com a rota do protótipo. O editor real usa SQLite. */
export default function NovoMovimentoRedirect() {
  const { tipo, id } = useLocalSearchParams<{ tipo?: string; id?: string }>();

  if (id) {
    return <Redirect href={{ pathname: '/movement/[id]', params: { id } }} />;
  }

  return (
    <Redirect
      href={{
        pathname: '/movement/new',
        params: { type: tipo === 'r' ? 'income' : 'expense' },
      }}
    />
  );
}
