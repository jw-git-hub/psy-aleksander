#!/usr/bin/env python3
"""
=============================================
Сборка шрифтов сайта: Inter (текст) и Manrope (заголовки)

Из полных переменных шрифтов Google Fonts собирается по одному woff2 на
семейство — только нужные глифы и только используемые насыщенности.

Зачем: Google отдаёт шрифты нарезанными по юникод-диапазонам, и знак рубля
«₽» (U+20BD) попадает в диапазон latin-ext. Из-за одного символа браузер
качал 98 КБ вьетнамской и фонетической латиницы — вторая волна запросов
приходила ровно в окно отрисовки LCP.

Запуск (редко — только когда меняется набор символов на сайте):
    python3 -m venv .venv && .venv/bin/pip install fonttools brotli
    .venv/bin/python tools/build-fonts.py
=============================================
"""

import io
import sys
import urllib.request
from pathlib import Path
from tempfile import gettempdir

from fontTools.ttLib import TTFont
from fontTools import subset
from fontTools.varLib import instancer

REPO_ROOT = Path(__file__).resolve().parent.parent
FONTS_DIR = REPO_ROOT / 'fonts'
SOURCES_CACHE = Path(gettempdir()) / 'psy-krasnogor-font-sources'

# Набор символов намеренно шире того, что на сайте сегодня: взята вся
# кириллица и запас типографики, чтобы обычные правки текста не роняли
# шрифт. Запас стоит около 4 КБ на семейство.
CHARSET = (
    ''.join(chr(code) for code in range(0x20, 0x7F))     # ASCII
    + ''.join(chr(code) for code in range(0x400, 0x460))  # кириллица целиком
    + 'ҐґЎўЈј№'                                            # укр./бел. + номер
    + '–—‘’“”„«»…·  ©°×−'                        # типографика
    + '₽€←→↑↓✓★'                                           # символы сайта
)

# Насыщенности должны совпадать с объявленными в css/fonts.css,
# иначе поедет начертание. opsz Inter фиксируем на 14 — так же,
# как это делает Google Fonts для веб-версии.
FAMILIES = [
    {
        'name': 'Inter',
        'url': 'https://github.com/google/fonts/raw/main/ofl/inter/Inter%5Bopsz%2Cwght%5D.ttf',
        'source': 'Inter.ttf',
        'output': 'inter-var.woff2',
        'axes': {'opsz': 14, 'wght': (400, 400, 600)},
    },
    {
        'name': 'Manrope',
        'url': 'https://github.com/google/fonts/raw/main/ofl/manrope/Manrope%5Bwght%5D.ttf',
        'source': 'Manrope.ttf',
        'output': 'manrope-var.woff2',
        'axes': {'wght': (600, 600, 700)},
    },
]


def download_source(url, filename):
    """Скачивает исходный переменный шрифт, повторно используя кэш."""
    SOURCES_CACHE.mkdir(parents=True, exist_ok=True)
    path = SOURCES_CACHE / filename
    if not path.exists():
        print(f'  скачиваю {filename}...')
        urllib.request.urlretrieve(url, path)
    return path


def subset_font(font, charset):
    """Оставляет в шрифте только нужные глифы.

    Набор OpenType-фич — по умолчанию pyftsubset. Он сохраняет кернинг и
    составные глифы кириллицы. Брать layout_features=['*'] нельзя: Inter
    раздувается с 27 до 41 КБ.
    """
    options = subset.Options(glyph_names=False)
    options.flavor = 'woff2'
    available = {chr(code) for code in font.getBestCmap()}
    subsetter = subset.Subsetter(options=options)
    subsetter.populate(text=''.join(c for c in charset if c in available))
    subsetter.subset(font)
    return sorted(c for c in charset if c not in available and c.isprintable())


def build_family(family):
    """Собирает один woff2 из полного переменного шрифта."""
    source = download_source(family['url'], family['source'])
    font = TTFont(source, lazy=False)

    # Порядок важен: сначала subset, потом instancer.
    # В обратном порядке fontTools падает с KeyError: '.notdef'.
    missing = subset_font(font, CHARSET)
    font = instancer.instantiateVariableFont(font, family['axes'], updateFontNames=False)

    buffer = io.BytesIO()
    font.flavor = 'woff2'
    font.save(buffer)
    target = FONTS_DIR / family['output']
    target.write_bytes(buffer.getvalue())
    return target, missing


def report(family, target, missing):
    """Печатает итог сборки семейства."""
    built = TTFont(target)
    axes = [(a.axisTag, a.minValue, a.maxValue) for a in built['fvar'].axes]
    size_kb = target.stat().st_size / 1024
    print(f'  {target.name:20} {size_kb:6.1f} КБ  '
          f'глифов={built["maxp"].numGlyphs}  cmap={len(built.getBestCmap())}  {axes}')
    if missing:
        print(f'    нет в шрифте, уйдёт в fallback: {"".join(missing)}')
    return target.stat().st_size


def main():
    if not FONTS_DIR.is_dir():
        sys.exit(f'Не найден каталог {FONTS_DIR}')

    total = 0
    for family in FAMILIES:
        print(f'{family["name"]}:')
        target, missing = build_family(family)
        total += report(family, target, missing)

    print(f'\nИтого {total / 1024:.1f} КБ в {len(FAMILIES)} файлах.')
    print('Не забудь: css/fonts.css и preload в index.html / pages/privacy.html.')


if __name__ == '__main__':
    main()
