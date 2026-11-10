import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { Delete, X } from "lucide-react-native";

import { formatShortPt, todayISO } from "../src/domain/dates";
import { nextSalaryDate } from "../src/domain/salary";
import { useAvisoRapido } from "../src/ui/componentes/AvisoRapido";
import { fonts } from "../src/ui/tema";
import { useSalario } from "../src/features/salario/useSalario";

/* ───────── Design AB Finance ───────── */

const light = {
  bg: "#ededed",
  panel: "#ffffff",
  text: "#0d0d0d",
  muted: "#8d8d8d",
  circ: "#efefef",
  hbtn: "#ffffff",
  ring: "#dedede",
  acc: "#9c32d7",
  amb: "#ffd35b",
};

const dark: typeof light = {
  bg: "#000000",
  panel: "#141414",
  text: "#ffffff",
  muted: "#7a7a7a",
  circ: "#000000",
  hbtn: "#262626",
  ring: "#262626",
  acc: "#9c32d7",
  amb: "#ffd35b",
};

type Palette = typeof light;

function useAb() {
  const scheme = useColorScheme();
  const c = scheme === "dark" ? dark : light;
  const styles = useMemo(() => makeStyles(c), [c]);
  return { c, styles };
}

const kz = (n: number) =>
  `${Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ")} Kz`;

const DAY_CHIPS = [1, 5, 10, 15, 20, 25, 28, 30];
const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "00", "0", "<"];

/* ───────── Ecrã ───────── */

