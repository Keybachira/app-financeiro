import { useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DEFAULT_CATEGORY } from "../../domain/categories";
import {
  createBill,
  setBillActive,
  updateBill,
  type BillRow,
} from "../../repos/bills";
import { Interruptor } from "../../ui/componentes/Interruptor";
import { TecladoValor } from "../../ui/componentes/TecladoValor";
import { useAvisoRapido } from "../../ui/componentes/AvisoRapido";
import { fonts, useTema } from "../../ui/tema";

// Paleta do protótipo HTML (AB Finance), tema claro/escuro.
const paleta = (escuro: boolean) => ({
  panel: escuro ? "#141414" : "#ffffff",
  text: escuro ? "#ffffff" : "#0d0d0d",
  muted: escuro ? "#7a7a7a" : "#8d8d8d",
  ring: escuro ? "#262626" : "#dedede",
  acc: "#9c32d7",
  overlay: "#00000070",
});
type Paleta = ReturnType<typeof paleta>;

const milhares = (digitos: string) =>
  digitos.replace(/\B(?=(\d{3})+(?!\d))/g, " ");

/**
 * Folha inferior de conta fixa (despesa mensal), como no protótipo AB Finance.
 *
 * Fica por cima do ecrã que a abre — a lista de despesas fixas mostra-a quando
 * se toca em "Nova conta fixa" ou numa conta. O mesmo componente serve para
 * criar e para editar: com uma conta carrega os valores e mostra também o
 * interruptor de conta ativa.
 *
 * O valor e o dia escrevem-se no teclado numérico próprio (o mesmo dos outros
 * ecrãs), aqui dentro da folha: tocar num dos dois campos escolhe onde o
 * teclado escreve. Só o nome usa o teclado do sistema.
 */
