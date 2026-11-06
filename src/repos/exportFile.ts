import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

/**
 * Escreve `content` na cache e abre a folha de partilha do sistema.
 *
 * A limpeza da cópia anterior é idempotente: `File.delete()` rebenta com
 * `... does not exist.` quando o ficheiro ainda não existe, e essa exceção
 * impedia a primeira exportação do dia (o nome inclui a data). Só apagamos o
 * que existe mesmo; `create({ overwrite: true })` cobre o resto dos casos.
 */
export async function shareExportFile(
  filename: string,
  content: string,
  mimeType: string
): Promise<void> {
  const file = new File(Paths.cache, filename);

  if (file.exists) {
    try {
      file.delete();
    } catch (caught) {
      // O sistema pode limpar a cache entre a verificação e o delete. Se o
      // ficheiro já não existe, o objetivo está cumprido; qualquer outra falha
      // de armazenamento continua a ser reportada.
      if (file.exists) {
        throw caught;
      }
    }
  }

  file.create({ overwrite: true, intermediates: true });
  file.write(content);

  // Um ficheiro vazio seria partilhado sem aviso e, na importação, recusado
  // como "conteúdo inesperado". Falhamos aqui com uma mensagem acionável.
  if (!file.exists || file.size === 0) {
    throw new Error(
      'Não foi possível criar o ficheiro de backup. Verifica o espaço livre no telemóvel e tenta outra vez.'
    );
  }

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('A partilha de ficheiros não está disponível neste dispositivo.');
  }

  await Sharing.shareAsync(file.uri, { mimeType, dialogTitle: 'Guardar backup' });
}
