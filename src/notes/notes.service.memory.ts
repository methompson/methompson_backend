import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

import { NotesRequestOutput, NotesService } from '@/src/notes/notes.service';
import { NewNote, Note } from '@/src/models/notes_model';
import { isUndefined } from '@/src/utils/type_guards';
import { InvalidInputError, NotFoundError } from '@/src/errors';

@Injectable()
export class InMemoryNotesService implements NotesService {
  /**
   * Notes are an object of String to Note. The key is the id.
   */
  protected notes: Record<string, Note> = {};

  constructor(inputNotes: Note[] = []) {
    for (const note of inputNotes) {
      this.notes[note.id] = note;
    }
  }

  get notesByDate(): Note[] {
    const notes = Object.values(this.notes);

    // Sorts in reverse chronological order
    return notes.sort((a, b) => b.dateAdded.getTime() - a.dateAdded.getTime());
  }

  async getNotes(page = 1, pagination = 10): Promise<NotesRequestOutput> {
    const skip = pagination * (page - 1);
    const end = pagination * page;

    const posts = this.notesByDate.slice(skip, end);

    const morePages = end < this.notesByDate.length;

    return {
      posts,
      morePages,
    };
  }

  async getById(id: string): Promise<Note> {
    const note = this.notes[id];

    if (isUndefined(note)) {
      throw new NotFoundError('Note Does Not Exist');
    }

    return note;
  }

  async addNote(requestBody: unknown): Promise<Note> {
    const newNote = NewNote.fromJSON(requestBody);

    const id = uuidv4();
    const note = Note.fromNewNote(id, newNote);

    this.notes[note.id] = note;

    return note;
  }

  async updateNote(requestBody: unknown): Promise<Note> {
    throw new Error('unimplemented');
  }

  async deleteNote(id: string): Promise<Note> {
    throw new Error('unimplemented');
  }

  async backup(): Promise<void> {}
}
