import 'dotenv/config'; // Load env vars first
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { PrismaClient } from '@prisma/client';
import { createClient } from '@libsql/client';
import path from 'path';

async function main() {
    try {
        console.log('Initializing Prisma with LibSQL Adapter...');

        // Check Env
        console.log('DATABASE_URL from env:', process.env.DATABASE_URL);

        // Create LibSQL client
        // Note: LibSQL client typically likes "file:" prefix for local files
        // Using absolute path is safest
        const dbPath = path.resolve('dev.db');
        const url = `file:${dbPath}`;
        console.log('LibSQL Client URL:', url);

        const libsql = createClient({
            url: url,
        });

        // Create Prisma Adapter
        const adapter = new PrismaLibSql(libsql);

        // Initialize Prisma Client
        const prisma = new PrismaClient({
            adapter,
            // We do NOT pass log here to keep it simple, or pass it if needed
            log: ['info', 'warn', 'error']
        });

        console.log('Starting DB Write Verification...');

        // Create a dummy company
        const companyName = `Test Co ${Date.now()}`;
        const userEmail = `user.${Date.now()}@test.com`;

        const company = await prisma.company.create({
            data: {
                name: companyName,
                users: {
                    create: {
                        name: "Test User",
                        email: userEmail,
                        passwordHash: "hash",
                        role: "ADMIN"
                    }
                },
                settings: { create: {} }
            },
            include: { users: true }
        });

        console.log('✅ Company created:', company.name, company.id);
        console.log('✅ User created:', company.users[0].email);

        // Cleanup
        await prisma.company.delete({ where: { id: company.id } });
        console.log('✅ Cleanup done');

    } catch (e) {
        console.error('❌ FAILED:', e);
        process.exit(1);
    }
}

main();
