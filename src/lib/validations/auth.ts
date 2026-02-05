import { z } from "zod";

export const loginSchema = z.object({
    email: z
        .string()
        .min(1, "L'email est requis")
        .email("Format d'email invalide"),
    password: z
        .string()
        .min(1, "Le mot de passe est requis")
        .min(6, "Le mot de passe doit contenir au moins 6 caractères"),
});

export const registerSchema = z
    .object({
        companyName: z
            .string()
            .min(1, "Le nom de l'entreprise est requis")
            .min(2, "Le nom doit contenir au moins 2 caractères"),
        name: z
            .string()
            .min(1, "Le nom est requis")
            .min(2, "Le nom doit contenir au moins 2 caractères"),
        email: z
            .string()
            .min(1, "L'email est requis")
            .email("Format d'email invalide"),
        password: z
            .string()
            .min(1, "Le mot de passe est requis")
            .min(8, "Le mot de passe doit contenir au moins 8 caractères")
            .regex(
                /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                "Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre"
            ),
        confirmPassword: z.string().min(1, "La confirmation est requise"),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Les mots de passe ne correspondent pas",
        path: ["confirmPassword"],
    });

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
