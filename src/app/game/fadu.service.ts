import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface FaduCard {
    id: string;
    name: string;
    pfh: number;
    image: string;
    type: 'standard' | 'sacrifice';
    isSacrifice: boolean;
    probability?: number;
}

interface ApiFaduCard {
    id: string;
    name: string;
    pfh: number;
    image: string;
    type: 'standard' | 'sacrifice';
    probability?: number;
}

interface SacrificeResponse {
    success: boolean;
    card?: ApiFaduCard;
    new_pfh: number;
    previous_pfh: number;
    pfh_change: number;
    message: string;
}

interface ProbabilitiesResponse {
    standard: ApiFaduCard[];
    sacrifice: ApiFaduCard[];
    config: {
        sacrifice_cost: number;
        min_pfh: number;
        max_pfh: number;
    };
}

@Injectable({ providedIn: 'root' })
export class FaduService {
    private readonly apiUrl = environment.apiUrl;
    private readonly sacrificeCost = environment.gameSettings.sacrificeCost;

    constructor(private http: HttpClient) { }

    private transformCard(card: ApiFaduCard): FaduCard {
        return {
            ...card,

            isSacrifice: card.type === 'sacrifice'
        };
    }

    // Tirage d'une carte
    drawCard(cardType: 'standard' | 'sacrifice' = 'standard'): Observable<FaduCard> {
        return this.http.post<ApiFaduCard>(
            `${this.apiUrl}/fadu/draw`,
            { card_type: cardType }
        ).pipe(
            map(apiCard => this.transformCard(apiCard))
        );
    }
    getSacrificeCost(): number {
        return this.sacrificeCost;
    }
    // Effectuer un sacrifice
    performSacrifice(currentPfh: number): Observable<{
        success: boolean;
        card?: FaduCard;
        newPfh: number;
        previousPfh: number;
        pfhChange: number;
        message: string;
    }> {
        return this.http.post<SacrificeResponse>(
            `${this.apiUrl}/fadu/sacrifice`,
            { current_pfh: currentPfh }
        ).pipe(
            map(response => ({
                success: response.success,
                card: response.card ? this.transformCard(response.card) : undefined,
                newPfh: response.new_pfh,
                previousPfh: response.previous_pfh,
                pfhChange: response.pfh_change,
                message: response.message
            }))
        );
    }

    // Obtenir les probabilités
    getProbabilities(): Observable<{
        standard: FaduCard[];
        sacrifice: FaduCard[];
        config: {
            cost: number;
            min: number;
            max: number;
        };
    }> {
        return this.http.get<ProbabilitiesResponse>(
            `${this.apiUrl}/fadu/probabilities`
        ).pipe(
            map(response => ({
                standard: response.standard.map(c => this.transformCard(c)),
                sacrifice: response.sacrifice.map(c => this.transformCard(c)),
                config: {
                    cost: response.config.sacrifice_cost,
                    min: response.config.min_pfh,
                    max: response.config.max_pfh
                }
            }))
        );
    }

    // Chemin de l'image
    getCardImage(card: FaduCard): string {
        const basePath = card.isSacrifice
            ? environment.assetsPath.cards.sacrifice
            : environment.assetsPath.cards.standard;
        return `${basePath}${card.image}`;
    }

    // Dos de carte
    getCardBackImage(): string {
        return 'assets/images/cards/card_back.jpg';
    }
}