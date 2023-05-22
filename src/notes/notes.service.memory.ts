import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

import { NotesRequestOutput, NotesService } from '@/src/notes/notes.service';
import { NewNote, Note } from '@/src/models/notes_model';
import { isUndefined } from '@/src/utils/type_guards';
import { NotFoundError, MutateDataException } from '@/src/errors';
import { arrayToObject } from '@/src/utils/array_to_obj';

@Injectable()
export class InMemoryNotesService implements NotesService {
  /**
   * Notes are an object of String to Note. The key is the id.
   */
  protected _notes: Record<string, Note> = {};

  get notes(): Record<string, Note> {
    return { ...this._notes };
  }

  constructor(inputNotes: Note[] = []) {
    this._notes = arrayToObject(inputNotes, (n) => n.id);
  }

  get notesByDate(): Note[] {
    const notes = Object.values(this._notes);

    // Sorts in reverse chronological order
    return notes.sort((a, b) => b.dateAdded.getTime() - a.dateAdded.getTime());
  }

  async getNotes(page = 1, pagination = 10): Promise<NotesRequestOutput> {
    const skip = pagination * (page - 1);
    const end = pagination * page;

    const notes = this.notesByDate.slice(skip, end);

    const morePages = end < this.notesByDate.length;

    return {
      notes,
      morePages,
    };
  }

  async getById(id: string): Promise<Note> {
    const note = this._notes[id];

    if (isUndefined(note)) {
      throw new NotFoundError('Note Does Not Exist');
    }

    return note;
  }

  async addNote(newNote: NewNote): Promise<Note> {
    const id = uuidv4();
    const note = Note.fromNewNote(id, newNote);

    this._notes[note.id] = note;

    return note;
  }

  async updateNote(note: Note): Promise<Note> {
    const oldNote = this._notes[note.id];

    if (isUndefined(oldNote)) {
      throw new MutateDataException('Note does not exist. Cannot update.');
    }

    this._notes[note.id] = note;

    return note;
  }

  async deleteNote(id: string): Promise<Note> {
    const oldNote = this._notes[id];
    if (isUndefined(oldNote)) {
      throw new NotFoundError(`No note for id ${id}`);
    }

    delete this._notes[id];

    return oldNote;
  }

  async backup(): Promise<void> {}
}
