import { DefaultSession, DefaultUser } from "next-auth";
// JWT type augmented directly in module declaration below

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            role: string;
            companyId: string;
            companyName: string;
        } & DefaultSession["user"];
    }

    interface User extends DefaultUser {
        role: string;
        companyId: string;
        companyName: string;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string;
        role: string;
        companyId: string;
        companyName: string;
    }
}
