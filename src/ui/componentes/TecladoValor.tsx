import { LinearGradient } from "expo-linear-gradient";
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { Delete } from "lucide-react-native";

import { toqueLigeiro, toqueMedio } from "../haptica";
import {
  fonts,
  radius,
  spacing,
  useTema,
  useEstilosTema,
  type Cores,
} from "../tema";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "000", "0", "back"];

/**
 * Teclado numérico 3×4 usado em todos os ecrãs que pedem um valor.
 *
 * Cada tecla envia apenas o texto premido ("0".."9" ou "000") para o ecrã pai —
 * quem decide como concatenar e limitar o número é o formulário. A tecla "000"
 * atalha três dígitos e vibra mais forte para o utilizador perceber que não foi
 * um "0" isolado. A largura de cada tecla é calculada a partir da largura real
 * do ecrã (três colunas com os mesmos espaçamentos da grelha).
 */
export function TecladoValor({
  onDigit,
  onBackspace,
}: {
  onDigit: (key: string) => void;
  onBackspace: () => void;
}) {
  const { colors, gradients } = useTema();
  const styles = useEstilosTema(makeStyles);
  const { width } = useWindowDimensions();
  const keyWidth = (width - spacing.lg * 2 - spacing.sm * 2) / 3;

  return (
    <View style={styles.grid}>
      {KEYS.map((key) => (
        <Pressable
          key={key}
          accessibilityRole="button"
          accessibilityLabel={key === "back" ? "Apagar último dígito" : key}
          onPress={() => {
            if (key === "back") {
              toqueLigeiro();
              onBackspace();
              return;
            }

            // "000" muda três dígitos de uma vez: mimeo mais forte para o
            // utilizador perceber que o toque não foi um "0" só.
            if (key === "000") {
              toqueMedio();
            } else {
              toqueLigeiro();
            }

            onDigit(key);
          }}
          // Sem isto o `Pressable` não produzia nenhum estado de premido:
          // `style` como array não tem `pressed`, logo não havia feedback
          // visual em nenhuma das 12 teclas.
          android_ripple={{ color: "rgba(127,127,127,.25)", borderless: false }}
          style={({ pressed }) => [
            styles.key,
            { width: keyWidth },
            pressed && styles.keyPressed,
          ]}
        >
          <LinearGradient
            colors={gradients.panel.colors}
            start={gradients.panel.start}
            end={gradients.panel.end}
            style={styles.keyBackground}
          >
            {key === "back" ? (
              <Delete color={colors.text} size={22} strokeWidth={2} />
            ) : (
              <Text style={styles.keyLabel}>{key}</Text>
            )}
          </LinearGradient>
        </Pressable>
      ))}
    </View>
  );
}

const makeStyles = (colors: Cores) =>
  StyleSheet.create({
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
    },
    key: {
      height: 56,
      borderRadius: radius.control,
      overflow: "hidden",
    },
    keyPressed: {
      opacity: 0.6,
    },
    keyBackground: {
      flex: 1,
      borderRadius: radius.control,
      borderWidth: 1,
      borderColor: colors.panelBorder,
      alignItems: "center",
      justifyContent: "center",
    },
    keyLabel: {
      fontFamily: fonts.medium,
      fontSize: 20,
      color: colors.text,
    },
  });
