import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ICON, num, useTemaBase } from "../data";
import { useConfigModulos } from "../src/features/modulos/useConfigModulos";
import { useNomeUtilizador } from "../src/features/definicoes/useDefinicoes";
import { usePreferenciasApp } from "../src/features/definicoes/usePreferenciasApp";
import { useEstadoBloqueio } from "../src/features/seguranca/useEstadoBloqueio";
import { setSetting } from "../src/repos/settings";
import { LockScreen } from "./lock";

// Passos: 0 boas-vindas · 1 nome · 2 situação · 3 dados · 4 PIN · 5 pronto
export default function Onboarding() {
  const { t, s } = useTemaBase();
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

  // Animação de entrada de cada passo (fade + deslize, como no protótipo)
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    anim.setValue(0);
    Animated.timing(anim, {
      toValue: 1,
      duration: 300,
      easing: Easing.bezier(0.2, 0.8, 0.2, 1),
      useNativeDriver: true,
    }).start();
  }, [step, anim]);

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
    <Pressable style={[s.oc, on && s.ocOn]} onPress={onPress}>
      <View style={[s.circQ, { width: 46, height: 46, borderRadius: 23 }]}>
        <Feather name={ICON[icon]} size={20} color={t.text} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.itTxt}>{titulo}</Text>
        <Text style={s.itSub}>{sub}</Text>
      </View>
    </Pressable>
  );

  return (
    <KeyboardAvoidingView
      style={s.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View
        style={{
          flex: 1,
          paddingTop: ins.top + 22,
          paddingHorizontal: 22,
          paddingBottom: ins.bottom + 24,
        }}
      >
        {/* progresso */}
        <View style={styles.top}>
          {step > 0 && (
            <Pressable
              style={s.circ}
              onPress={() => setStep(step - 1)}
              accessibilityLabel="Voltar"
            >
              <Feather name={ICON.back} size={20} color={t.text} />
            </Pressable>
          )}
          <View style={styles.progress}>
            {[1, 2, 3, 4].map((i) => (
              <View
                key={i}
                style={[
                  styles.bar,
                  { backgroundColor: i <= step ? t.acc : t.ring },
                ]}
              />
            ))}
          </View>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingTop: 22 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={{
              opacity: anim,
              transform: [
                {
                  translateX: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [14, 0],
                  }),
                },
              ],
            }}
          >
            {step === 0 && (
              <View style={{ alignItems: "center", paddingTop: 50 }}>
                <View style={[s.okc, { borderRadius: 30 }]}>
                  <Feather name={ICON.debt} size={44} color="#fff" />
                </View>
                <Text style={[s.h1, { marginTop: 0, textAlign: "center" }]}>
                  Bem-vindo ao Meu Kumbo
                </Text>
                <Text style={[s.sub, { textAlign: "center" }]}>
                  Vamos configurar a tua conta em menos de um minuto.
                </Text>
              </View>
            )}

            {step === 1 && (
              <>
                <Text style={[s.h1, { marginTop: 0 }]}>Como te chamas?</Text>
                <Text style={s.sub}>Vamos personalizar a tua experiência.</Text>
                <View
                  style={{
                    alignItems: "center",
                    marginTop: 26,
                    marginBottom: 8,
                  }}
                >
                  <View style={[s.av, s.avBig]}>
                    <Text style={[s.avTxt, { fontSize: 26 }]}>
                      {(nome.trim().charAt(0) || "+").toUpperCase()}
                    </Text>
                  </View>
                </View>
                <TextInput
                  style={s.inputBox}
                  value={nome}
                  onChangeText={setNome}
                  placeholder="O teu nome"
                  placeholderTextColor={t.muted}
                  maxLength={24}
                />
              </>
            )}

            {step === 2 && (
              <>
                <Text style={[s.h1, { marginTop: 0 }]}>
                  O que descreve melhor a tua situação?
                </Text>
                <Text style={s.sub}>Adaptamos a app ao teu dia a dia.</Text>
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
            )}

            {step === 3 && (
              <>
                <Text style={[s.h1, { marginTop: 0 }]}>Fala-nos de ti</Text>
                <Text style={[s.fl, { marginTop: 16 }]}>Idade</Text>
                <TextInput
                  style={s.inputBox}
                  value={idade}
                  onChangeText={(v) => setIdade(v.replace(/\D/g, ""))}
                  keyboardType="number-pad"
                  maxLength={2}
                  placeholder="Ex.: 21"
                  placeholderTextColor={t.muted}
                />
                <Text style={[s.fl, { marginTop: 20 }]}>
                  {est ? "Recebes mesada?" : "Trabalhas atualmente?"}
                </Text>
                <View
                  style={[s.seg, { backgroundColor: t.panel, marginTop: 8 }]}
                >
                  {[true, false].map((v, i) => (
                    <Pressable
                      key={i}
                      style={[
                        s.segBtn,
                        renda === v && { backgroundColor: t.acc },
                      ]}
                      onPress={() => setRenda(v)}
                    >
                      <Text style={[s.segTxt, renda === v && s.segTxtOn]}>
                        {v ? "Sim" : "Não"}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                {renda && (
                  <TextInput
                    style={s.inputBox}
                    value={valor}
                    onChangeText={setValor}
                    keyboardType="decimal-pad"
                    placeholder={
                      est
                        ? "Valor da mesada por mês (Kz)"
                        : "Salário mensal (Kz)"
                    }
                    placeholderTextColor={t.muted}
                  />
                )}
              </>
            )}

            {step === 4 && (
              <>
                <Text style={[s.h1, { marginTop: 0 }]}>
                  Protege os teus dados
                </Text>
                <Text style={s.sub}>Queres pedir um PIN ao abrir a app?</Text>
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
            )}

            {step === 5 && (
              <View style={{ alignItems: "center", paddingTop: 50 }}>
                <View style={[s.okc, { borderRadius: 48 }]}>
                  <Feather name={ICON.ok} size={44} color="#fff" />
                </View>
                <Text style={[s.h1, { marginTop: 0, textAlign: "center" }]}>
                  Tudo pronto, {nome.trim() || "amigo"}!
                </Text>
                <Text style={[s.sub, { textAlign: "center" }]}>
                  Perfil {est ? "Estudante" : "Profissional"} configurado. Já
                  podes organizar o teu dinheiro.
                </Text>
              </View>
            )}
          </Animated.View>
        </ScrollView>

        {!!erro && <Text style={[styles.erro, { color: t.neg }]}>{erro}</Text>}

        <Pressable
          style={[s.go, { marginTop: 18 }]}
          onPress={() => void avancar()}
        >
          <Text style={s.goTxt}>{label}</Text>
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

const styles = StyleSheet.create({
  top: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 46,
  },
  progress: { flex: 1, flexDirection: "row", gap: 6 },
  bar: { flex: 1, height: 4, borderRadius: 4 },
  erro: { fontSize: 12, textAlign: "center", marginTop: 8 },
});
