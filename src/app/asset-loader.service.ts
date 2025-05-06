import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class AssetLoaderService {
    private loadedAssets = new Map<string, HTMLImageElement>();

    async preloadAssets(assets: string[]): Promise<void> {
        await Promise.all(assets.map(src => this.loadImage(src)));
    }

    private loadImage(src: string): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.loadedAssets.has(src)) {
                resolve();
                return;
            }

            const img = new Image();
            img.src = src;
            img.onload = () => {
                this.loadedAssets.set(src, img);
                resolve();
            };
            img.onerror = () => reject(new Error(`Failed to load ${src}`));
        });
    }
}