import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, radius, spacing } from '../theme';

type ToastOptions = {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  duration?: number;
};

type ToastState = ToastOptions & { id: number };

const ToastContext = createContext<(options: ToastOptions) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const slide = useRef(new Animated.Value(24)).current;

  const show = useCallback((options: ToastOptions) => {
    if (timer.current) {
      clearTimeout(timer.current);
    }
    setToast({ id: Date.now(), ...options });
  }, []);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    slide.setValue(24);
    Animated.timing(slide, { toValue: 0, duration: 180, useNativeDriver: true }).start();

    timer.current = setTimeout(() => setToast(null), toast.duration ?? 5000);

    return () => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
    };
  }, [toast, slide]);

  const dismiss = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
    }
    setToast(null);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      {toast ? (
        <Animated.View style={[styles.wrap, { transform: [{ translateY: slide }] }]} pointerEvents="box-none">
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
    bottom: 104,
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
