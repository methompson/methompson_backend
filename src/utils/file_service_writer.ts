import { FileHandle, mkdir, open } from 'fs/promises';
import { join } from 'path';

export class FileServiceWriter {
  constructor(
    protected readonly baseName: string,
    protected readonly fileExtension: string,
  ) {}

  get filename(): string {
    return `${this.baseName}.${this.fileExtension}`;
  }

  async writeToFile(content: string, fh?: FileHandle) {
    const fileHandle = fh ?? (await this.makeFileHandle(this.filename));
    await fileHandle.truncate(0);
    await fileHandle.write(content, 0);
    await fileHandle.close();
  }

  async readFile(path: string, fh?: FileHandle): Promise<string> {
    const fileHandle = fh ?? (await this.makeFileHandle(path));
    const buffer = await fileHandle.readFile();

    return buffer.toString();
  }

  async makeFileHandle(filePath: string, name?: string): Promise<FileHandle> {
    await mkdir(filePath, { recursive: true });
    const filename = name ?? this.filename;
    const filepath = join(filePath, filename);

    const fileHandle = await open(filepath, 'a+');

    return fileHandle;
  }

  async writeBackup(
    filePath: string,
    rawData: string,
    options?: {
      fh?: FileHandle;
      name?: string;
    },
  ) {
    const filename =
      options?.name ??
      `${this.baseName}_backup_${new Date().toISOString()}.${
        this.fileExtension
      }`;
    const fileHandle =
      options?.fh ?? (await this.makeFileHandle(filePath, filename));

    await this.writeToFile(rawData, fileHandle);
    await fileHandle.close();
  }

  async clearFile(fh?: FileHandle) {
    const fileHandle = fh ?? (await this.makeFileHandle(this.filename));
    await fileHandle.truncate(0);
    await fileHandle.write('[]', 0);
    await fileHandle.close();
  }
}
