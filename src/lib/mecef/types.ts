// Types pour l'intégration future avec l'API e-MECeF de la DGI Bénin

export interface MecefInvoiceConfig {
    apiUrl: string;
    token: string;
}

export interface MecefInvoicePayload {
    ifu: string;            // IFU Vendeur
    nim: string;            // Identifiant Machine
    uid: string;            // ID Unique Facture
    type: 'FV' | 'FA';      // Facture Vente (FV), Facture Avoir (FA)
    client: {
        ifu?: string;
        name?: string;
    };
    items: Array<{
        name: string;
        price: number;
        quantity: number;
        taxGroup: 'A' | 'B' | 'C' | 'D' | 'E' | 'F'; // A=Exonéré, B=18%
    }>;
    total: number;
}

export interface MecefVerifyResponse {
    code: string;
    counters: string;
    dateTime: string;
    qrCode: string;
    signature: string;
}

// Fonction placeholder pour l'instant
export const normalizeInvoice = async (invoiceId: string): Promise<MecefVerifyResponse | null> => {
    console.log("Normalisation MECeF en attente d'implémentation pour la facture:", invoiceId);
    return null;
}
