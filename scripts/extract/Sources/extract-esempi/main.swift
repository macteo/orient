// extract-esempi — worked examples (S3 pp. 17 – 28) and the page-3 event grid.
//
// Renders each page at 4× on white, finds the drawn table rules, crops the
// Carta / Terreno / Descrizione punti cells of every data row, reads the
// Descrizione con testo from the text layer of the fourth column, and writes
// content/esempi/*.json, content/artwork/esempi/**.png and the contact sheet.
//
// Spec: akaaso/03-modules/005-pipeline-esempi.md
// Run:  cd scripts/extract && swift run extract-esempi
//       …          --probe N [--dump DIR]   print the detected grid of one page
//                                           (and write its row crops to DIR)

import Foundation
import PDFKit

// MARK: - Configuration

let scale: CGFloat = 4
let esempiPages = 17...28  // printed page numbers; PDF index is one less
let paginaGriglia = 3
let headerWords = ["Carta", "Terreno", "Descrizione"]

// MARK: - Paths

/// Walks up from the current directory to the repository root (the folder that
/// holds `sources/iof_descrizioni_punti_ital.pdf`).
func findRepoRoot() -> URL {
    var dir = URL(fileURLWithPath: FileManager.default.currentDirectoryPath)
    for _ in 0..<8 {
        let pdf = dir.appendingPathComponent("sources/iof_descrizioni_punti_ital.pdf")
        if FileManager.default.fileExists(atPath: pdf.path) { return dir }
        dir = dir.deletingLastPathComponent()
    }
    fail("radice del repository non trovata a partire da \(FileManager.default.currentDirectoryPath)")
}

func fail(_ message: String) -> Never {
    FileHandle.standardError.write(Data("extract-esempi: \(message)\n".utf8))
    exit(1)
}

let root = findRepoRoot()
let pdfURL = root.appendingPathComponent("sources/iof_descrizioni_punti_ital.pdf")
let markdownURL = root.appendingPathComponent("akaaso/sources/iof_descrizioni_punti_ital.md")
let contentDir = root.appendingPathComponent("content")
let esempiDir = contentDir.appendingPathComponent("esempi")
let artworkDir = contentDir.appendingPathComponent("artwork/esempi")
let contactDir = contentDir.appendingPathComponent("_contact")

let fm = FileManager.default
guard let document = PDFDocument(url: pdfURL) else {
    fail("impossibile aprire \(pdfURL.path)")
}

// MARK: - Model

struct Esempio {
    let codice: String
    let pagina: Int
    let famiglia: String
    let testo: String
    let carta: String
    let terreno: String
    let riga: String
}

/// One §Esempi page after grid detection. The render is held only long enough
/// to cut the page's crops — a 4× page is sixteen megabytes.
struct PaginaEsempi {
    let numero: Int
    let render: RenderedPage
    let rows: [Band]
    let cols: [Band]
    let dataRows: [Int]  // indices into `rows` (row i spans rows[i]…rows[i+1])
    let testi: [String]
}

// MARK: - Text-layer helpers

func squash(_ s: String) -> String {
    String(s.unicodeScalars.filter { !CharacterSet.whitespacesAndNewlines.contains($0) && $0 != "-" })
}

let markdown: String = (try? String(contentsOf: markdownURL, encoding: .utf8)) ?? ""

/// The body of one page of the converted text layer: everything between the
/// page markers, without the table header, the section title and the footer.
func markdownBody(page n: Int) -> String {
    guard !markdown.isEmpty else { return "" }
    let start = "<!-- pagina \(n) -->"
    let end = "<!-- pagina \(n + 1) -->"
    guard let a = markdown.range(of: start) else { return "" }
    let b = markdown.range(of: end)?.lowerBound ?? markdown.endIndex
    let block = String(markdown[a.upperBound..<b])
    let drop = [
        "---", "Esempi", "Carta Terreno Descrizione punti Descrizione",
        "con testo", "\(n) Descrizioni dei punti IOF",
    ]
    return
        block
        .components(separatedBy: .newlines)
        .map { $0.trimmingCharacters(in: .whitespaces) }
        .filter { !$0.isEmpty && !drop.contains($0) }
        .joined(separator: "\n")
}

func looksLikeHeader(_ text: String) -> Bool {
    headerWords.allSatisfy { text.contains($0) }
}

// MARK: - §Esempi pages

