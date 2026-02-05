import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import prisma from "./prisma";

export const authOptions: NextAuthOptions = {
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 jours
    },
    pages: {
        signIn: "/login",
        error: "/login",
    },
    providers: [
        CredentialsProvider({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Mot de passe", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Identifiants manquants");
                }

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email },
                    include: { company: true },
                });

                if (!user || !user.isActive) {
                    throw new Error("Utilisateur introuvable ou inactif");
                }

                const isPasswordValid = await compare(
                    credentials.password,
                    user.passwordHash
                );

                if (!isPasswordValid) {
                    throw new Error("Mot de passe incorrect");
                }

                // Mise à jour de la dernière connexion
                await prisma.user.update({
                    where: { id: user.id },
                    data: { lastLogin: new Date() },
                });

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    companyId: user.companyId,
                    companyName: user.company.name,
                };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.role = user.role;
                token.companyId = user.companyId;
                token.companyName = user.companyName;
            }
            return token;
        },
        async session({ session, token }) {
            if (token) {
                session.user.id = token.id as string;
                session.user.role = token.role as string;
                session.user.companyId = token.companyId as string;
                session.user.companyName = token.companyName as string;
            }
            return session;
        },
    },
};
