#!/usr/bin/env python3
"""orient — Level 6 artboard generator.

Writes one Claude Design artboard (.dc.html) per screen per state into
akaaso/06-design/_artboards/, in the dialect of the founder's Orient.dc.html:
<x-dc> + <helmet> linking the Braisor - Preline design system under _ds/,
sc-if / sc-for / x-import markup, and a data-dc-script DCLogic component whose
`stato` and `mazzo` props select the state and the deck shown.

Real artwork is embedded: Purple Pen pictogram SVGs (sources/svg-control-descriptions),
an IOF ISOM drawing and one worked example, downscaled and inlined as data URIs
(paths under ART below). Edit this file and re-run; never edit the artboards.
"""
import re, base64, json, sys, os
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUT = f"{ROOT}/akaaso/06-design/_artboards"
ART = os.environ.get("ORIENT_ART", "/private/tmp/claude-501/-Users-matteo-Developer-orient/74c28e7f-d975-4753-84fb-12e239ba70e8/scratchpad/art")
os.makedirs(OUT, exist_ok=True)

def svg_inner(ref):
    s = open(f"{ROOT}/sources/svg-control-descriptions/symbols/{ref}.svg", encoding="utf-8").read()
    return re.search(r"<svg[^>]*>(.*)</svg>", s, re.S).group(1).strip()
REFS = ["0.2NW","0.5","1.2","1.3","1.9","2.4","2.5","3.7","4.4","5.11","8.6","11.1E","11.4NE","11.15"]
sprite = '<svg width="0" height="0" style="position:absolute;overflow:hidden" aria-hidden="true">\n' + "\n".join(
    f'  <symbol id="s-{r}" viewBox="-100 -100 200 200">{svg_inner(r)}</symbol>' for r in REFS) + "\n</svg>"
sprite = sprite.replace('stroke="black"', 'stroke="currentColor"').replace('fill="black"', 'fill="currentColor"')
def b64(p): return "data:image/png;base64," + base64.b64encode(open(p, "rb").read()).decode()
IMG = {"isom204": b64(f"{ART}/isom-204.png"), "esCarta": b64(f"{ART}/es-carta.png"),
       "esTerreno": b64(f"{ART}/es-terreno.png"), "esRiga": b64(f"{ART}/es-riga.png")}
s1 = open(f"{ROOT}/akaaso/sources/ISOM_2017-2_CH_IT.md", encoding="utf-8").read()
m = re.search(r"^204 Masso \(P\)\n(.*?)(?=^\d{3} )", s1, re.S | re.M)
isom204 = re.sub(r"\s+", " ", " ".join(l.strip() for l in m.group(1).strip().splitlines() if l.strip()).replace("- ", ""))

HELMET = """<helmet>
<link rel="stylesheet" href="_ds/braisor-preline-095ff135-97b7-4430-ba48-8c6b4874b775/tokens/fonts.css">
<link rel="stylesheet" href="_ds/braisor-preline-095ff135-97b7-4430-ba48-8c6b4874b775/tokens/colors.css">
<link rel="stylesheet" href="_ds/braisor-preline-095ff135-97b7-4430-ba48-8c6b4874b775/tokens/typography.css">
<link rel="stylesheet" href="_ds/braisor-preline-095ff135-97b7-4430-ba48-8c6b4874b775/tokens/spacing.css">
<link rel="stylesheet" href="_ds/braisor-preline-095ff135-97b7-4430-ba48-8c6b4874b775/tokens/shadows.css">
<link rel="stylesheet" href="_ds/braisor-preline-095ff135-97b7-4430-ba48-8c6b4874b775/tokens/fig-tokens.css">
<link rel="stylesheet" href="_ds/braisor-preline-095ff135-97b7-4430-ba48-8c6b4874b775/styles.css">
<script src="_ds/braisor-preline-095ff135-97b7-4430-ba48-8c6b4874b775/_ds_bundle.js"></script>
<style>
  :root { --tint: var(--blue-600); }   /* 2.006: one accent — Preline blue, set once */
  body { margin: 0; background: var(--gray-50); }
  a { color: var(--tint-600); text-decoration: none; }
  .riga { display:grid; grid-template-columns: 0.8fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr; border:1.5px solid var(--gray-800); background:#fff; }
  .riga > div { aspect-ratio: 1/1; border-right:1.5px solid var(--gray-800); display:flex; align-items:center; justify-content:center; font-family: var(--font-sans); font-weight:600; color: var(--gray-800); }
  .riga > div:last-child { border-right:0; }
  .riga svg { width:72%; height:72%; color: var(--gray-800); }
  .riga.tile > div { font-size:11px; } .riga.carta > div { font-size:16px; } .riga.lista > div { font-size:9px; }
  .img-bianco { background:#fff; border:1px solid var(--gray-200); border-radius:8px; object-fit:contain; }
</style>
</helmet>"""

def head(title, subtitle):
    return f"""
  <div style="display:flex;flex-direction:column;gap:6px;align-items:center;max-width:520px;text-align:center">
    <div style="font-size:13px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:var(--tint-600)">orient</div>
    <div style="font-size:20px;font-weight:600;letter-spacing:-.02em;color:var(--gray-800)">{title}</div>
    <div style="font-size:13px;line-height:1.5;color:var(--gray-500)">{subtitle}</div>
  </div>"""

def dc(title, subtitle, body, props, script):
    return f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<script src="./support.js"></script>
</head>
<body>
<x-dc>
{HELMET}

{sprite}

<div style="min-height:100vh;display:flex;flex-direction:column;align-items:center;gap:24px;padding:40px 20px 64px;box-sizing:border-box;font-family:var(--font-sans)">
{head(title, subtitle)}

  <x-import component-from-global-scope="PrelineUIDesignSystem_3ff5dc.Device" type="phone" width="{{{{ 392 }}}}" hint-size="392px,812px">
    <div style="height:780px;display:flex;flex-direction:column;background:#fff;overflow:hidden;position:relative">
{body}
    </div>
  </x-import>

  <div style="font-size:12px;color:var(--gray-400);max-width:520px;text-align:center;line-height:1.5">Testi verbatim dalle fonti in <code style="font-family:var(--font-mono);font-size:11px">content/</code>. Pittogrammi: Purple Pen (BSD). Disegni ISOM ed esempi: IOF / Swiss Orienteering (CC BY-ND).</div>
</div>

