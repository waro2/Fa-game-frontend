import {
    animate,
    animateChild,
    animation,
    AnimationTriggerMetadata,
    group,
    query,
    style,
    transition,
    trigger,
    useAnimation
} from '@angular/animations';

// Animation de base pour le retournement
const flipAnimation = animation([
    style({
        transform: '{{transformFrom}}',
        'transform-style': 'preserve-3d',
        'backface-visibility': 'hidden'
    }),
    animate('{{duration}} {{delay}} ease-in-out', style({
        transform: '{{transformTo}}'
    }))
], {
    params: {
        duration: '500ms',
        delay: '0ms',
        transformFrom: 'rotateY(0deg)',
        transformTo: 'rotateY(180deg)'
    }
});

// Animation de retournement complet (face à dos)
export const flipCardAnimation = animation([
    group([
        // Animation de la face avant
        query('.card-front', [
            useAnimation(flipAnimation, {
                params: {
                    transformFrom: 'rotateY(0deg)',
                    transformTo: 'rotateY(180deg)'
                }
            })
        ], { optional: true }),

        // Animation de la face arrière
        query('.card-back', [
            style({ transform: 'rotateY(180deg)' }),
            useAnimation(flipAnimation, {
                params: {
                    transformFrom: 'rotateY(180deg)',
                    transformTo: 'rotateY(360deg)'
                }
            })
        ], { optional: true }),

        // Animation des enfants (contenu de la carte)
        query('@*', animateChild(), { optional: true })
    ])
]);

// Définition du trigger d'animation
export const cardFlipTrigger: AnimationTriggerMetadata = trigger('cardFlip', [
    // État face visible
    transition('front => back', [
        useAnimation(flipCardAnimation)
    ]),

    // État dos visible
    transition('back => front', [
        useAnimation(flipCardAnimation)
    ]),

    // Animation d'apparition initiale
    transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.8) rotate(5deg)' }),
        animate('300ms ease-out',
            style({ opacity: 1, transform: 'scale(1) rotate(0deg)' }))
    ]),

    // Animation de sacrifice (légère rotation + disparition)
    transition('* => sacrificed', [
        group([
            animate('400ms ease-in',
                style({ transform: 'rotate(15deg) scale(0.8)', opacity: 0 })),
            animateChild()
        ])
    ])
]);

// Animation pour le tirage de carte
export const cardDrawTrigger: AnimationTriggerMetadata = trigger('cardDraw', [
    transition(':enter', [
        style({
            transform: 'translateY(100px) rotate({{angle}}deg) scale(0.5)',
            opacity: 0
        }),
        animate('600ms cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            style({
                transform: 'translateY(0) rotate(0deg) scale(1)',
                opacity: 1
            }))
    ], { params: { angle: 0 } })
]);

// Animation pour le lot des sacrifices
export const sacrificeDeckTrigger: AnimationTriggerMetadata = trigger('sacrificeDeck', [
    transition('* => active', [
        style({ transform: 'scale(1)' }),
        animate('500ms ease-in-out',
            style({ transform: 'scale(1.1)' })),
        animate('500ms ease-in-out',
            style({ transform: 'scale(1)' }))
    ])
]);