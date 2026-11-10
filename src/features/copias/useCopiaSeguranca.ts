import { useCallback, useState } from "react";

import {
  backupToJson,
  movementsToCsv,
  parseBackup,
  type BackupPayload,
} from "../../domain/backup";
import {
  buildBackup,
  importBackup,
  pickBackupFile,
  shareExportFile,
  type ImportMode,
} from "../../repos/backup";

export type ResultadoImportacao =
  { imported: true; mode: ImportMode } | { imported: false };

/**
 * Exportação/importação de dados (JSON completo e CSV de movimentos).
 *
 * 'run' concentra o estado 'busy'/'error': qualquer exceção vira mensagem para
 * o ecrã em vez de rebentar a UI. A importação lê o ficheiro, valida o conteúdo
 * com 'parseBackup' e só então escreve na base de dados.
 */
export function useCopiaSeguranca() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async (action: () => Promise<void>) => {
    setBusy(true);
    setError(null);

    try {
      await action();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Erro inesperado. Tenta outra vez.",
      );
    } finally {
      setBusy(false);
    }
  }, []);

  const exportJson = useCallback(async () => {
    const payload = buildBackup();
    await run(async () => {
      await shareExportFile(
        `financas-${payload.exportedAt}.json`,
        backupToJson(payload),
        "application/json",
      );
    });
  }, [run]);

  const exportCsv = useCallback(async () => {
    const payload = buildBackup();
    await run(async () => {
      await shareExportFile(
        `financas-movimentos-${payload.exportedAt}.csv`,
        movementsToCsv(payload.movements),
        "text/csv",
      );
    });
  }, [run]);

  const importJson = useCallback(
    async (mode: ImportMode): Promise<ResultadoImportacao> => {
      const file = await pickBackupFile();

      if (!file) {
        return { imported: false };
      }

      let result: ResultadoImportacao = { imported: false };

      await run(async () => {
        const text = await file.text();
        const parsed = parseBackup(text);

        if (!parsed.ok) {
          throw new Error(parsed.error);
        }

        importBackup(parsed.payload, mode);
        result = { imported: true, mode };
      });

      return result;
    },
    [run],
  );

  const clearError = useCallback(() => setError(null), []);

  return { busy, error, exportJson, exportCsv, importJson, clearError };
}

export type { BackupPayload };
