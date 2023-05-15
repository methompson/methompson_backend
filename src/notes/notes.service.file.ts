import { FileHandle, mkdir, open } from 'fs/promises';
import { join } from 'path';
import { Injectable } from '@nestjs/common';

import { InMemoryNotesService } from '@/src/notes/notes.service.memory';
import { NewNote, Note } from '@/src/models/notes_model';

const BASE_NAME = 'notes_data';
const FILE_EXTENSION = 'json';
export const FILE_NAME = `${BASE_NAME}.${FILE_EXTENSION}`;

@Injectable()
export class FileNotesService extends InMemoryNotesService {
  constructor(
    protected readonly fileHandle: FileHandle,
    protected readonly notesPath: string,
    inputNotes: Note[] = [],
  ) {
    super(inputNotes);
  }

  get notesString(): string {
    return JSON.stringify(Object.values(this.notes));
  }

  async addNote(newNote: NewNote): Promise<Note> {
    const note = await super.addNote(newNote);

    await this.writeToFile();

    return note;
  }

  async updateNote(updateNote: Note): Promise<Note> {
    const note = await super.updateNote(updateNote);

    await this.writeToFile();

    return note;
  }

  async deleteNote(id: string): Promise<Note> {
    const note = await super.deleteNote(id);

    await this.writeToFile();

    return note;
  }

  async writeToFile(): Promise<void> {
    const postsJson = this.notesString;

    await this.fileHandle.truncate(0);
    await this.fileHandle.write(postsJson, 0);
  }

  async backup(): Promise<void> {
    const backupPath = join(this.notesPath, 'backup');
    await FileNotesService.writeBackup(backupPath, this.notesString);
  }

  static async makeFileHandle(
    notesPath: string,
    name?: string,
  ): Promise<FileHandle> {
    await mkdir(notesPath, {
      recursive: true,
    });

    const filename = name ?? FILE_NAME;

    const filepath = join(notesPath, filename);

    const fileHandle = await open(filepath, 'a+');

    return fileHandle;
  }

  static async writeBackup(notesPath: string, rawData: string, name?: string) {
    const filename =
      name ??
      `${BASE_NAME}_backup_${new Date().toISOString()}.${FILE_EXTENSION}`;
    const fileHandle = await FileNotesService.makeFileHandle(
      notesPath,
      filename,
    );

    await fileHandle.truncate(0);
    await fileHandle.write(rawData, 0);
    await fileHandle.close();
  }

  static async init(notesPath: string): Promise<FileNotesService> {
    const fileHandle = await FileNotesService.makeFileHandle(notesPath);
    const buffer = await fileHandle.readFile();

    const notes: Note[] = [];
    let rawData = '';

    try {
      rawData = buffer.toString();

      const json = JSON.parse(rawData);

      if (Array.isArray(json)) {
        for (const val of json) {
          try {
            notes.push(Note.fromJSON(val));
          } catch (e) {
            console.error('Invalid Note: ', val, e);
          }
        }
      }
    } catch (e) {
      console.error('Invalid or no data when reading file data file', e);

      if (rawData.length > 0) {
        await FileNotesService.writeBackup(notesPath, rawData);
      }

      await fileHandle.truncate(0);
      await fileHandle.write('[]', 0);
    }

    return new FileNotesService(fileHandle, notesPath, notes);
  }
}
