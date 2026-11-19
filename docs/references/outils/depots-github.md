# Dépôts GitHub : classés par thème et par utilité pour Pathway

**Sources :** une compilation de 5 posts sur X, vérifiée le 19 nov. 2026 (63 dépôts uniques, liens testés). On y ajoute 3 dépôts cités dans la référence 01 (Remotion, ses skills, HyperFrames).

**Ce que mesure la note.** Elle dit l'**utilité pour Pathway**, pas la qualité de l'outil :
- ★★★ : à utiliser pour le studio vidéo et les réseaux sociaux ;
- ★★ : utile selon le format ;
- ★ : hors sujet pour l'instant.

Le site et le Campus sont en **HTML/CSS/JS sans framework**. Les outils React ou Tailwind ne servent donc qu'aux vidéos (Remotion), pas au site.

**Avant toute installation :**
- vérifier la licence ;
- lire le code d'un skill ou d'un serveur MCP avant de l'activer : il peut lire et exécuter des choses dans la session ;
- aucun compte payant sans l'accord de Sacha ;
- aucune clé dans le chat.

**Rien n'a été installé ni testé.**

---

## Sélection de départ pour le studio vidéo

Le minimum pour produire la pub principale, les Reels et les posts :

| Besoin | Outil |
|---|---|
| Animer en code | GSAP, avec [greensock/gsap-skills](https://github.com/greensock/gsap-skills), ou [Remotion](https://github.com/remotion-dev/remotion) avec [remotion-dev/skills](https://github.com/remotion-dev/skills) |
| Capturer les images et vérifier | [microsoft/playwright](https://github.com/microsoft/playwright), déjà présent dans les sessions cloud |
| Encoder, assembler, faire les planches d'images | [FFmpeg/FFmpeg](https://github.com/FFmpeg/FFmpeg), avec [kajisho5/ffmpeg-skill](https://github.com/kajisho5/ffmpeg-skill) |
| Sous-titrer les vrais témoignages | [m-bain/whisperX](https://github.com/m-bain/whisperX), ou la transcription ElevenLabs (déjà payé) |
| Détourer captures et portraits | [danielgatis/rembg](https://github.com/danielgatis/rembg) |
| Visuels fixes pour Instagram (carrousels, posts) | `canvas-design` et `frontend-design` dans [anthropics/skills](https://github.com/anthropics/skills) |
| Écrire la charte pour les agents | [google-labs-code/design.md](https://github.com/google-labs-code/design.md), comme modèle de `bible.md` |

---

## 1. Rendu vidéo et animation en code

| Dépôt | À quoi il sert | Utilité |
|---|---|---|
| [remotion-dev/remotion](https://github.com/remotion-dev/remotion) | Vidéos en composants React, rendu paramétré (même composition, données différentes). Licence gratuite pour les petites équipes, à vérifier. | ★★★ |
| [remotion-dev/skills](https://github.com/remotion-dev/skills) | Skills officiels Remotion pour agents : compositions, animations, sous-titres, rendu | ★★★ |
| [greensock/gsap-skills](https://github.com/greensock/gsap-skills) | Skills GSAP : timelines, courbes, effets. GSAP est prévu dans notre plan. | ★★★ |
| [FFmpeg/FFmpeg](https://github.com/FFmpeg/FFmpeg) | Encodage, assemblage, filtres, export | ★★★ |
| [kajisho5/ffmpeg-skill](https://github.com/kajisho5/ffmpeg-skill) | Opérations FFmpeg courantes sous forme de skill | ★★★ |
| [microsoft/playwright](https://github.com/microsoft/playwright) | Pilotage du navigateur : capture image par image, captures du site et du Campus | ★★★ |
| [heygen-com/hyperframes](https://github.com/heygen-com/hyperframes) | Vidéo déterministe en HTML/CSS : une autre option que Remotion | ★★ |
| [motiondivision/motion](https://github.com/motiondivision/motion) | Animations React à ressorts. Utile seulement avec Remotion. | ★★ |
| [maxwellito/vivus](https://github.com/maxwellito/vivus) | Tracé progressif de SVG, par exemple pour dessiner le phare du logo | ★★ |
| [mojs/mojs](https://github.com/mojs/mojs) | Effets graphiques animés (éclats, formes) | ★ |
| [animate-css/animate.css](https://github.com/animate-css/animate.css) | Animations CSS toutes faites. Trop génériques pour notre charte. | ★ |
| [pixijs/pixijs](https://github.com/pixijs/pixijs) | Moteur 2D accéléré, inutile pour nos formats | ★ |
| [rough-stuff/rough](https://github.com/rough-stuff/rough) | Formes au style dessiné à la main | ★ |
| [microsoft/playwright-mcp](https://github.com/microsoft/playwright-mcp) | Playwright sous forme de serveur MCP. Inutile en session cloud, où Playwright est déjà là. | ★ |

## 2. Montage, sous-titres, voix et son

| Dépôt | À quoi il sert | Utilité |
|---|---|---|
| [m-bain/whisperX](https://github.com/m-bain/whisperX) | Transcription avec l'horodatage de chaque mot : sous-titres au mot | ★★★ |
| [moritzkremb/claude-eyes](https://github.com/moritzkremb/claude-eyes) | Permet à un agent de regarder une vidéo, pour le relecteur | ★★ |
| [WyattBlue/auto-editor](https://github.com/WyattBlue/auto-editor) | Coupe automatiquement les silences, par exemple dans les témoignages filmés | ★★ |
| [Breakthrough/PySceneDetect](https://github.com/Breakthrough/PySceneDetect) | Découpe une vidéo en plans, pour extraire des moments de témoignages | ★★ |
| [snakers4/silero-vad](https://github.com/snakers4/silero-vad) | Détecte la parole et les silences | ★★ |
| [openai/whisper](https://github.com/openai/whisper) | Transcription (whisperX est plus précis pour le minutage) | ★★ |
| [mifi/editly](https://github.com/mifi/editly) | Montage à partir d'un fichier de description | ★★ |
| [fishaudio/fish-speech](https://github.com/fishaudio/fish-speech) | Voix de synthèse, une autre option qu'ElevenLabs (vérifier la licence) | ★ |
| [facebookresearch/audiocraft](https://github.com/facebookresearch/audiocraft) | Musique et bruitages générés. La licence des modèles est souvent non commerciale : à vérifier. | ★ |
| [browser-use/video-use](https://github.com/browser-use/video-use) | Montage de rushes par agent | ★ |
| [cathrynlavery/yap-studio](https://github.com/cathrynlavery/yap-studio) | Montage par agent : coupe les temps morts, ajoute des plans d'illustration | ★ |
| [talsiach/take-one](https://github.com/talsiach/take-one) | Vidéo de lancement à partir d'une instruction texte | ★ |
| [HandBrake/HandBrake](https://github.com/HandBrake/HandBrake) | Compression vidéo. FFmpeg suffit. | ★ |
| [OpenCut-app/OpenCut](https://github.com/OpenCut-app/OpenCut) | Éditeur vidéo dans le navigateur, pour un montage manuel | ★ |
| [AcademySoftwareFoundation/OpenTimelineIO](https://github.com/AcademySoftwareFoundation/OpenTimelineIO) | Échange de timelines entre logiciels de montage | ★ |
| [samuelgursky/davinci-resolve-mcp](https://github.com/samuelgursky/davinci-resolve-mcp) | Pilote DaVinci Resolve (logiciel payant, sur poste local) | ★ |
| [blazejkustra/uncut](https://github.com/blazejkustra/uncut) | Éditeur vidéo macOS | ★ |

## 3. Génération IA d'images et de vidéos, 3D

Ces outils servent surtout à générer des images ou de la vidéo réaliste. **Nos interdits s'appliquent** : aucun faux élève, faux professeur ou faux témoignage.

| Dépôt | À quoi il sert | Utilité |
|---|---|---|
| [danielgatis/rembg](https://github.com/danielgatis/rembg) | Supprime l'arrière-plan d'une image | ★★★ |
| [shinpr/mcp-image](https://github.com/shinpr/mcp-image) | Génération d'images et de textures via MCP (fournisseurs payants) | ★ |
| [Comfy-Org/ComfyUI](https://github.com/Comfy-Org/ComfyUI) | Chaînes de génération d'images et de vidéos (carte graphique nécessaire) | ★ |
| [guoyww/AnimateDiff](https://github.com/guoyww/AnimateDiff) | Animation par diffusion | ★ |
| [KlingAIResearch/LivePortrait](https://github.com/KlingAIResearch/LivePortrait) | Anime un portrait : **à exclure** pour de vraies personnes sans leur accord | ★ |
| [hzwer/ECCV2022-RIFE](https://github.com/hzwer/ECCV2022-RIFE) | Images intermédiaires pour plus de fluidité ou des ralentis | ★ |
| [facebookresearch/sam2](https://github.com/facebookresearch/sam2) | Détoure et suit des objets dans une vidéo | ★ |
| [opentoonz/opentoonz](https://github.com/opentoonz/opentoonz) | Logiciel d'animation 2D classique | ★ |
| [pmndrs/react-three-fiber](https://github.com/pmndrs/react-three-fiber) | Scènes 3D en React | ★ |
| [meshy-dev/meshy-mcp-server](https://github.com/meshy-dev/meshy-mcp-server) | Modèles 3D générés (service payant) | ★ |
| [aframevr/aframe](https://github.com/aframevr/aframe) | 3D et réalité virtuelle en HTML | ★ |
| [graphdeco-inria/gaussian-splatting](https://github.com/graphdeco-inria/gaussian-splatting) | Scènes 3D reconstruites à partir de photos | ★ |
| [CesiumGS/cesium](https://github.com/CesiumGS/cesium) | Globe et cartes 3D. Une carte Amérique latine → Canada est envisageable, mais lourde. | ★ |
| [oso95/scroll-world](https://github.com/oso95/scroll-world) | Pages d'arrivée en monde 3D au défilement | ★ |

## 4. Design d'interface et direction artistique

| Dépôt | À quoi il sert | Utilité |
|---|---|---|
| [anthropics/skills](https://github.com/anthropics/skills) | Skills `frontend-design` (interfaces), `canvas-design` (visuels PNG/PDF : posts, carrousels), `pptx`, `theme-factory` | ★★★ |
| [google-labs-code/design.md](https://github.com/google-labs-code/design.md) | Format pour décrire une charte aux agents | ★★★ |
| [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill) | Direction artistique, typographie, mise en page pour agents | ★★ |
| [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) | Styles, palettes, associations de polices | ★★ |
| [adobe/leonardo](https://github.com/adobe/leonardo) | Palettes de couleurs avec un contraste garanti | ★★ |
| [dequelabs/axe-core](https://github.com/dequelabs/axe-core) | Tests d'accessibilité automatiques du site et du Campus | ★★ |
| [lucide-icons/lucide](https://github.com/lucide-icons/lucide) | Icônes. Le site a déjà sa propre bibliothèque (`v4/icons.js`). | ★ |
| [meta/astryx](https://github.com/meta/astryx) | Système de design de Meta pensé pour les agents | ★ |
| [google-labs-code/stitch-skills](https://github.com/google-labs-code/stitch-skills) | Génération d'interfaces avec Google Stitch | ★ |
| [penpot/penpot](https://github.com/penpot/penpot) | Maquettes et prototypes (avec MCP) | ★ |
| [GLips/Figma-Context-MCP](https://github.com/GLips/Figma-Context-MCP) | Lit des maquettes Figma. Pathway n'utilise pas Figma. | ★ |
| [21st-dev/magic-mcp](https://github.com/21st-dev/magic-mcp) | Composants d'interface à partir d'une demande texte | ★ |
| [shadcn-ui/ui](https://github.com/shadcn-ui/ui) | Composants React | ★ |
| [tailwindlabs/tailwindcss](https://github.com/tailwindlabs/tailwindcss) | Framework CSS. Le site n'en utilise pas. | ★ |
| [magicuidesign/magicui](https://github.com/magicuidesign/magicui) | Composants React animés | ★ |
| [radix-ui/primitives](https://github.com/radix-ui/primitives) | Composants React accessibles | ★ |
| [storybookjs/storybook](https://github.com/storybookjs/storybook) | Catalogue de composants | ★ |
| [excalidraw/excalidraw](https://github.com/excalidraw/excalidraw) | Schémas au style dessiné à la main | ★ |
| [tldraw/tldraw](https://github.com/tldraw/tldraw) | Tableau blanc et canevas | ★ |
| [darkroomengineering/lenis](https://github.com/darkroomengineering/lenis) | Défilement fluide de site | ★ |
| [vercel-labs/agent-browser](https://github.com/vercel-labs/agent-browser) | Navigateur piloté par agent. Playwright suffit. | ★ |
