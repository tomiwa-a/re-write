import { documentService } from './documents';
import { GET_STARTED_CONTENT } from '../data/dummy/GetStartedNote';

const CURRENT_USER_ID = 'local-user';

export async function checkAndSeedData(): Promise<string | null> {
    try {
        let docs = await documentService.getAll();
        
        const getStartedDoc = docs.find(d => d.title === 'Get Started' && d.type === 'note');
        
        if (getStartedDoc) {
             await documentService.update(getStartedDoc.id, {
                 content: GET_STARTED_CONTENT
             });
             return getStartedDoc.id;
        }

        if (docs.length === 0 || !getStartedDoc) {
            console.log('Seeding initial data...');
            const newDoc = await documentService.create({
                title: 'Get Started',
                type: 'note',
                content: GET_STARTED_CONTENT,
                userId: CURRENT_USER_ID,
                isLocalOnly: true,
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