func leggiPagina(_ numero: Int) throws -> PaginaEsempi {
    guard let page = document.page(at: numero - 1) else {
        fail("pagina \(numero) assente dal PDF")
    }
    let render = try renderPage(page, scale: scale)
    let rows = horizontalRules(render)
    guard rows.count >= 3 else {
        fail("pagina \(numero): trovate solo \(rows.count) righe orizzontali, griglia non riconosciuta")
    }
    let cols = verticalRules(render, top: rows.first!.end, bottom: rows.last!.start)
    guard cols.count == 5 else {
        fail("pagina \(numero): trovate \(cols.count) righe verticali invece di 5, griglia non riconosciuta")
    }

    let text = PageText(page)
    // Every band pair is a row; the first one is the header (gray fill, and its
    // text is the header line "Carta Terreno Descrizione punti …").
    var dataRows: [Int] = []
    var testi: [String] = []
    var fuoriColonna: [String] = []  // text the other three columns carry
    for i in 0..<(rows.count - 1) {
        let whole = rowRect(rows: rows, left: cols.first!, right: cols.last!, row: i, bleed: 0)
        let wholeText = joinWrappedLines(text.text(in: render.pdfRect(of: whole)))
        if i == 0 && looksLikeHeader(wholeText) { continue }
        let cell = cellRect(rows: rows, cols: cols, row: i, col: 3)
        let testo = joinWrappedLines(text.text(in: render.pdfRect(of: cell)))
        for c in 0..<3 {
            let other = joinWrappedLines(
                text.text(in: render.pdfRect(of: cellRect(rows: rows, cols: cols, row: i, col: c))))
            if !other.isEmpty { fuoriColonna.append(other) }
        }
        dataRows.append(i)
        testi.append(testo)
    }

    // The count check the module asks for: one Descrizione con testo per data row.
    let vuote = testi.enumerated().filter { $0.element.isEmpty }.map { dataRows[$0.offset] }
    if !vuote.isEmpty {
        fail(
            """
            pagina \(numero): \(dataRows.count) righe dati ma \(testi.count - vuote.count) \
            stringhe "Descrizione con testo" — le righe \(vuote.map(String.init).joined(separator: ", ")) \
            non hanno testo nella quarta colonna. Pagina interrotta.
            """)
    }

    // Cross-check against the converted text layer, which was produced by a
    // different tool: the same strings, in the same order, whatever the
    // wrapping. Notes printed in the other columns (page 20's "Non posare
    // punti accanto ai formicai!") are taken out of the expected side first.
    var atteso = squash(markdownBody(page: numero))
    for extra in fuoriColonna where !squash(extra).isEmpty {
        atteso = atteso.replacingOccurrences(of: squash(extra), with: "")
    }
    let ottenuto = squash(testi.joined())
    if !atteso.isEmpty && atteso != ottenuto {
        fail(
            """
            pagina \(numero): le \(testi.count) stringhe estratte non coincidono con \
            akaaso/sources/iof_descrizioni_punti_ital.md. Pagina interrotta.
              testo convertito : \(markdownBody(page: numero).replacingOccurrences(of: "\n", with: " ⏎ "))
              testo estratto   : \(testi.joined(separator: " ⏎ "))
            """)
    }

    return PaginaEsempi(
        numero: numero, render: render, rows: rows, cols: cols,
        dataRows: dataRows, testi: testi)
}

// MARK: - Page → D family

/// The six column-D families of S3 (the section ids of the `esempi` deck).
/// The §Esempi table walks the D column in order, so each page belongs to the
/// family most of its rows describe; `notaSezioni` records the crossings.
let famigliaPerPagina: [Int: String] = [
    17: "d-morfologici",  // terrazzo, naso, rientranza
    18: "d-morfologici",  // rientranza, scarpata, cava, terrapieno, fossa, collina
    19: "d-morfologici",  // collina, collinetta, sella, depressione, buca profonda
    20: "d-rocce",  // formicaio (1.16) poi roccia, torre di roccia, caverna, sasso
    21: "d-rocce",  // sassi, sassaia, terreno pietroso, roccia nuda, passaggio stretto
    22: "d-idrografia",  // lago, stagno, buca con acqua, ruscelli, rigagnoli
    23: "d-idrografia",  // rigagnoli, palude, isola nella palude, fontana
    24: "d-vegetazione",  // sorgente e cisterna (3.10, 3.11) poi terreno aperto, bosco, boschetti
    25: "d-costruzioni",  // limite di vegetazione e alberi (4.7–4.10) poi strade e sentieri
    26: "d-costruzioni",  // sentieri, taglio di bosco, ponte, linea elettrica, galleria, muro
    27: "d-costruzioni",  // muro, recinto, punto di passaggio, edificio, rovina, condotta, torre
    28: "d-costruzioni",  // posta del cacciatore, tumulo, mangiatoia, carbonaia, statua, scala
]

