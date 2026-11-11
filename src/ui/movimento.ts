import { useEffect, useState } from "react";
import { AccessibilityInfo, Easing } from "react-native";

/**
 * Camada de movimento partilhada por toda a app.
 *
 * Os valores são os do protótipo `migrar-design/ab-finance.html`: as durações
 * em milissegundos e a curva `cubic-bezier(0.2, 0.8, 0.2, 1)` (a mesma de
 * `.view`, `.sh`, `nin` e `rv`). Manter tudo aqui evita números soltos espalhados
 * pelos componentes e permite desligar o movimento num único sítio.
 */
export const duracao = {
  /** Feedback de toque ao premir (PressivelEscala). */
  toqueEntrada: 70,
  /** Retorno do toque. */
  toqueSaida: 160,
  /** Entrada de uma vista inteira (`.view` / `in`). */
  vista: 300,
  /** Entrada de uma linha de lista (`nin`). */
  linha: 300,
  /** Subida da folha inferior (`.sh`). */
  folha: 300,
  /** Fecho da folha inferior. */
  folhaSaida: 240,
  /** Escurecer do fundo por trás de uma folha (`.ov`). */
  fundo: 250,
  /** Escalonamento entre linhas de uma lista revelada (`rv`). */
  escalonamento: 50,
  /** Atraso antes de começar a revelar uma lista (`rv`). */
  atrasoLista: 200,
  /** Anel de pulso em volta do avatar (`rg`). */
  anel: 2800,
  /** Pulsar do indicador de notificações (`bdgp`). */
  pulso: 2400,
  /** Deslizar do botão de um interruptor (`.sw`, 0.2s). */
  interruptor: 200,
  /** Confirmação de um item (`pop`). */
  pop: 450,
  /** Revelação de conteúdo por etapas (`rv`). */
  revelacao: 700,
  /** Entrada do ecrã de bloqueio (`lkin`). */
  bloqueioEntrada: 800,
  /** Saída do ecrã de bloqueio (`lkout`). */
  bloqueioSaida: 850,
} as const;

/**
 * Curvas de animação.
 *
 * `padrao` é a curva da referência; `elastica` é a do toast `.npush`;
 * `suave`/`linear` servem para oscilações contínuas.
 */
export const curva = {
  padrao: Easing.bezier(0.2, 0.8, 0.2, 1),
  elastica: Easing.bezier(0.2, 1.25, 0.3, 1),
  suave: Easing.out(Easing.cubic),
  linear: Easing.linear,
} as const;

/** Deslocamentos (em pontos) usados nas entradas. */
export const deslocamento = {
  /** Vista inteira: `translateX(14px)` no protótipo. */
  vista: 14,
  /** Linha de lista: `translateY(10px)`. */
  linha: 10,
  /** Revelação por etapas: `translateY(16px)`. */
  revelacao: 16,
} as const;

/**
 * `true` quando o sistema pede menos movimento.
 *
 * A referência desliga todas as animações com `prefers-reduced-motion`; aqui o
 * mesmo pedido faz os componentes saltarem diretamente para o estado final.
 */
export function useMovimentoReduzido() {
  const [reduzido, setReduzido] = useState(false);

  useEffect(() => {
    let montado = true;
    AccessibilityInfo.isReduceMotionEnabled().then((ativo) => {
      if (montado) setReduzido(ativo);
    });
    const subscricao = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduzido,
    );
    return () => {
      montado = false;
      subscricao.remove();
    };
  }, []);

  return reduzido;
}
