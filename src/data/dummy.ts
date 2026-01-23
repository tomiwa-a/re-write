import { Category } from '../types/frontend';
import { NotesIcon } from '../assets/icons/notes';
import { CanvasIcon } from '../assets/icons/canvas';
import { ERDIcon } from '../assets/icons/erd';
import { CodeIcon } from '../assets/icons/code';

export const DUMMY_CATEGORIES: Category[] = [
  {
    id: 'notes',
    title: 'NOTES',
    type: 'category',
    collapsed: false,
    icon: NotesIcon,
    items: [
      { id: 'n1', type: 'note', title: 'Getting Started' },
      { id: 'n2', type: 'note', title: 'Ideas' },
      { 
        id: 'f1', type: 'folder', title: 'Journal', collapsed: true,
        children: [
          { id: 'n3', type: 'note', title: 'Day 1' },
          { id: 'n4', type: 'note', title: 'Day 2' }
        ]
      }
    ],
    actions: { newFile: true, newFolder: true }
  },
  {
    id: 'canvas',
    title: 'CANVAS',
    type: 'category',
    collapsed: true,
    icon: CanvasIcon,
    items: [
      { id: 'c1', type: 'canvas', title: 'Brainstorm' },
      { id: 'c2', type: 'canvas', title: 'UI Mockups' }
    ],
    actions: { newFile: true, newFolder: true }
  },
  {
    id: 'erd',
    title: 'ERD',
    type: 'category',
    collapsed: true,
    icon: ERDIcon,
    items: [
       { id: 'e1', type: 'diagram', title: 'Schema V1' }
    ],
    actions: { newFile: true }
  },
  {
    id: 'code',
    title: 'CODE',
    type: 'category',
    collapsed: true,
    icon: CodeIcon,
    items: [],
    actions: { newFile: true }
  }
];