export function FormularioConta({
  visible,
  conta,
  onClose,
}: {
  visible: boolean;
  conta?: BillRow | null;
  onClose: () => void;
}) {
  // Segue o tema escolhido nas definições (sistema, claro ou escuro).
  const { dark } = useTema();
  const p = paleta(dark);
  const styles = makeStyles(p);
  const insets = useSafeAreaInsets();
  const toast = useAvisoRapido();
  const existing = conta ?? null;

  const [nome, setNome] = useState(existing?.name ?? "");
  const [digitos, setDigitos] = useState(
    existing ? String(existing.amount) : "",
  );
  const [diaTexto, setDiaTexto] = useState(
    existing ? String(existing.day_of_month) : "",
  );
  const [ativa, setAtiva] = useState(existing ? existing.active === 1 : true);
  // Destino das teclas do teclado numérico: valor mensal ou dia do mês.
  const [alvo, setAlvo] = useState<"valor" | "dia">("valor");

  // Guarda contra duplo-toque: dois toques seguidos criariam duas contas.
  const aGuardar = useRef(false);

  // Cada abertura recomeça a partir da conta recebida (editar) ou vazia (criar).
  useEffect(() => {
    if (!visible) return;

    aGuardar.current = false;
    setNome(existing?.name ?? "");
    setDigitos(existing ? String(existing.amount) : "");
    setDiaTexto(existing ? String(existing.day_of_month) : "");
    setAtiva(existing ? existing.active === 1 : true);
    setAlvo("valor");
  }, [visible, existing]);

  if (!visible) return null;

  const valor = digitos.length > 0 ? Number(digitos) : 0;
  const dia = diaTexto.length > 0 ? Number(diaTexto) : null;
  const valido =
    nome.trim().length > 0 && valor > 0 && dia !== null && dia >= 1 && dia <= 31;

  const aoMudarDia = (texto: string) => {
    const so = texto.replace(/\D/g, "").slice(0, 2);
    if (so === "0") return setDiaTexto("");
    setDiaTexto(so && Number(so) > 31 ? "31" : so);
  };

  const aoTeclar = (tecla: string) => {
    if (alvo === "dia") {
      aoMudarDia(diaTexto + tecla);
      return;
    }

    const texto = (digitos + tecla).replace(/\D/g, "").slice(0, 12);
    setDigitos(texto.replace(/^0+(?=\d)/, ""));
  };

  const apagar = () => {
    if (alvo === "dia") {
      setDiaTexto((atual) => atual.slice(0, -1));
      return;
    }

    setDigitos((atual) => atual.slice(0, -1));
  };

  const guardar = () => {
    if (aGuardar.current) return;

    if (!valido || dia === null) {
      toast({ message: "Indica nome, valor e dia da conta" });
      return;
    }

    aGuardar.current = true;

    try {
      const input = {
        name: nome.trim(),
        amount: valor,
        dayOfMonth: dia,
        // O protótipo não pede categoria nem lembrete: mantém o que já existia.
        remindDaysBefore: existing?.remind_days_before ?? 1,
        category: existing?.category ?? DEFAULT_CATEGORY,
        icon: existing?.icon ?? null,
      };

      if (existing) {
        updateBill(existing.id, input);
        setBillActive(existing.id, ativa);
        toast({ message: "Conta atualizada", tone: "success" });
      } else {
        createBill(input);
        toast({ message: "Conta criada", tone: "success" });
      }

      onClose();
    } catch {
      aGuardar.current = false;
      toast({ message: "Não foi possível guardar a conta.", tone: "error" });
    }
  };

  return (
    <View style={styles.root}>
      {/* Toque fora da folha fecha */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Fechar"
        onPress={onClose}
        style={StyleSheet.absoluteFill}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.kav}
        pointerEvents="box-none"
      >
        <View style={[styles.sheet, { paddingBottom: 24 + insets.bottom }]}>
          <View style={styles.grab} />
          <Text style={styles.title}>
            {existing ? "Editar conta fixa" : "Nova conta fixa"}
          </Text>

          <TextInput
            value={nome}
            onChangeText={setNome}
            placeholder="Nome da conta"
            placeholderTextColor={p.muted}
            style={styles.input}
            returnKeyType="done"
            onSubmitEditing={() => setAlvo("valor")}
          />

          {/* Valor e dia: mostram o que está escrito e recebem o teclado de baixo. */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Valor mensal (Kz)"
            accessibilityState={{ selected: alvo === "valor" }}
            onPress={() => setAlvo("valor")}
            style={[
              styles.input,
              alvo === "valor" && { borderBottomColor: p.acc },
            ]}
          >
            <Text style={[styles.inputText, !digitos && styles.placeholder]}>
              {digitos ? milhares(digitos) : "Valor mensal (Kz)"}
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Dia do mês (1-31)"
            accessibilityState={{ selected: alvo === "dia" }}
            onPress={() => setAlvo("dia")}
            style={[styles.input, alvo === "dia" && { borderBottomColor: p.acc }]}
          >
            <Text style={[styles.inputText, !diaTexto && styles.placeholder]}>
              {diaTexto || "Dia do mês (1-31)"}
            </Text>
          </Pressable>

          <View style={styles.teclado}>
            <TecladoValor onDigit={aoTeclar} onBackspace={apagar} />
          </View>

          {existing ? (
            <View style={styles.toggleRow}>
              <View style={styles.toggleText}>
                <Text style={styles.toggleTitle}>Conta ativa</Text>
                <Text style={styles.toggleSub}>
                  Contas inativas não contam para o valor diário
                </Text>
              </View>
              <Interruptor
                value={ativa}
                onValueChange={setAtiva}
                label="Conta ativa"
              />
            </View>
          ) : null}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Guardar conta fixa"
            accessibilityState={{ disabled: !valido }}
            disabled={!valido}
            onPress={guardar}
            style={[styles.go, !valido && styles.goDisabled]}
          >
            <Text style={styles.goLabel}>Guardar</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const makeStyles = (p: Paleta) =>
  StyleSheet.create({
    root: {
      position: "absolute",
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      backgroundColor: p.overlay,
    },
    kav: { flex: 1, justifyContent: "flex-end" },
    sheet: {
      backgroundColor: p.panel,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingTop: 10,
      paddingHorizontal: 22,
    },
    grab: {
      width: 40,
      height: 4,
      borderRadius: 4,
      backgroundColor: p.ring,
      alignSelf: "center",
      marginBottom: 14,
    },
    title: {
      fontFamily: fonts.bold,
      fontSize: 18,
      color: p.text,
      marginBottom: 2,
    },
    input: {
      fontFamily: fonts.medium,
      fontSize: 16,
      color: p.text,
      paddingVertical: 10,
      paddingHorizontal: 0,
      marginTop: 10,
      borderBottomWidth: 1.5,
      borderBottomColor: p.ring,
    },
    inputText: {
      fontFamily: fonts.medium,
      fontSize: 16,
      color: p.text,
    },
    placeholder: {
      color: p.muted,
    },
    teclado: {
      marginTop: 16,
    },
    toggleRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      paddingVertical: 12,
      paddingHorizontal: 4,
      marginTop: 6,
    },
    toggleText: { flex: 1 },
    toggleTitle: { fontFamily: fonts.regular, fontSize: 13, color: p.text },
    toggleSub: { fontFamily: fonts.regular, fontSize: 10, color: p.muted },
    go: {
      height: 50,
      borderRadius: 25,
      backgroundColor: p.acc,
      marginTop: 18,
      alignItems: "center",
      justifyContent: "center",
    },
    goDisabled: { opacity: 0.5 },
    goLabel: { fontFamily: fonts.medium, fontSize: 14, color: "#ffffff" },
  });
