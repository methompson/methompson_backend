import { Injectable } from '@nestjs/common';

import { Note } from '@/src/models/notes_model';
import { Backupable } from '@/src/utils/backuppable';

export interface NotesRequestOutput {
  posts: Note[];
  morePages: boolean;
}

@Injectable()
export abstract class NotesService implements Backupable {
  abstract getNotes(
    page: number,
    pagination: number,
  ): Promise<NotesRequestOutput>;

  abstract getById(id: string): Promise<Note>;

  abstract addNote(requestBody: unknown): Promise<Note>;

  abstract updateNote(requestBody: unknown): Promise<Note>;

  abstract deleteNote(id: string): Promise<Note>;

  abstract backup(): Promise<void>;
}