</x-dc>
<script type="text/x-dc" data-dc-script data-props="{props}">
{script}
</script>
</body>
</html>
"""
def props_attr(d): return json.dumps(d, ensure_ascii=False).replace('"', "&quot;")

JS_COMMON = """
const IMG = %s;
const SIMBOLI = [
  { id:'ds:1.2', rif:'1.2', nome:'Naso', def:'Piccola sporgenza del terreno su un pendio.', sym:'1.2', sez:'Oggetti morfologici' },
  { id:'ds:1.3', rif:'1.3', nome:'Rientranza', def:'Insenatura del terreno su un pendio, valletta, il contrario di un naso.', sym:'1.3', sez:'Oggetti morfologici' },
  { id:'ds:1.9', rif:'1.9', nome:'Collina', def:'Rilievo, rappresentato sulla carta mediante curve di livello.', sym:'1.9', sez:'Oggetti morfologici' },
  { id:'ds:2.4', rif:'2.4', nome:'Sasso', def:'Frammento roccioso isolato.', sym:'2.4', sez:'Rocce e sassi' },
  { id:'ds:2.5', rif:'2.5', nome:'Sassaia', def:'Area ricoperta da svariati sassi da non poter essere mappati individualmente.', sym:'2.5', sez:'Rocce e sassi' },
  { id:'ds:11.1E', rif:'11.1', nome:'Lato est', def:'Posizione della lanterna rispetto all’oggetto: sul lato est.', sym:'11.1E', sez:'Colonna G' },
  { id:'ds:11.4NE', rif:'11.4', nome:'Angolo nord-est', def:'Usato quando il bordo dell’oggetto forma un angolo.', sym:'11.4NE', sez:'Colonna G' },
  { id:'ds:11.15', rif:'11.15', nome:'Tra', def:'La lanterna si trova tra due oggetti.', sym:'11.15', sez:'Colonna G' }
];
const RIGHE = [
  { id:'dc:ufficiale:2', codice:'212', num:'2', celle:{ C:'0.2NW', D:'2.4', E:'', F:'1.0', G:'11.1E', H:'' }, testo:'Sasso nord ovest, 1 m d’altezza, lato est', origine:'ufficiale' },
  { id:'dc:gen:0137', codice:'—', num:'—', celle:{ C:'', D:'1.3', E:'', F:'', G:'11.4NE', H:'' }, testo:'Rientranza, angolo nord-est', origine:'generata' },
  { id:'dc:gen:0041', codice:'—', num:'—', celle:{ C:'0.5', D:'2.5', E:'', F:'', G:'', H:'' }, testo:'Sassaia centrale', origine:'generata' },
  { id:'dc:gen:0088', codice:'—', num:'—', celle:{ C:'', D:'1.9', E:'8.6', F:'', G:'11.15', H:'' }, testo:'Collina, rocciosa, tra', origine:'generata' }
];
const ESEMPIO = { id:'es:066', codice:'66', testo:'Cisterna d’acqua, pozzo, parte est' };
const ISOM = { id:'isom:204', rif:'204', nome:'Masso', geo:'P', sez:'3.2 Rocce e sassi', def: %s };
const CELL_ORDER = ['A','B','C','D','E','F','G','H'];
function cells(r) {
  return CELL_ORDER.map(k => {
    if (k === 'A') return { text: r.num, href: '' };
    if (k === 'B') return { text: r.codice, href: '' };
    const v = r.celle[k] || '';
    if (!v) return { text: '', href: '' };
    if (k === 'F' && /^[0-9]/.test(v)) return { text: v, href: '' };
    return { text: '', href: '#s-' + v };
  });
}
const SEG = 'height:38px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:500;cursor:pointer';
const SEG_ON = SEG + ';background:#fff;color:var(--gray-800);box-shadow:var(--shadow-sm)';
const SEG_OFF = SEG + ';background:transparent;color:var(--gray-500)';
const PILL = 'height:38px;border-radius:8px;border:1px solid var(--gray-200);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:500;cursor:pointer';
const PILL_ON = PILL + ';border-color:var(--tint-600);background:var(--tint-50);color:var(--tint-700)';
const PILL_OFF = PILL + ';background:#fff;color:var(--gray-500)';
const CHIP = 'height:34px;padding:0 14px;border-radius:999px;border:1px solid var(--gray-200);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:500;cursor:pointer';
const CHIP_ON = CHIP + ';border-color:var(--tint-600);background:var(--tint-50);color:var(--tint-700)';
const CHIP_OFF = CHIP + ';background:#fff;color:var(--gray-500)';
const OPT = 'display:flex;align-items:center;gap:12px;min-height:56px;padding:12px 16px;border-radius:12px;border:1px solid var(--gray-200);background:#fff;box-shadow:var(--shadow-sm);cursor:pointer;box-sizing:border-box';
const TILE = 'display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;min-height:116px;padding:10px;border-radius:12px;border:1px solid var(--gray-200);background:#fff;box-shadow:var(--shadow-sm);cursor:pointer;box-sizing:border-box';
const BOX_OFF = 'width:22px;height:22px;border-radius:6px;border:1px solid var(--gray-300);background:#fff;display:flex;align-items:center;justify-content:center;flex-shrink:0';
const BOX_ON = 'width:22px;height:22px;border-radius:6px;border:1px solid var(--tint-600);background:var(--tint-600);display:flex;align-items:center;justify-content:center;flex-shrink:0';
""" % (json.dumps(IMG), json.dumps(isom204, ensure_ascii=False))

FACE_FRONT = """
              <sc-if value="{{ tipoSimbolo }}" hint-placeholder-val="{{ true }}">
                <div style="width:100%;background:#fff;border:1px solid var(--gray-200);border-radius:16px;box-shadow:var(--shadow-sm);padding:40px 24px;display:flex;flex-direction:column;align-items:center;gap:24px">
                  <svg viewBox="0 0 200 200" style="width:148px;height:148px;color:var(--gray-800)"><use href="{{ symHref }}"></use></svg>
                  <div style="font-size:13px;color:var(--gray-400)">{{ hintFronte }}</div>
                </div>
              </sc-if>
              <sc-if value="{{ tipoRiga }}" hint-placeholder-val="{{ false }}">
                <div style="width:100%;background:#fff;border:1px solid var(--gray-200);border-radius:16px;box-shadow:var(--shadow-sm);padding:28px 16px;display:flex;flex-direction:column;align-items:center;gap:22px">
                  <div class="riga carta" style="width:100%">
                    <sc-for list="{{ celle }}" as="c" hint-placeholder-count="8">
                      <div><sc-if value="{{ c.href }}" hint-placeholder-val="{{ true }}"><svg viewBox="0 0 200 200"><use href="{{ c.href }}"></use></svg></sc-if><sc-if value="{{ c.text }}" hint-placeholder-val="{{ false }}"><span>{{ c.text }}</span></sc-if></div>
                    </sc-for>
                  </div>
                  <div style="font-size:13px;color:var(--gray-400)">{{ hintFronte }}</div>
                </div>
              </sc-if>
              <sc-if value="{{ tipoEsempio }}" hint-placeholder-val="{{ false }}">
                <div style="width:100%;background:#fff;border:1px solid var(--gray-200);border-radius:16px;box-shadow:var(--shadow-sm);padding:20px 16px;display:flex;flex-direction:column;align-items:center;gap:18px">
                  <div style="display:grid;grid-template-columns:1fr 2.2fr;gap:10px;width:100%;align-items:center">
                    <img class="img-bianco" src="{{ imgCarta }}" width="240" height="360" style="width:100%;height:auto" alt="Carta">
                    <img class="img-bianco" src="{{ imgTerreno }}" width="360" height="176" style="width:100%;height:auto" alt="Terreno">
                  </div>
                  <div style="font-size:13px;color:var(--gray-400)">{{ hintFronte }}</div>
                </div>
              </sc-if>
              <sc-if value="{{ tipoIsom }}" hint-placeholder-val="{{ false }}">
                <div style="width:100%;background:#fff;border:1px solid var(--gray-200);border-radius:16px;box-shadow:var(--shadow-sm);padding:28px 24px;display:flex;flex-direction:column;align-items:center;gap:20px">
                  <img class="img-bianco" src="{{ imgIsom }}" width="360" height="268" style="width:220px;height:auto;border:0" alt="Simbolo ISOM">
                  <div style="font-size:12px;color:var(--gray-400)">{{ isomSez }}</div>
                  <div style="font-size:13px;color:var(--gray-400)">{{ hintFronte }}</div>
                </div>
              </sc-if>"""

FACE_BACK = """
              <div style="width:100%;background:#fff;border:1px solid var(--gray-200);border-radius:16px;box-shadow:var(--shadow-sm);padding:24px 20px;display:flex;flex-direction:column;align-items:center;gap:14px">
                <sc-if value="{{ tipoSimbolo }}" hint-placeholder-val="{{ true }}">
                  <svg viewBox="0 0 200 200" style="width:64px;height:64px;color:var(--gray-800)"><use href="{{ symHref }}"></use></svg>
                </sc-if>
                <sc-if value="{{ tipoRiga }}" hint-placeholder-val="{{ false }}">
                  <div class="riga tile" style="width:100%">
                    <sc-for list="{{ celle }}" as="c" hint-placeholder-count="8">
                      <div><sc-if value="{{ c.href }}" hint-placeholder-val="{{ true }}"><svg viewBox="0 0 200 200"><use href="{{ c.href }}"></use></svg></sc-if><sc-if value="{{ c.text }}" hint-placeholder-val="{{ false }}"><span>{{ c.text }}</span></sc-if></div>
                    </sc-for>
                  </div>
                </sc-if>
                <sc-if value="{{ tipoEsempio }}" hint-placeholder-val="{{ false }}">
                  <img class="img-bianco" src="{{ imgRiga }}" width="480" height="140" style="width:100%;height:auto" alt="Descrizione stampata">
                </sc-if>
                <sc-if value="{{ tipoIsom }}" hint-placeholder-val="{{ false }}">
                  <img class="img-bianco" src="{{ imgIsom }}" width="360" height="268" style="width:120px;height:auto;border:0" alt="Simbolo ISOM">
                </sc-if>
                <div style="display:flex;gap:8px;align-items:center">
                  <x-import component-from-global-scope="PrelineUIDesignSystem_3ff5dc.Badge" variant="soft" color="gray" size="sm" pill="{{ true }}" hint-size="auto,22px">{{ retroRif }}</x-import>
                  <sc-if value="{{ generata }}" hint-placeholder-val="{{ false }}">
                    <x-import component-from-global-scope="PrelineUIDesignSystem_3ff5dc.Badge" variant="outline" color="gray" size="sm" pill="{{ true }}" hint-size="auto,22px">generata</x-import>
                  </sc-if>
                </div>
                <div style="font-size:22px;font-weight:600;letter-spacing:-.02em;color:var(--gray-800);text-align:center;text-wrap:pretty">{{ retroNome }}</div>
                <div style="font-size:14px;line-height:1.55;color:var(--gray-500);text-align:center;text-wrap:pretty">{{ retroDef }}</div>
              </div>"""

JS_FACES = """
  faceVals(vals) {
    const m = this.props.mazzo || 'descrizioni-simboli';
    vals.tipoSimbolo = m === 'descrizioni-simboli'; vals.tipoRiga = m === 'descrizioni-complete';
    vals.tipoEsempio = m === 'esempi'; vals.tipoIsom = m === 'isom';
    vals.imgCarta = IMG.esCarta; vals.imgTerreno = IMG.esTerreno; vals.imgRiga = IMG.esRiga; vals.imgIsom = IMG.isom204;
    vals.isomSez = ISOM.sez; vals.generata = false;
    if (vals.tipoSimbolo) { const s = SIMBOLI[0]; vals.symHref = '#s-' + s.sym; vals.retroRif = s.rif; vals.retroNome = s.nome; vals.retroDef = s.def; vals.nomeDomanda = s.nome; }
    if (vals.tipoRiga) { const r = RIGHE[this.props.rigaGenerata ? 1 : 0]; vals.celle = cells(r); vals.retroRif = r.codice === '—' ? 'riga generata' : 'riga ' + r.num + ' · ' + r.codice; vals.retroNome = r.testo; vals.retroDef = r.origine === 'generata' ? 'Frase composta dai nomi ufficiali dei simboli.' : 'Esempio ufficiale IOF, pagina 3.'; vals.generata = r.origine === 'generata'; vals.nomeDomanda = r.testo; }
    if (vals.tipoEsempio) { vals.retroRif = 'esempio ' + ESEMPIO.codice; vals.retroNome = ESEMPIO.testo; vals.retroDef = 'Descrizione con testo, come stampata nella fonte.'; vals.nomeDomanda = ESEMPIO.testo; }
    if (vals.tipoIsom) { vals.retroRif = ISOM.rif + ' · ' + ISOM.geo; vals.retroNome = ISOM.nome; vals.retroDef = ISOM.def; vals.nomeDomanda = ISOM.nome; }
    vals.titoloSerie = ({ 'descrizioni-simboli':'Descrizioni dei punti · Rocce e sassi', 'descrizioni-complete':'Descrizioni complete · Ufficiali, Rocce e sassi', 'esempi':'Esempi sul terreno · Vegetazione', 'isom':'ISOM 2017-2 · Rocce e sassi' })[m];
    return vals;
  }