let notaSezioni = """
    Le pagine 17 – 28 di S3 percorrono la colonna D nel suo ordine \
    (oggetti morfologici, rocce e sassi, idrografia, vegetazione, costruzioni, \
    oggetti particolari), quindi ogni pagina è assegnata alla famiglia della \
    maggioranza delle sue righe, leggendo le "Descrizione con testo". \
    Tre pagine sono a cavallo di due famiglie e la maggioranza decide: \
    pagina 20 apre con "Formicaio" (1.16, morfologici) e prosegue con le rocce; \
    pagina 24 apre con "Sorgente" e "Cisterna d’acqua" (3.10 e 3.11, idrografia) \
    e prosegue con la vegetazione; pagina 25 apre con "Limite di vegetazione", \
    "Gruppo d’alberi", "Albero particolare" e "Radice" (4.7 – 4.10, vegetazione) \
    e prosegue con strade e sentieri (costruzioni). \
    La famiglia "d-particolari" (6.1, 6.2) non compare: S3 non ne dà esempi.
    """

// MARK: - JSON writing (fixed key order, no timestamp but the `generato` date)

func jsonEscape(_ s: String) -> String {
    var out = ""
    for scalar in s.unicodeScalars {
        switch scalar {
        case "\"": out += "\\\""
        case "\\": out += "\\\\"
        case "\n": out += "\\n"
        case "\r": out += "\\r"
        case "\t": out += "\\t"
        default:
            if scalar.value < 0x20 {
                out += String(format: "\\u%04x", scalar.value)
            } else {
                out.unicodeScalars.append(scalar)
            }
        }
    }
    return out
}

let oggi: String = {
    let f = DateFormatter()
    f.locale = Locale(identifier: "en_US_POSIX")
    f.timeZone = TimeZone(identifier: "UTC")
    f.dateFormat = "yyyy-MM-dd"
    return f.string(from: Date())
}()

// MARK: - Probe mode

let args = CommandLine.arguments
if let i = args.firstIndex(of: "--probe"), i + 1 < args.count, let n = Int(args[i + 1]) {
    guard let page = document.page(at: n - 1) else { fail("pagina \(n) assente") }
    let render = try renderPage(page, scale: scale)
    let rows = horizontalRules(render)
    let cols = verticalRules(render, top: rows.first?.end ?? 0, bottom: rows.last?.start ?? 0)
    print("pagina \(n): \(render.width)×\(render.height) px, \(rows.count) righe orizzontali, \(cols.count) verticali")
    print("  orizzontali: " + rows.map { "\($0.start)–\($0.end)" }.joined(separator: " "))
    print("  verticali:   " + cols.map { "\($0.start)–\($0.end)" }.joined(separator: " "))
    let text = PageText(page)
    if cols.count >= 2 {
        for r in 0..<(rows.count - 1) {
            var cells: [String] = []
            for c in 0..<(cols.count - 1) {
                let rect = cellRect(rows: rows, cols: cols, row: r, col: c)
                let t = joinWrappedLines(text.text(in: render.pdfRect(of: rect)))
                cells.append("[\(c)] \(t)")
            }
            let h = rows[r + 1].start - rows[r].end
            let inner = innerRules(
                render, rows: rows, row: r, left: cols[0], right: cols[1]
            ).count
            print("  riga \(r) (h=\(h), celle interne=\(inner)): " + cells.joined(separator: " | "))
            if let d = args.firstIndex(of: "--dump"), d + 1 < args.count {
                let dir = URL(fileURLWithPath: args[d + 1])
                let rect = rowRect(rows: rows, left: cols[0], right: cols[1], row: r)
                try writePNG(crop(render, rect), to: dir.appendingPathComponent("riga-\(r).png"))
            }
        }
    }
    exit(0)
}

// MARK: - Extraction

// Write everything into a temp folder first, then swap it in, so a failed run
// never leaves half of content/artwork/esempi/ behind.
let temp = fm.temporaryDirectory.appendingPathComponent(
    "extract-esempi-\(ProcessInfo.processInfo.processIdentifier)")
try? fm.removeItem(at: temp)
try fm.createDirectory(
    at: temp.appendingPathComponent("pagina3"), withIntermediateDirectories: true)

var esempi: [Esempio] = []
var conteggi: [(Int, Int)] = []
var codice = 1  // sequential from the first data row of page 17

