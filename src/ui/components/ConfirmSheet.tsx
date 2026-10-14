import type { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, radius, spacing } from '../theme';

export function ConfirmSheet({
  visible,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
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
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.container}>
        <Pressable accessibilityLabel="Cancelar" style={styles.backdrop} onPress={onCancel} />
        <View style={styles.sheet}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.actions}>
            <Pressable accessibilityRole="button" onPress={onCancel} style={[styles.button, styles.cancel]}>
              <Text style={styles.cancelLabel}>{cancelLabel}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={onConfirm}
              style={[styles.button, destructive ? styles.destructive : styles.confirm]}
            >
              <Text style={[styles.buttonLabel, destructive && styles.destructiveLabel]}>{confirmLabel}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(4,8,24,.72)',
  },
  sheet: {
    backgroundColor: colors.bgMid,
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
    borderTopLeftRadius: radius.glass,
    borderTopRightRadius: radius.glass,
    padding: spacing.xl,
    paddingBottom: spacing.xl + spacing.md,
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
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  button: {
    flex: 1,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
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
