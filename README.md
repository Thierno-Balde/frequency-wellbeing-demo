# Fréquence — démo publique

Démo publique de l’application PWA **Fréquence** : un signal sonore généré localement dans le navigateur avec Web Audio API.

👉 **Ouvrir la démo :** https://thierno-balde.github.io/frequency-wellbeing-demo/

## Interface

L’écran met la fréquence active, sa saisie et le volume au premier plan. Les sept presets intégrés sont : Racine (396 Hz), Sacré (417 Hz), Plexus solaire (528 Hz), Cœur (639 Hz), Gorge (741 Hz), Troisième œil (852 Hz) et Couronne (963 Hz). Les presets historiques intégrés 256, 432 et 768 Hz ont été retirés. La valeur de lancement 432 Hz reste disponible comme fréquence libre.

La commande **Écouter / Arrêter** reste accessible en bas de l’écran. **Mes presets** est replié par défaut. Les presets personnels existants restent conservés dans le stockage local du navigateur sur cet appareil; aucun compte ni synchronisation serveur.

## Aucun serveur audio

- aucun fichier audio généré ou stocké ;
- aucun backend ;
- aucun compte ;
- aucun modèle IA ;
- le signal est créé à la volée sur l’appareil.

L’application est une expérience de méditation, créativité et bien-être. Elle ne revendique aucun effet médical. Écouter à volume modéré.

## Lecture en arrière-plan

La lecture en arrière-plan a été validée manuellement par Thierno sur iPhone. Le comportement peut varier selon le navigateur et le système d’exploitation; cette validation ne vaut pas pour tous les appareils.

Les presets personnels (nom et fréquence uniquement) restent dans `localStorage` sur ce navigateur/appareil. Effacer les données du site peut les supprimer. Aucun audio n’est stocké.

Le dépôt de développement privé est séparé de ce dépôt public de démonstration.
