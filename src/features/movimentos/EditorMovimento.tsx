import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Calendar,
  Car,
  Delete,
  Heart,
  Home,
  MoreHorizontal,
  Plus,
  Star,
  Trash,
  Utensils,
  Wallet,
  Zap,
} from "lucide-react-native";

import { CATEGORIES, DEFAULT_CATEGORY } from "../../domain/categories";
import { suggestCategory } from "../../domain/categoryHints";
import { parseISO, toISO, todayISO } from "../../domain/dates";
import { formatKz } from "../../domain/money";
import { ChipsRapidos } from "../../ui/componentes/ChipsRapidos";
import { FolhaConfirmacao } from "../../ui/componentes/FolhaConfirmacao";
import { useAvisoRapido } from "../../ui/componentes/AvisoRapido";
import { fonts, useTema, useEstilosTema, type Cores } from "../../ui/tema";
import {
  createMovement,
  deleteMovement,
  restoreMovement,
  updateMovement,
  type MovementInput,
  type MovementRow,
  type MovementType,
} from "../../repos/movements";
import {
  useSugestoesCategoria,
  useChipsRapidos,
  type DadosChipRapido,
} from "./useAtalhosRapidos";
import { useResumoMes } from "./useResumoMes";
import { sincronizarInteligenciaAposMovimento } from "../inteligencia/motor";

const TYPE_OPTIONS: { value: MovementType; label: string }[] = [
  { value: "income", label: "Receita" },
  { value: "expense", label: "Despesa" },
];

const MESES = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

// Ícone + cor por categoria (iguais ao protótipo HTML)
const CAT_STYLE: { match: string; Icon: typeof Plus; color: string }[] = [
  { match: "comid", Icon: Utensils, color: "#f08a3c" },
  { match: "casa", Icon: Home, color: "#4d8bf0" },
  { match: "servi", Icon: Zap, color: "#d9a514" },
  { match: "transp", Icon: Car, color: "#2fb5a3" },
  { match: "lazer", Icon: Star, color: "#e0569a" },
  { match: "sa", Icon: Heart, color: "#e2574c" },
  { match: "sal", Icon: Wallet, color: "#1f9d57" },
  { match: "extra", Icon: Plus, color: "#1f9d57" },
];
const CAT_FALLBACK = { Icon: MoreHorizontal, color: "#8d8d8d" };

function catStyle(label: string) {
  const n = label
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  return CAT_STYLE.find((c) => n.startsWith(c.match)) ?? CAT_FALLBACK;
}

// CATEGORIES pode ser lista de strings ou de objetos: aceitamos os dois
function catId(c: unknown): string {
  if (typeof c === "string") return c;
  const o = c as { id?: string; key?: string; value?: string; name?: string };
  return o.id ?? o.key ?? o.value ?? o.name ?? "";
}
function catLabel(c: unknown): string {
  if (typeof c === "string") return c;
  const o = c as { label?: string; name?: string; id?: string };
  return o.label ?? o.name ?? o.id ?? "";
}

function isDarkColor(hex: string | undefined): boolean {
  if (!hex || hex[0] !== "#") return true;
  let h = hex.slice(1);
  if (h.length === 3)
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  if (h.length < 6) return true;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  if ([r, g, b].some((n) => Number.isNaN(n))) return true;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.5;
}

const fmtNum = (d: string) => d.replace(/\B(?=(\d{3})+(?!\d))/g, " ");

function fmtDate(iso: string, today: string): string {
  if (iso === today) return "Hoje";
  const p = iso.split("-");
  if (p.length < 3) return iso;
  return `${Number(p[2])} ${MESES[Number(p[1]) - 1]} ${p[0]}`;
}

/**
 * Editor de um movimento (novo ou existente), com o aspeto do protótipo:
 * folha inferior, controlo Receita/Despesa, valor grande, descrição,
 * categorias com ícone, data, botão guardar e teclado numérico próprio.
 *
 * Regras principais:
 * - 'actionLockRef' bloqueia duplo toque em guardar/apagar (só destrava em erro).
 * - A categoria é sugerida pela nota enquanto o utilizador não a escolher
 *   manualmente ('categoryTouched').
 * - Cada gravação notifica o motor de inteligência e mostra um aviso com
 *   "Desfazer" que inverte a operação (repõe ou apaga).
 * - Movimentos ligados a pagamentos são somente de leitura aqui.
 */
