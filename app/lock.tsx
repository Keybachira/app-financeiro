import { useCallback, useEffect, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Delete, Lock } from "lucide-react-native";

// [2026-11-10] Substituído pelo teclado circular abaixo (mantido para referência):
// import { AmountKeypad } from '../src/ui/components/AmountKeypad';
import { IconTile } from "../src/ui/components/IconTile";
import { ScreenBackground } from "../src/ui/components/ScreenBackground";
import { fonts, spacing, useThemedStyles, type Colors } from "../src/ui/theme";
import { useLockState } from "../src/features/security/useLockState";
import { useUserAvatar } from "../src/features/settings/useSettings";

// [2026-11-10] Chave local onde o avatar configurado é guardado (ajusta se for outra)

const DIAS = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
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

const KEYS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
] as const;

// [2026-11-10] Relógio + data ("08:05" / "Terça, 10 Nov"), atualiza a cada 15s
function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(id);
  }, []);
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  return {
    time: `${hh}:${mm}`,
    date: `${DIAS[now.getDay()]}, ${now.getDate()} ${MESES[now.getMonth()]}`,
  };
}

// [2026-11-10] Deteta tema escuro pela luminância do fundo (fallback: escuro).
// Não depende de nenhum hook extra do tema.
function isDarkColor(hex: string | undefined): boolean {
  if (!hex || typeof hex !== "string" || hex[0] !== "#") return true;
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

type LockScreenProps = {
  onUnlocked?: () => void;
  avatarUri?: string | null; // [2026-11-10] avatar vindo do perfil (tem prioridade)
  title?: string; // [2026-11-10]
  subtitle?: string; // [2026-11-10]
  onCancel?: () => void; // [2026-11-10] botão "Cancelar"
};

export function LockScreen({
  onUnlocked,
  avatarUri,
  title = "Introduz o PIN",
  subtitle = "Digita os 4 dígitos",
  onCancel,
}: LockScreenProps) {
  const styles = useThemedStyles(makeStyles);
  const { unlock } = useLockState();
  const { avatar: configuredAvatar } = useUserAvatar();
  const [digits, setDigits] = useState("");
  const [error, setError] = useState(false);
  const { time, date } = useNow();

  // [2026-11-10] Avatar: prop > guardado localmente > ícone de cadeado (fallback)
  const avatar = avatarUri || configuredAvatar || null;

  // [2026-11-10] Cor do ícone de apagar vem do estilo do tema (igual à dos números)
  const deleteColor =
    (StyleSheet.flatten(styles.keyTxt) as { color?: string }).color ?? "#fff";

  const attempt = useCallback(
    async (pin: string) => {
      const ok = await unlock(pin);

      if (ok) {
        onUnlocked?.();
        return;
      }

      setError(true);
      setDigits("");
    },
    [unlock, onUnlocked],
  );

  useEffect(() => {
    if (digits.length === 4) {
      void attempt(digits);
    }
  }, [digits, attempt]);

  // [2026-11-10] Handlers do teclado
  const onDigit = (key: string) => {
    // `slice` é obrigatório para nunca passar de 4 dígitos
    setError(false);
    setDigits((current) => (current + key).slice(0, 4));
  };
  const onBackspace = () => {
    setError(false);
    setDigits((current) => current.slice(0, -1));
  };
  const handleCancel = () => {
    setError(false);
    setDigits("");
    onCancel?.();
  };

  return (
    <View style={styles.root}>
      <ScreenBackground />
      <View style={styles.body}>
        {/* [2026-11-10] Relógio e data */}
        <View style={styles.clockWrap}>
          <Text style={styles.clock}>{time}</Text>
          <Text style={styles.date}>{date}</Text>
        </View>

        <View style={styles.header}>
          {/* [2026-11-10] Avatar com anéis */}
          <View style={styles.ringOuter}>
            <View style={styles.ringInner}>
              {avatar ? (
                <Image source={{ uri: avatar }} style={styles.avatar} />
              ) : (
                <IconTile icon={Lock} size={64} iconSize={28} />
              )}
            </View>
          </View>
          {/* [2026-11-10] Antes:
          <IconTile icon={Lock} size={64} iconSize={28} />
          <Text style={styles.title}>Aplicação bloqueada</Text>
          <Text style={styles.subtitle}>Introduz o PIN de 4 dígitos para continuar.</Text>
          */}
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>

        <View style={styles.pinWrap}>
          {[0, 1, 2, 3].map((index) => (
            <View
              key={index}
              style={[
                styles.pinDot,
                index < digits.length && styles.pinDotFilled,
              ]}
            />
          ))}
        </View>

        {error ? (
          <Text style={styles.error}>PIN incorreto. Tenta outra vez.</Text>
        ) : null}

        {/* [2026-11-10] Teclado circular (substitui o AmountKeypad) */}
        <View style={styles.keypad}>
          {KEYS.map((row, i) => (
            <View key={i} style={styles.row}>
              {row.map((k) => (
                <Pressable
                  key={k}
                  style={({ pressed }) => [
                    styles.key,
                    pressed && styles.keyPressed,
                  ]}
                  onPress={() => onDigit(k)}
                  accessibilityLabel={`Dígito ${k}`}
                >
                  <Text style={styles.keyTxt}>{k}</Text>
                </Pressable>
              ))}
            </View>
          ))}
          <View style={styles.row}>
            <Pressable
              style={styles.keyGhost}
              onPress={handleCancel}
              accessibilityLabel="Cancelar"
            >
              <Text style={styles.cancelTxt}>Cancelar</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.key,
                pressed && styles.keyPressed,
              ]}
              onPress={() => onDigit("0")}
              accessibilityLabel="Dígito 0"
            >
              <Text style={styles.keyTxt}>0</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.key,
                styles.keyAlt,
                pressed && styles.keyPressed,
              ]}
              onPress={onBackspace}
              accessibilityLabel="Apagar"
            >
              {/* [2026-11-10] antes: color={colors_text} (branco fixo) */}
              <Delete size={24} color={deleteColor} />
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

