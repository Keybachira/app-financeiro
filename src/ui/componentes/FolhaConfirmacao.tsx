import { useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { toqueLigeiro, toqueMedio } from "../haptica";
import { fonts, spacing, useEstilosTema, type Cores } from "../tema";
import { FolhaInferior } from "./FolhaInferior";

/**
 * Bottom sheet de confirmação para ações destrutivas.
 *
 * O 'confirming' (useRef) bloqueia reentrância: sem ele um duplo toque chamava
 * 'onConfirm' duas vezes e, nos ecrãs de detalhe, isso originava dois
 * 'remove()' + dois 'router.back()'.
 */
export function FolhaConfirmacao({
  visible,
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  destructive = false,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  // Sem guarda de reentrada, um duplo-toque chamava `onConfirm` duas vezes —
  // nos ecrãs de detalhe isso era `remove()` + `router.back()` duplicados, com
  // duas telas a saltar de uma vez.
  const styles = useEstilosTema(makeStyles);
  const confirming = useRef(false);

  const handleConfirm = () => {
    if (confirming.current) {
      return;
    }

    confirming.current = true;
    toqueMedio();
    onConfirm();
    // Liberta quando o voltar a abrir, para não ficar travado para sempre.
    setTimeout(() => {
      confirming.current = false;
    }, 600);
  };

  return (
    <FolhaInferior visible={visible} onRequestClose={onCancel}>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              toqueLigeiro();
              onCancel();
            }}
            style={({ pressed }) => [
              styles.button,
              styles.cancel,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.cancelLabel}>{cancelLabel}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={handleConfirm}
            style={({ pressed }) => [
              styles.button,
              destructive ? styles.destructive : styles.confirm,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text
              style={[
                styles.buttonLabel,
                destructive && styles.destructiveLabel,
              ]}
            >
              {confirmLabel}
            </Text>
          </Pressable>
        </View>
      </View>
    </FolhaInferior>
  );
}

const makeStyles = (colors: Cores) =>
  StyleSheet.create({
    content: {
      gap: spacing.sm,
    },
    title: {
      fontFamily: fonts.bold,
      fontSize: 18,
      color: colors.text,
    },
    message: {
      fontFamily: fonts.regular,
      fontSize: 14,
      lineHeight: 20,
      color: colors.textMuted,
    },
    actions: {
      flexDirection: "row",
      gap: spacing.md,
      marginTop: spacing.md,
    },
    button: {
      flex: 1,
      height: 52,
      borderRadius: 26,
      alignItems: "center",
      justifyContent: "center",
    },
    buttonPressed: {
      opacity: 0.7,
    },
    cancel: {
      borderWidth: 1,
      borderColor: colors.hairline,
    },
    confirm: {
      backgroundColor: colors.tabPill,
    },
    destructive: {
      backgroundColor: colors.chipWarnBg,
    },
    cancelLabel: {
      fontFamily: fonts.medium,
      fontSize: 15,
      color: colors.text,
    },
    buttonLabel: {
      fontFamily: fonts.bold,
      fontSize: 15,
      color: colors.text,
    },
    destructiveLabel: {
      color: colors.warn,
    },
  });
