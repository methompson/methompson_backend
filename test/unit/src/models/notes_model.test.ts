import {
  NewNote,
  NewNoteInterface,
  Note,
  NoteInterface,
} from '@/src/models/notes_model';

describe('notes', () => {
  describe('NewNote', () => {
    const validData: NewNoteInterface = {
      title: 'test note',
      content: 'here are some notes',
      dateAdded: '2023-04-19T12:00:00.000Z',
      authorId: '1',
    };

    describe('toJSON', () => {
      test('returns a specific value', () => {
        const nn = new NewNote(
          validData.title,
          validData.content,
          new Date(validData.dateAdded),
          validData.authorId,
        );

        const json = nn.toJSON();
        expect(json).toStrictEqual(validData);
        expect(json.title).toBe(validData.title);
        expect(json.content).toBe(validData.content);
        expect(json.dateAdded).toBe(validData.dateAdded);
        expect(json.authorId).toBe(validData.authorId);
      });
    });

    describe('fromJSON', () => {
      test('returns a NewNote object form proper JSON', () => {
        const nn = NewNote.fromJSON(validData);

        expect(nn.toJSON()).toStrictEqual(validData);
        expect(nn.title).toBe(validData.title);
        expect(nn.content).toBe(validData.content);
        expect(nn.dateAdded.toISOString()).toBe(validData.dateAdded);
        expect(nn.authorId).toBe(validData.authorId);
      });

      test('throws an exception with improper JSON', () => {
        let invalidData: Record<string, unknown>;

        invalidData = { ...validData };
        delete invalidData.title;
        expect(() => NewNote.fromJSON(invalidData)).toThrow();

        invalidData = { ...validData };
        delete invalidData.content;
        expect(() => NewNote.fromJSON(invalidData)).toThrow();

        invalidData = { ...validData };
        delete invalidData.dateAdded;
        expect(() => NewNote.fromJSON(invalidData)).toThrow();

        invalidData = { ...validData };
        delete invalidData.authorId;
        expect(() => NewNote.fromJSON(invalidData)).toThrow();
      });

      test('toJSON can be passed into fromJSON and get the same data', () => {
        const nn1 = NewNote.fromJSON(validData);
        const nn2 = NewNote.fromJSON(nn1.toJSON());

        expect(nn1.toJSON()).toStrictEqual(nn2.toJSON());
      });
    });

    describe('newNoteInterfaceTest', () => {
      test('returns an empty array with properly formatted JSON', () => {
        expect(NewNote.newNoteInterfaceTest(validData)).toStrictEqual([]);
      });

      test('returns a single element when passed a non-object', () => {
        expect(NewNote.newNoteInterfaceTest(null)).toStrictEqual(['root']);
      });

      test('returns values for every missed key', () => {
        const invalidData: Record<string, unknown> = { ...validData };
        delete invalidData.title;
        expect(NewNote.newNoteInterfaceTest(invalidData)).toStrictEqual([
          'title',
        ]);

        delete invalidData.content;
        expect(NewNote.newNoteInterfaceTest(invalidData)).toStrictEqual([
          'title',
          'content',
        ]);

        delete invalidData.dateAdded;
        expect(NewNote.newNoteInterfaceTest(invalidData)).toStrictEqual([
          'title',
          'content',
          'dateAdded',
        ]);

        delete invalidData.authorId;
        expect(NewNote.newNoteInterfaceTest(invalidData)).toStrictEqual([
          'title',
          'content',
          'dateAdded',
          'authorId',
        ]);
      });

      test('returns values for every key with incorrect data types', () => {
        let invalidData: Record<string, unknown>;

        invalidData = { ...validData };
        invalidData.title = 123;
        expect(NewNote.newNoteInterfaceTest(invalidData)).toStrictEqual([
          'title',
        ]);

        invalidData = { ...validData };
        invalidData.content = 123;
        expect(NewNote.newNoteInterfaceTest(invalidData)).toStrictEqual([
          'content',
        ]);

        invalidData = { ...validData };
        invalidData.dateAdded = 123;
        expect(NewNote.newNoteInterfaceTest(invalidData)).toStrictEqual([
          'dateAdded',
        ]);

        invalidData = { ...validData };
        invalidData.authorId = 123;
        expect(NewNote.newNoteInterfaceTest(invalidData)).toStrictEqual([
          'authorId',
        ]);
      });
    });

    describe('isNewNoteInterface', () => {
      test('returns true for properly formatted JSON', () => {
        expect(NewNote.isNewNoteInterface(validData)).toBe(true);
      });

      test('returns false for improperly formatted JSON', () => {
        let invalidData: Record<string, unknown>;

        invalidData = { ...validData };
        delete invalidData.title;
        expect(NewNote.isNewNoteInterface(invalidData)).toBe(false);

        invalidData = { ...validData };
        delete invalidData.content;
        expect(NewNote.isNewNoteInterface(invalidData)).toBe(false);

        invalidData = { ...validData };
        delete invalidData.dateAdded;
        expect(NewNote.isNewNoteInterface(invalidData)).toBe(false);

        invalidData = { ...validData };
        delete invalidData.authorId;
        expect(NewNote.isNewNoteInterface(invalidData)).toBe(false);
      });
    });
  });

  describe('Note', () => {
    const validData: NoteInterface = {
      id: '123',
      title: 'test note',
      content: 'here are some notes',
      dateAdded: '2023-04-19T12:00:00.000Z',
      authorId: '1',
    };

    describe('toJSON', () => {
      test('returns a specific value', () => {
        const n = new Note(
          validData.id,
          validData.title,
          validData.content,
          new Date(validData.dateAdded),
          validData.authorId,
        );

        const json = n.toJSON();
        expect(json).toStrictEqual(validData);
        expect(json.id).toBe(validData.id);
        expect(json.title).toBe(validData.title);
        expect(json.content).toBe(validData.content);
        expect(json.dateAdded).toBe(validData.dateAdded);
        expect(json.authorId).toBe(validData.authorId);
      });
    });

    describe('fromJSON', () => {
      test('returns a Note object form proper JSON', () => {
        const n = Note.fromJSON(validData);

        expect(n.toJSON()).toStrictEqual(validData);
        expect(n.title).toBe(validData.title);
        expect(n.content).toBe(validData.content);
        expect(n.dateAdded.toISOString()).toBe(validData.dateAdded);
        expect(n.authorId).toBe(validData.authorId);
      });

      test('throws an exception with improper JSON', () => {
        let invalidData: Record<string, unknown>;

        invalidData = { ...validData };
        delete invalidData.id;
        expect(() => Note.fromJSON(invalidData)).toThrow();

        invalidData = { ...validData };
        delete invalidData.title;
        expect(() => Note.fromJSON(invalidData)).toThrow();

        invalidData = { ...validData };
        delete invalidData.content;
        expect(() => Note.fromJSON(invalidData)).toThrow();

        invalidData = { ...validData };
        delete invalidData.dateAdded;
        expect(() => Note.fromJSON(invalidData)).toThrow();

        invalidData = { ...validData };
        delete invalidData.authorId;
        expect(() => Note.fromJSON(invalidData)).toThrow();
      });

      test('toJSON can be passed into fromJSON and get the same data', () => {
        const n1 = Note.fromJSON(validData);
        const n2 = Note.fromJSON(n1.toJSON());

        expect(n1.toJSON()).toStrictEqual(n2.toJSON());
      });
    });

    describe('noteInterfaceTest', () => {
      test('returns an empty array with properly formatted JSON', () => {
        expect(Note.newNoteInterfaceTest(validData)).toStrictEqual([]);
      });

      test('returns a single element when passed a non-object', () => {
        expect(Note.newNoteInterfaceTest(null)).toStrictEqual(['root']);
      });

      test('returns values for every missed key', () => {
        const invalidData: Record<string, unknown> = { ...validData };
        delete invalidData.id;
        expect(Note.noteInterfaceTest(invalidData)).toStrictEqual(['id']);

        delete invalidData.title;
        expect(Note.noteInterfaceTest(invalidData)).toStrictEqual([
          'title',
          'id',
        ]);

        delete invalidData.content;
        expect(Note.noteInterfaceTest(invalidData)).toStrictEqual([
          'title',
          'content',
          'id',
        ]);

        delete invalidData.dateAdded;
        expect(Note.noteInterfaceTest(invalidData)).toStrictEqual([
          'title',
          'content',
          'dateAdded',
          'id',
        ]);

        delete invalidData.authorId;
        expect(Note.noteInterfaceTest(invalidData)).toStrictEqual([
          'title',
          'content',
          'dateAdded',
          'authorId',
          'id',
        ]);
      });

      test('returns values for every key with incorrect data', () => {
        let invalidData: Record<string, unknown>;

        invalidData = { ...validData };
        invalidData.id = 123;
        expect(Note.noteInterfaceTest(invalidData)).toStrictEqual(['id']);

        invalidData = { ...validData };
        invalidData.title = 123;
        expect(Note.noteInterfaceTest(invalidData)).toStrictEqual(['title']);

        invalidData = { ...validData };
        invalidData.content = 123;
        expect(Note.noteInterfaceTest(invalidData)).toStrictEqual(['content']);

        invalidData = { ...validData };
        invalidData.dateAdded = 123;
        expect(Note.noteInterfaceTest(invalidData)).toStrictEqual([
          'dateAdded',
        ]);

        invalidData = { ...validData };
        invalidData.authorId = 123;
        expect(Note.noteInterfaceTest(invalidData)).toStrictEqual(['authorId']);
      });
    });

    describe('isNoteInterface', () => {
      test('returns true for properly formatted JSON', () => {
        expect(Note.isNoteInterface(validData)).toBe(true);
      });

      test('returns false for improperly formatted JSON', () => {
        let invalidData: Record<string, unknown>;

        invalidData = { ...validData };
        delete invalidData.id;
        expect(Note.isNoteInterface(invalidData)).toBe(false);

        invalidData = { ...validData };
        delete invalidData.title;
        expect(Note.isNoteInterface(invalidData)).toBe(false);

        invalidData = { ...validData };
        delete invalidData.content;
        expect(Note.isNoteInterface(invalidData)).toBe(false);

        invalidData = { ...validData };
        delete invalidData.dateAdded;
        expect(Note.isNoteInterface(invalidData)).toBe(false);

        invalidData = { ...validData };
        delete invalidData.authorId;
        expect(Note.isNoteInterface(invalidData)).toBe(false);
      });
    });
  });
});
