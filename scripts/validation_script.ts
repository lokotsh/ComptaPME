import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
    log: ['info', 'warn', 'error'],
});

async function main() {
    try {
        console.log('Connecting to database...');
        const userCount = await prisma.user.count();
        console.log(`Current user count: ${userCount}`);

        // Check if we can create a dummy company (transaction test)
        // We won't actually commit it if we throw, or we just delete it after.
        // Or we just checking read access is enough to say "DB is OK".
        // Let's try to find a user.

        const users = await prisma.user.findMany({ take: 1 });
        if (users.length > 0) {
            console.log('First user found:', users[0].email);
        } else {
            console.log('No users found.');
        }

        console.log('Database Access OK');

    } catch (e) {
        console.error('Database Access FAILED:', e);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
