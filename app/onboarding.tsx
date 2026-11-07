import React, { useState, useCallback } from "react";
import {
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
import { A, ICON, num, useTheme } from "../data";
import { useLockState } from "../src/features/security/useLockState";

// Passos: 0 boas-vindas · 1 nome · 2 situação · 3 dados · 4 PIN · 5 pronto
export default function Onboarding() {
  const { t, s, st } = useTheme();
  const ins = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const [nome, setNome] = useState("");
  const [perfil, setPerfil] = useState<"e" | "p" | "">("");
  const [idade, setIdade] = useState("");
  const [renda, setRenda] = useState<boolean | null>(null);
  const [valor, setValor] = useState("");
  const [pinEnabled, setPinEnabled] = useState<boolean | null>(null);
  const [erro, setErro] = useState("");
  const [digits, setDigits] = useState("");

  const { setPin, removePin, hasPin, enabled } = useLockState();
  const est = perfil === "e";

  const label =
    step === 0 ? "Começar" : step === 5 ? "Entrar na app" : "Continuar";

  const sair = () =>
    router.canGoBack() ? router.back() : router.replace("/" as never);

  // Set PIN - stores hash in SQLite via useLockState
  const setPinHandler = useCallback(async (pin: string) => {
    await setPin(pin);
    setPinEnabled(true);
  }, [setPin]);

  // Remove PIN - clears from SQLite
  const removePinHandler = useCallback(async () => {
    await removePin();
    setPinEnabled(false);
  }, [removePin]);

  const avancar = () => {
    setErro("");
    if (step === 1 && !nome.trim()) return setErro("Indica o teu nome");
    if (step === 2 && !perfil) return setErro("Escolhe uma opção");
    if (step === 3 && renda && !(num(valor) > 0))
      return setErro("Indica o valor");
    if (step === 5) {
      A.finishOnboarding({
        name: nome,
        estudante: est,
        temRenda: renda,
        valor,
        pin: pinEnabled === true,
      });
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
    <Pressable style={[s.oc, on && s.ocOn]} onPress={onPress} >
      <View style={[s.circQ, { width: 46, height: 46, borderRadius: 23 }]} >
        <Feather name={ICON[icon]} size={20} color={t.text} />
      </View>
      <View style={{ flex: 1 }} >
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
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            minHeight: 46,
          }}
        >
          {step > 0 && (
            <Pressable
              style={s.circ}
              onPress={() => setStep(step - 1)}
              accessibilityLabel="Voltar"
            >
              <Feather name={ICON.back} size={20} color={t.text} />
            </Pressable>
          )}
          <View style={{ flex: 1, flexDirection: "row", gap: 6 }}>
            {[1, 2, 3, 4].map((i) => (
              <View
                key={i}
                style={{
                  flex: 1,
                  height: 4,
                  borderRadius: 4,
                  backgroundColor: i <= step ? t.acc : t.ring,
                }}
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
          {step === 0 && (
            <View style={{ alignItems: "center", paddingTop: 50 }} >
              <View style={s.okc}>
                <Feather name={ICON.debt} size={44} color="#fff" />
              </View>
              <Text style={[s.h1, { marginTop: 0, textAlign: "center" }]}>
                Bem-vindo ao AB Finance
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
                style={{ alignItems: "center", marginTop: 26, marginBottom: 8 }}
              >
                <View style={[s.av, s.avBig]} >
                  <Text style={[s.avTxt, { fontSize: 26 }]} >
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
              <Text style={[s.h1, { marginTop: 0 }]} >
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
              <Text style={s.fl}>Idade</Text>
              <TextInput
                style={s.inputBox}
                value={idade}
                onChangeText={(v) => setIdade(v.replace(/\D/g, ""))}
                keyboardType="number-pad"
                maxLength={2}
                placeholder="Ex.: 21"
                placeholderTextColor={t.muted}
              />
              <Text style={[s.fl, { marginTop: 20 }]} >
                {est ? "Recebes mesada?" : "Trabalhas atualmente?"}
              </Text>
              <View style={[s.seg, { backgroundColor: t.panel, marginTop: 8 }]}>
                {[true, false].map((v, i) => (
                  <Pressable
                    key={i}
                    style={s.segBtn}
                    onPress={() => setRenda(v)}
                  >
                    <Text style={[s.segTxt, renda === v && s.segTxtOn]}>{v ? "Sim" : "Não"}</Text>
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
              <Text style={[s.h1, { marginTop: 0 }]}>Protege os teus dados</Text>
              <Text style={s.sub}>Queres pedir um PIN ao abrir a app?</Text>
              <Opcao
                on={pinEnabled === true}
                icon="lock"
                titulo="Sim, criar PIN"
                sub="4 dígitos para abrir a app"
                onPress={() => setDigits("")}
              />
              <Opcao
                on={pinEnabled === false}
                icon="set"
                titulo="Agora não"
                sub="Podes ativar depois em Ajustes"
                onPress={() => {
                  removePinHandler();
                  setStep(5);
                }}
              />
              {pinEnabled && (
                <>
                  <Text style={s.fl}>PIN definido com sucesso!</Text>
                  <Text style={s.sub}>Agora podes usar o PIN para abrir a app.</Text>
                </>
              )}
            </>
          )}

          {step === 5 && (
            <View style={{ alignItems: "center", paddingTop: 50 }} >
              <View style={[s.okc, { borderRadius: 48 }]} >
                <Feather name={ICON.ok} size={44} color="#fff" />
              </View>
              <Text style={[s.h1, { marginTop: 0, textAlign: "center" }]}>
                Tudo pronto, {nome.trim() || st.name}!
              </Text>
              <Text style={[s.sub, { textAlign: "center" }]}>
                Perfil {est ? "Estudante" : "Profissional"} configurado. Já podes organizar o teu dinheiro.
              </Text>
            </View>
          )}
        </ScrollView>

        {!!erro && (
          <Text
            style={{
              color: t.neg,
              fontSize: 12,
              textAlign: "center",
              marginTop: 8,
            }}
          >
            {erro}
          </Text>
        )}

        <Pressable style={s.go} onPress={avancar}>
          <Text style={s.goTxt}>{label}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  pinDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  pinDotFilled: {
    backgroundColor: "#9C32D7",
    borderColor: "#9C32D7",
  },
  key: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#F0DDF8",
    alignItems: "center",
    justifyContent: "center",
    margin: 2,
  },
  keyTxt: { fontSize: 24, color: "#8123B9" },
  back: {
    marginTop: 20,
    backgroundColor: "#F0DDF8",
    borderRadius: 20,
    padding: 8,
  },
  backTxt: { color: "#8123B9", fontWeight: "bold" },
  confirm: {
    marginTop: 20,
    backgroundColor: "#9C32D7",
    borderRadius: 20,
    padding: 8,
  },
  confirmTxt: { color: "#fff", fontWeight: "bold" },
});