export default function SalaryScreen() {
  const { c, styles } = useAb();
  const router = useRouter();
  const toast = useAvisoRapido();
  const { settings, save } = useSalario();
  const today = todayISO();

  const [digits, setDigits] = useState(
    settings.amount === null ? "" : String(settings.amount),
  );
  const [day, setDay] = useState<number | null>(settings.day);
  const [adjust, setAdjust] = useState(settings.adjustBusinessDay);
  const [auto, setAuto] = useState(settings.autoIncome);

  const amount = digits.length > 0 ? Number(digits) : 0;
  const valid = amount > 0 && day !== null;

  const preview =
    day === null
      ? null
      : nextSalaryDate({ salaryDay: day, adjustBusinessDay: adjust, today });

  const pressKey = (key: string) =>
    setDigits((current) => {
      if (key === "<") return current.slice(0, -1);
      if (current === "" && key.startsWith("0")) return current;
      return (current + key).slice(0, 12);
    });

  const savingRef = useRef(false);
  const guardar = () => {
    if (savingRef.current) return;
    if (!valid) {
      toast({ message: "Indica o valor e o dia do salário" });
      return;
    }

    savingRef.current = true;
    try {
      save({ amount, day, adjustBusinessDay: adjust, autoIncome: auto });
      toast({ message: "Salário atualizado" });
      router.back();
    } catch (caught) {
      savingRef.current = false;
      toast({
        message:
          caught instanceof Error
            ? caught.message
            : "Não foi possível guardar.",
        tone: "error",
      });
    }
  };

  return (
    <View style={styles.root}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Topo */}
          <View style={styles.top}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Fechar"
              onPress={() => router.back()}
              style={({ pressed }) => [
                styles.circBtn,
                pressed && styles.pressed,
              ]}
            >
              <X size={20} color={c.text} strokeWidth={1.6} />
            </Pressable>
          </View>

          <Text style={styles.h1}>Salário</Text>
          <Text style={styles.sub}>Define quanto recebes e quando cai.</Text>

          {/* Cartão âmbar + cartão roxo sobrepostos */}
          <View style={styles.stack}>
            <View style={styles.sal}>
              <View style={styles.dots}>
                <View style={styles.dotA} />
                <View style={styles.dotB} />
              </View>
              <Text style={styles.salText}>
                {preview
                  ? `Salário • ${formatShortPt(preview)}`
                  : "Salário • escolhe o dia"}
              </Text>
            </View>

            <View style={styles.main}>
              <Text style={styles.lbl}>Valor mensal</Text>
              <Text style={styles.big} accessibilityLabel={kz(amount)}>
                {kz(amount)}
              </Text>
              <View style={styles.io}>
                <View style={styles.ioBox}>
                  <Text style={styles.ioLabel}>Dia do mês</Text>
                  <Text style={styles.ioValue}>
                    {day === null ? "—" : String(day)}
                  </Text>
                </View>
                <View style={styles.ioBox}>
                  <Text style={styles.ioLabel}>Lançamento</Text>
                  <Text style={styles.ioValue}>
                    {auto ? "Automático" : "Manual"}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Teclado */}
          <View style={[styles.panel, styles.keypad]}>
            {KEYS.map((key) => (
              <Pressable
                key={key}
                accessibilityRole="button"
                accessibilityLabel={key === "<" ? "Apagar" : key}
                onPress={() => pressKey(key)}
                style={({ pressed }) => [styles.key, pressed && styles.pressed]}
              >
                {key === "<" ? (
                  <Delete size={22} color={c.muted} strokeWidth={1.6} />
                ) : (
                  <Text style={styles.keyText}>{key}</Text>
                )}
              </Pressable>
            ))}
          </View>

          {/* Dia */}
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Dia em que cai</Text>
            <View style={styles.daysRow}>
              {DAY_CHIPS.map((value) => {
                const active = day === value;
                return (
                  <Pressable
                    key={value}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    onPress={() => setDay(value)}
                    style={({ pressed }) => [
                      styles.dayChip,
                      active && styles.dayChipActive,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text
                      style={[styles.dayText, active && styles.dayTextActive]}
                    >
                      {String(value)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Opções */}
          <View style={styles.panel}>
            <ToggleRow
              title="Ajustar ao dia útil"
              subtitle="Se cair ao fim de semana, conta na sexta"
              value={adjust}
              onChange={setAdjust}
            />
            <ToggleRow
              title="Lançar como receita"
              subtitle="Regista nos movimentos no dia certo"
              value={auto}
              onChange={setAuto}
            />
          </View>

          {/* Guardar */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Guardar salário"
            accessibilityState={{ disabled: !valid }}
            disabled={!valid}
            onPress={guardar}
            style={({ pressed }) => [
              styles.go,
              !valid && styles.goDisabled,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.goLabel}>Guardar</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

/* ───────── Componentes locais ───────── */

function ToggleRow({
  title,
  subtitle,
  value,
  onChange,
}: {
  title: string;
  subtitle: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  const { styles } = useAb();

  return (
    <View style={styles.tg}>
      <View style={styles.tgText}>
        <Text style={styles.tgTitle}>{title}</Text>
        <Text style={styles.tgSubtitle}>{subtitle}</Text>
      </View>
      <Switch value={value} onChange={onChange} label={title} />
    </View>
  );
}

function Switch({
  value,
  onChange,
  label,
}: {
  value: boolean;
  onChange: (value: boolean) => void;
  label: string;
}) {
  const { styles } = useAb();
  const x = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(x, {
      toValue: value ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [value, x]);

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value }}
      onPress={() => onChange(!value)}
      style={[styles.sw, value && styles.swOn]}
    >
      <Animated.View
        style={[
          styles.swKnob,
          {
            transform: [
              {
                translateX: x.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 18],
                }),
              },
            ],
          },
        ]}
      />
    </Pressable>
  );
}

/* ───────── Estilos ───────── */

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: c.bg },
    flex: { flex: 1 },
    content: {
      paddingHorizontal: 18,
      paddingTop: 56,
      paddingBottom: 48,
    },
    pressed: { transform: [{ scale: 0.94 }] },

    top: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    circBtn: {
      width: 46,
      height: 46,
      borderRadius: 23,
      backgroundColor: c.hbtn,
      alignItems: "center",
      justifyContent: "center",
    },
    h1: {
      fontFamily: fonts.medium,
      fontSize: 27,
      lineHeight: 34,
      letterSpacing: -0.4,
      color: c.text,
      marginTop: 16,
    },
    sub: {
      fontFamily: fonts.regular,
      fontSize: 12,
      color: c.muted,
      marginTop: 3,
    },

    /* cartões sobrepostos */
    stack: { marginTop: 16 },
    sal: {
      backgroundColor: c.amb,
      borderRadius: 24,
      height: 100,
      paddingTop: 20,
      paddingLeft: 16,
      paddingRight: 18,
      flexDirection: "row",
      justifyContent: "space-between",
    },
    dots: { flexDirection: "row", alignItems: "center", height: 16 },
    dotA: {
      width: 13,
      height: 13,
      borderRadius: 7,
      backgroundColor: "#111111",
    },
    dotB: {
      width: 15,
      height: 15,
      borderRadius: 8,
      marginLeft: -5,
      backgroundColor: "#111111",
      borderWidth: 1.5,
      borderColor: c.amb,
    },
    salText: {
      fontFamily: fonts.regular,
      fontSize: 14,
      color: "#111111",
    },
    main: {
      backgroundColor: c.acc,
      borderRadius: 24,
      padding: 20,
      marginTop: -47,
    },
    lbl: {
      fontFamily: fonts.regular,
      fontSize: 12,
      color: "#ffffffd9",
    },
    big: {
      fontFamily: fonts.medium,
      fontSize: 33,
      lineHeight: 44,
      letterSpacing: -0.6,
      color: "#ffffff",
    },
    io: { flexDirection: "row", gap: 10, marginTop: 12 },
    ioBox: {
      flex: 1,
      backgroundColor: "#ffffff22",
      borderRadius: 16,
      paddingVertical: 9,
      paddingHorizontal: 12,
    },
    ioLabel: {
      fontFamily: fonts.regular,
      fontSize: 11,
      color: "#ffffff",
    },
    ioValue: {
      fontFamily: fonts.medium,
      fontSize: 14,
      color: "#ffffff",
      marginTop: 2,
    },

    /* painéis */
    panel: {
      backgroundColor: c.panel,
      borderRadius: 28,
      paddingVertical: 18,
      paddingHorizontal: 14,
      marginTop: 16,
    },
    panelTitle: {
      fontFamily: fonts.medium,
      fontSize: 14,
      color: c.text,
    },

    /* teclado */
    keypad: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "center",
      gap: 14,
    },
    key: {
      width: 68,
      height: 68,
      borderRadius: 34,
      backgroundColor: c.circ,
      alignItems: "center",
      justifyContent: "center",
    },
    keyText: {
      fontFamily: fonts.medium,
      fontSize: 22,
      color: c.text,
    },

    /* dias */
    daysRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginTop: 14,
    },
    dayChip: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: c.circ,
      alignItems: "center",
      justifyContent: "center",
    },
    dayChipActive: { backgroundColor: c.acc },
    dayText: {
      fontFamily: fonts.medium,
      fontSize: 14,
      color: c.text,
    },
    dayTextActive: { color: "#ffffff" },

    /* toggles */
    tg: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      paddingVertical: 12,
      paddingHorizontal: 4,
    },
    tgText: { flex: 1 },
    tgTitle: {
      fontFamily: fonts.regular,
      fontSize: 13,
      color: c.text,
    },
    tgSubtitle: {
      fontFamily: fonts.regular,
      fontSize: 10,
      color: c.muted,
      marginTop: 1,
    },
    sw: {
      width: 44,
      height: 26,
      borderRadius: 13,
      backgroundColor: c.ring,
      justifyContent: "center",
      paddingHorizontal: 3,
    },
    swOn: { backgroundColor: c.acc },
    swKnob: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: "#ffffff",
    },

    /* guardar */
    go: {
      height: 50,
      borderRadius: 25,
      backgroundColor: c.acc,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 18,
    },
    goDisabled: { opacity: 0.5 },
    goLabel: {
      fontFamily: fonts.medium,
      fontSize: 14,
      color: "#ffffff",
    },
  });
