import { Note } from '@/src/models/notes_model';
import { InMemoryNotesService } from './notes.service.memory';

const note1 = new Note('id1', 'title1', 'get milk', new Date(1), 'author1');
const note2 = new Note('id2', 'title2', 'exercise', new Date(2), 'author2');
const note3 = new Note('id3', 'title3', 'mow lawn', new Date(3), 'author2');
const note4 = new Note('id4', 'title4', 'eat lunch', new Date(4), 'author2');
const note5 = new Note('id5', 'title5', 'clean oven', new Date(5), 'author2');

describe('InMemoryNotesService', () => {
  describe('notes', () => {
    test('returns a map that is similar to _notes', () => {
      const imns = new InMemoryNotesService([note1, note2]);
      const protectedNotes = imns['_notes'];

      expect(imns.notes).toStrictEqual(protectedNotes);
    });

    test('modifying notes does not modify the protected value', () => {
      const imns = new InMemoryNotesService([note1]);

      imns.notes[note2.id] = note2;

      const protectedNotes = imns['_notes'];
      expect(protectedNotes[note2.id]).toBeUndefined();

      expect(imns.notes).toStrictEqual(protectedNotes);
    });
  });

  describe('notesByDate', () => {
    test('returns an empty array when no notes are present', () => {
      const imns = new InMemoryNotesService([]);
      expect(imns.notesByDate).toStrictEqual([]);
    });

    test('returns a single item when 1 note is present', () => {
      const imns = new InMemoryNotesService([note1]);
      expect(imns.notesByDate).toStrictEqual([note1]);
    });

    test('returns values in reverse chrono order, even when presented out of order', () => {
      const imns = new InMemoryNotesService([note4, note1, note3, note2]);
      expect(imns.notesByDate).toStrictEqual([note4, note3, note2, note1]);
    });
  });

  describe('getNotes', () => {
    const imns = new InMemoryNotesService([note1, note2, note3, note4, note5]);

    test('returns all values if pagination is greater than total notes', async () => {
      const result = await imns.getNotes();

      expect(result.notes.length).toBe(5);
      expect(result.morePages).toBe(false);
      expect(result.notes).toEqual([note5, note4, note3, note2, note1]);
    });

    test('if pagination is less than total length, not all values will be in result. morePages will be true', async () => {
      const result = await imns.getNotes({ pagination: 2 });

      expect(result.notes.length).toBe(2);
      expect(result.morePages).toBe(true);
      expect(result.notes).toEqual([note5, note4]);
    });

    test('Pagination and pages will affect result', async () => {
      const result1 = await imns.getNotes({ pagination: 2, page: 2 });

      expect(result1.notes.length).toBe(2);
      expect(result1.morePages).toBe(true);
      expect(result1.notes).toEqual([note3, note2]);

      const result2 = await imns.getNotes({ pagination: 2, page: 3 });

      expect(result2.notes.length).toBe(1);
      expect(result2.morePages).toBe(false);
      expect(result2.notes).toEqual([note1]);
    });
  });

  describe('getById', () => {});
  describe('addNote', () => {});
  describe('updateNote', () => {});
  describe('deleteNote', () => {});
});