for numero in esempiPages {
    let p = try leggiPagina(numero)
    guard let famiglia = famigliaPerPagina[numero] else {
        fail("pagina \(numero): nessuna famiglia della colonna D assegnata")
    }
    for (k, row) in p.dataRows.enumerated() {
        for (col, name) in ["carta", "terreno", "riga"].enumerated() {
            let rect = cellRect(rows: p.rows, cols: p.cols, row: row, col: col)
            try writePNG(
                crop(p.render, rect),
                to: temp.appendingPathComponent("\(codice)-\(name).png"))
        }
        esempi.append(
            Esempio(
                codice: String(codice), pagina: numero, famiglia: famiglia,
                testo: p.testi[k],
                carta: "content/artwork/esempi/\(codice)-carta.png",
                terreno: "content/artwork/esempi/\(codice)-terreno.png",
                riga: "content/artwork/esempi/\(codice)-riga.png"))
        codice += 1
    }
    conteggi.append((numero, p.dataRows.count))
}

// MARK: - Page 3: the nine official rows

guard let page3 = document.page(at: paginaGriglia - 1) else { fail("pagina 3 assente") }
let render3 = try renderPage(page3, scale: scale)
let rows3All = horizontalRules(render3)
let text3 = PageText(page3)

// Only the outer borders of the two tables run the whole height: the left one
// (the A – H grid) is between the first two, the sentences are to their right.
let cols3 = verticalRules(
    render3, top: rows3All.first?.end ?? 0, bottom: rows3All.last?.start ?? 0)
guard cols3.count >= 2 else { fail("pagina 3: colonne non riconosciute") }
let sinistra = cols3[0]
let destra = cols3[1]

// The row numbers and the codes of the left grid are drawn glyphs, not text, so
// a data row is told by its geometry: it carries the seven A – H cell
// separators *and* something printed in column B, its control code. That skips
// the headings (Categorie, Percorso), the two route lines — single wide cells —
// and the start row, which has the triangle in A and an empty B.
var righePagina3: [Int] = []
for r in 0..<(rows3All.count - 1) {
    let inner = innerRules(
        render3, rows: rows3All, row: r, left: sinistra, right: destra)
    guard inner.count == 7 else { continue }
    let colonnaB = CGRect(
        x: inner[0].end + 1 + 3, y: rows3All[r].end + 1 + 3,
        width: inner[1].start - inner[0].end - 1 - 6,
        height: rows3All[r + 1].start - rows3All[r].end - 1 - 6)
    if !isBlank(render3, colonnaB) { righePagina3.append(r) }
}
guard righePagina3.count == 9 else {
    fail(
        "pagina 3: trovate \(righePagina3.count) righe con le celle A – H invece di 9 "
            + "(righe \(righePagina3.map(String.init).joined(separator: ", "))). "
            + "Griglia dell'esempio IOF non riconosciuta.")
}
var testiPagina3: [String] = []
for (i, r) in righePagina3.enumerated() {
    let rect = rowRect(rows: rows3All, left: sinistra, right: destra, row: r)
    try writePNG(
        crop(render3, rect),
        to: temp.appendingPathComponent("pagina3/riga-\(i + 1).png"))
    // The sentence printed beside the row, for the transcription review.
    let frase = joinWrappedLines(
        text3.text(
            in: render3.pdfRect(
                of: rowRect(rows: rows3All, left: cols3[cols3.count - 2], right: cols3.last!, row: r, bleed: -3))))
    testiPagina3.append(frase)
}

// MARK: - JSON

var json = "{\n  \"v\": 1,\n  \"generato\": \"\(oggi)\",\n  \"sorgente\": \"S3\",\n  \"esempi\": [\n"
for (i, e) in esempi.enumerated() {
    json += "    {"
    json += "\"codice\": \"\(jsonEscape(e.codice))\", "
    json += "\"pagina\": \(e.pagina), "
    json += "\"famiglia\": \"\(jsonEscape(e.famiglia))\", "
    json += "\"testo\": \"\(jsonEscape(e.testo))\", "
    json += "\"carta\": \"\(jsonEscape(e.carta))\", "
    json += "\"terreno\": \"\(jsonEscape(e.terreno))\", "
    json += "\"riga\": \"\(jsonEscape(e.riga))\""
    json += "}" + (i == esempi.count - 1 ? "\n" : ",\n")
}
json += "  ]\n}\n"

var sezioni = "{\n  \"v\": 1,\n  \"generato\": \"\(oggi)\",\n  \"sorgente\": \"S3\",\n"
sezioni += "  \"nota\": \"\(jsonEscape(notaSezioni))\",\n  \"pagine\": {\n"
for (i, n) in esempiPages.enumerated() {
    let f = famigliaPerPagina[n] ?? ""
    sezioni += "    \"\(n)\": \"\(jsonEscape(f))\"" + (i == esempiPages.count - 1 ? "\n" : ",\n")
}
sezioni += "  }\n}\n"


