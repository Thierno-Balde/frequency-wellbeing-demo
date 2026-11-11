# Spécification v0 — Fréquence

## Contexte

Application web installable qui produit un signal sonore directement dans le navigateur. Le produit doit rester léger, privé, sans compte et sans serveur de génération.

## Décisions confirmées

| Décision | Valeur |
|---|---|
| Plateforme | Navigateur moderne + PWA |
| Audio | Web Audio API, synthèse à la volée |
| Stockage audio | Aucun |
| Backend | Aucun en v0 |
| Entrée principale | Fréquence en Hz |
| Presets | Valeurs prédéfinies, révisables |
| Cibles | iPhone, Android, tablette, desktop |
| Style | Minimal, moderne, inspiré de la clarté Apple sans dépendance Apple |
| Bien-être | Pas de promesse médicale |

## Parcours principal

1. L’utilisateur arrive sur l’écran principal.
2. Une fréquence active est visible en Hz.
3. Il peut saisir une valeur ou choisir un preset.
4. Il appuie sur **Écouter**.
5. Le signal démarre après le geste utilisateur.
6. Il ajuste le volume ou appuie sur **Arrêter**.

## États obligatoires

| État | Retour utilisateur | Action disponible |
|---|---|---|
| Prêt | Fréquence et bouton Écouter | Choisir, modifier, écouter |
| Lecture | Animation discrète et bouton Arrêter | Modifier fréquence, volume, arrêter |
| Arrêt | Retour à l’état prêt | Relancer |
| Fréquence invalide | Message lisible | Corriger |
| Audio bloqué | Message expliquant le geste utilisateur | Appuyer sur Écouter |

## Contraintes UX

- une action principale visible sans défilement sur mobile ;
- contrôles tactiles d’au moins 44 px ;
- contraste lisible en mode clair ;
- aucun texte technique nécessaire pour commencer ;
- volume limité côté interface ;
- le son ne démarre jamais automatiquement ;
- l’état de lecture reste visible ;
- pas de perte silencieuse de l’action utilisateur.

## Critères d’acceptation v0

- CA1 : une fréquence valide met à jour l’affichage en Hz ;
- CA2 : un preset sélectionné devient la fréquence active ;
- CA3 : Écouter crée le signal uniquement après un geste ;
- CA4 : Arrêter coupe le signal avec une sortie progressive ;
- CA5 : modifier la fréquence pendant la lecture modifie le signal sans recréer la page ;
- CA6 : une valeur hors limites est refusée avec un message ;
- CA7 : l’application ne référence aucun fichier audio externe ;
- CA8 : le build statique peut être mis en cache par le service worker ;
- CA9 : l’interface reste utilisable au clavier et avec lecteur d’écran sur les contrôles principaux.


## Thème visuel

- le mode clair reste disponible ;
- un bouton bascule vers un thème sombre sobre ;
- le choix est mémorisé localement dans le navigateur ;
- le contenu, les contrôles et le contraste restent utilisables dans les deux thèmes ;
- le thème ne modifie ni la fréquence ni le moteur audio.


## Presets nommés et presets personnels — chantier validé

- Presets intégrés : exactement sept profils nommés : Racine 396, Sacré 417, Plexus solaire 528, Cœur 639, Gorge 741, Troisième œil 852, Couronne 963 Hz. Les anciens presets intégrés 256, 432 et 768 Hz sont retirés.
- Le preset existant 528 Hz est représenté une seule fois, sous le nom Plexus solaire.
- Presets personnels : l’utilisateur saisit un nom et une fréquence entière de 20 à 20 000 Hz, puis enregistre explicitement.
- Persistance dans `localStorage`, limitée au même navigateur/appareil ; aucun compte, serveur, audio ou synchronisation.
- Données locales versionnées et validées à la lecture ; une erreur de stockage ne doit pas annoncer un faux succès.
- Sélection d’un preset charge la fréquence active. Si la lecture est en cours, l’oscillateur est retuné sans redémarrage de page.
- Les libellés de chakras sont des noms de presets fournis par l’utilisateur ; aucune propriété médicale n’est revendiquée.


## Hiérarchie mobile validée

- Fréquence active, saisie et volume en premier; valeur initiale 432 Hz conservée comme saisie libre pour ne pas modifier le comportement de démarrage.
- Presets intégrés ensuite; « Mes presets » derrière un panneau repliable sans suppression ni migration du stockage existant.
- Commande Écouter/Arrêter fixe en bas sur mobile, accessible pendant le défilement; cibles tactiles ≥44 px.
