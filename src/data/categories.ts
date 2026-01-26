import { Category } from '../types/frontend';
import { FavoritesIcon } from '../assets/icons/favorites';
import { NotesIcon } from '../assets/icons/notes';
import { CanvasIcon } from '../assets/icons/canvas';
import { ERDIcon } from '../assets/icons/erd';

export const INITIAL_CATEGORIES: Category[] = [
    { id: 'favorites', title: 'Favorites', type: 'category', collapsed: true, items: [], icon: FavoritesIcon },
    { 
        id: 'notes', 
        title: 'Notes', 
        type: 'category', 
        collapsed: false, 
        items: [], 
        icon: NotesIcon,
        actions: { newFile: true, newFolder: true }
    },
    { id: 'canvas', title: 'Canvas', type: 'category', collapsed: true, items: [], icon: CanvasIcon, actions: { newFile: true, newFolder: true } },
    { id: 'erd', title: 'Relationships', type: 'category', collapsed: true, items: [], icon: ERDIcon, actions: { newFile: true, newFolder: true } },
];