// MARK: - Contact sheet

func htmlEscape(_ s: String) -> String {
    s.replacingOccurrences(of: "&", with: "&amp;")
        .replacingOccurrences(of: "<", with: "&lt;")
        .replacingOccurrences(of: ">", with: "&gt;")
        .replacingOccurrences(of: "\"", with: "&quot;")
}

var html = """
    <!doctype html>
    <html lang="it">
    <meta charset="utf-8">
    <title>Provino — esempi (S3 pp. 17 – 28)</title>
    <style>
      body { font: 14px/1.4 -apple-system, system-ui, sans-serif; margin: 24px; background: #fff; color: #111; }
      h1 { font-size: 18px; } h2 { font-size: 15px; margin: 28px 0 8px; }
      .strip { display: grid; grid-template-columns: 4rem 12rem 12rem 20rem 1fr; gap: 12px;
               align-items: center; border-bottom: 1px solid #e5e5e5; padding: 6px 0; }
      .strip img { max-width: 100%; height: auto; background: #fff; display: block; }
      .cod { font: 12px ui-monospace, monospace; color: #666; }
      .g3 { display: grid; grid-template-columns: 3rem 26rem 1fr; gap: 12px; align-items: center;
            border-bottom: 1px solid #e5e5e5; padding: 6px 0; }
      .g3 img { max-width: 100%; height: auto; }
    </style>
    <h1>Provino — esempi</h1>
    <p>\(esempi.count) esempi, pagine 17 – 28 di <em>Descrizioni dei punti IOF</em>. Carta · Terreno · Descrizione punti · Descrizione con testo.</p>

    """
var paginaCorrente = 0
for e in esempi {
    if e.pagina != paginaCorrente {
        paginaCorrente = e.pagina
        html += "<h2>Pagina \(e.pagina) — \(htmlEscape(e.famiglia))</h2>\n"
    }
    html += "<div class=\"strip\">"
    html += "<span class=\"cod\">\(htmlEscape(e.codice))</span>"
    html += "<img src=\"../artwork/esempi/\(e.codice)-carta.png\" alt=\"carta\">"
    html += "<img src=\"../artwork/esempi/\(e.codice)-terreno.png\" alt=\"terreno\">"
    html += "<img src=\"../artwork/esempi/\(e.codice)-riga.png\" alt=\"riga\">"
    html += "<span>\(htmlEscape(e.testo))</span>"
    html += "</div>\n"
}
html += "<h2>Pagina 3 — le nove righe ufficiali</h2>\n"
html += "<p>Da confrontare con <code>content/righe/ufficiali.json</code>.</p>\n"
for n in 1...9 {
    html += "<div class=\"g3\"><span class=\"cod\">\(n)</span>"
    html += "<img src=\"../artwork/esempi/pagina3/riga-\(n).png\" alt=\"riga \(n)\">"
    html += "<span>\(htmlEscape(testiPagina3[n - 1]))</span></div>\n"
}
html += "</html>\n"

// MARK: - Atomic replace

try fm.createDirectory(at: esempiDir, withIntermediateDirectories: true)
try fm.createDirectory(at: contactDir, withIntermediateDirectories: true)
try fm.createDirectory(at: artworkDir.deletingLastPathComponent(), withIntermediateDirectories: true)

let gitkeep = artworkDir.appendingPathComponent(".gitkeep")
let avevaGitkeep = fm.fileExists(atPath: gitkeep.path)
if fm.fileExists(atPath: artworkDir.path) { try fm.removeItem(at: artworkDir) }
try fm.moveItem(at: temp, to: artworkDir)
if avevaGitkeep { fm.createFile(atPath: gitkeep.path, contents: Data()) }
try json.write(
    to: esempiDir.appendingPathComponent("esempi.json"), atomically: true, encoding: .utf8)
try sezioni.write(
    to: esempiDir.appendingPathComponent("sezioni.json"), atomically: true, encoding: .utf8)
try html.write(
    to: contactDir.appendingPathComponent("esempi.html"), atomically: true, encoding: .utf8)

// MARK: - Report

print("extract-esempi — \(esempi.count) esempi da S3 pp. 17 – 28")
for (pagina, n) in conteggi {
    print("  pagina \(pagina): \(n) righe dati → \(famigliaPerPagina[pagina] ?? "?")")
}
print("  pagina 3: 9 righe ufficiali ritagliate in artwork/esempi/pagina3/")
for (i, frase) in testiPagina3.enumerated() {
    print("    riga-\(i + 1).png — \(frase)")
}
print("  \(esempi.count * 3 + 9) PNG, esempi.json, sezioni.json, _contact/esempi.html")
