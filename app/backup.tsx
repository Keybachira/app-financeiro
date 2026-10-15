import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Download, FileJson, FileSpreadsheet, RotateCcw, Warehouse, X } from 'lucide-react-native';

import { IconButton } from '../src/ui/components/IconButton';
import { Panel } from '../src/ui/components/Panel';
import { ScreenBackground } from '../src/ui/components/ScreenBackground';
import { ConfirmSheet } from '../src/ui/components/ConfirmSheet';
import { IconTile } from '../src/ui/components/IconTile';
import { useBackup } from '../src/features/backup/useBackup';
import { buildBackup } from '../src/repos/backup';
import type { LucideIcon } from 'lucide-react-native';
import { colors, fonts, radius, spacing } from '../src/ui/theme';

type Counts = {
  movements: number;
  goals: number;
  debts: number;
  projects: number;
  bills: number;
};

export default function BackupScreen() {
  const router = useRouter();
  const { busy, error, exportJson, exportCsv, importJson, clearError } = useBackup();
  const [confirmReplace, setConfirmReplace] = useState(false);
  const [countsKey, setCountsKey] = useState(0);

  const counts = useCallback((): Counts => {
    const payload = buildBackup();
    return {
      movements: payload.movements.length,
      goals: payload.goals.length,
      debts: payload.debts.length,
      projects: payload.projects.length,
      bills: payload.bills.length,
    };
  }, [countsKey]);

  const handleMergeImport = useCallback(async () => {
    const result = await importJson('merge');
    if (result.imported) {
      setCountsKey((value) => value + 1);
    }
  }, [importJson]);

  const handleReplaceImport = useCallback(async () => {
    setConfirmReplace(false);
    const result = await importJson('replace');
    if (result.imported) {
      setCountsKey((value) => value + 1);
      clearError();
    }
  }, [importJson, clearError]);

  const current = counts();

  return (
    <View style={styles.root}>
      <ScreenBackground />
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Backup</Text>
          <IconButton icon={X} label="Fechar" onPress={() => router.back()} />
        </View>

        <Panel>
          <View style={styles.cardHeader}>
            <IconTile icon={Warehouse} />
            <View style={styles.cardHeaderText}>
              <Text style={styles.cardTitle}>Cópia local</Text>
              <Text style={styles.cardMeta}>
                Os dados ficam no telemóvel. Exporta um ficheiro, guarda-o onde quiseres e importa-o para recuperar.
              </Text>
            </View>
          </View>

          <View style={styles.countsRow}>
            <CountChip label="Movimentos" value={current.movements} />
            <CountChip label="Metas" value={current.goals} />
            <CountChip label="Dívidas" value={current.debts} />
            <CountChip label="Projetos" value={current.projects} />
            <CountChip label="Contas" value={current.bills} />
          </View>
        </Panel>

        {error ? (
          <Panel style={styles.errorPanel}>
            <Text style={styles.errorTitle}>Ação recusada</Text>
            <Text style={styles.errorMessage}>{error}</Text>
          </Panel>
        ) : null}

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <IconTile icon={Download} />
            <View style={styles.cardHeaderText}>
              <Text style={styles.cardTitle}>Exportar</Text>
              <Text style={styles.cardMeta}>Guarda os dados num ficheiro partilhável.</Text>
            </View>
          </View>

          <View style={styles.buttonsRow}>
            <ActionTile
              icon={FileJson}
              label="Backup completo (JSON)"
              disabled={busy}
              onPress={() => {
                void exportJson();
              }}
            />
            <ActionTile
              icon={FileSpreadsheet}
              label="Movimentos (CSV)"
              disabled={busy}
              onPress={() => {
                void exportCsv();
              }}
            />
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <IconTile icon={RotateCcw} />
            <View style={styles.cardHeaderText}>
              <Text style={styles.cardTitle}>Importar</Text>
              <Text style={styles.cardMeta}>
                Escolhe um ficheiro JSON criado por esta aplicação. Registos com o mesmo identificador são ignorados.
              </Text>
            </View>
          </View>

          <View style={styles.buttonsRow}>
            <ActionTile
              icon={FileJson}
              label="Juntar ao atual"
              disabled={busy}
              onPress={() => {
                void handleMergeImport();
              }}
            />
            <ActionTile
              icon={FileJson}
              label="Substituir tudo"
              disabled={busy}
              onPress={() => setConfirmReplace(true)}
            />
          </View>
          <Text style={styles.cardFooter}>Substituir apaga os dados existentes antes de importar.</Text>
        </View>

        {busy ? (
          <View style={styles.busyRow}>
            <ActivityIndicator color={colors.accent} />
            <Text style={styles.busyText}>A processar ficheiro…</Text>
          </View>
        ) : null}
      </ScrollView>

      <ConfirmSheet
        visible={confirmReplace}
        title="Substituir todos os dados"
        message="Os dados atuais vão ser apagados e substituídos pelo backup escolhido. Esta ação é irreversível."
        confirmLabel="Apagar e importar"
        destructive
        onConfirm={() => {
          void handleReplaceImport();
        }}
        onCancel={() => setConfirmReplace(false)}
      />
    </View>
  );
}

function CountChip({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipValue}>{String(value)}</Text>
      <Text style={styles.chipLabel}>{label}</Text>
    </View>
  );
}

function ActionTile({
  icon: Icon,
  label,
  disabled,
  onPress,
}: {
  icon: LucideIcon;
  label: string;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Panel style={styles.actionTile} padded={false}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled }}
        onPress={onPress}
        disabled={disabled}
        style={({ pressed }) => [styles.pressable, pressed && !disabled && styles.pressablePressed]}
      >
        <Icon color={disabled ? colors.textMuted : colors.text} size={22} strokeWidth={2} />
        <Text style={[styles.pressableLabel, disabled && styles.pressableLabelDisabled]}>{label}</Text>
      </Pressable>
    </Panel>
  );
}
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    flexGrow: 1,
    padding: spacing.lg,
    paddingTop: spacing.xl,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 20,
    color: colors.text,
  },
  card: {
    borderRadius: radius.panel,
    borderWidth: 1,
    borderColor: colors.panelBorder,
    backgroundColor: colors.bgMid,
    padding: spacing.lg,
    gap: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconTile: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.iconTileBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.text,
  },
  cardMeta: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textMuted,
    marginTop: 2,
  },
  cardFooter: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textMuted,
  },
  countsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    borderRadius: radius.chip,
    backgroundColor: colors.chipNeutralBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignItems: 'center',
    minWidth: 64,
  },
  chipValue: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  chipLabel: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textMuted,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionTile: {
    flex: 1,
  },
  pressable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 64,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  pressablePressed: {
    opacity: 0.6,
  },
  pressableLabel: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.text,
  },
  pressableLabelDisabled: {
    color: colors.textMuted,
  },
  errorPanel: {
    borderColor: 'rgba(255,181,71,.4)',
  },
  errorTitle: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.warn,
  },
  errorMessage: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textMuted,
    marginTop: 4,
  },
  busyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
  busyText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textMuted,
  },
});
