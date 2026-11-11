"""Build the public manual page of one Pathway level (A1, A2, B1, B2) from its PDF.

Usage: python3 scripts/build-manual-level.py a1 path/to/Manuel-A1-APPRENANT.pdf

Since November 2026 the A2 also comes from its born-digital student manual
(the older scanned pipeline, scripts/compose-manual-a2.py, is no longer used).
These manuals are born-digital: whole pages are
published as-is, except the few pages that mix two sections, which are cropped
at the boundary found in the page text. The source PDF is never modified and is
not stored in the repository (see scripts/manual-levels-source.md).

Outputs:
  assets/manual-<level>/cover.webp
  assets/manual-<level>/reader/<section>-<n>.webp, <section>.pdf,
      manuel-<level>-extraits.pdf, pages.js
  programas/<level>/index.html
  v4/data/manuals/<level>.json (facts reused by the V4 program pages)
"""
import html
import json
import re
import sys
from pathlib import Path

import pymupdf as fitz
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
W, H = 595.32, 841.92
SCALE = 2
QUALITY = 84


def find_y(page, pattern, default=None):
    """Top y of the first text block matching pattern (page coordinates)."""
    for x0, y0, x1, y1, text, *_ in page.get_text('blocks'):
        if re.search(pattern, text.replace('\n', ' ')):
            return y0
    if default is None:
        raise ValueError(f'{pattern!r} not found on page {page.number + 1}')
    return default


