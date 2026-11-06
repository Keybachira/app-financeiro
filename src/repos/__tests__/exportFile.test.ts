import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import {
  BACKUP_SCHEMA_VERSION,
  backupToJson,
  movementsToCsv,
  parseBackup,
  type BackupPayload,
  type MovementBackupRow,
} from '../../domain/backup';

type FakeEntry = {
  uri: string;
  exists: boolean;
  content: string;
  deleteCalls: number;
  failDelete?: boolean;
};

jest.mock('expo-file-system', () => {
  const files: {
    uri: string;
    exists: boolean;
    content: string;
    deleteCalls: number;
    failDelete?: boolean;
  }[] = [];

  class File {
    readonly uri: string;
    private entry: (typeof files)[number];

    constructor(base: { uri: string }, name: string) {
      this.uri = `${base.uri}/${name}`;
      const existing = files.find((candidate) => candidate.uri === this.uri);
      if (existing) {
        this.entry = existing;
      } else {
        this.entry = { uri: this.uri, exists: false, content: '', deleteCalls: 0 };
        files.push(this.entry);
      }
    }

    get exists(): boolean {
      return this.entry.exists;
    }

    get size(): number {
      return this.entry.exists ? this.entry.content.length : 0;
    }

    delete(): void {
      if (this.entry.failDelete) {
        throw new Error('EIO: falha de armazenamento');
      }
      if (!this.entry.exists) {
        throw new Error(`Unable to delete file or directory ${this.uri} does not exist.`);
      }
      this.entry.deleteCalls += 1;
      this.entry.exists = false;
      this.entry.content = '';
    }

    create(options?: { overwrite?: boolean; intermediates?: boolean }): void {
      if (this.entry.exists && !options?.overwrite) {
        throw new Error(`File already exists: ${this.uri}`);
      }
      this.entry.exists = true;
      this.entry.content = '';
    }

    write(content: string): void {
      if (!this.entry.exists) {
        throw new Error(`File does not exist: ${this.uri}`);
      }
      this.entry.content = content;
    }
  }

  return { File, Paths: { cache: { uri: 'file:///data/cache' } }, __files: files };
});

jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(async () => true),
  shareAsync: jest.fn(async () => undefined),
}));

// eslint-disable-next-line import/first
import { shareExportFile } from '../exportFile';

const files = jest.requireMock<{ __files: FakeEntry[] }>('expo-file-system').__files;
const sharing = jest.requireMock<{
  isAvailableAsync: jest.Mock<() => Promise<boolean>>;
  shareAsync: jest.Mock<
    (uri: string, options: { mimeType: string; dialogTitle: string }) => Promise<void>
  >;
}>('expo-sharing');

const movement: MovementBackupRow = {
  id: '11111111-1111-4111-8111-111111111111',
  type: 'expense',
  amount: 1800,
  category: 'Transporte',
  date: '2026-11-05',
  note: 'táxi',
  bill_id: null,
  project_payment_id: null,
  origin: 'manual',
};

const payload: BackupPayload = {
  schemaVersion: BACKUP_SCHEMA_VERSION,
  exportedAt: '2026-11-05',
  settings: [{ key: 'monthly_limit', value: '300000' }],
  movements: [movement],
  goals: [],
  goalOps: [],
  debts: [],
  debtPayments: [],
  projects: [],
  projectPayments: [],
  bills: [],
  billPayments: [],
  categoryHints: [],
};

const JSON_NAME = 'financas-2026-11-05.json';
const JSON_URI = `file:///data/cache/${JSON_NAME}`;

beforeEach(() => {
  files.length = 0;
  sharing.isAvailableAsync.mockClear();
  sharing.shareAsync.mockClear();
});

describe('exportação de backup', () => {
  it('exporta o JSON quando não existe nenhum ficheiro anterior na cache', async () => {
    // Regressão: `file.delete()` corria antes de saber se o ficheiro existia,
    // pelo que a primeira exportação do dia rebentava com
    // "Unable to delete file or directory ... does not exist."
    const json = backupToJson(payload);

    await expect(shareExportFile(JSON_NAME, json, 'application/json')).resolves.toBeUndefined();

    expect(files[0].deleteCalls).toBe(0);
    expect(files[0].content).toBe(json);
    expect(sharing.shareAsync).toHaveBeenCalledWith(JSON_URI, {
      mimeType: 'application/json',
      dialogTitle: 'Guardar backup',
    });
  });

  it('o ficheiro escrito volta a ser importado sem perdas', async () => {
    await shareExportFile(JSON_NAME, backupToJson(payload), 'application/json');

    const parsed = parseBackup(files[0].content);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.payload).toEqual(payload);
    }
  });

  it('reutiliza o ficheiro do mesmo dia sem deixar conteúdo antigo', async () => {
    files.push({ uri: JSON_URI, exists: true, content: 'conteúdo antigo e bem mais longo', deleteCalls: 0 });

    const json = backupToJson(payload);
    await shareExportFile(JSON_NAME, json, 'application/json');

    expect(files[0].deleteCalls).toBe(1);
    expect(files[0].content).toBe(json);
  });

  it('exporta o CSV com nome e tipo próprios', async () => {
    const name = 'financas-movimentos-2026-11-05.csv';
    const csv = movementsToCsv(payload.movements);

    await shareExportFile(name, csv, 'text/csv');

    expect(files[0].content).toBe('data,tipo,valor,categoria,nota\n2026-11-05,despesa,1800,Transporte,táxi');
    expect(sharing.shareAsync).toHaveBeenCalledWith(`file:///data/cache/${name}`, {
      mimeType: 'text/csv',
      dialogTitle: 'Guardar backup',
    });
  });

  it('não esconde falhas de armazenamento ao limpar a cópia antiga', async () => {
    files.push({ uri: JSON_URI, exists: true, content: '', deleteCalls: 0, failDelete: true });

    await expect(shareExportFile(JSON_NAME, backupToJson(payload), 'application/json')).rejects.toThrow(
      'falha de armazenamento'
    );
    expect(sharing.shareAsync).not.toHaveBeenCalled();
  });

  it('avisa quando a partilha não está disponível', async () => {
    sharing.isAvailableAsync.mockResolvedValueOnce(false);

    await expect(shareExportFile(JSON_NAME, backupToJson(payload), 'application/json')).rejects.toThrow(
      'partilha'
    );
    expect(sharing.shareAsync).not.toHaveBeenCalled();
  });
});
