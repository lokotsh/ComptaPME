import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";
import Link from "next/link";

export default function FiscaliteDeclarationsPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
            <div className="bg-muted p-6 rounded-full">
                <FileText className="h-12 w-12 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-bold">Déclarations Fiscales</h1>
            <p className="text-muted-foreground text-center max-w-md">
                Ce module permettra de générer et gérer vos liasses fiscales.
                Disponible prochainement.
            </p>
            <Link href="/dashboard/fiscalite/tva">
                <Button>Voir la TVA</Button>
            </Link>
        </div>
    );
}