# Each section lists (page number, top, bottom) in source points. A bound may be
# a regex: the crop then stops (or starts) at the block matching it.
LEVELS = {
    'a1': {
        'title': 'A1',
        'cover': (1, 0, r'^T\s?A\s?B\s?L\s?E D E S'),
        'sections': [
            ('table-matieres', 'Tabla de contenidos', [(1, r'^T\s?A\s?B\s?L\s?E D E S', None), (2, 0, None), (3, 0, None)]),
            ('sommaire', 'Índice detallado', [(4, 0, None), (5, 0, None)]),
            ('unite-1', 'Unidad 1', [(n, 0, None) for n in range(6, 13)]),
            ('examen-a', 'Bilan del segmento A', [(n, 0, None) for n in range(98, 102)]),
        ],
        'segments_page': 3,
        'sommaire_pages': [4, 5],
        'unit_page': 6,
        'exam_page': 98,
        'rule_page': 101,
        'hero': ('Tus primeros pasos.', 'En francés.'),
        'hero_text': 'Explora el manual A1: descubre el recorrido, trabaja una unidad completa y conoce cómo se evalúa tu progreso.',
        'cover_line': ('Del primer bonjour', 'a presentarte con soltura.'),
        'unit_text': 'Aprende a saludar y a despedirte en registro formal e informal, y a adaptar el saludo al momento del día. La unidad termina con un arranque sobre el alfabeto y el deletreo.',
        'description': 'Explora el manual A1 Pathway: 64 unidades, índice detallado, unidad 1 completa y el balance del segmento A. Consulta y descarga los extractos originales.',
    },
    'a2': {
        'title': 'A2',
        'cover': (1, 0, None),
        # The A2 cover card sits inside a white framed page: crop the card itself.
        'cover_card': (61, 45, 535, 512),
        'sections': [
            ('table-matieres', 'Tabla de contenidos', [(2, 0, None)]),
            ('sommaire', 'Índice detallado', [(3, 0, None), (4, 0, None)]),
            ('unite-1', 'Unidad 1', [(n, 0, None) for n in range(6, 13)]),
            ('examen-a', 'Bilan del segmento A', [(n, 0, None) for n in range(97, 101)]),
        ],
        'segments_page': 2,
        'sommaire_pages': [3, 4],
        'unit_page': 6,
        'exam_page': 97,
        'rule_page': 100,
        'hero': ('Tu próximo paso.', 'En francés.'),
        'hero_text': 'Explora el manual A2: descubre el recorrido, trabaja una unidad completa y conoce cómo se evalúa tu progreso.',
        'cover_line': ('De la rutina', 'a tus propias ideas.'),
        'unit_text': 'Aprende a conjugar los verbos en -er, hablar de tu rutina y utilizar los pronombres sujeto. La unidad empieza con un diagnóstico de entrada de 15 minutos.',
        'description': 'Explora el manual A2 Pathway: 64 unidades, índice detallado, unidad 1 completa y el balance del segmento A. Consulta y descarga los extractos originales.',
    },
    'b1': {
        'title': 'B1',
        'cover': (1, 0, None),
        'sections': [
            ('table-matieres', 'Tabla de contenidos', [(2, 0, None)]),
            ('sommaire', 'Índice detallado', [(3, 0, None), (4, 0, None)]),
            ('unite-1', 'Unidad 1', [(n, 0, None) for n in range(6, 13)]),
            ('examen-a', 'Bilan del segmento A', [(n, 0, None) for n in range(97, 101)]),
        ],
        'segments_page': 2,
        'sommaire_pages': [3, 4],
        'unit_page': 6,
        'exam_page': 97,
        'rule_page': 100,
        'hero': ('Expresarte con independencia.', 'En francés.'),
        'hero_text': 'Explora el manual B1: descubre el recorrido hacia la autonomía y el TCF Canada, trabaja una unidad completa y conoce cómo se evalúa tu progreso.',
        'cover_line': ('De dar tu opinión', 'a argumentar con matices.'),
        'unit_text': 'Reactiva los cuatro tiempos básicos del A2 y sitúa una acción en el presente, el pasado o el futuro. La unidad empieza con un diagnóstico de entrada de 15 minutos.',
        'description': 'Explora el manual B1 Pathway: 64 unidades, índice detallado, unidad 1 completa y el balance del segmento A, con preparación al TCF Canada. Consulta y descarga los extractos originales.',
    },
    'b2': {
        'title': 'B2',
        'cover': (1, 0, None),
        'sections': [
            ('table-matieres', 'Tabla de contenidos', [(2, 0, None)]),
            ('sommaire', 'Índice detallado', [(3, 0, None), (4, 0, None)]),
            ('unite-1', 'Unidad 1', [(n, 0, None) for n in range(6, 14)]),
            ('examen-a', 'Bilan del segmento A', [(n, 0, None) for n in range(110, 113)] + [(113, 0, r'^F R A N Ç A I S')]),
        ],
        'segments_page': 2,
        'sommaire_pages': [3, 4],
        'unit_page': 6,
        'exam_page': 110,
        'rule_page': 113,
        'hero': ('Argumentar con matices.', 'En francés.'),
        'hero_text': 'Explora el manual B2: descubre el recorrido hacia la autonomía académica y el TCF Canada, trabaja una unidad completa y conoce cómo se evalúa tu progreso.',
        'cover_line': ('Del matiz', 'al discurso complejo.'),
        'unit_text': 'Consolida el sistema de tiempos del B1 y encadena tus ideas con conectores complejos. La unidad empieza con un diagnóstico de entrada al B2 de 15 minutos.',
        'description': 'Explora el manual B2 Pathway: 64 unidades, índice detallado, unidad 1 completa y el balance del segmento A, con preparación al TCF Canada. Consulta y descarga los extractos originales.',
    },
}


def bound(page, value, default, is_bottom=False):
    if value is None:
        return default
    if not isinstance(value, str):
        return value
    y = find_y(page, value)
    if not is_bottom:
        return y - 6
    # Stop just below the last text above the match, so the decorated card
    # that holds the matched text is left out entirely.
    above = [b[3] for b in page.get_text('blocks') if b[3] < y - 1]
    return (max(above) if above else y) + 14


def save_webp(pix, path):
    Image.frombytes('RGB', [pix.width, pix.height], pix.samples).save(path, 'WEBP', quality=QUALITY, method=6)


