import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { enableProdMode } from '@angular/core';
import { environment } from './environments/environment';
import { AssetLoaderService } from './app/asset-loader.service';

// Activation du mode production si nécessaire
if (environment.production) {
  enableProdMode();
}

// Affichage pendant le chargement
const loadingElement = document.createElement('div');
loadingElement.id = 'app-loading';
loadingElement.innerHTML = `
  <div class="loading-content">
    <h1>Jeu Fà</h1>
    <p>Chargement de la simulation stratégique...</p>
    <div class="loading-spinner"></div>
  </div>
`;
document.body.appendChild(loadingElement);

// Styles temporaires pour l'écran de chargement
const loadingStyles = document.createElement('style');
loadingStyles.textContent = `
  #app-loading {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #121212;
    color: #f0f0f0;
    font-family: 'Roboto', sans-serif;
    z-index: 9999;
  }
  .loading-content {
    text-align: center;
  }
  .loading-spinner {
    border: 4px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    border-top: 4px solid #4a6fa5;
    width: 40px;
    height: 40px;
    animation: spin 1s linear infinite;
    margin: 20px auto;
  }
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(loadingStyles);

// Initialisation du jeu
async function initializeApp() {
  try {
    // Étape 1: Préchargement des assets critiques
    const appRef = await bootstrapApplication(AppComponent, appConfig);

    // Étape 2: Récupération du service après bootstrap
    const assetLoader = appRef.injector.get(AssetLoaderService);
    await assetLoader.preloadAssets([
      'assets/cards/standard/gbe_medji.jpg',
      'assets/cards/standard/gbe_abla.jpg',
      'assets/cards/standard/gbe_aklan.jpg',
      'assets/cards/standard/gbe_di.jpg',
      'assets/cards/standard/gbe_loso.jpg',
      'assets/cards/standard/gbe_wlin.jpg',
      'assets/cards/standard/gbe_woli.jpg',
      'assets/cards/standard/gbe_yeku.jpg',



    ]);

    // Étape 3: Suppression de l'écran de chargement
    if (loadingElement) {
      loadingElement.style.opacity = '0';
      setTimeout(() => loadingElement.remove(), 500);
    }
    document.head.removeChild(loadingStyles);

    return appRef;
  } catch (err: unknown) {
    console.error('Erreur lors du démarrage du jeu:', err);

    // Gestion des erreurs
    if (loadingElement) {
      const errorContent = environment.production
        ? ''
        : `<pre>${err instanceof Error ? err.stack || err.message : String(err)}</pre>`;

      loadingElement.innerHTML = `
        <div class="error-content">
          <h1>Erreur de chargement</h1>
          <p>Le jeu n'a pas pu démarrer. Veuillez rafraîchir la page.</p>
          <button onclick="window.location.reload()">Réessayer</button>
          ${errorContent}
        </div>
      `;
    }
    throw err;
  }
}

// Lancement de l'application
initializeApp().catch((err: unknown) => console.error('Initialization failed:', err));