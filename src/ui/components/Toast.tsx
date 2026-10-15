import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';

import { notifyError, notifySuccess } from '../haptics';
import { colors, fonts, layout, radius, spacing } from '../theme';

type ToastOptions = {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  duration?: number;
  /**
   * Só vibra se for explicitamente indicado: não é possível inferir do texto se
   * um toast é sucesso ou erro, e vibrar "conta não encontrada" a verde seria
   * pior do que não vibrar.
   */
  tone?: 'success' | 'error';
};

type ToastState = ToastOptions & { id: number };

const ToastContext = createContext<(options: ToastOptions) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const enter = useRef(new Animated.Value(0)).current;
  const exiting = useRef(false);

  const animateIn = useCallback(() => {
    enter.setValue(0);
    Animated.spring(enter, {
      toValue: 1,
      friction: 9,
      tension: 70,
      useNativeDriver: true,
    }).start();
  }, [enter]);

  const animateOut = useCallback(
    (after: () => void) => {
      if (exiting.current) {
        after();
        return;
      }
      exiting.current = true;
      Animated.timing(enter, {
        toValue: 0,
        duration: 160,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        exiting.current = false;
        // `setValue` num novo toast cancela esta animação mas o callback é
        // chamado na mesma; sem esta guarda o toast acabado de aparecer era
        // eliminado de imediato.
        if (finished) {
          after();
        }
      });
    },
    [enter]
  );

  const show = useCallback((options: ToastOptions) => {
    if (timer.current) {
      clearTimeout(timer.current);
    }

    if (options.tone === 'success') {
      notifySuccess();
    } else if (options.tone === 'error') {
      notifyError();
    }

    setToast({ id: Date.now(), ...options });
  }, []);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    exiting.current = false;
    animateIn();

    timer.current = setTimeout(() => {
      animateOut(() => setToast(null));
    }, toast.duration ?? 5000);

    return () => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
    };
  }, [toast, animateIn, animateOut]);

  const dismiss = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
    }
    animateOut(() => setToast(null));
  }, [animateOut]);

  const translateY = enter.interpolate({ inputRange: [0, 1], outputRange: [24, 0] });
  const opacity = enter.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const scale = enter.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] });

  return (
    <ToastContext.Provider value={show}>
      {children}
      {toast ? (
        <Animated.View
          style={[styles.wrap, { transform: [{ translateY }, { scale }], opacity }]}
          pointerEvents="box-none"
        >
          <View style={styles.toast}>
            <Text style={styles.message} numberOfLines={2}>
              {toast.message}
            </Text>
            {toast.actionLabel ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  const action = toast.onAction;
                  dismiss();
                  action?.();
                }}
                style={styles.action}
              >
                <Text style={styles.actionText}>{toast.actionLabel}</Text>
              </Pressable>
            ) : null}
          </View>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    // Acima do FAB (`layout.fabBottom` + `layout.fabHeight`). O Toast é irmão
    // de toda a Stack e desenha-se por cima do botão; a 104 tapava-o por
    // completo durante os 5 s em que fica visível.
    bottom: layout.fabBottom + layout.fabHeight + spacing.sm,
    alignItems: 'stretch',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.panel,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: '#101839',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    shadowColor: '#000000',
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  message: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.text,
  },
  action: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    minHeight: 44,
    justifyContent: 'center',
  },
  actionText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.accentSoft,
  },
});