def build_assets(level, cfg, source):
    asset_dir = ROOT / f'assets/manual-{level}'
    reader = asset_dir / 'reader'
    reader.mkdir(parents=True, exist_ok=True)
    for old in reader.glob('*'):
        old.unlink()

    # Cover: the cover card, scaled onto a full page of its own background.
    n, top, bottom = cfg['cover']
    page = source[n - 1]
    full = (round(W * SCALE), round(H * SCALE))
    if 'cover_card' in cfg:
        # Exact card rectangle (points), inset to stay inside its rounded corners.
        x0, y0, x1, y1 = cfg['cover_card']
        pix = page.get_pixmap(matrix=fitz.Matrix(SCALE, SCALE), clip=fitz.Rect(x0 + 8, y0 + 8, x1 - 8, y1 - 8))
        card = Image.frombytes('RGB', [pix.width, pix.height], pix.samples)
    else:
        clip = fitz.Rect(0, bound(page, top, 0), W, bound(page, bottom, H))
        pix = page.get_pixmap(matrix=fitz.Matrix(SCALE, SCALE), clip=clip)
        card = Image.frombytes('RGB', [pix.width, pix.height], pix.samples)
        # Keep only the cover card: trim the white page margin and the rounded
        # corners, then centre it full-bleed on its own background colour.
        mask = Image.eval(card.convert('L'), lambda v: 255 if v < 235 else 0)
        x0, y0, x1, y1 = mask.getbbox() or (0, 0, *card.size)
        inset = 14 * SCALE
        card = card.crop((x0 + inset, y0 + inset, x1 - inset, y1 - inset))
    bg = card.getpixel((4, 4))
    card = card.resize((full[0], round(card.height * full[0] / card.width)))
    canvas = Image.new('RGB', full, bg)
    canvas.paste(card, (0, max(0, (full[1] - card.height) // 2)))
    card = canvas
    card.save(asset_dir / 'cover.webp', 'WEBP', quality=QUALITY, method=6)

    manifest, combined, number = [], fitz.open(), 0
    for key, title, items in cfg['sections']:
        out = fitz.open()
        for index, (n, top, bottom) in enumerate(items, 1):
            src = source[n - 1]
            clip = fitz.Rect(0, bound(src, top, 0), W, bound(src, bottom, H, True))
            dest = out.new_page(width=W, height=H)
            dest.show_pdf_page(fitz.Rect(0, 0, W, clip.height), source, n - 1, clip=clip)
            number += 1
            name = f'{key}-{index}.webp'
            save_webp(dest.get_pixmap(matrix=fitz.Matrix(SCALE, SCALE)), reader / name)
            manifest.append({'src': f'/assets/manual-{level}/reader/{name}', 'title': title,
                             'n': number, 'source': str(n), 'key': key})
        out.set_metadata({'title': f'Pathway {cfg["title"]} - {key} - extraits', 'author': 'Pathway Language Solutions'})
        out.save(reader / f'{key}.pdf', garbage=4, deflate=True)
        combined.insert_pdf(out)
    combined.set_metadata({'title': f'Manuel {cfg["title"]} Pathway - extraits', 'author': 'Pathway Language Solutions'})
    combined.save(reader / f'manuel-{level}-extraits.pdf', garbage=4, deflate=True)
    (reader / 'pages.js').write_text('window.PathwayManualPages = ' + json.dumps(manifest, ensure_ascii=False) + ';\n', encoding='utf-8')
    return manifest


def clean(text):
    return re.sub(r'\s+', ' ', text.replace('‑', '-')).strip()


def read_content(cfg, source):
    """Facts shown on the page, read from the manual rather than retyped."""
    text = source[cfg['segments_page'] - 1].get_text()
    segments = []
    for match in re.finditer(r'Segment ([A-D]), ([^\n]+)\nUnités (\d+) – (\d+)\n(.*?)(?=\nSegment [A-D], |\Z)', text, re.S):
        letter, name, first, last, desc = match.groups()
        desc = clean(desc)
        desc = re.split(r' → ', desc)[0].rstrip('. ') + '.'
        segments.append({'letter': letter, 'name': clean(name), 'units': f'{first}–{last}', 'desc': desc})
    if len(segments) != 4:
        raise ValueError(f'expected 4 segments, found {len(segments)}')

    units = {}
    for n in cfg['sommaire_pages']:
        for number, name in re.findall(r'U(\d+) · ([^\n]+)', source[n - 1].get_text()):
            units[int(number)] = clean(name)
    segment_a = [units[i] for i in range(1, 16)]

    unit = source[cfg['unit_page'] - 1].get_text()
    duration = clean(re.search(r'⏱ ([^\n]+)', unit).group(1))
    title = clean(re.search(r'⏱ [^\n]+\n(.*?)\nObjectifs', unit, re.S).group(1))

    exam = source[cfg['exam_page'] - 1].get_text()
    exam_title = clean(re.search(r'VERSION A\n(.*?)\n\d\n', exam, re.S).group(1))
    exam_time = clean(re.search(r'⏱ ([^·\n]+)', exam).group(1))
    rule = clean(re.search(r'(Règle de décision interne.*?)(?:Règle propre|\n[A-Z][^\n]*Pathway Language|\Z)', source[cfg['rule_page'] - 1].get_text(), re.S).group(1))
    return {'segments': segments, 'segment_a': segment_a, 'unit_title': title, 'unit_time': duration,
            'exam_title': exam_title, 'exam_time': exam_time, 'rule': rule}


def figures(level, manifest, key):
    pages = [p for p in manifest if p['key'] == key]
    out = []
    for p in pages:
        label = f'{p["title"]}, página {p["n"]}'
        out.append(
            f'<figure class="manual-sheet"><a href="{p["src"]}" target="_blank" rel="noopener" aria-label="Ampliar {label}">'
            f'<img src="{p["src"]}" width="{round(W * SCALE)}" height="{round(H * SCALE)}" loading="lazy" decoding="async" '
            f'alt="{label} de los extractos"></a><figcaption>Pathway {level.upper()} · p. {p["n"]}<span>Fuente: manual, p. {p["source"]}</span></figcaption></figure>')
    count = len(pages)
    noun = 'página' if count == 1 else 'páginas'
    return (f'<details class="manual-reader"><summary><span>Consultar {pages[0]["title"]}</span><span>{count} {noun} <b aria-hidden="true">＋</b></span></summary>'
            f'<div class="manual-pages" lang="fr">{"".join(out)}</div></details>'
            f'<a class="manual-download" href="/assets/manual-{level}/reader/{key}.pdf" download>Descargar {pages[0]["title"]} · PDF ↓</a>')


def render_page(level, cfg, manifest, content):
    e = html.escape
    L = cfg['title']
    starts = {}
    for i, p in enumerate(manifest):
        starts.setdefault(p['key'], i)
    unit_pages = sum(1 for p in manifest if p['key'] == 'unite-1')
    segment_html = ''.join(
        f'<article class="segment"><span class="segment-letter">{s["letter"]}</span><div><small>Unités {s["units"]}</small>'
        f'<h3>{e(s["name"])}</h3><p>{e(s["desc"])}</p></div></article>' for s in content['segments'])
    rows = ''.join(
        f'<fieldset class="assessment-row"><legend>U{i + 1} · {e(name)}</legend><div>'
        + ''.join(f'<label><input type="radio" name="skill-{i}" value="{v}"><span>{t}</span></label>'
                  for v, t in enumerate(['Acquis', 'En cours', 'À revoir']))
        + '</div></fieldset>' for i, name in enumerate(content['segment_a']))
    hero1, hero2 = cfg['hero']
    cover1, cover2 = cfg['cover_line']
    version = 'reader-7'
    return f'''<!doctype html>
<html lang="es" class="brand-palette"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#f5efe4"><title>Programa {L} · Explora el manual | Pathway</title>
<meta name="description" content="{e(cfg['description'])}">
<link rel="canonical" href="https://pathway-languages.com/programas/{level}/">
<link rel="icon" href="/pathway-mark.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Outfit:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/pathway-v3.css"><link rel="stylesheet" href="/programa.css"><link rel="stylesheet" href="/manual-a2.css?v={version}">
</head><body class="program-page-body manual-body">
<!-- Generated by scripts/build-manual-level.py; edit the script, not this file. -->
<a class="skip-link" href="#manual">Saltar al contenido</a>
<header class="site-header"><div class="container header-inner"><a class="brand" href="/" aria-label="Pathway, inicio"><img src="/pathway-mark.svg" width="39" height="39" alt=""><span>Pathway<small>Language Solutions</small></span></a><nav class="program-header-nav" aria-label="Navegación principal"><a href="/">Volver al inicio</a><a class="button button-primary" href="/test-placement.html">Evaluar mi nivel</a></nav></div></header>
<main id="manual" class="reader-shell">
<div class="reader-heading"><div><span>LA BIBLIOTECA PATHWAY</span><h1>Tu manual de francés <b>{L}</b></h1></div><a href="/assets/manual-{level}/reader/manuel-{level}-extraits.pdf" download>Descargar los extractos <span aria-hidden="true">↓</span></a></div>
<div class="reader-toolbar"><label for="chapter">Ir a <select id="chapter"><option value="{starts['table-matieres']}">Tabla de contenidos</option><option value="{starts['sommaire']}">Índice detallado</option><option value="{starts['unite-1']}">Unidad 1 completa</option><option value="{starts['examen-a']}">Bilan del segmento A</option></select></label><div class="reader-toolbar-actions"><button type="button" id="zoom-open" aria-label="Ampliar la página actual">Ampliar página</button><button type="button" id="fullscreen-open" class="reader-fullscreen-trigger" aria-pressed="false" aria-label="Abrir el manual en pantalla completa"><span id="fullscreen-label">Pantalla completa</span><span id="fullscreen-icon" aria-hidden="true">↗</span></button></div></div>
<div class="book-desk"><div class="book is-closed" id="book" data-level="{L}" tabindex="0" role="region" aria-label="Manual {L}. Usa las flechas del teclado para pasar las páginas."><div class="book-page left-page" id="left-page"></div><div class="book-page right-page" id="right-page"></div><div class="book-spine" aria-hidden="true"></div><div class="turning-leaf" id="leaf" aria-hidden="true"><div class="leaf-front"></div><div class="leaf-back"></div></div><button type="button" class="page-edge edge-left" id="edge-prev" aria-label="Página anterior"><span>‹</span></button><button type="button" class="page-edge edge-right" id="edge-next" aria-label="Página siguiente"><span>›</span></button><button type="button" class="book-cover" id="cover" aria-label="Abrir el manual {L}"><img src="/assets/manual-{level}/cover.webp" alt="Manuel de français — niveau {L}" fetchpriority="high"><span>Abrir el manual →</span></button></div></div>
<div class="reader-controls"><button id="previous" type="button" aria-label="Página anterior">←</button><div><p id="page-label" aria-live="polite" aria-atomic="true">Abriendo el manual…</p><span id="reader-hint">Desliza o toca el borde para pasar la página</span></div><button id="next" type="button" aria-label="Página siguiente">→</button></div><div class="reader-progress" aria-hidden="true"><span id="progress"></span></div>
<div class="reader-bottom"><button type="button" id="close-book">Volver a la portada</button><a href="#reading-alternative">Lectura continua y autoevaluación</a><span>Contenido original · Páginas completas</span></div>
</main><dialog id="page-zoom" aria-label="Página ampliada"><header><span id="zoom-label">Manuel {L}</span><button id="zoom-close" type="button" aria-label="Cerrar la página ampliada">Cerrar ✕</button></header><div id="zoom-content"></div></dialog>
<details id="reading-alternative" class="reading-alternative"><summary>Lectura continua y autoevaluación interactiva</summary><div id="lectura">
<section class="manual-hero container"><div><nav class="program-breadcrumbs" aria-label="Ruta de navegación"><a href="/">Inicio</a><span>/</span><span aria-current="page">Programa {L}</span></nav><span class="program-level-label">Dentro del método Pathway</span><h1>{e(hero1)}<br><em>{e(hero2)}</em></h1><p>{e(cfg['hero_text'])}</p><a class="button button-primary" href="#unidad">Explorar la unidad 1 <span aria-hidden="true">↓</span></a><a class="manual-download" href="/assets/manual-{level}/reader/manuel-{level}-extraits.pdf" download>Todos los extractos · PDF ↓</a></div><aside class="manual-cover" aria-label="Manual de francés {L}"><span>Pathway · Français langue étrangère</span><strong>{L}</strong><h2>{e(cover1)}<br>{e(cover2)}</h2><p>64 unidades · 4 segmentos<br>4 balances internos</p><span class="cover-bottom">Un recorrido. Paso a paso.</span></aside></section>
<div class="manual-layout container"><nav class="manual-nav" aria-label="En esta página"><span>Explora el manual</span><a href="#tabla"><b>01</b> Tabla de contenidos</a><a href="#sommaire"><b>02</b> Índice detallado</a><a href="#unidad"><b>03</b> Unidad 1 completa</a><a href="#examen"><b>04</b> Bilan del segmento A</a><a href="#autoevaluacion"><b>05</b> Autoevaluación</a><small>Los documentos conservan el francés y el contenido del manual original.</small></nav><div class="manual-content">
<section id="tabla" class="manual-section"><span class="program-level-label">01 · El recorrido</span><h2>Cuatro segmentos.<br>Una progresión clara.</h2><p>Cada segmento reúne 16 unidades con la misma progresión y termina con un balance interno.</p><div class="segment-list" lang="fr">{segment_html}</div>{figures(level, manifest, 'table-matieres')}</section>
<section id="sommaire" class="manual-section"><span class="program-level-label">02 · El contenido</span><h2>Las 64 unidades, en detalle.</h2><p>Consulta el sommaire détaillé completo: todos los títulos, en su orden de aprendizaje.</p>{figures(level, manifest, 'sommaire')}</section>
<section id="unidad" class="manual-section"><span class="program-level-label">03 · Una unidad de principio a fin</span><h2 lang="fr">{e(content['unit_title'])}</h2><p>Unidad 1 · <span lang="fr">{e(content['unit_time'])}</span>. {e(cfg['unit_text'])}</p><ol class="unit-stages"><li>Situación y observación</li><li>Explicación y ejercicios guiados</li><li>Consolidación y aplicación</li><li>Producción y comprensión</li><li>Vocabulario clave</li></ol><p>Las {unit_pages} páginas reproducen la unidad completa, tal como aparece en el manual.</p>{figures(level, manifest, 'unite-1')}</section>
<section id="examen" class="manual-section"><span class="program-level-label">04 · Comprobar lo aprendido</span><h2>El balance completo<br>del segmento A.</h2><p>Unidad 16 · <span lang="fr">{e(content['exam_time'])}</span> · 100 puntos. <span lang="fr">{e(content['exam_title'])}</span>: las cuatro pruebas movilizan las nociones de las unidades 1–15.</p><div class="exam-parts"><span>Comprensión oral <b>25 puntos</b></span><span>Comprensión escrita <b>25 puntos</b></span><span>Producción escrita <b>25 puntos</b></span><span>Producción e interacción orales <b>25 puntos</b></span></div>{figures(level, manifest, 'examen-a')}<p class="manual-note">El profesor lee los documentos de comprensión oral. Criterio indicado en el manual: <span lang="fr">{e(content['rule'])}</span></p></section>
<section id="autoevaluacion" class="manual-section"><span class="program-level-label">05 · Hacer balance</span><h2>Reconoce tus avances.</h2><p>Las quince unidades del segmento A, tal como aparecen en el sommaire. Marca una respuesta por línea para preparar el balance con tu profesor.</p><form class="manual-assessment" lang="fr"><h3>Unités 1–15</h3>{rows}<button class="manual-reset" type="reset">Effacer mes réponses</button></form><p class="manual-note">Tus respuestas no se envían ni se guardan al cerrar la página. Esta reflexión personal complementa la evaluación del profesor.</p></section>
</div></div><section class="program-closing"><div class="container program-closing-inner"><div><span>¿Listo para empezar?</span><h2>Encuentra tu punto de partida.</h2></div><a class="button" href="/test-placement.html" data-cta="program-{level}-evaluation">Evaluar mi nivel →</a></div></section></div>
<footer class="program-footer"><div class="container"><span>Pathway Language Solutions · Programa {L}</span><a href="/">Inicio</a><a href="/privacidad.html">Privacidad</a></div></footer></details><script src="/assets/manual-{level}/reader/pages.js?v={version}"></script><script src="/manual-a2.js?v={version}"></script><script src="/analytics.js"></script></body></html>
'''


def main():
    level, source_path = sys.argv[1].lower(), Path(sys.argv[2])
    cfg = LEVELS[level]
    source = fitz.open(source_path)
    manifest = build_assets(level, cfg, source)
    content = read_content(cfg, source)
    page = ROOT / f'programas/{level}/index.html'
    page.write_text(render_page(level, cfg, manifest, content), encoding='utf-8')
    # Facts for the V4 program pages (scripts/build-v4-programs.mjs).
    data = ROOT / f'v4/data/manuals/{level}.json'
    data.parent.mkdir(parents=True, exist_ok=True)
    data.write_text(json.dumps({'level': cfg['title'], **content}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    size = sum(p.stat().st_size for p in (ROOT / f'assets/manual-{level}').rglob('*') if p.is_file())
    print(f'{level}: {len(manifest)} pages, assets {size / 1e6:.1f} MB, unit 1 "{content["unit_title"]}"')


if __name__ == '__main__':
    main()
