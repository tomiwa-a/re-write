import { Category } from '../types/frontend';

export const DUMMY_CATEGORIES: Category[] = [
  {
    id: 'notes',
    title: 'NOTES',
    type: 'category',
    collapsed: false,
    icon: `<path d="m6 9 6 6 6-6"/>`,
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
    collapsed: false,
    icon: `<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>`,
    items: [
      { id: 'c1', type: 'canvas', title: 'Brainstorm' },
      { id: 'c2', type: 'canvas', title: 'UI Mockups' }
    ],
    actions: { newFile: true }
  },
  {
    id: 'erd',
    title: 'ERD',
    type: 'category',
    collapsed: true,
    icon: `<rect width="8" height="6" x="8" y="2" rx="2"/><path d="M12 8v4"/><path d="M12 12H7a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h5"/><path d="M12 12h5a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-5"/>`,
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
    icon: `<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>`,
    items: [],
    actions: { newFile: true }
  }
];