export function EditorMovimento({
  movement,
  initialType = "expense",
}: {
  movement: MovementRow | null;
  initialType?: MovementType;
}) {
  const { colors } = useTema();
  const styles = useEstilosTema(makeStyles);
  const ins = useSafeAreaInsets();
  const today = todayISO();
  const router = useRouter();
  const toast = useAvisoRapido();
  const hints = useSugestoesCategoria();
  const quickChips = useChipsRapidos(today);
  const actionLockRef = useRef(false);

  const dark = isDarkColor(colors.bg);
  const sheetBg = dark ? "#141414" : "#ffffff";
  const fieldBg = dark ? "#000000" : "#efefef";
  const keyBg = dark ? "#1d1d1d" : "#ffffff";

  const [type, setType] = useState<MovementType>(movement?.type ?? initialType);
  const [digits, setDigits] = useState(() =>
    movement ? String(movement.amount) : "",
  );
  const [note, setNote] = useState(movement?.note ?? "");
  const [date, setDate] = useState(movement?.date ?? today);
  const [category, setCategory] = useState(
    movement?.category ?? DEFAULT_CATEGORY,
  );
  const [categoryTouched, setCategoryTouched] = useState(movement !== null);
  const [showPicker, setShowPicker] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [kbOpen, setKbOpen] = useState(true);

  const suggestion = useMemo(() => suggestCategory(note, hints), [note, hints]);

  useEffect(() => {
    if (!categoryTouched && suggestion && suggestion !== category) {
      setCategory(suggestion);
    }
  }, [suggestion, categoryTouched, category]);

  const amount = digits.length > 0 ? Number(digits) : 0;
  const canChangeType = movement === null || movement.origin === "manual";

  // Limite diário derivado do limite mensal — é o mesmo valor que o Início
  // mostra como "podes gastar X por dia". Serve para o travão antes de gravar.
  const resumo = useResumoMes(today);
  const limiteDiario = resumo.summary.dailyLimit;
  const [confirmarLimite, setConfirmarLimite] = useState(false);

  // Ao editar um gasto de hoje, o valor antigo não pode contar duas vezes.
  const gastoHojeSemEste =
    resumo.summary.todaySpent -
    (movement && movement.type === "expense" && movement.date === today
      ? movement.amount
      : 0);
  const totalDoDia =
    gastoHojeSemEste + (type === "expense" && date === today ? amount : 0);
  const excedeLimiteDiario =
    type === "expense" &&
    date === today &&
    limiteDiario !== null &&
    limiteDiario > 0 &&
    totalDoDia > limiteDiario;

  const aplicarChipRapido = useCallback(
    (chip: DadosChipRapido) => {
      if (actionLockRef.current || chip.amount <= 0) {
        return;
      }

      actionLockRef.current = true;
      try {
        const chipCategory =
          chip.category ??
          suggestCategory(chip.note ?? "", hints) ??
          DEFAULT_CATEGORY;
        const input: MovementInput = {
          type: chip.type,
          amount: chip.amount,
          category: chipCategory,
          date: today,
          note: chip.note,
        };

        const created = createMovement(input);
        sincronizarInteligenciaAposMovimento();
        toast({
          message: `Registado ${chip.label}`,
          actionLabel: "Desfazer",
          onAction: () => {
            deleteMovement(created.id);
            sincronizarInteligenciaAposMovimento();
          },
        });
        router.back();
      } catch {
        actionLockRef.current = false;
        toast({ message: "Não foi possível registar o movimento." });
      }
    },
    [hints, router, toast, today],
  );

  const gravar = useCallback(() => {
    if (actionLockRef.current) return;

    actionLockRef.current = true;
    try {
      const trimmedNote = note.trim();
      const input: MovementInput = {
        type,
        amount,
        category,
        date,
        note: trimmedNote.length > 0 ? trimmedNote : null,
      };

      if (movement) {
        const previous = movement;
        updateMovement(previous.id, input);
        sincronizarInteligenciaAposMovimento();
        toast({
          message: "Movimento atualizado",
          actionLabel: "Desfazer",
          onAction: () => {
            updateMovement(previous.id, {
              type: previous.type,
              amount: previous.amount,
              category: previous.category,
              date: previous.date,
              note: previous.note,
            });
            sincronizarInteligenciaAposMovimento();
          },
        });
      } else {
        const created = createMovement(input);
        sincronizarInteligenciaAposMovimento();
        // Mensagem igual à do protótipo: num gasto de hoje com limite
        // definido, mostra quanto resta (ou avisa se o limite foi passado).
        const mensagem =
          type === "expense" && date === today && limiteDiario !== null
            ? totalDoDia >= limiteDiario
              ? `Limite diário atingido · gastaste ${formatKz(totalDoDia)} hoje`
              : totalDoDia >= limiteDiario * 0.8
                ? `Quase no limite · usaste ${Math.round(
                    (totalDoDia / limiteDiario) * 100,
                  )}% do limite diário`
                : `Gasto registado · restam ${formatKz(limiteDiario - totalDoDia)} hoje`
            : "Movimento registado";
        toast({
          message: mensagem,
          actionLabel: "Desfazer",
          onAction: () => {
            deleteMovement(created.id);
            sincronizarInteligenciaAposMovimento();
          },
        });
      }

      router.back();
    } catch (error) {
      actionLockRef.current = false;
      toast({
        message:
          error instanceof Error
            ? error.message
            : "Não foi possível guardar o movimento.",
        tone: "error",
      });
    }
  }, [
    amount,
    category,
    date,
    limiteDiario,
    movement,
    note,
    router,
    toast,
    totalDoDia,
    type,
  ]);

  const guardar = useCallback(() => {
    if (actionLockRef.current) return;
    if (amount <= 0) {
      toast({ message: "Indica um valor maior que zero" });
      return;
    }

    // Travão de segurança: antes de gravar um gasto de hoje que passa o limite
    // diário, pede confirmação com os três valores (protótipo: "Vais passar o
    // limite de hoje"). Não trava nada se ainda não houver limite definido.
    if (excedeLimiteDiario) {
      setConfirmarLimite(true);
      return;
    }

    gravar();
  }, [amount, excedeLimiteDiario, gravar, toast]);

  const apagar = useCallback(() => {
    if (!movement || actionLockRef.current) {
      return;
    }

    actionLockRef.current = true;
    try {
      const deleted = movement;
      deleteMovement(deleted.id);
      sincronizarInteligenciaAposMovimento();
      setConfirmDelete(false);
      toast({
        message: "Movimento apagado",
        actionLabel: "Desfazer",
        onAction: () => {
          restoreMovement(deleted);
          sincronizarInteligenciaAposMovimento();
        },
      });
      router.back();
    } catch (error) {
      actionLockRef.current = false;
      setConfirmDelete(false);
      toast({
        message:
          error instanceof Error
            ? error.message
            : "Não foi possível apagar o movimento.",
        tone: "error",
      });
    }
  }, [movement, router, toast]);

  // Teclado numérico
  const onDigit = (key: string) =>
    setDigits((cur) => {
      if (key === "00") return cur ? (cur + "00").slice(0, 12) : cur;
      return cur === "0" ? key : (cur + key).slice(0, 12);
    });
  const onBackspace = () => setDigits((cur) => cur.slice(0, -1));

  const Key = ({
    label,
    onPress,
    flex = 1,
    children,
  }: {
    label: string;
    onPress: () => void;
    flex?: number;
    children?: React.ReactNode;
  }) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.key,
        { flex, backgroundColor: keyBg },
        pressed && { opacity: 0.6, transform: [{ scale: 0.95 }] },
      ]}
    >
      {children ?? <Text style={styles.keyTxt}>{label}</Text>}
    </Pressable>
  );

  return (
    <View style={styles.root}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <View style={[styles.sheet, { backgroundColor: sheetBg }]}>
          <View style={[styles.grab, { backgroundColor: colors.hairline }]} />

          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.title}>
              {movement ? "Editar movimento" : "Novo movimento"}
            </Text>

            {/* Receita / Despesa */}
            <View style={[styles.seg, { backgroundColor: fieldBg }]}>
              {TYPE_OPTIONS.map((o) => {
                const on = type === o.value;
                return (
                  <Pressable
                    key={o.value}
                    style={[
                      styles.segBtn,
                      on && { backgroundColor: colors.accent },
                    ]}
                    onPress={() => canChangeType && setType(o.value)}
                  >
                    <Text
                      style={[
                        styles.segTxt,
                        { color: on ? "#fff" : colors.textMuted },
                      ]}
                    >
                      {o.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Valor */}
            <Pressable
              onPress={() => setKbOpen(true)}
              style={[
                styles.underline,
                { borderBottomColor: kbOpen ? colors.accent : colors.hairline },
              ]}
              accessibilityLabel="Valor em Kz"
            >
              <Text
                style={[
                  styles.value,
                  { color: digits ? colors.text : colors.textMuted },
                ]}
              >
                {digits ? fmtNum(digits) : "0 Kz"}
              </Text>
            </Pressable>

            {/* Descrição */}
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Descrição (ex.: Supermercado)"
              placeholderTextColor={colors.textMuted}
              style={[
                styles.input,
                styles.underline,
                { borderBottomColor: colors.hairline },
              ]}
              returnKeyType="done"
              onFocus={() => setKbOpen(false)}
              accessibilityLabel="Descrição"
            />

            {/* Categorias */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.cats}
              style={styles.catsWrap}
            >
              {CATEGORIES.map((c: unknown) => {
                const id = catId(c);
                const label = catLabel(c);
                const { Icon, color } = catStyle(label);
                const on = category === id;
                return (
                  <Pressable
                    key={id}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: on }}
                    onPress={() => {
                      setCategory(id);
                      setCategoryTouched(true);
                    }}
                    style={[
                      styles.cc,
                      { backgroundColor: fieldBg, borderColor: "transparent" },
                      on && {
                        backgroundColor: color + "1f",
                        borderColor: color,
                      },
                    ]}
                  >
                    <Icon size={14} color={color} strokeWidth={1.8} />
                    <Text style={[styles.ccTxt, { color: colors.text }]}>
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Data */}
            <Pressable
              onPress={() => setShowPicker(true)}
              style={[
                styles.input,
                styles.underline,
                styles.dateRow,
                { borderBottomColor: colors.hairline },
              ]}
              accessibilityLabel="Data"
            >
              <Calendar size={18} color={colors.textMuted} strokeWidth={1.6} />
              <Text style={[styles.dateTxt, { color: colors.text }]}>
                {fmtDate(date, today)}
              </Text>
            </Pressable>

            {/* Atalhos rápidos */}
            {quickChips.length > 0 ? (
              <View style={styles.quick}>
                <Text style={styles.sectionLabel}>
                  Rápidos · um toque guarda
                </Text>
                <ChipsRapidos
                  items={quickChips.map((chip) => ({
                    key: chip.key,
                    label: chip.label,
                    highlighted: chip.highlighted,
                  }))}
                  onSelect={(key) => {
                    const chip = quickChips.find((item) => item.key === key);
                    if (chip) aplicarChipRapido(chip);
                  }}
                />
              </View>
            ) : null}

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Guardar movimento"
              onPress={guardar}
              style={[styles.go, { backgroundColor: colors.accent }]}
            >
              <Text style={styles.goTxt}>
                {movement ? "Guardar alterações" : "Guardar movimento"}
              </Text>
            </Pressable>

            {movement?.origin === "manual" ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => setConfirmDelete(true)}
                style={[styles.go, styles.ghost, { backgroundColor: fieldBg }]}
              >
                <Trash color={colors.warn} size={18} strokeWidth={2} />
                <Text style={[styles.goTxt, { color: colors.warn }]}>
                  Apagar movimento
                </Text>
              </Pressable>
            ) : null}
            {movement && movement.origin !== "manual" ? (
              <Text style={styles.linkedHint}>
                Este movimento pertence a um pagamento. Edita ou apaga-o no
                módulo de origem.
              </Text>
            ) : null}
          </ScrollView>

          {/* Teclado numérico próprio (4 colunas, como no protótipo) */}
          {kbOpen ? (
            <View
              style={[
                styles.kb,
                {
                  backgroundColor: colors.bg,
                  borderTopColor: colors.hairline,
                  paddingBottom: 12 + ins.bottom,
                },
              ]}
            >
              <View style={styles.kbLeft}>
                <View style={styles.kbRow}>
                  {["1", "2", "3"].map((k) => (
                    <Key key={k} label={k} onPress={() => onDigit(k)} />
                  ))}
                </View>
                <View style={styles.kbRow}>
                  {["4", "5", "6"].map((k) => (
                    <Key key={k} label={k} onPress={() => onDigit(k)} />
                  ))}
                </View>
                <View style={styles.kbRow}>
                  {["7", "8", "9"].map((k) => (
                    <Key key={k} label={k} onPress={() => onDigit(k)} />
                  ))}
                </View>
                <View style={styles.kbRow}>
                  <Key label="0" flex={2} onPress={() => onDigit("0")} />
                  <Key label="00" onPress={() => onDigit("00")} />
                </View>
              </View>
              <View style={styles.kbRight}>
                <Key label="Apagar" onPress={onBackspace}>
                  <Delete size={22} color={colors.text} />
                </Key>
                <View style={styles.kbSpacer} />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Concluir"
                  onPress={() => setKbOpen(false)}
                  style={({ pressed }) => [
                    styles.key,
                    styles.kbOk,
                    { backgroundColor: colors.accent },
                    pressed && { opacity: 0.85 },
                  ]}
                >
                  <Text
                    style={[styles.keyTxt, { color: "#fff", fontSize: 15 }]}
                  >
                    OK
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : null}
        </View>
      </KeyboardAvoidingView>

      {showPicker ? (
        <DateTimePicker
          value={parseISO(date)}
          mode="date"
          display="default"
          maximumDate={new Date()}
          onChange={(_event, selected) => {
            setShowPicker(false);
            if (selected) {
              setDate(toISO(selected));
            }
          }}
        />
      ) : null}

      <FolhaConfirmacao
        visible={confirmDelete}
        title="Apagar movimento"
        message="O movimento será removido e os pagamentos ligados deixam de estar associados a ele."
        confirmLabel="Apagar"
        destructive
        onConfirm={apagar}
        onCancel={() => setConfirmDelete(false)}
      />

      <FolhaConfirmacao
        visible={confirmarLimite}
        title="Vais passar o limite de hoje"
        message={`Já gastaste hoje ${formatKz(gastoHojeSemEste)}.\nEste gasto são ${formatKz(amount)}.\nFicas ${formatKz(totalDoDia - (limiteDiario ?? 0))} acima do limite diário de ${formatKz(limiteDiario ?? 0)}.`}
        confirmLabel="Guardar mesmo assim"
        cancelLabel="Não gastar agora"
        onConfirm={() => {
          setConfirmarLimite(false);
          gravar();
        }}
        onCancel={() => setConfirmarLimite(false)}
      />
    </View>
  );
}

const KEY_H = 46;

const makeStyles = (colors: Cores) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    flex: { flex: 1 },
    sheet: {
      flex: 1,
      marginTop: 40,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      overflow: "hidden",
    },
    grab: {
      width: 40,
      height: 4,
      borderRadius: 4,
      alignSelf: "center",
      marginTop: 10,
    },
    content: {
      paddingHorizontal: 22,
      paddingTop: 14,
      paddingBottom: 24,
    },
    title: {
      fontFamily: fonts.bold,
      fontSize: 18,
      color: colors.text,
      marginBottom: 12,
    },
    seg: {
      flexDirection: "row",
      borderRadius: 99,
      padding: 3,
      gap: 3,
    },
    segBtn: {
      flex: 1,
      paddingVertical: 8,
      borderRadius: 99,
      alignItems: "center",
    },
    segTxt: { fontFamily: fonts.medium, fontSize: 12 },
    underline: {
      borderBottomWidth: 1.5,
      marginTop: 10,
    },
    value: {
      fontFamily: fonts.medium,
      fontSize: 30,
      paddingVertical: 10,
    },
    input: {
      fontFamily: fonts.medium,
      fontSize: 16,
      color: colors.text,
      paddingVertical: 10,
    },
    catsWrap: { marginTop: 12, marginHorizontal: -22 },
    cats: { paddingHorizontal: 22, gap: 6 },
    cc: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      height: 32,
      paddingLeft: 10,
      paddingRight: 12,
      borderRadius: 99,
      borderWidth: 1.5,
    },
    ccTxt: { fontFamily: fonts.medium, fontSize: 12 },
    dateRow: { flexDirection: "row", alignItems: "center", gap: 10 },
    dateTxt: { fontFamily: fonts.medium, fontSize: 16 },
    quick: { marginTop: 16, gap: 8 },
    sectionLabel: {
      fontFamily: fonts.regular,
      fontSize: 12,
      color: colors.textMuted,
    },
    go: {
      height: 50,
      marginTop: 18,
      borderRadius: 25,
      alignItems: "center",
      justifyContent: "center",
    },
    goTxt: { fontFamily: fonts.medium, fontSize: 14, color: "#fff" },
    ghost: { flexDirection: "row", gap: 8 },
    linkedHint: {
      fontFamily: fonts.regular,
      fontSize: 12,
      lineHeight: 17,
      color: colors.textMuted,
      textAlign: "center",
      marginTop: 16,
    },
    // teclado
    kb: {
      flexDirection: "row",
      gap: 7,
      paddingTop: 10,
      paddingHorizontal: 12,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopLeftRadius: 22,
      borderTopRightRadius: 22,
    },
    kbLeft: { flex: 3, gap: 7 },
    kbRight: { flex: 1, gap: 7 },
    kbRow: { flexDirection: "row", gap: 7 },
    kbSpacer: { height: KEY_H },
    kbOk: { height: KEY_H * 2 + 7, flex: 0 },
    key: {
      height: KEY_H,
      borderRadius: 15,
      alignItems: "center",
      justifyContent: "center",
    },
    keyTxt: {
      fontFamily: fonts.medium,
      fontSize: 19,
      color: colors.text,
    },
  });
