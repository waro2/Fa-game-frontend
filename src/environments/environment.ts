export const environment = {
    production: false,               // Mode développement
    apiUrl: 'http://localhost:8000/api/v1', // Endpoint de votre API FastAPI
    wsUrl: 'ws://localhost:8000/ws', // Endpoint WebSocket 
    gameSettings: {                  // Configuration spécifique au jeu
        maxTurns: 20,                  // Nombre maximum de tours
        maxPFH: 280,                   // PFH maximum pour victoire
        sacrificeCost: 14              // Coût du sacrifice en PFH
    },
    assetsPath: {
        cards: {
            standard: 'assets/images/cards/standard/',
            sacrifice: 'assets/images/cards/sacrifice/'
        }
    }
};

