import type { ReactNode } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { layout, spacing, useEstilosTema, type Cores } from "../tema";
import { CabecalhoModal } from "./CabecalhoModal";
import { EntradaAnimada } from "./EntradaAnimada";
import { FundoEcra } from "./FundoEcra";
import { CabecalhoEcra } from "./CabecalhoEcra";

/**
 * Estrutura comum a quase todos os ecrãs: fundo, área segura, scroll e
 * cabeçalho.
 *
 * Três modos de cabeçalho: 'header' (renderizado à medida), 'back' (modal, com
 * seta de voltar) ou o cabeçalho normal com título/subtítulo. O conteúdo entra
 * com a animação `in` da camada de movimento (`EntradaAnimada`), que respeita o
 * pedido de menos movimento do sistema.
 */
export function Ecra({
  title,
  subtitle,
  right,
  floating,
  header,
  back = false,
  children,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  floating?: ReactNode;
  header?: ReactNode;
  /**
   * Ecrãs abertos como modal precisam de voltar visível: o cabeçalho nativo do
   * `Stack` está desligado (`headerShown: false`), portanto sem isto só o gesto
   * de sistema tirava o utilizador do ecrã.
   */
  back?: boolean;
  children?: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const styles = useEstilosTema(makeStyles);

  return (
    <View style={styles.root}>
      <FundoEcra />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.sm },
        ]}
        showsVerticalScrollIndicator={false}
        // Sem isto, o primeiro toque numa linha com o teclado aberto era
        // consumido para o fechar e a linha não navegava. Os ecrãs de formulário
        // já usavam "handled"; este é o `ScrollView` da Home e listas.
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {header ? header : back ? (
          <CabecalhoModal title={title} subtitle={subtitle} right={right} />
        ) : (
          <CabecalhoEcra title={title} subtitle={subtitle} right={right} />
        )}
        <EntradaAnimada variante="vista" gatilho={title}>
          {children}
        </EntradaAnimada>
      </ScrollView>
      {floating}
    </View>
  );
}

const makeStyles = (colors: Cores) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    content: {
      paddingHorizontal: layout.screenPadding,
      paddingBottom: layout.screenBottom,
      gap: spacing.md,
    },
  });
