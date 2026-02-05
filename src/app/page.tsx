import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Calculator,
  FileText,
  Landmark,
  Users,
  BarChart3,
  ShieldCheck,
  ArrowRight,
  CheckCircle2
} from "lucide-react";

const features = [
  {
    icon: FileText,
    title: "Facturation simplifiée",
    description: "Créez et envoyez vos factures en quelques clics. Suivi des paiements automatique.",
  },
  {
    icon: Landmark,
    title: "Gestion bancaire",
    description: "Importez vos relevés et rapprochez automatiquement vos opérations.",
  },
  {
    icon: Users,
    title: "Paie intégrée",
    description: "Générez les bulletins de paie et déclarations CNSS conformes.",
  },
  {
    icon: BarChart3,
    title: "Rapports en temps réel",
    description: "Tableaux de bord et états financiers disponibles instantanément.",
  },
  {
    icon: ShieldCheck,
    title: "Conforme SYSCOHADA",
    description: "Plan comptable pré-configuré selon les normes OHADA.",
  },
  {
    icon: Calculator,
    title: "TVA automatique",
    description: "Calcul et déclarations TVA générés automatiquement.",
  },
];

const benefits = [
  "Aucune installation requise - 100% en ligne",
  "Interface intuitive en français",
  "Support adapté au contexte béninois",
  "Sauvegarde automatique de vos données",
  "Accessible sur tous vos appareils",
  "Mises à jour gratuites incluses",
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700">
              <Calculator className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">
              ComptaPME
            </span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Connexion</Button>
            </Link>
            <Link href="/register">
              <Button className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800">
                Essai gratuit
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-medium mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              Nouveau : Déclarations CNSS automatiques
            </div>

            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              La comptabilité{" "}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">
                simplifiée
              </span>{" "}
              pour les PME africaines
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Gérez votre comptabilité, facturation, paie et fiscalité en toute autonomie.
              Conçu spécialement pour les entreprises du Bénin et de la zone OHADA.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register">
                <Button size="xl" className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 shadow-lg shadow-blue-500/25">
                  Commencer gratuitement
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/demo">
                <Button size="xl" variant="outline">
                  Voir la démo
                </Button>
              </Link>
            </div>

            <p className="text-sm text-muted-foreground mt-4">
              Essai gratuit 14 jours • Aucune carte bancaire requise
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Tout ce dont vous avez besoin
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Une solution complète pour gérer la comptabilité de votre PME sans comptable sur site.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group p-6 rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10 transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">
                Pourquoi choisir ComptaPME ?
              </h2>
              <p className="text-muted-foreground mb-8">
                Nous comprenons les défis uniques des PME africaines. Notre solution
                est conçue pour vous permettre de gérer votre comptabilité efficacement,
                même sans expertise comptable.
              </p>
              <ul className="space-y-4">
                {benefits.map((benefit) => (
                  <li key={benefit} className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <span className="text-sm">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div className="aspect-video rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-1 shadow-2xl shadow-blue-500/20">
                <div className="w-full h-full rounded-xl bg-slate-900 flex items-center justify-center">
                  <div className="text-center text-white/80">
                    <Calculator className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-sm">Aperçu du tableau de bord</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="relative rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 p-8 md:p-12 overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0" style={{
                backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
              }} />
            </div>

            <div className="relative text-center text-white">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Prêt à simplifier votre comptabilité ?
              </h2>
              <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
                Rejoignez des centaines d&apos;entreprises qui font confiance à ComptaPME pour leur gestion comptable.
              </p>
              <Link href="/register">
                <Button size="xl" className="bg-white text-blue-700 hover:bg-white/90 shadow-lg">
                  Démarrer maintenant
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700">
                <Calculator className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold">ComptaPME</span>
            </div>
            <nav className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="/about" className="hover:text-foreground transition-colors">
                À propos
              </Link>
              <Link href="/pricing" className="hover:text-foreground transition-colors">
                Tarifs
              </Link>
              <Link href="/contact" className="hover:text-foreground transition-colors">
                Contact
              </Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">
                CGU
              </Link>
              <Link href="/privacy" className="hover:text-foreground transition-colors">
                Confidentialité
              </Link>
            </nav>
            <p className="text-sm text-muted-foreground">
              © 2026 ComptaPME. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
