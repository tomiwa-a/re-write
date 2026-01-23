import { documentService } from './documents';
import { GET_STARTED_CONTENT } from '../data/dummy/GetStartedNote';

const CURRENT_USER_ID = 'local-user';

export async function checkAndSeedData(): Promise<string | null> {
    try {
        let docs = await documentService.getAll();
        if (docs.length === 0) {
            console.log('Seeding initial data...');
            const newDoc = await documentService.create({
                title: 'Get Started',
                type: 'note',
                content: GET_STARTED_CONTENT,
                userId: CURRENT_USER_ID,
            });
            console.log('Seeding complete.');
            return newDoc.id;
        }
        return docs[0].id;
    } catch (error) {
        console.error('Failed to seed data:', error);
        return null;
    }
}
