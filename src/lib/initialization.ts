import { documentService } from './documents';
import { GET_STARTED_CONTENT } from '../data/dummy/GetStartedNote';
import { Toast } from '../components/Toast';

const CURRENT_USER_ID = 'local-user';

export async function checkAndSeedData(): Promise<void> {
    try {
        const docs = await documentService.getAll();
        
        // 1. Check for existing "Get Started" note to PATCH it (Dev/Fix mode)
        const getStartedNote = docs.find(d => d.title === 'Get Started' && d.type === 'note');
        if (getStartedNote) {
             console.log('Patching "Get Started" note content...');
             await documentService.update(getStartedNote.id, { content: GET_STARTED_CONTENT });
        } else if (docs.length === 0) {
            // 2. Seed if empty
            console.log('Seeding initial data...');
            await documentService.create({
                title: 'Get Started',
                type: 'note',
                content: GET_STARTED_CONTENT,
                userId: CURRENT_USER_ID,
                // Root level, so no folderId
            });
            console.log('Seeding complete.');
        }
    } catch (error) {
        console.error('Failed to seed data:', error);
    }
}
