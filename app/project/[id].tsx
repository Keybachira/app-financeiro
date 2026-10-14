import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeftRight, Pencil, Trash, X } from 'lucide-react-native';

import { formatKz } from '../../src/domain/money';
import { formatDayMonthPt } from '../../src/domain/dates';
import { AmountSheet } from '../../src/ui/components/AmountSheet';
import { ConfirmSheet } from '../../src/ui/components/ConfirmSheet';
import { GlassCard } from '../../src/ui/components/GlassCard';
import { IconButton } from '../../src/ui/components/IconButton';
import { MoneyText } from '../../src/ui/components/MoneyText';
import { Panel } from '../../src/ui/components/Panel';
import { ProgressBar } from '../../src/ui/components/ProgressBar';
import { ProgressRing } from '../../src/ui/components/ProgressRing';
import { ScreenBackground } from '../../src/ui/components/ScreenBackground';
import { StatusChip } from '../../src/ui/components/StatusChip';
import { Switch } from '../../src/ui/components/Switch';
import { useToast } from '../../src/ui/components/Toast';
import { colors, fonts, spacing } from '../../src/ui/theme';
import { getProject, projectView } from '../../src/repos/projects';
import { projectChipLabel, useProjects } from '../../src/features/projects/useProjects';

export default function ProjectDetailScreen() {
  const router = useRouter();
  const toast = useToast();
  const { id } = useLocalSearchParams<{ id: string }>();
  const projectId = typeof id === 'string' ? id : null;
  const { pay, payments, updatePayment, removePayment, remove, deliver, createIncomeDefault, setCreateIncomeDefault } = useProjects();

  const [payOpen, setPayOpen] = useState(false);
  const [editPaymentId, setEditPaymentId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const project = projectId ? getProject(projectId) : null;
  const view = project ? projectView(project) : null;

  if (!projectId || !project || !view) {
    return (
      <View style={styles.root}>
        <ScreenBackground />
        <View style={styles.header}>
          <Text style={styles.title}>Projeto</Text>
          <IconButton icon={X} label="Fechar" onPress={() => router.back()} />
        </View>
        <View style={styles.body}>
          <Text style={styles.muted}>Este projeto já não existe.</Text>
        </View>
      </View>
    );
  }

  const paymentList = payments(projectId);
  const editing = paymentList.find((payment) => payment.id === editPaymentId) ?? null;

  return (
    <View style={styles.root}>
      <ScreenBackground />
      <View style={styles.body}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>
            {project.name}
          </Text>
          <View style={styles.headerActions}>
            <IconButton
              icon={Pencil}
              label="Editar projeto"
              onPress={() => router.push({ pathname: '/project/new', params: { id: projectId } })}
            />
            <IconButton icon={X} label="Fechar" onPress={() => router.back()} />
          </View>
        </View>

        <GlassCard>
          <View style={styles.summaryRow}>
            <ProgressRing value={view.progress} size={72} stroke={8} />
            <View style={styles.summaryInfo}>
              <Text style={styles.summaryLabel}>{view.settled ? 'Recebido' : 'Em falta'}</Text>
              <MoneyText value={view.settled ? view.received : view.remaining} size="lg" />
              <Text style={styles.summaryLabel}>de {formatKz(project.total)}</Text>
            </View>
            <StatusChip label={projectChipLabel(view)} tone="accent" />
          </View>
          <Text style={styles.summaryFooter}>
            {project.client ? `Cliente: ${project.client} · ` : ''}
            {project.due_date ? `entrega a ${formatDayMonthPt(project.due_date)}` : 'sem data de entrega'}
          </Text>
        </GlassCard>

        {!view.settled ? (
          <Panel style={styles.payCard} padded={false}>
            <Pressable accessibilityRole="button" onPress={() => setPayOpen(true)} style={styles.payButton}>
              <Text style={styles.payLabel}>Registar recebimento</Text>
              <Text style={styles.payHint}>
                {createIncomeDefault ? 'Cria uma receita em Projetos' : 'Sem receita automática'}
              </Text>
            </Pressable>
          </Panel>
        ) : null}

        <View style={styles.optionRow}>
          <View style={styles.optionText}>
            <Text style={styles.optionTitle}>Criar receita ao receber</Text>
            <Text style={styles.optionMeta}>Lança um movimento de receita na categoria Projetos.</Text>
          </View>
          <Switch
            value={createIncomeDefault}
            onValueChange={(value) => {
              setCreateIncomeDefault(value);
              toast({ message: value ? 'Receita automática ativada' : 'Receita automática desativada' });
            }}
            label="Criar receita ao receber"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recebimentos</Text>
          {paymentList.length > 0 ? (
            paymentList.map((payment) => (
              <View key={payment.id} style={styles.paymentRow}>
                <View style={styles.paymentIcon}>
                  <ArrowLeftRight color={colors.accent} size={18} strokeWidth={2} />
                </View>
                <View style={styles.paymentInfo}>
                  <Text style={styles.paymentDate}>{formatDayMonthPt(payment.date)}</Text>
                  <Text style={styles.paymentMeta}>
                    {payment.movement_id ? 'Movimento ligado' : 'Sem movimento ligado'}
                  </Text>
                </View>
                <MoneyText value={payment.amount} size="md" />
                <Pressable
                  accessibilityLabel="Editar recebimento"
                  hitSlop={8}
                  onPress={() => setEditPaymentId(payment.id)}
                >
                  <Pencil color={colors.textMuted} size={16} strokeWidth={2} />
                </Pressable>
                <Pressable
                  accessibilityLabel="Apagar recebimento"
                  hitSlop={8}
                  onPress={() => {
                    removePayment(payment.id);
                    toast({ message: 'Recebimento apagado' });
                  }}
                >
                  <Trash color={colors.warn} size={16} strokeWidth={2} />
                </Pressable>
              </View>
            ))
          ) : (
            <Text style={styles.muted}>Sem recebimentos registados.</Text>
          )}
        </View>

        <View style={styles.footerRow}>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              deliver(projectId, project.delivered_at === null);
              toast({ message: project.delivered_at === null ? 'Marcado como entregue' : 'Entrega removida' });
            }}
            style={styles.textButton}
          >
            <Text style={styles.textButtonLabel}>
              {project.delivered_at === null ? 'Marcar como entregue' : 'Remover entrega'}
            </Text>
          </Pressable>

          <Pressable accessibilityRole="button" onPress={() => setConfirmDelete(true)} style={styles.textButton}>
            <Trash color={colors.warn} size={16} strokeWidth={2} />
            <Text style={styles.deleteLabel}>Apagar projeto</Text>
          </Pressable>
        </View>
      </View>

      <AmountSheet
        visible={payOpen}
        title={`Recebimento · ${project.name}`}
        confirmLabel="Registar"
        maxAmount={view.remaining}
        helper={`Em falta ${formatKz(view.remaining)}`}
        onCancel={() => setPayOpen(false)}
        onConfirm={(amount) => {
          setPayOpen(false);
          pay(projectId, amount, undefined, createIncomeDefault);
          toast({ message: `Recebimento de ${formatKz(amount)} registado` });
        }}
      />

      <AmountSheet
        visible={editing !== null}
        title="Editar recebimento"
        confirmLabel="Guardar"
        maxAmount={view.remaining}
        onCancel={() => setEditPaymentId(null)}
        onConfirm={(amount) => {
          if (!editing) {
            return;
          }
          updatePayment(editing.id, amount, editing.date);
          setEditPaymentId(null);
          toast({ message: 'Recebimento atualizado' });
        }}
      />

      <ConfirmSheet
        visible={confirmDelete}
        title="Apagar projeto"
        message="Os recebimentos registados vão ser apagados. Os movimentos ligados deixam de estar associados a eles."
        confirmLabel="Apagar"
        destructive
        onConfirm={() => {
          setConfirmDelete(false);
          remove(projectId);
          toast({ message: 'Projeto apagado' });
          router.back();
        }}
        onCancel={() => setConfirmDelete(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  body: {
    flex: 1,
    padding: spacing.lg,
    paddingTop: spacing.xl,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: 20,
    color: colors.text,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  summaryInfo: {
    flex: 1,
    gap: 2,
  },
  summaryLabel: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.glassText,
  },
  summaryFooter: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,.12)',
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.glassText,
  },
  payCard: {
    overflow: 'hidden',
  },
  payButton: {
    minHeight: 60,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  payLabel: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.text,
  },
  payHint: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textMuted,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.text,
  },
  optionMeta: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textMuted,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.text,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    minHeight: 48,
  },
  paymentIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.iconTileBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentInfo: {
    flex: 1,
  },
  paymentDate: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.text,
  },
  paymentMeta: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textMuted,
  },
  footerRow: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  textButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 44,
  },
  textButtonLabel: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.text,
  },
  deleteLabel: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.warn,
  },
  muted: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textMuted,
    paddingVertical: spacing.sm,
  },
});