export default LockScreen;

// [2026-11-10] Cor do ícone de apagar (branco fixo) — substituída por deleteColor, que segue o tema:
// const colors_text = "#fff";

const KEY = 68;

const makeStyles = (colors: Colors) => {
  // [2026-11-10] Paleta dependente do tema
  const dark = isDarkColor(colors.bg);
  const keyBg = dark ? "#ffffff14" : "#ffffff";
  const keyAltBg = dark ? "#ffffff0d" : "#ffffffcc";
  const keyPressedBg = dark ? "#ffffff2e" : "#0000001a";

  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    body: {
      flex: 1,
      padding: spacing.lg,
      paddingTop: spacing.xl,
      gap: spacing.lg,
      alignItems: "center",
    },
    // [2026-11-10] novos
    clockWrap: { alignItems: "center", marginTop: spacing.lg },
    clock: {
      fontFamily: fonts.bold,
      fontSize: 56,
      lineHeight: 64,
      // [2026-11-10] antes: color: "#fff",
      color: colors.text,
      letterSpacing: -1,
    },
    date: {
      fontFamily: fonts.regular,
      fontSize: 13,
      color: colors.textMuted,
      marginTop: 2,
    },
    ringOuter: {
      width: 116,
      height: 116,
      borderRadius: 58,
      borderWidth: 1,
      borderColor: colors.accent + "33",
      alignItems: "center",
      justifyContent: "center",
    },
    ringInner: {
      width: 92,
      height: 92,
      borderRadius: 46,
      borderWidth: 1,
      borderColor: colors.accent + "88",
      alignItems: "center",
      justifyContent: "center",
    },
    avatar: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: "#fff",
    },
    header: {
      alignItems: "center",
      gap: spacing.sm,
    },
    title: {
      fontFamily: fonts.bold,
      fontSize: 24,
      color: colors.text,
    },
    subtitle: {
      fontFamily: fonts.regular,
      fontSize: 14,
      color: colors.textMuted,
      textAlign: "center",
    },
    pinWrap: {
      flexDirection: "row",
      gap: spacing.md,
      marginTop: spacing.sm,
    },
    pinDot: {
      width: 14,
      height: 14,
      borderRadius: 7,
      borderWidth: 1,
      borderColor: colors.hairline,
    },
    pinDotFilled: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    error: {
      fontFamily: fonts.medium,
      fontSize: 14,
      color: colors.warn,
    },
    keypad: {
      alignSelf: "center",
      marginTop: spacing.md,
      gap: 14,
    },
    row: { flexDirection: "row", gap: 14, justifyContent: "center" },
    key: {
      width: KEY,
      height: KEY,
      borderRadius: KEY / 2,
      // [2026-11-10] antes: backgroundColor: "#ffffff14",
      backgroundColor: keyBg,
      alignItems: "center",
      justifyContent: "center",
    },
    // [2026-11-10] antes: keyAlt: { backgroundColor: "#ffffff0d" },
    keyAlt: { backgroundColor: keyAltBg },
    // [2026-11-10] antes: keyPressed: { backgroundColor: "#ffffff2e" },
    keyPressed: { backgroundColor: keyPressedBg },
    keyGhost: {
      width: KEY,
      height: KEY,
      alignItems: "center",
      justifyContent: "center",
    },
    // [2026-11-10] antes: color: "#fff"
    keyTxt: { fontFamily: fonts.medium, fontSize: 24, color: colors.text },
    cancelTxt: {
      fontFamily: fonts.regular,
      fontSize: 13,
      color: colors.textMuted,
    },
  });
};
