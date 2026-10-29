# Décors de tournage — première implantation

Ouvrir `index.html` via un serveur HTTP (par exemple `python -m http.server 8091`), puis choisir une zone. Le menu de départ ne charge pas la scène 3D avant le choix.

## Lieux

| Zone | Implantation fictive | Décors |
| --- | --- | --- |
| Projet 32 / Rennrat | Parcelle de De Witt Clinton Park | 8 maisons, dont 2 visitables ; école, centre médical et commissariat communs |
| Projet 41 / Herytstory | Parcelle sud de Tompkins Square Park | 13 maisons, dont 2 visitables ; café et réception |

Les deux zones sont distantes d'environ 4,8 km. Leurs voies privées rejoignent les rues existantes, leurs jardins sont séparés et leurs bâtiments évitent les empreintes cadastrales. Les autres parties des parcs restent dans la ville complète. Le petit bâtiment existant dans De Witt Clinton Park est conservé.

Les fichiers sources sont `projet32.json` et `projet41.json`. Cette implantation couvre leurs décors urbains récurrents, et non chaque décor ponctuel de leurs listes : espace, batailles médiévales, circuits automobiles, etc. restent des décors à développer séparément.

Chaque maison principale comprend un salon, une cuisine / espace repas, une chambre / bureau et une salle de bains. Les maisons voisines sont des enveloppes non visitables.

L'école commune comprend deux classes, une cantine, un bureau et un couloir. Le centre médical comprend accueil, consultation, salle d?examen et chambre de soins. Le commissariat comprend accueil, bureau, interrogatoire et cellule. La réception comprend café, préparation et salle de cérémonie. Ces bâtiments sont construits sur mesure : les données locales ne permettent pas d'identifier une façade institutionnelle appropriée dans les parcelles choisies. Aucun bâtiment existant n'est arbitrairement présenté comme une vraie école ou un vrai hôpital.

## Utilisation

- Le panneau **Décors de tournage** permet de choisir un décor et de le visiter à pied.
- Les portes s'ouvrent à proximité. Le personnage existant utilise les collisions des murs et du mobilier.
- Les cadrages intérieurs et extérieurs sont fixes et indépendants du personnage ; la vue à hauteur des yeux permet de circuler.
- Les toits peuvent être retirés pour préparer les plans. Les murs restent en place.
- Le curseur de lumière règle les sources intérieures ; leur puissance s'adapte aussi au jour et à la nuit.
- Changer de zone recharge l'application et libère la scène précédente. La ville complète reste accessible.

Les pièces sont de plain-pied ; les circulations font 2 ? 4 m de large et les passages de portes 1,6 m. Les proportions sont compatibles avec les personnages du projet. Les points `sit` et `sleep` dans `window.studio.anchors` préparent le placement des acteurs ; ils ne constituent pas encore des animations d'assise ou de sommeil. Il n'y a pas encore de timeline, d'éditeur de scènes ou d'export vidéo.

## Chargement et performances

Un mode quartier construit uniquement le quartier choisi et les bâtiments voisins dans une marge de 420 m. Il ne construit ni les autres boroughs, ni les monuments lointains, ni le trafic autoroutier. Le trafic local est plafonné à 32 voitures, 2 bus et 48 piétons. Le graphe routier est borné à la zone. La voie privée reste destinée au joueur ; la circulation automatique reste sur les rues publiques.

Les empreintes des bâtiments et les arbres sont servis par fichiers compressés régionaux : 468 bâtiments pour Rennrat (5 444 octets), 1 809 pour Herytstory (19 357 octets). Les rues et la carte conservent leurs données géographiques communes ; le mode quartier n'est donc pas un téléchargement de toutes les données strictement par tuiles. Son fond géographique est volontairement simplifié à l'extérieur du périmètre construit.

Le mobilier apparaît à moins de 100 m et est retiré au-delà de 160 m avec ses lumières, collisions et points d'action. Les géométries et matériaux des 25 modèles Polyfork restent en cache et sont partagés entre clones. Les murs et sols statiques sont fusionnés par matériau. Les maisons non visitables n'ont pas de mobilier.

## Sources et maintenance

- `js/studio-layout.js` : parcelles, placements, dimensions et répartition entre projets.
- `js/studio-sets.js` : structures, intérieurs, portes, collisions, éclairage et chargement de proximité.
- `js/studio-region.js` : environnement local.
- `js/studio-panel.js` : navigation et cadrages.
- `js/main.js` : sélection initiale ; `js/city-main.js` : application 3D.
- `assets/polyfork/manifest.json` : origine et empreinte SHA-256 de chaque asset. Les en-têtes de licence des modules sont conservés. Ces assets ne sont pas sous la licence du code du projet ; voir https://polyfork.dev/licensing.
- `node tools/fetch-studio-assets.mjs` : récupérer les modules manquants (les copies présentes sont conservées).
- `node tools/build-studio-geodata.mjs` : régénérer les fichiers régionaux après modification des parcelles ou des données complètes. Régénérer ces fichiers après toute reconstruction des bâtiments / arbres.
- `node --test tests/*.test.cjs` : tests du moteur et des implantations.

`window.studio` expose les décors, cadrages, points d'action, visites et statistiques de chargement pour les prochaines étapes du studio.

## Vérifications effectuées

Les 196 tests `.cjs` passent, dont les tests de parcelles, de raccordement des voies et de fichiers régionaux. Le test de reconstruction géographique `.mjs` a également passé. Les sept tests Overpass `.mjs` échouent dans cet environnement Windows : ils lancent `C:\windows\system32\bash.exe` et ne produisent pas le fichier de suivi attendu du faux exécutable `curl`. Le script Overpass n'a pas été modifié.

Vérification WebGPU dans le navigateur : démarrage des deux zones et de la ville complète, seuls fichiers régionaux demandés en mode quartier, trafic local limité et nœuds routiers dans la zone, traversée de porte à pied, cadrages intérieur / extérieur, éclairage de nuit, retrait des intérieurs lors d'un changement de quartier dans la ville complète. Aucune erreur JavaScript constatée après corrections ; les modules Polyfork émettent des avertissements Three.js bénins sur des géométries déjà non indexées.

## Reprise des d?cors

Les quatre maisons principales utilisent des plans distincts (`studio-plans.js`) : salon lavande et chambre de jeu de Rennrat, seconde maison familiale avec cuisine plus profonde, s?jour ouvert/cuisine int?gr?e de Herytstory, seconde maison avec suite ? l?arri?re. Les meubles, rangements, sanitaires et accessoires sont dispos?s par usage dans `studio-dressing.js`.

Les surfaces de route, trottoir, bordure et gazon proviennent du moteur existant. Briques, ardoises, bois et carreaux utilisent des textures r?p?t?es ? l??chelle m?trique (`studio-materials.js`). Les ?tages ext?rieurs et toitures se retirent ensemble. Les ?tages ne sont pas visitables.

L??cole poss?de un auvent, une cour pav?e, du mobilier ext?rieur, un bus, un terrain de basket et des casiers des deux c?t?s du couloir. La clinique poss?de une croix et une ambulance ; le commissariat une entr?e ? colonnes et une voiture de police ; le caf? une terrasse avec auvent. Les panneaux sont des plaques discr?tes. Les v?hicules institutionnels sont des accessoires statiques.

Les jardins ont murets, grilles et plantations ; les lampadaires ?clairent la voie la nuit. Huit lampadaires proches peuvent ?clairer simultan?ment, et les lumi?res int?rieures sont actives dans un rayon de 35 m. Les modules de mobilier sont toujours partag?s et les int?rieurs ?loign?s sont retir?s.