"""

RUN_HEADER = """
        <div style="padding:52px 16px 12px;display:flex;flex-direction:column;gap:10px;border-bottom:1px solid var(--gray-200)">
          <div style="display:flex;align-items:center;gap:12px">
            <div style="font-size:13px;font-weight:500;color:var(--gray-500);cursor:pointer;padding:6px 2px">← Mazzi</div>
            <div style="flex:1"></div>
            <div style="font-size:13px;font-weight:600;color:var(--gray-800)">{{ contatore }}</div>
          </div>
          <x-import component-from-global-scope="PrelineUIDesignSystem_3ff5dc.Progress" value="{{ progresso }}" size="sm" color="blue" hint-size="100%,6px"></x-import>
          <div style="font-size:12px;color:var(--gray-500)">{{ titoloSerie }}</div>
        </div>
        <sc-if value="{{ isRipresa }}" hint-placeholder-val="{{ false }}">
          <div style="padding:10px 16px 0"><x-import component-from-global-scope="PrelineUIDesignSystem_3ff5dc.Alert" variant="soft" color="blue" title="Serie ripresa" hint-size="100%,44px">Riprendi da dove eri rimasto.</x-import></div>
        </sc-if>
        <sc-if value="{{ isInvalid }}" hint-placeholder-val="{{ false }}">
          <div style="padding:10px 16px 0"><x-import component-from-global-scope="PrelineUIDesignSystem_3ff5dc.Alert" variant="soft" color="yellow" title="Sezione non trovata" hint-size="100%,44px">Serie avviata su tutte le sezioni, 8 carte.</x-import></div>
        </sc-if>"""

EMPTY_RUN = """
        <sc-if value="{{ isEmpty }}" hint-placeholder-val="{{ false }}">
          <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:32px;background:var(--gray-50);text-align:center">
            <div style="font-size:17px;font-weight:600;color:var(--gray-800)">Nessuna carta per le sezioni scelte</div>
            <div style="font-size:13px;color:var(--gray-500);line-height:1.5">Torna ai mazzi e scegli almeno una sezione con delle carte.</div>
            <x-import component-from-global-scope="PrelineUIDesignSystem_3ff5dc.Button" variant="outline" color="dark" size="md" hint-size="auto,44px">Torna ai mazzi</x-import>
          </div>
        </sc-if>"""

HOME_BODY = """
        <div style="display:flex;flex-direction:column;height:780px">
          <div style="padding:52px 20px 14px;border-bottom:1px solid var(--gray-200);display:flex;flex-direction:column;gap:2px">
            <div style="font-size:22px;font-weight:700;letter-spacing:-.02em;color:var(--gray-800)">orient</div>
            <div style="font-size:13px;color:var(--gray-500)">Scegli un mazzo e le sezioni da allenare</div>
          </div>
          <div style="flex:1;overflow-y:auto;padding:16px 16px 20px;display:flex;flex-direction:column;gap:12px;background:var(--gray-50)">
            <sc-for list="{{ mazzi }}" as="deck" hint-placeholder-count="4">
              <div style="background:#fff;border:1px solid var(--gray-200);border-radius:12px;box-shadow:var(--shadow-sm);overflow:hidden">
                <div style="display:flex;align-items:center;gap:12px;padding:14px 16px;cursor:pointer">
                  <div style="flex:1;display:flex;flex-direction:column;gap:3px">
                    <div style="font-size:15px;font-weight:600;color:var(--gray-800)">{{ deck.nome }}</div>
                    <div style="font-size:12px;color:var(--gray-500)">{{ deck.meta }}</div>
                    <sc-if value="{{ deck.ultimo }}" hint-placeholder-val="{{ true }}">
                      <div style="font-size:12px;color:var(--gray-500);display:flex;gap:8px;align-items:center"><span>{{ deck.ultimo }}</span><a href="#" style="font-weight:500">Risultati</a></div>
                    </sc-if>
                  </div>
                  <div style="font-size:11px;color:var(--gray-400);font-weight:600">{{ deck.caret }}</div>
                </div>
                <sc-if value="{{ deck.open }}" hint-placeholder-val="{{ true }}">
                  <div style="border-top:1px solid var(--gray-200);display:flex;flex-direction:column">
                    <sc-for list="{{ deck.sezioni }}" as="sec" hint-placeholder-count="4">
                      <div style="display:flex;align-items:center;gap:12px;padding:12px 16px;border-bottom:1px solid var(--gray-100);cursor:pointer;min-height:44px;box-sizing:border-box">
                        <div style="{{ sec.boxStyle }}"><sc-if value="{{ sec.on }}" hint-placeholder-val="{{ true }}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></sc-if></div>
                        <div style="flex:1;font-size:14px;font-weight:500;color:var(--gray-800)">{{ sec.label }}</div>
                        <div style="font-size:12px;color:var(--gray-400)">{{ sec.count }}</div>
                      </div>
                    </sc-for>
                  </div>
                </sc-if>
              </div>
            </sc-for>
            <div style="font-size:12px;color:var(--gray-400);text-align:center;padding:4px 0"><a href="#">Fonti e licenze</a></div>
          </div>
          <div style="border-top:1px solid var(--gray-200);background:#fff;padding:12px 16px 24px;display:flex;flex-direction:column;gap:10px">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;background:var(--gray-100);padding:4px;border-radius:10px">
              <div style="{{ modeCardStyle }}">Flash card</div>
              <div style="{{ modeQuizStyle }}">Quiz</div>
            </div>
            <sc-if value="{{ isQuizMode }}" hint-placeholder-val="{{ false }}">
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
                <div style="{{ dirForwardStyle }}">Simbolo → nome</div>
                <div style="{{ dirReverseStyle }}">Nome → simbolo</div>
              </div>
            </sc-if>
            <div style="display:flex;gap:8px;align-items:center">
              <div style="font-size:12px;color:var(--gray-500);margin-right:4px">Carte</div>
              <sc-for list="{{ chips }}" as="ch" hint-placeholder-count="4"><div style="{{ ch.style }}">{{ ch.label }}</div></sc-for>
            </div>
            <x-import component-from-global-scope="PrelineUIDesignSystem_3ff5dc.Button" color="blue" size="lg" disabled="{{ startDisabled }}" dc-props="{{ btnFull }}" hint-size="100%,60px">{{ startLabel }}</x-import>
          </div>
        </div>"""
HOME_JS = JS_COMMON + """
class Component extends DCLogic {
  renderVals() {
    const p = this.props; const quiz = (p.modo || 'flashcard') === 'quiz';
    const chips = ['8','12','23','tutte'].map(l => ({ label: l, style: l === String(p.carte || '8') ? CHIP_ON : CHIP_OFF }));
    const sez = (labels, counts, on) => labels.map((l, i) => ({ label: l, count: counts[i] + ' carte', on: on[i], boxStyle: on[i] ? BOX_ON : BOX_OFF }));
    const withScores = p.conRisultati !== false;
    const mazzi = [
      { nome:'Descrizioni dei punti', meta:'IOF · simboli · 118 carte', ultimo: withScores ? 'Ultima serie 6 / 8 · flash card' : '', open: true, caret:'CHIUDI',
        sezioni: sez(['Colonna C', 'Oggetti morfologici', 'Rocce e sassi', 'Idrografia', 'Vegetazione', 'Costruzioni'], [5,15,11,11,7,24], [true,true,true,true,true,true]) },
      { nome:'Descrizioni complete', meta:'righe C–H · 9 ufficiali + 200 generate', ultimo: withScores ? 'Ultima serie 9 / 12 · quiz' : '', open: false, caret:'APRI', sezioni: [] },
      { nome:'Esempi sul terreno', meta:'carta, schizzo e descrizione · 99 carte', ultimo: '', open: false, caret:'APRI', sezioni: [] },
      { nome:'ISOM 2017-2', meta:'simboli della carta · 112 carte', ultimo: withScores ? 'Ultima serie 6 / 8 · quiz' : '', open: false, caret:'APRI', sezioni: [] }
    ];
    return {
      mazzi, chips, isQuizMode: quiz,
      modeCardStyle: quiz ? SEG_OFF : SEG_ON, modeQuizStyle: quiz ? SEG_ON : SEG_OFF,
      dirForwardStyle: PILL_ON, dirReverseStyle: PILL_OFF,
      btnFull: { style: { width: '100%' } },
      startDisabled: !!p.nessunaSezione,
      startLabel: p.nessunaSezione ? 'Scegli almeno una sezione' : 'Inizia · ' + (p.carte === 'tutte' ? '73' : (p.carte || '8')) + ' carte'
    };
  }
}"""
HOME_PROPS = {"$preview":{"width":560,"height":1000},
  "modo":{"editor":"enum","options":["flashcard","quiz"],"default":"flashcard","tsType":"string","section":"Home"},
  "carte":{"editor":"enum","options":["8","12","23","tutte"],"default":"8","tsType":"string","section":"Home"},
  "nessunaSezione":{"editor":"boolean","default":False,"tsType":"boolean","section":"Home"},
  "conRisultati":{"editor":"boolean","default":True,"tsType":"boolean","section":"Home"}}

FC_BODY = """
        <div style="display:flex;flex-direction:column;height:780px">""" + RUN_HEADER + EMPTY_RUN + """
          <sc-if value="{{ notEmpty }}" hint-placeholder-val="{{ true }}">
            <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px;padding:24px 16px;background:var(--gray-50);cursor:pointer;overflow-y:auto">
              <sc-if value="{{ fronte }}" hint-placeholder-val="{{ true }}">""" + FACE_FRONT + """
              </sc-if>
              <sc-if value="{{ retro }}" hint-placeholder-val="{{ false }}">""" + FACE_BACK + """
              </sc-if>
            </div>
            <div style="border-top:1px solid var(--gray-200);padding:14px 16px 24px;display:flex;flex-direction:column;gap:10px">
              <sc-if value="{{ retro }}" hint-placeholder-val="{{ false }}">
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
                  <x-import component-from-global-scope="PrelineUIDesignSystem_3ff5dc.Button" variant="outline" color="dark" size="lg" dc-props="{{ btnFull }}" hint-size="100%,60px">Non lo sapevo</x-import>
                  <x-import component-from-global-scope="PrelineUIDesignSystem_3ff5dc.Button" color="blue" size="lg" dc-props="{{ btnFull }}" hint-size="100%,60px">Lo sapevo</x-import>
                </div>
              </sc-if>
              <sc-if value="{{ fronte }}" hint-placeholder-val="{{ true }}">
                <div style="text-align:center;font-size:13px;color:var(--gray-400);padding:19px 0">Gira la carta per autovalutarti</div>
              </sc-if>
            </div>
          </sc-if>
        </div>"""
FC_JS = JS_COMMON + """
class Component extends DCLogic {""" + JS_FACES + """
  renderVals() {
    const st = this.props.stato || 'default';
    let v = { isRipresa: st === 'ripresa', isInvalid: st === 'invalid-input', isEmpty: st === 'empty', notEmpty: st !== 'empty',
              fronte: st !== 'retro', retro: st === 'retro', contatore: '3 / 8', progresso: 38, hintFronte: 'Tocca per girare la carta', btnFull: { style: { width: '100%' } } };
    v = this.faceVals(v);
    if (st === 'ripresa') { v.contatore = '4 / 8'; v.progresso = 50; }
    if (st === 'invalid-input') { v.titoloSerie = 'Descrizioni dei punti · tutte le sezioni'; v.contatore = '1 / 8'; v.progresso = 13; }
    return v;
  }
}"""
def run_props(states, deck_default):
    return {"$preview":{"width":560,"height":1000},
         "stato":{"editor":"enum","options":states,"default":states[0],"tsType":"string","section":"Schermata"},
         "mazzo":{"editor":"enum","options":["descrizioni-simboli","descrizioni-complete","esempi","isom"],"default":deck_default,"tsType":"string","section":"Schermata"},
         "rigaGenerata":{"editor":"boolean","default":False,"tsType":"boolean","section":"Schermata"}}

QZ_BODY = """
        <div style="display:flex;flex-direction:column;height:780px">""" + RUN_HEADER + EMPTY_RUN + """
          <sc-if value="{{ notEmpty }}" hint-placeholder-val="{{ true }}">
            <div style="flex:1;overflow-y:auto;background:var(--gray-50);padding:20px 16px;display:flex;flex-direction:column;gap:16px">
              <div style="background:#fff;border:1px solid var(--gray-200);border-radius:16px;box-shadow:var(--shadow-sm);padding:20px;display:flex;flex-direction:column;align-items:center;gap:10px">
                <div style="font-size:12px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--gray-400)">{{ prompt }}</div>
                <sc-if value="{{ diretta }}" hint-placeholder-val="{{ true }}">
                  <sc-if value="{{ tipoSimbolo }}" hint-placeholder-val="{{ true }}"><svg viewBox="0 0 200 200" style="width:104px;height:104px;color:var(--gray-800)"><use href="{{ symHref }}"></use></svg></sc-if>
                  <sc-if value="{{ tipoRiga }}" hint-placeholder-val="{{ false }}"><div class="riga carta" style="width:100%"><sc-for list="{{ celle }}" as="c" hint-placeholder-count="8"><div><sc-if value="{{ c.href }}" hint-placeholder-val="{{ true }}"><svg viewBox="0 0 200 200"><use href="{{ c.href }}"></use></svg></sc-if><sc-if value="{{ c.text }}" hint-placeholder-val="{{ false }}"><span>{{ c.text }}</span></sc-if></div></sc-for></div></sc-if>
                  <sc-if value="{{ tipoEsempio }}" hint-placeholder-val="{{ false }}"><div style="display:grid;grid-template-columns:1fr 2.2fr;gap:10px;width:100%;align-items:center"><img class="img-bianco" src="{{ imgCarta }}" width="240" height="360" style="width:100%;height:auto" alt="Carta"><img class="img-bianco" src="{{ imgTerreno }}" width="360" height="176" style="width:100%;height:auto" alt="Terreno"></div></sc-if>
                  <sc-if value="{{ tipoIsom }}" hint-placeholder-val="{{ false }}"><img class="img-bianco" src="{{ imgIsom }}" width="360" height="268" style="width:180px;height:auto;border:0" alt="Simbolo ISOM"></sc-if>
                </sc-if>
                <sc-if value="{{ inversa }}" hint-placeholder-val="{{ false }}">
                  <div style="font-size:22px;font-weight:600;letter-spacing:-.02em;color:var(--gray-800);text-align:center;padding:12px 0;text-wrap:pretty">{{ nomeDomanda }}</div>
                </sc-if>
              </div>
              <sc-if value="{{ diretta }}" hint-placeholder-val="{{ true }}">
                <div style="display:flex;flex-direction:column;gap:10px">
                  <sc-for list="{{ opzioni }}" as="o" hint-placeholder-count="4">
                    <div style="{{ o.rowStyle }}"><div style="flex:1;font-size:15px;font-weight:500;color:var(--gray-800);text-wrap:pretty">{{ o.nome }}</div><div style="font-size:15px;font-weight:600">{{ o.mark }}</div></div>
                  </sc-for>
                </div>
              </sc-if>
              <sc-if value="{{ inversa }}" hint-placeholder-val="{{ false }}">
                <div style="{{ tileGridStyle }}">
                  <sc-for list="{{ opzioni }}" as="o" hint-placeholder-count="4">
                    <div style="{{ o.tileStyle }}">
                      <sc-if value="{{ o.href }}" hint-placeholder-val="{{ true }}"><svg viewBox="0 0 200 200" style="width:72px;height:72px;color:var(--gray-800)"><use href="{{ o.href }}"></use></svg></sc-if>
                      <sc-if value="{{ o.celle }}" hint-placeholder-val="{{ false }}"><div class="riga tile" style="width:100%"><sc-for list="{{ o.celle }}" as="c" hint-placeholder-count="8"><div><sc-if value="{{ c.href }}" hint-placeholder-val="{{ true }}"><svg viewBox="0 0 200 200"><use href="{{ c.href }}"></use></svg></sc-if><sc-if value="{{ c.text }}" hint-placeholder-val="{{ false }}"><span>{{ c.text }}</span></sc-if></div></sc-for></div></sc-if>
                      <div style="font-size:14px;font-weight:600">{{ o.mark }}</div>
                    </div>
                  </sc-for>
                </div>
              </sc-if>
              <sc-if value="{{ verdetto }}" hint-placeholder-val="{{ false }}">
                <div style="{{ verdettoStyle }}">
                  <div style="font-size:14px;font-weight:600">{{ verdettoTitolo }}</div>
                  <div style="font-size:13px;line-height:1.5">{{ verdettoTesto }}</div>
                </div>
              </sc-if>
            </div>
            <div style="border-top:1px solid var(--gray-200);padding:14px 16px 24px">
              <sc-if value="{{ verdetto }}" hint-placeholder-val="{{ false }}">
                <x-import component-from-global-scope="PrelineUIDesignSystem_3ff5dc.Button" color="blue" size="lg" dc-props="{{ btnFull }}" hint-size="100%,60px">Avanti</x-import>
              </sc-if>
              <sc-if value="{{ noVerdetto }}" hint-placeholder-val="{{ true }}">
                <div style="text-align:center;font-size:13px;color:var(--gray-400);padding:19px 0">Scegli una risposta</div>
              </sc-if>
            </div>
          </sc-if>
        </div>"""
QZ_JS = JS_COMMON + """
class Component extends DCLogic {""" + JS_FACES + """
  renderVals() {
    const st = this.props.stato || 'default'; const inv = st === 'inversa';
    let v = { isRipresa: st === 'ripresa', isInvalid: st === 'invalid-input', isEmpty: st === 'empty', notEmpty: st !== 'empty',
              diretta: !inv, inversa: inv, verdetto: st === 'verdetto', noVerdetto: st !== 'verdetto',
              contatore: '5 / 12', progresso: 42, btnFull: { style: { width: '100%' } } };
    v = this.faceVals(v);
    v.prompt = inv ? 'Quale simbolo?' : (v.tipoRiga ? 'Cosa dice questa riga?' : 'Quale oggetto?');
    const picked = st === 'verdetto'; const wrongIdx = 1, rightIdx = 2;
    const mark = i => !picked ? '' : (i === rightIdx ? '✓' : (i === wrongIdx ? '✕' : ''));
    const extra = i => !picked ? '' : (i === rightIdx ? ';border-color:var(--teal-500);background:var(--teal-50)' : (i === wrongIdx ? ';border-color:var(--red-500);background:var(--red-50)' : ';opacity:.5'));
    if (v.tipoRiga) {
      const names = [RIGHE[3].testo, RIGHE[2].testo, RIGHE[0].testo, RIGHE[1].testo];
      v.opzioni = names.map((n, i) => ({ nome: n, mark: mark(i), rowStyle: OPT + extra(i), tileStyle: TILE + extra(i), href: '', celle: cells(RIGHE[[3,2,0,1][i]]) }));
      v.verdettoTitolo = 'Sbagliato — ' + RIGHE[0].testo; v.verdettoTesto = 'Esempio ufficiale IOF: sasso, il più a nord-ovest, alto 1 m, lanterna sul lato est.';
    } else if (v.tipoIsom) {
      const names = ['Cocuzzolo', 'Grande masso', 'Masso', 'Cumulo di massi'];
      v.opzioni = names.map((n, i) => ({ nome: n, mark: mark(i), rowStyle: OPT + extra(i), tileStyle: TILE + extra(i), href: '', celle: null }));
      v.verdettoTitolo = 'Giusto'; v.verdettoTesto = ISOM.def;
    } else if (v.tipoEsempio) {
      const names = ['Sorgente, bordo ovest', 'Terreno aperto, angolo est (interno)', ESEMPIO.testo, 'Radura'];
      v.opzioni = names.map((n, i) => ({ nome: n, mark: mark(i), rowStyle: OPT + extra(i), tileStyle: TILE + extra(i), href: '', celle: null }));
      v.verdettoTitolo = 'Sbagliato — ' + ESEMPIO.testo; v.verdettoTesto = 'Guarda la riga stampata: cisterna d’acqua, lanterna sulla parte est.';
    } else {
      const opts = [SIMBOLI[1], SIMBOLI[3], SIMBOLI[0], SIMBOLI[2]];
      v.opzioni = opts.map((s, i) => ({ nome: s.nome, mark: mark(i), rowStyle: OPT + extra(i), tileStyle: TILE + extra(i), href: '#s-' + s.sym, celle: null }));
      v.verdettoTitolo = 'Sbagliato — ' + SIMBOLI[0].nome; v.verdettoTesto = SIMBOLI[0].def;
    }
    v.tileGridStyle = 'display:grid;gap:10px;grid-template-columns:' + (v.tipoRiga ? '1fr' : '1fr 1fr');
    if (v.tipoRiga) v.opzioni.forEach(o => { o.tileStyle = o.tileStyle.replace('min-height:116px', 'min-height:88px'); });
    const right = v.verdettoTitolo === 'Giusto';
    v.verdettoStyle = 'border-radius:12px;padding:14px 16px;display:flex;flex-direction:column;gap:4px;border:1px solid ' + (right ? 'var(--teal-200);background:var(--teal-50);color:var(--teal-800)' : 'var(--red-200);background:var(--red-50);color:var(--red-800)');
    if (st === 'ripresa') { v.contatore = '6 / 12'; v.progresso = 50; }
    return v;
  }
}"""

RS_BODY = """
        <div style="display:flex;flex-direction:column;height:780px;position:relative">
          <div style="padding:52px 16px 14px;border-bottom:1px solid var(--gray-200)">
            <div style="font-size:20px;font-weight:700;letter-spacing:-.02em;color:var(--gray-800)">{{ titolo }}</div>
            <div style="font-size:13px;color:var(--gray-500)">{{ sottotitolo }}</div>
          </div>
          <sc-if value="{{ isEmpty }}" hint-placeholder-val="{{ false }}">
            <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:32px;background:var(--gray-50);text-align:center">
              <div style="font-size:17px;font-weight:600;color:var(--gray-800)">Nessuna serie completata per questo mazzo</div>
              <div style="font-size:13px;color:var(--gray-500);line-height:1.5">{{ emptyNota }}</div>
              <x-import component-from-global-scope="PrelineUIDesignSystem_3ff5dc.Button" color="blue" size="md" hint-size="auto,44px">Scegli un mazzo</x-import>
            </div>
          </sc-if>
          <sc-if value="{{ notEmpty }}" hint-placeholder-val="{{ true }}">
            <div style="flex:1;overflow-y:auto;background:var(--gray-50);padding:20px 16px;display:flex;flex-direction:column;gap:14px">
              <div style="background:#fff;border:1px solid var(--gray-200);border-radius:16px;box-shadow:var(--shadow-sm);padding:24px;display:flex;flex-direction:column;align-items:center;gap:14px">
                <div style="font-size:44px;font-weight:700;letter-spacing:-.03em;color:var(--gray-800);line-height:1">{{ punteggio }}</div>
                <div style="font-size:13px;color:var(--gray-500)">{{ didascalia }}</div>
                <x-import component-from-global-scope="PrelineUIDesignSystem_3ff5dc.Progress" value="{{ pct }}" size="md" color="blue" hint-size="100%,10px"></x-import>
              </div>
              <sc-if value="{{ conErrori }}" hint-placeholder-val="{{ true }}">
                <div style="background:#fff;border:1px solid var(--gray-200);border-radius:16px;box-shadow:var(--shadow-sm);overflow:hidden">
                  <div style="padding:12px 16px;background:var(--gray-50);border-bottom:1px solid var(--gray-200);font-size:13px;font-weight:600;color:var(--gray-800)">{{ titoloErrori }}</div>
                  <sc-for list="{{ errori }}" as="w" hint-placeholder-count="3">
                    <div style="display:flex;align-items:center;gap:14px;padding:12px 16px;border-bottom:1px solid var(--gray-100);cursor:pointer">
                      <svg viewBox="0 0 200 200" style="width:40px;height:40px;color:var(--gray-800);flex-shrink:0"><use href="{{ w.href }}"></use></svg>
                      <div style="flex:1;display:flex;flex-direction:column;gap:2px;min-width:0"><div style="font-size:14px;font-weight:600;color:var(--gray-800)">{{ w.nome }}</div><div style="font-size:12px;color:var(--gray-400)">{{ w.rif }}</div></div>
                      <div style="font-size:12px;color:var(--gray-400)">›</div>
                    </div>
                  </sc-for>
                </div>
                <x-import component-from-global-scope="PrelineUIDesignSystem_3ff5dc.Button" color="blue" size="lg" dc-props="{{ btnFull }}" hint-size="100%,60px">Ripassa con le carte</x-import>
              </sc-if>
              <sc-if value="{{ senzaErrori }}" hint-placeholder-val="{{ false }}">
                <x-import component-from-global-scope="PrelineUIDesignSystem_3ff5dc.Alert" variant="soft" color="green" title="Nessun errore in questa serie" hint-size="100%,52px">Tutte le carte erano giuste.</x-import>
              </sc-if>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
                <x-import component-from-global-scope="PrelineUIDesignSystem_3ff5dc.Button" variant="outline" color="dark" size="md" dc-props="{{ btnFull }}" hint-size="100%,44px">Ripeti</x-import>
                <x-import component-from-global-scope="PrelineUIDesignSystem_3ff5dc.Button" variant="ghost" color="dark" size="md" dc-props="{{ btnFull }}" hint-size="100%,44px">Torna ai mazzi</x-import>
              </div>
              <div style="background:#fff;border:1px solid var(--gray-200);border-radius:16px;box-shadow:var(--shadow-sm);overflow:hidden">
                <div style="padding:12px 16px;background:var(--gray-50);border-bottom:1px solid var(--gray-200);font-size:13px;font-weight:600;color:var(--gray-800)">Storico</div>
                <sc-for list="{{ storico }}" as="h" hint-placeholder-count="4">
                  <div style="display:flex;align-items:center;gap:12px;padding:11px 16px;border-bottom:1px solid var(--gray-100)">
                    <div style="flex:1;display:flex;flex-direction:column;gap:2px"><div style="font-size:13px;font-weight:500;color:var(--gray-800)">{{ h.quando }}</div><div style="font-size:12px;color:var(--gray-400)">{{ h.cosa }}</div></div>
                    <div style="font-size:14px;font-weight:600;color:var(--gray-800)">{{ h.punteggio }}</div>
                  </div>
                </sc-for>
              </div>
              <sc-if value="{{ noConferma }}" hint-placeholder-val="{{ true }}">
                <div style="text-align:center;padding:6px 0 10px"><a href="#" style="font-size:13px;color:var(--red-600);font-weight:500">Cancella i risultati</a></div>
              </sc-if>
              <sc-if value="{{ conferma }}" hint-placeholder-val="{{ false }}">
                <div style="border:1px solid var(--red-200);background:var(--red-50);border-radius:12px;padding:14px 16px;display:flex;flex-direction:column;gap:10px">
                  <div style="font-size:14px;font-weight:600;color:var(--red-800)">Sicuro? Cancella tutti i risultati su questo telefono, per tutti i mazzi.</div>
                  <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
                    <x-import component-from-global-scope="PrelineUIDesignSystem_3ff5dc.Button" variant="outline" color="dark" size="md" dc-props="{{ btnFull }}" hint-size="100%,44px">Annulla</x-import>
                    <x-import component-from-global-scope="PrelineUIDesignSystem_3ff5dc.Button" color="red" size="md" dc-props="{{ btnFull }}" hint-size="100%,44px">Cancella tutto</x-import>
                  </div>
                </div>
              </sc-if>
            </div>
          </sc-if>
          <sc-if value="{{ ripasso }}" hint-placeholder-val="{{ false }}">
            <div style="position:absolute;inset:0;background:rgba(31,41,55,.5);display:flex;flex-direction:column;justify-content:flex-end">
              <div style="background:#fff;border-radius:16px 16px 0 0;padding:16px 16px 28px;display:flex;flex-direction:column;gap:14px">
                <div style="display:flex;align-items:center"><div style="font-size:13px;font-weight:600;color:var(--gray-800);flex:1">Da ripassare</div><div style="font-size:13px;color:var(--gray-500);cursor:pointer;padding:6px 2px">Chiudi</div></div>""" + FACE_BACK + """
              </div>
            </div>
          </sc-if>
        </div>"""
RS_JS = JS_COMMON + """
class Component extends DCLogic {""" + JS_FACES + """
  renderVals() {
    const st = this.props.stato || 'default';
    let v = { isEmpty: st === 'empty' || st === 'error', notEmpty: st !== 'empty' && st !== 'error',
              conErrori: st !== 'nessun-errore', senzaErrori: st === 'nessun-errore', ripasso: st === 'ripasso',
              conferma: st === 'conferma-cancellazione', noConferma: st !== 'conferma-cancellazione', btnFull: { style: { width: '100%' } } };
    v = this.faceVals(v);
    v.titolo = 'Quiz completato'; v.sottotitolo = v.titoloSerie;
    v.punteggio = st === 'nessun-errore' ? '12 / 12' : '9 / 12'; v.pct = st === 'nessun-errore' ? 100 : 75; v.didascalia = 'risposte corrette';
    v.errori = [SIMBOLI[5], SIMBOLI[6], SIMBOLI[7]].map(s => ({ nome: s.nome, rif: s.rif, href: '#s-' + s.sym }));
    v.titoloErrori = '3 simboli da ripassare';
    v.storico = [
      { quando: 'Oggi, 18:40', cosa: 'quiz · Colonna G · 12 carte', punteggio: '9 / 12' },
      { quando: 'Oggi, 18:12', cosa: 'ripasso · 3 carte', punteggio: '3 / 3' },
      { quando: 'Ieri, 21:05', cosa: 'flash card · Rocce e sassi, Oggetti morfologici · 8 carte', punteggio: '6 / 8' },
      { quando: '2 set, 19:30', cosa: 'quiz · nome → simbolo · tutte le sezioni · 23 carte', punteggio: '17 / 23' }
    ];
    v.emptyNota = st === 'error' ? 'Non riesco a leggere i risultati salvati su questo telefono. Le serie funzionano lo stesso.' : 'Completa una serie o un quiz e la troverai qui.';
    return v;
  }
}"""

FN_BODY = """
        <div style="display:flex;flex-direction:column;height:780px">
          <div style="padding:52px 16px 14px;border-bottom:1px solid var(--gray-200);display:flex;flex-direction:column;gap:6px">
            <div style="font-size:13px;font-weight:500;color:var(--gray-500);cursor:pointer;padding:0 2px 4px">← Mazzi</div>
            <div style="font-size:20px;font-weight:700;letter-spacing:-.02em;color:var(--gray-800)">Fonti e licenze</div>
            <div style="font-size:13px;color:var(--gray-500);line-height:1.5">Da dove vengono i simboli e i testi di orient, e a quali condizioni.</div>
          </div>
          <div style="flex:1;overflow-y:auto;background:var(--gray-50);padding:16px;display:flex;flex-direction:column;gap:12px">
            <sc-for list="{{ fonti }}" as="f" hint-placeholder-count="6">
              <div style="background:#fff;border:1px solid var(--gray-200);border-radius:12px;box-shadow:var(--shadow-sm);padding:14px 16px;display:flex;flex-direction:column;gap:8px">
                <div style="display:flex;align-items:flex-start;gap:10px"><div style="flex:1;font-size:14px;font-weight:600;color:var(--gray-800);text-wrap:pretty">{{ f.titolo }}</div>
                  <x-import component-from-global-scope="PrelineUIDesignSystem_3ff5dc.Badge" variant="soft" color="{{ f.colore }}" size="sm" pill="{{ true }}" hint-size="auto,22px">{{ f.licenza }}</x-import></div>
                <div style="font-size:12px;color:var(--gray-500);line-height:1.5">{{ f.autori }}</div>
                <div style="font-size:13px;color:var(--gray-600);line-height:1.5"><span style="font-weight:600;color:var(--gray-800)">Cosa usiamo: </span>{{ f.uso }}</div>
                <div style="font-size:12px;color:var(--gray-500);line-height:1.5;font-style:italic">{{ f.attribuzione }}</div>
              </div>
            </sc-for>
            <div style="font-size:12px;color:var(--gray-500);line-height:1.5;padding:4px 2px">Le righe segnate <span style="font-weight:600">generata</span> sono composte da orient con i nomi ufficiali dei simboli; non compaiono nelle fonti.</div>
          </div>
          <div style="border-top:1px solid var(--gray-200);padding:14px 16px 24px;display:flex;flex-direction:column;gap:8px">
            <x-import component-from-global-scope="PrelineUIDesignSystem_3ff5dc.Button" variant="outline" color="dark" size="md" dc-props="{{ btnFull }}" hint-size="100%,44px">Scrivi a chi cura il sito</x-import>
            <div style="text-align:center;font-size:12px;color:var(--gray-400)">Un sito di famiglia per imparare i simboli. Nessun dato lascia il tuo telefono.</div>
          </div>
        </div>"""
FN_JS = JS_COMMON + """
class Component extends DCLogic {
  renderVals() {
    return { btnFull: { style: { width: '100%' } }, fonti: [
      { titolo: 'Descrizioni dei punti IOF, edizione italiana', autori: 'Commissione regolamenti IOF; adattamento Swiss Orienteering; traduzione Bea Arn', licenza: 'IOF', colore: 'gray', uso: 'nomi e definizioni dei pittogrammi, l’esempio di pagina 3, gli esempi sul terreno con le loro immagini e frasi.', attribuzione: 'Riproduzione di estratti per uso familiare, senza modifiche. © International Orienteering Federation.' },
      { titolo: 'Pittogrammi delle descrizioni (SVG)', autori: 'Purple Pen, © 2006–2007 Peter Golde; estrazione di Per Liedman', licenza: 'BSD', colore: 'green', uso: 'i disegni dei pittogrammi in tutte le carte delle descrizioni.', attribuzione: 'Licenza BSD a tre clausole: il testo completo è riportato in fondo a questa pagina.' },
      { titolo: 'ISOM 2017-2 CH, edizione italiana', autori: 'Swiss Orienteering, Commissione Carte; traduzione C. Tarabocchia (FISO) e T. Pezzati; aggiornamento C. Moreni', licenza: 'CC BY-ND 4.0', colore: 'blue', uso: 'numeri, nomi e descrizioni dei simboli della carta.', attribuzione: 'Testi riprodotti senza modifiche. Licenza Creative Commons Attribuzione – Non opere derivate 4.0.' },
      { titolo: 'Illustrazioni dei simboli ISOM 2017-2', autori: 'IOF Map Commission, pacchetto per le commissioni carte nazionali', licenza: 'CC BY-ND 4.0', colore: 'blue', uso: 'i disegni dei simboli della carta, con le annotazioni come stampate nella norma.', attribuzione: 'Riprodotti senza modifiche. © International Orienteering Federation.' },
      { titolo: 'Preline UI', autori: 'Preline Labs', licenza: 'MIT', colore: 'green', uso: 'i componenti dell’interfaccia.', attribuzione: 'Licenza MIT.' },
      { titolo: 'Inter e JetBrains Mono', autori: 'Rasmus Andersson; JetBrains', licenza: 'SIL OFL 1.1', colore: 'green', uso: 'i caratteri, ospitati sul sito stesso.', attribuzione: 'SIL Open Font License 1.1.' }
    ] };
  }
}"""

SCREENS = [
  ("index", "Home — scelta del mazzo", "R-001 · Quattro mazzi, sezioni con conteggio, modalità, carte per serie, ultimo punteggio.", HOME_BODY, HOME_PROPS, HOME_JS, ["default"]),
  ("[mazzo].flashcard", "Serie di flash card", "R-002 · Fronte e retro, autovalutazione, ripresa, stati vuoto e input non valido. Cambia mazzo dalle proprietà.", FC_BODY, run_props(["default","retro","ripresa","empty","invalid-input"], "descrizioni-simboli"), FC_JS, ["default","retro","ripresa","empty","invalid-input"]),
  ("[mazzo].quiz", "Quiz", "R-003 · Domanda, quattro opzioni, verdetto, direzione inversa a riquadri. Cambia mazzo dalle proprietà.", QZ_BODY, run_props(["default","inversa","verdetto","ripresa","empty","invalid-input"], "isom"), QZ_JS, ["default","inversa","verdetto","ripresa","empty","invalid-input"]),
  ("[mazzo].risultati", "Risultati", "R-004 · Ultima serie, errori con ripasso, ripeti, storico, cancellazione con conferma; stati vuoto ed errore.", RS_BODY, run_props(["default","nessun-errore","ripasso","conferma-cancellazione","empty","error"], "descrizioni-simboli"), RS_JS, ["default","nessun-errore","ripasso","conferma-cancellazione","empty","error"]),
  ("fonti", "Fonti e licenze", "R-005 · Generata dal registro delle licenze; contatto.", FN_BODY, {"$preview":{"width":560,"height":1000}}, FN_JS, ["default"]),
]
DECK_FOR_STATE = {("[mazzo].flashcard","retro"): "descrizioni-complete", ("[mazzo].quiz","inversa"): "descrizioni-complete",
                  ("[mazzo].quiz","verdetto"): "descrizioni-simboli", ("[mazzo].flashcard","empty"): "esempi"}
if __name__ == "__main__":
    written = []
    for stem, title, subtitle, body, props, script, states in SCREENS:
        for st in states:
            p = json.loads(json.dumps(props))
            if "stato" in p: p["stato"]["default"] = st
            if (stem, st) in DECK_FOR_STATE: p["mazzo"]["default"] = DECK_FOR_STATE[(stem, st)]
            name = f"{stem}.dc.html" if st == "default" else f"{stem}.{st}.dc.html"
            html = dc(title + ("" if st == "default" else f" — stato {st}"), subtitle, body, props_attr(p), script)
            banner = f"<!-- orient · Level 6 artboard · screen {stem} · state {st} · generated 2026-09-05 by akaaso/scripts/build-artboards.py; edit the generator, not this file -->\n"
            open(f"{OUT}/{name}", "w", encoding="utf-8").write(banner + html)
            written.append(name)
    print(len(written), "artboards written to", OUT)
