import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

async function main() {
    let prisma: PrismaClient | undefined;
    try {
        console.log('Initializing Prisma Client (Standard/Legacy Mode)...');

        // In legacy (Pre-7) mode, URL typically comes from environment variable 'DATABASE_URL' linked in schema
        // or passed implicitly. 
        // Since we are downgrading to 5.22, we rely on standard behavior.
        console.log('DATABASE_URL:', process.env.DATABASE_URL);

        prisma = new PrismaClient({
            log: ['info', 'warn', 'error']
        });

        console.log('Starting DB Write Verification...');

        const randomEmail = `test.legacy.${Date.now()}@example.com`;

        const company = await prisma.company.create({
            data: {
                name: "Test Legacy Company",
                users: {
                    create: {
                        name: "Test User Legacy",
                        email: randomEmail,
                        passwordHash: "mock_hash",
                        role: "ADMIN"
                    }
                },
                settings: {
                    create: {}
                }
            },
            include: {
                users: true
            }
        });

        console.log('✅ Company and User created successfully. Company ID:', company.id);
        console.log('User:', company.users[0].email);

        await prisma.company.delete({
            where: { id: company.id }
        });
        console.log('✅ Cleanup successful.');

    } catch (e) {
        console.error('❌ VERIFICATION FAILED:', e);
        process.exit(1);
    } finally {
        if (prisma) {
            await prisma.$disconnect().catch(() => { });
        }
    }
}

main();
