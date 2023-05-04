import { ValidDate } from '@/src/utils/valid_date';
import { isRecord, isString } from '@/src/utils/type_guards';
import { InvalidInputError } from '@/src/errors';

export interface NewNoteInterface {
  title: string;
  content: string;
  dateAdded: string;
  authorId: string;
}

export interface NoteInterface extends NewNoteInterface {
  id: string;
}

export class NewNote {
  constructor(
    protected _title: string,
    protected _content: string,
    protected _dateAdded: ValidDate,
    protected _authorId: string,
  ) {}

  get title(): string {
    return this._title;
  }

  get content(): string {
    return this._content;
  }

  get dateAdded(): ValidDate {
    return this._dateAdded;
  }

  get authorId(): string {
    return this._authorId;
  }

  toJSON(): NewNoteInterface {
    return {
      title: this._title,
      content: this._content,
      dateAdded: this._dateAdded.toISOString(),
      authorId: this._authorId,
    };
  }

  static fromJSON(input: unknown): NewNote {
    if (!NewNote.isNewNoteInterface(input)) {
      const results = NewNote.newNoteInterfaceTest(input);

      throw new InvalidInputError(
        `Invalid NewNote. Missing parameters: ${results.join}`,
      );
    }

    return new NewNote(
      input.title,
      input.content,
      new Date(input.dateAdded),
      input.authorId,
    );
  }

  static newNoteInterfaceTest(input: unknown): string[] {
    if (!isRecord(input)) {
      return ['root'];
    }

    const output: string[] = [];

    if (!isString(input.title)) output.push('title');
    if (!isString(input.content)) output.push('content');
    if (!isString(input.dateAdded)) output.push('dateAdded');
    if (!isString(input.authorId)) output.push('authorId');

    return output;
  }

  static isNewNoteInterface(input: unknown): input is NewNoteInterface {
    const results = NewNote.newNoteInterfaceTest(input);

    return results.length === 0;
  }
}

export class Note extends NewNote {
  constructor(
    protected _id: string,
    title: string,
    content: string,
    dateAdded: ValidDate,
    authorId: string,
  ) {
    super(title, content, dateAdded, authorId);
  }

  get id(): string {
    return this._id;
  }

  toJSON(): NoteInterface {
    return {
      ...super.toJSON(),
      id: this._id,
    };
  }

  static fromJSON(input: unknown): Note {
    if (!Note.isNoteInterface(input)) {
      const results = Note.noteInterfaceTest(input);

      throw new InvalidInputError(
        `Invalid NewNote. Missing parameters: ${results.join}`,
      );
    }

    return new Note(
      input.id,
      input.title,
      input.content,
      new Date(input.dateAdded),
      input.authorId,
    );
  }

  static noteInterfaceTest(input: unknown): string[] {
    if (!isRecord(input)) {
      return ['root'];
    }

    const output: string[] = NewNote.newNoteInterfaceTest(input);

    if (!isString(input.id)) output.push('id');

    return output;
  }

  static isNoteInterface(input: unknown): input is NoteInterface {
    const results = Note.noteInterfaceTest(input);

    return results.length === 0;
  }

  static fromNewNote(id: string, input: NewNote): Note {
    return new Note(
      id,
      input.title,
      input.content,
      input.dateAdded,
      input.authorId,
    );
  }
}
