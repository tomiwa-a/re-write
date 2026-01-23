import { documentService } from './documents';
import { GET_STARTED_CONTENT } from '../data/dummy/GetStartedNote';
import { Toast } from '../components/Toast';

const CURRENT_USER_ID = 'local-user';

export async function checkAndSeedData(): Promise<void> {
    try {
        const docs = await documentService.getAll();
        if (docs.length === 0) {
            console.log('Seeding initial data...');
            await documentService.create({
                title: 'Get Started',
                type: 'note',
                content: GET_STARTED_CONTENT,
                userId: CURRENT_USER_ID,
            });
            console.log('Seeding complete.');
        }
    } catch (error) {
        console.error('Failed to seed data:', error);
    }
}
