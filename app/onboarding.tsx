import React, { useCallback, useState } from "react";
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
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ICON, num } from "../data";
import { useConfigModulos } from "../src/features/modulos/useConfigModulos";
import { useNomeUtilizador } from "../src/features/definicoes/useDefinicoes";
import { usePreferenciasApp } from "../src/features/definicoes/usePreferenciasApp";
import { useEstadoBloqueio } from "../src/features/seguranca/useEstadoBloqueio";
import { setSetting } from "../src/repos/settings";
import { EntradaAnimada } from "../src/ui/componentes/EntradaAnimada";
import {
  fonts,
  useEstilosTema,
  useTema,
  type Cores,
} from "../src/ui/tema";
import { LockScreen } from "./lock";

// Passos: 0 boas-vindas · 1 nome · 2 situação · 3 dados · 4 PIN · 5 pronto
export default function Onboarding() {
  const { colors } = useTema();
  const styles = useEstilosTema(makeStyles);
  const ins = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const [nome, setNome] = useState("");
  const [perfil, setPerfil] = useState<"e" | "p" | "">("");
  const [idade, setIdade] = useState("");
  const [renda, setRenda] = useState<boolean | null>(null);
  const [valor, setValor] = useState("");
  const [pinEnabled, setPinEnabled] = useState<boolean | null>(null);
  const [erro, setErro] = useState("");
  // O PIN é definido no ecrã de bloqueio, aberto por cima do onboarding.
  const [pinSetup, setPinSetup] = useState(false);

  const { removePin, hasPin } = useEstadoBloqueio();
  const { setName } = useNomeUtilizador();
  const { setProfile } = useConfigModulos();
  const { completeOnboarding } = usePreferenciasApp();
  const est = perfil === "e";

  const label =
    step === 0 ? "Começar" : step === 5 ? "Entrar na app" : "Continuar";

  const sair = () =>
    router.canGoBack() ? router.back() : router.replace("/" as never);

  const removePinHandler = useCallback(async () => {
    await removePin();
    setPinEnabled(false);
  }, [removePin]);

  const avancar = async () => {
    setErro("");
    if (step === 1 && !nome.trim()) return setErro("Indica o teu nome");
    if (step === 2 && !perfil) return setErro("Escolhe uma opção");
    if (step === 3 && renda && !(num(valor) > 0))
      return setErro("Indica o valor");
    if (step === 4) {
      if (pinEnabled === null) return setErro("Escolhe uma opção");
      // O PIN já foi criado no ecrã de bloqueio; aqui só se confirma que existe.
      if (pinEnabled && !hasPin) return setErro("Define um PIN de 4 dígitos");
    }
    if (step === 5) {
      setName(nome);
      setProfile(est ? "student" : "worker");
      if (idade.trim()) {
        setSetting("user_age", idade.trim());
      }
      // A mesada/salário fica só como configuração (pré-enche o ecrã do
      // salário). Não se cria nenhuma receita: o dinheiro só deve entrar no
      // saldo quando o utilizador o registar, ou quando ativar o lançamento
      // automático no ecrã do salário.
      const amount = num(valor);
      if (renda && amount > 0) {
        setSetting("salary_amount", String(amount));
      }
      completeOnboarding();
      return sair();
    }
    setStep(step + 1);
  };

  const Opcao = ({
    on,
    icon,
    titulo,
    sub,
    onPress,
  }: {
    on: boolean;
    icon: string;
    titulo: string;
    sub: string;
    onPress: () => void;
  }) => (
    <Pressable
      style={[styles.oc, on && styles.ocOn]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      accessibilityLabel={`${titulo}. ${sub}`}
    >
      <View style={styles.ocCirc}>
        <Feather name={ICON[icon]} size={20} color={colors.text} />
      </View>
      <View style={styles.ocBody}>
        <Text style={styles.ocTitle}>{titulo}</Text>
        <Text style={styles.ocSub}>{sub}</Text>
      </View>
    </Pressable>
  );

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View
        style={[
          styles.screen,
          {
            paddingTop: ins.top + 22,
            paddingBottom: ins.bottom + 24,
          },
        ]}
      >
        {/* progresso (`.ob-top` / `.ob-p`) */}
        <View style={styles.top}>
          {step > 0 ? (
            <Pressable
              style={styles.backCirc}
              onPress={() => setStep(step - 1)}
              accessibilityRole="button"
              accessibilityLabel="Voltar"
            >
              <Feather name={ICON.back} size={20} color={colors.text} />
            </Pressable>
          ) : null}
          <View style={styles.progress}>
            {[1, 2, 3, 4].map((i) => (
              <View
                key={i}
                style={[
                  styles.bar,
                  { backgroundColor: i <= step ? colors.accent : colors.hairline },
                ]}
              />
            ))}
          </View>
        </View>

        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <EntradaAnimada variante="vista" gatilho={step}>
            {step === 0 ? (
              <View style={styles.centerBlock}>
                <View style={styles.okcWelcome}>
                  <Feather
                    name={ICON.debt}
                    size={44}
                    color={colors.glassText}
                  />
                </View>
                <Text style={[styles.h1, styles.center]}>
                  Bem-vindo ao Meu Kumbo
                </Text>
                <Text style={[styles.sub, styles.center]}>
                  Vamos configurar a tua conta em menos de um minuto.
                </Text>
              </View>
            ) : null}

            {step === 1 ? (
              <>
                <Text style={styles.h1}>Como te chamas?</Text>
                <Text style={styles.sub}>
                  Vamos personalizar a tua experiência.
                </Text>
                <View style={styles.avatarWrap}>
                  <View style={styles.avatarBig}>
                    <Text style={styles.avatarTxt}>
                      {(nome.trim().charAt(0) || "+").toUpperCase()}
                    </Text>
                  </View>
                </View>
                <TextInput
                  style={styles.input}
                  value={nome}
                  onChangeText={setNome}
                  placeholder="O teu nome"
                  placeholderTextColor={colors.textMuted}
                  maxLength={24}
                  accessibilityLabel="O teu nome"
                />
              </>
            ) : null}

            {step === 2 ? (
              <>
                <Text style={styles.h1}>
                  O que descreve melhor a tua situação?
                </Text>
                <Text style={styles.sub}>Adaptamos a app ao teu dia a dia.</Text>
                <Opcao
                  on={perfil === "e"}
                  icon="goal"
                  titulo="Estudante"
                  sub="Mesada, poupanças e gastos do dia a dia"
                  onPress={() => {
                    setPerfil("e");
                    setRenda(null);
                  }}
                />
                <Opcao
                  on={perfil === "p"}
                  icon="debt"
                  titulo="Profissional"
                  sub="Salário, contas fixas e metas"
                  onPress={() => {
                    setPerfil("p");
                    setRenda(null);
                  }}
                />
              </>
            ) : null}

            {step === 3 ? (
              <>
                <Text style={styles.h1}>Fala-nos de ti</Text>
                <Text style={styles.fl}>Idade</Text>
                <TextInput
                  style={styles.input}
                  value={idade}
                  onChangeText={(v) => setIdade(v.replace(/\D/g, ""))}
                  keyboardType="number-pad"
                  maxLength={2}
                  placeholder="Ex.: 21"
                  placeholderTextColor={colors.textMuted}
                  accessibilityLabel="Idade"
                />
                <Text style={[styles.fl, styles.flGap]}>
                  {est ? "Recebes mesada?" : "Trabalhas atualmente?"}
                </Text>
                <View style={styles.seg}>
                  {[true, false].map((v, i) => (
                    <Pressable
                      key={i}
                      style={[styles.segBtn, renda === v && styles.segBtnOn]}
                      onPress={() => setRenda(v)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: renda === v }}
                      accessibilityLabel={v ? "Sim" : "Não"}
                    >
                      <Text
                        style={[styles.segTxt, renda === v && styles.segTxtOn]}
                      >
                        {v ? "Sim" : "Não"}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                {renda ? (
                  <TextInput
                    style={styles.input}
                    value={valor}
                    onChangeText={setValor}
                    keyboardType="decimal-pad"
                    placeholder={
                      est
                        ? "Valor da mesada por mês (Kz)"
                        : "Salário mensal (Kz)"
                    }
                    placeholderTextColor={colors.textMuted}
                    accessibilityLabel="Valor mensal"
                  />
                ) : null}
              </>
            ) : null}

            {step === 4 ? (
              <>
                <Text style={styles.h1}>Protege os teus dados</Text>
                <Text style={styles.sub}>Queres pedir um PIN ao abrir a app?</Text>
                <Opcao
                  on={pinEnabled === true}
                  icon="lock"
                  titulo="Sim, criar PIN"
                  sub={
                    pinEnabled === true && hasPin
                      ? "PIN definido · toca para alterar"
                      : "4 dígitos para abrir a app"
                  }
                  onPress={() => {
                    setPinEnabled(true);
                    setPinSetup(true);
                  }}
                />
                <Opcao
                  on={pinEnabled === false}
                  icon="set"
                  titulo="Agora não"
                  sub="Podes ativar depois em Ajustes"
                  onPress={() => {
                    void removePinHandler();
                    setPinEnabled(false);
                  }}
                />
              </>
            ) : null}

            {step === 5 ? (
              <View style={styles.centerBlock}>
                <View style={styles.okc}>
                  <Feather name={ICON.ok} size={44} color={colors.glassText} />
                </View>
                <Text style={[styles.h1, styles.center]}>
                  Tudo pronto, {nome.trim() || "amigo"}!
                </Text>
                <Text style={[styles.sub, styles.center]}>
                  Perfil {est ? "Estudante" : "Profissional"} configurado. Já
                  podes organizar o teu dinheiro.
                </Text>
              </View>
            ) : null}
          </EntradaAnimada>
        </ScrollView>

        {erro ? <Text style={styles.erro}>{erro}</Text> : null}

        <Pressable
          style={styles.go}
          onPress={() => void avancar()}
          accessibilityRole="button"
          accessibilityLabel={label}
        >
          <Text style={styles.goTxt}>{label}</Text>
        </Pressable>
      </View>

      {/* O ecrã de bloqueio real, em modo de criação, por cima do onboarding. */}
      {pinSetup ? (
        <View style={StyleSheet.absoluteFill}>
          <LockScreen
            mode="setup"
            title="Cria o teu PIN"
            onCreated={() => setPinSetup(false)}
            onCancel={() => {
              // Cancelar não apaga um PIN que já exista: só desfaz a escolha.
              setPinEnabled(hasPin);
              setPinSetup(false);
            }}
          />
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}

const makeStyles = (colors: Cores) =>
  StyleSheet.create({
    // `.onb`
    root: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    screen: {
      flex: 1,
      paddingHorizontal: 22,
    },

    // `.ob-top` / `.ob-p`
    top: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      minHeight: 46,
    },
    backCirc: {
      width: 46,
      height: 46,
      borderRadius: 23,
      backgroundColor: colors.bgMid,
      alignItems: "center",
      justifyContent: "center",
    },
    progress: {
      flex: 1,
      flexDirection: "row",
      gap: 6,
    },
    bar: {
      flex: 1,
      height: 4,
      borderRadius: 4,
    },

    // `.ob-b`
    body: {
      flex: 1,
    },
    bodyContent: {
      paddingTop: 22,
    },

    // `h1` / `.sub`
    h1: {
      fontFamily: fonts.medium,
      fontSize: 27,
      lineHeight: 34,
      letterSpacing: -0.4,
      color: colors.text,
    },
    sub: {
      fontFamily: fonts.regular,
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 3,
    },
    center: {
      textAlign: "center",
    },
    centerBlock: {
      alignItems: "center",
      paddingTop: 50,
    },

    // `.okc`
    okc: {
      width: 96,
      height: 96,
      borderRadius: 48,
      backgroundColor: colors.accent,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 22,
    },
    okcWelcome: {
      width: 96,
      height: 96,
      borderRadius: 30,
      backgroundColor: colors.accent,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 22,
    },

    // `.av.big`
    avatarWrap: {
      alignItems: "center",
      marginTop: 26,
      marginBottom: 8,
    },
    avatarBig: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: colors.avatarBg,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarTxt: {
      fontFamily: fonts.bold,
      fontSize: 26,
      color: colors.avatarText,
    },

    // `.in`
    input: {
      backgroundColor: colors.bgMid,
      borderRadius: 16,
      paddingVertical: 14,
      paddingHorizontal: 16,
      marginTop: 10,
      fontFamily: fonts.regular,
      fontSize: 15,
      color: colors.text,
    },

    // `.fl`
    fl: {
      fontFamily: fonts.regular,
      fontSize: 10,
      color: colors.textMuted,
      marginTop: 14,
    },
    flGap: {
      marginTop: 20,
    },

    // `.oc`
    oc: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      width: "100%",
      backgroundColor: colors.bgMid,
      borderRadius: 22,
      padding: 16,
      marginTop: 12,
      borderWidth: 2,
      borderColor: "transparent",
    },
    ocOn: {
      borderColor: colors.accent,
    },
    ocCirc: {
      width: 46,
      height: 46,
      borderRadius: 23,
      backgroundColor: colors.chipNeutralBg,
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    ocBody: {
      flex: 1,
      minWidth: 0,
    },
    ocTitle: {
      fontFamily: fonts.medium,
      fontSize: 14,
      color: colors.text,
    },
    ocSub: {
      fontFamily: fonts.regular,
      fontSize: 11,
      color: colors.textMuted,
      marginTop: 1,
    },

    // `.seg` (variante do onboarding: fundo `--panel`)
    seg: {
      flexDirection: "row",
      backgroundColor: colors.bgMid,
      borderRadius: 99,
      padding: 3,
      gap: 3,
      marginTop: 8,
    },
    segBtn: {
      flex: 1,
      paddingVertical: 8,
      borderRadius: 99,
      alignItems: "center",
    },
    segBtnOn: {
      backgroundColor: colors.accent,
    },
    segTxt: {
      fontFamily: fonts.regular,
      fontSize: 12,
      color: colors.textMuted,
    },
    segTxtOn: {
      color: colors.glassText,
    },

    // `.go`
    go: {
      width: "100%",
      height: 50,
      marginTop: 18,
      borderRadius: 25,
      backgroundColor: colors.accent,
      alignItems: "center",
      justifyContent: "center",
    },
    goTxt: {
      fontFamily: fonts.medium,
      fontSize: 14,
      color: colors.glassText,
    },

    erro: {
      fontFamily: fonts.regular,
      fontSize: 12,
      color: colors.danger,
      textAlign: "center",
      marginTop: 8,
    },
  });
