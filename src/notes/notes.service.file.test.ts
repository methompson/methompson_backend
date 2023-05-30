import { mkdir, open } from 'fs/promises';

import { FileNotesService } from '@/src/notes/notes.service.file';
import { Note } from '@/src//models/notes_model';

jest.mock('fs/promises', () => {
  const mkdir = jest.fn();
  const open = jest.fn();

  return {
    mkdir,
    open,
  };
});

const note1 = new Note('id1', 'title1', 'get milk', new Date(1), 'author1');
const note2 = new Note('id2', 'title2', 'get bread', new Date(2), 'author2');

describe('FileNotesService', () => {
  describe('noteString', () => {
    test('Returns a JSON string with an empty array with no notes', async () => {
      const svc = new FileNotesService(await open(''), 'path');
      expect(svc.notesString).toBe('[]');
    });

    test('Returns a JSON string with expected values', async () => {
      const svc = new FileNotesService(await open(''), 'path', [note1]);
      expect(svc.notesString).toBe(`[${JSON.stringify(note1.toJSON())}]`);
    });
  });

  describe('addNote', () => {});
  describe('updateNote', () => {});
  describe('deleteNote', () => {});
  describe('writeToFile', () => {});
  describe('backup', () => {});
  describe('makeFileHandle', () => {});
  describe('writeBackup', () => {});
  describe('init', () => {});
});
