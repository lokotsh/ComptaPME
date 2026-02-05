import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { z } from "zod";
import prisma from "@/lib/prisma";

const registerSchema = z.object({
    companyName: z.string().min(2),
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(8),
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validatedData = registerSchema.parse(body);

        // Vérifier si l'email existe déjà
        const existingUser = await prisma.user.findUnique({
            where: { email: validatedData.email },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: "Cet email est déjà utilisé" },
                { status: 400 }
            );
        }

        // Hash du mot de passe
        const passwordHash = await hash(validatedData.password, 12);

        // Création de l'entreprise et de l'utilisateur admin
        const company = await prisma.company.create({
            data: {
                name: validatedData.companyName,
                users: {
                    create: {
                        name: validatedData.name,
                        email: validatedData.email,
                        passwordHash,
                        role: "ADMIN",
                    },
                },
                // Créer les paramètres par défaut
                settings: {
                    create: {},
                },
            },
            include: {
                users: true,
            },
        });

        // Créer l'exercice fiscal par défaut
        const currentYear = new Date().getFullYear();
        await prisma.fiscalYear.create({
            data: {
                companyId: company.id,
                name: currentYear.toString(),
                startDate: new Date(currentYear, 0, 1),
                endDate: new Date(currentYear, 11, 31),
            },
        });

        // Créer le plan comptable SYSCOHADA de base
        await createDefaultAccounts(company.id);

        return NextResponse.json({
            message: "Compte créé avec succès",
            companyId: company.id,
        });
    } catch (error) {
        console.error("Erreur lors de l'inscription:", error);

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Données invalides", details: error.issues },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: `Erreur: ${error instanceof Error ? error.message : String(error)}` },
            { status: 500 }
        );
    }
}

// Créer les comptes comptables de base SYSCOHADA
async function createDefaultAccounts(companyId: string) {
    const defaultAccounts = [
        // Classe 1 - Ressources durables
        { code: "101000", label: "Capital social", type: "EQUITY" as const },
        { code: "120000", label: "Report à nouveau", type: "EQUITY" as const },

        // Classe 2 - Actif immobilisé
        { code: "211000", label: "Frais d'établissement", type: "ASSET" as const },
        { code: "241000", label: "Matériel et outillage", type: "ASSET" as const },
        { code: "244000", label: "Matériel de transport", type: "ASSET" as const },
        { code: "245000", label: "Matériel de bureau", type: "ASSET" as const },
        { code: "281000", label: "Amort. frais d'établissement", type: "ASSET" as const },

        // Classe 3 - Stocks
        { code: "311000", label: "Marchandises", type: "ASSET" as const },
        { code: "321000", label: "Matières premières", type: "ASSET" as const },

        // Classe 4 - Tiers
        { code: "401000", label: "Fournisseurs", type: "LIABILITY" as const },
        { code: "408000", label: "Fournisseurs factures non parvenues", type: "LIABILITY" as const },
        { code: "411000", label: "Clients", type: "ASSET" as const },
        { code: "418000", label: "Clients factures à établir", type: "ASSET" as const },
        { code: "421000", label: "Personnel rémunérations dues", type: "LIABILITY" as const },
        { code: "431000", label: "CNSS", type: "LIABILITY" as const },
        { code: "441000", label: "État, impôt sur les bénéfices", type: "LIABILITY" as const },
        { code: "443100", label: "État, TVA due", type: "LIABILITY" as const },
        { code: "445000", label: "État, TVA récupérable", type: "ASSET" as const },

        // Classe 5 - Trésorerie
        { code: "512000", label: "Banques comptes courants", type: "ASSET" as const },
        { code: "531000", label: "Caisse", type: "ASSET" as const },

        // Classe 6 - Charges
        { code: "601000", label: "Achats de marchandises", type: "EXPENSE" as const },
        { code: "602000", label: "Achats de matières premières", type: "EXPENSE" as const },
        { code: "604000", label: "Achats stockés - autres approvisionnements", type: "EXPENSE" as const },
        { code: "605000", label: "Fournitures non stockables", type: "EXPENSE" as const },
        { code: "611000", label: "Transports sur achats", type: "EXPENSE" as const },
        { code: "613000", label: "Locations", type: "EXPENSE" as const },
        { code: "614000", label: "Charges locatives", type: "EXPENSE" as const },
        { code: "622000", label: "Honoraires et commissions", type: "EXPENSE" as const },
        { code: "624000", label: "Publicité et relations publiques", type: "EXPENSE" as const },
        { code: "625000", label: "Frais de déplacements", type: "EXPENSE" as const },
        { code: "626000", label: "Frais postaux et télécommunications", type: "EXPENSE" as const },
        { code: "641000", label: "Rémunérations du personnel", type: "EXPENSE" as const },
        { code: "646000", label: "Charges de CNSS", type: "EXPENSE" as const },
        { code: "671000", label: "Intérêts des emprunts", type: "EXPENSE" as const },

        // Classe 7 - Produits
        { code: "701000", label: "Ventes de marchandises", type: "REVENUE" as const },
        { code: "706000", label: "Services vendus", type: "REVENUE" as const },
        { code: "707000", label: "Produits accessoires", type: "REVENUE" as const },
        { code: "771000", label: "Intérêts de placement", type: "REVENUE" as const },
    ];

    await prisma.account.createMany({
        data: defaultAccounts.map((account) => ({
            ...account,
            companyId,
        })),
    });
}
