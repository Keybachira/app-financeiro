import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Delete, Lock } from "lucide-react-native";

import { IconeCirculo } from "../src/ui/componentes/IconeCirculo";
import { FundoEcra } from "../src/ui/componentes/FundoEcra";
import { fonts, spacing, useEstilosTema, type Cores } from "../src/ui/tema";
import { useEstadoBloqueio } from "../src/features/seguranca/useEstadoBloqueio";
import { useAvatarUtilizador } from "../src/features/definicoes/useDefinicoes";

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
  avatarUri?: string | null;
  title?: string;
  subtitle?: string;
  onCancel?: () => void;
  /** 'setup' cria um PIN novo (pede duas vezes) em vez de desbloquear. */
  mode?: "unlock" | "setup";
  /** Fim da criação do PIN, depois da animação de sucesso. */
  onCreated?: () => void;
};

export function LockScreen({
  onUnlocked,
  avatarUri,
  title = "Introduz o PIN",
  subtitle = "Digita os 4 dígitos",
  onCancel,
  mode = "unlock",
  onCreated,
}: LockScreenProps) {
  const styles = useEstilosTema(makeStyles);
  const { unlock, setPin, tentativasRestantes, bloqueadoAte } =
    useEstadoBloqueio();
  const { avatar: configuredAvatar } = useAvatarUtilizador();
  const [digits, setDigits] = useState("");
  const [error, setError] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  // Criação do PIN: escolhe 4 dígitos e depois repete para confirmar.
  const [step, setStep] = useState<"primeiro" | "confirmar">("primeiro");
  const [primeiro, setPrimeiro] = useState("");
  const { time, date } = useNow();

  // Bloqueio temporário depois de várias tentativas erradas: conta os segundos
  // que faltam e desliga o teclado até ao fim.
  const [restante, setRestante] = useState(0);

  useEffect(() => {
    if (bloqueadoAte === null) {
      setRestante(0);
      return undefined;
    }

    const segundos = () =>
      Math.max(0, Math.ceil((bloqueadoAte - Date.now()) / 1000));

    let id: ReturnType<typeof setInterval>;
    id = setInterval(() => {
      const falta = segundos();
      setRestante(falta);
      if (falta === 0) {
        clearInterval(id);
      }
    }, 1000);

    setRestante(segundos());
    return () => clearInterval(id);
  }, [bloqueadoAte]);

  const bloqueado = restante > 0;

  // [2026-11-10] Animações de desbloqueio
  const pop = useRef(new Animated.Value(1)).current; // pontos: "pop"
  const out = useRef(new Animated.Value(0)).current; // ecrã: saída
  const busy = useRef(false);

  useEffect(() => {
    return () => {
      pop.stopAnimation();
      out.stopAnimation();
    };
  }, [pop, out]);

  const avatar = avatarUri || configuredAvatar || null;

  const deleteColor =
    (StyleSheet.flatten(styles.keyTxt) as { color?: string }).color ?? "#fff";

  // No desbloqueio avisa o layout; na criação do PIN devolve o controlo ao
  // ecrã que a abriu (o onboarding).
  const finish = mode === "setup" ? onCreated : onUnlocked;

  // [2026-11-10] Pontos ficam verdes + pop, depois o ecrã faz zoom e desvanece
  const playUnlock = useCallback(() => {
    setUnlocking(true);
    Animated.sequence([
      Animated.timing(pop, {
        toValue: 1.6,
        duration: 200,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(pop, {
        toValue: 1,
        duration: 250,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => {
      Animated.timing(out, {
        toValue: 1,
        duration: 850,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: true,
      }).start(() => finish?.());
    });
  }, [pop, out, finish]);

  const attempt = useCallback(
    async (pin: string) => {
      if (busy.current) return;
      busy.current = true;

      const ok = await unlock(pin);

      if (ok) {
        playUnlock();
        return;
      }

      busy.current = false;
      setError(true);
      setDigits("");
    },
    [unlock, playUnlock],
  );

  // Só guarda o PIN quando a segunda introdução coincide com a primeira.
  const criar = useCallback(
    async (pin: string) => {
      if (busy.current) return;
      busy.current = true;

      try {
        await setPin(pin);
        playUnlock();
      } catch {
        busy.current = false;
        setError(true);
        setDigits("");
        setPrimeiro("");
        setStep("primeiro");
      }
    },
    [playUnlock, setPin],
  );

  useEffect(() => {
    if (mode !== "setup" || digits.length !== 4) return;

    if (step === "primeiro") {
      setPrimeiro(digits);
      setDigits("");
      setStep("confirmar");
      return;
    }

    if (digits === primeiro) {
      void criar(digits);
      return;
    }

    setError(true);
    setDigits("");
    setPrimeiro("");
    setStep("primeiro");
  }, [criar, digits, mode, primeiro, step]);

  useEffect(() => {
    if (mode === "unlock" && digits.length === 4 && !bloqueado) {
      void attempt(digits);
    }
  }, [attempt, bloqueado, digits, mode]);

  const onDigit = (key: string) => {
    if (unlocking || bloqueado) return;
    setError(false);
    setDigits((current) => (current + key).slice(0, 4));
  };
  const onBackspace = () => {
    if (unlocking || bloqueado) return;
    setError(false);
    setDigits((current) => current.slice(0, -1));
  };
  const handleCancel = () => {
    if (unlocking) return;
    setError(false);
    setDigits("");
    onCancel?.();
  };

  return (
    <Animated.View
      pointerEvents={unlocking ? "none" : "auto"}
      style={[
        styles.root,
        {
          opacity: out.interpolate({
            inputRange: [0, 0.4, 1],
            outputRange: [1, 1, 0],
          }),
          transform: [
            {
              scale: out.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 1.2],
              }),
            },
          ],
        },
      ]}
    >
      <FundoEcra />
      <View style={styles.body}>
        <View style={styles.clockWrap}>
          <Text style={styles.clock}>{time}</Text>
          <Text style={styles.date}>{date}</Text>
        </View>

        <View style={styles.header}>
          <View style={styles.ringOuter}>
            <View style={styles.ringInner}>
              {avatar ? (
                <Image source={{ uri: avatar }} style={styles.avatar} />
              ) : (
                <IconeCirculo icon={Lock} size={64} iconSize={28} />
              )}
            </View>
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>
            {mode === "setup"
              ? step === "primeiro"
                ? "Escolhe 4 dígitos"
                : "Repete o PIN para confirmar"
              : subtitle}
          </Text>
        </View>

        <View style={styles.pinWrap}>
          {[0, 1, 2, 3].map((index) => (
            <Animated.View
              key={index}
              style={[
                styles.pinDot,
                index < digits.length && styles.pinDotFilled,
                unlocking && styles.pinDotOk,
                { transform: [{ scale: pop }] },
              ]}
            />
          ))}
        </View>

        {mode === "unlock" && bloqueado ? (
          <Text style={styles.error}>
            Demasiadas tentativas. Tenta outra vez dentro de {restante}s.
          </Text>
        ) : error ? (
          <Text style={styles.error}>
            {mode === "setup"
              ? "Os PIN não coincidem. Tenta outra vez."
              : tentativasRestantes <= 2
                ? tentativasRestantes === 1
                  ? "PIN incorreto · resta 1 tentativa"
                  : `PIN incorreto · restam ${tentativasRestantes} tentativas`
                : "PIN incorreto. Tenta outra vez."}
          </Text>
        ) : null}

        <View style={[styles.keypad, bloqueado && styles.keypadBlocked]}>
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
              <Delete size={24} color={deleteColor} />
            </Pressable>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

export default LockScreen;

const KEY = 68;
const POS = "#1f9d57"; // verde de sucesso (igual ao --pos do protótipo)

const makeStyles = (colors: Cores) => {
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
    clockWrap: { alignItems: "center", marginTop: spacing.lg },
    clock: {
      fontFamily: fonts.bold,
      fontSize: 56,
      lineHeight: 64,
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
    // [2026-11-10] pontos verdes no desbloqueio
    pinDotOk: {
      backgroundColor: POS,
      borderColor: POS,
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
    keypadBlocked: { opacity: 0.4 },
    row: { flexDirection: "row", gap: 14, justifyContent: "center" },
    key: {
      width: KEY,
      height: KEY,
      borderRadius: KEY / 2,
      backgroundColor: keyBg,
      alignItems: "center",
      justifyContent: "center",
    },
    keyAlt: { backgroundColor: keyAltBg },
    keyPressed: { backgroundColor: keyPressedBg },
    keyGhost: {
      width: KEY,
      height: KEY,
      alignItems: "center",
      justifyContent: "center",
    },
    keyTxt: { fontFamily: fonts.medium, fontSize: 24, color: colors.text },
    cancelTxt: {
      fontFamily: fonts.regular,
      fontSize: 13,
      color: colors.textMuted,
    },
  });
};
