import Foundation

/// One symbol PDF successfully rendered to a PNG.
struct RenderedEntry {
    let ref: String
    let outputStem: String
    let sourceFile: String
}

/// Sort key that orders "105.1" before "105.2" and "204" before "205",
/// rather than falling back to lexical string order (which would put
/// "105.10" before "105.2").
private func naturalSortKey(_ stem: String) -> (Int, Int, String) {
    let separators = CharacterSet(charactersIn: ".-")
    let parts = stem.components(separatedBy: separators)
    let major = parts.first.flatMap { Int($0) } ?? Int.max
    let minorDigits = parts.count > 1 ? parts[1].prefix { $0.isNumber } : ""
    let minor = Int(minorDigits) ?? 0
    return (major, minor, stem)
}

private func escapeHTML(_ text: String) -> String {
    text
        .replacingOccurrences(of: "&", with: "&amp;")
        .replacingOccurrences(of: "<", with: "&lt;")
        .replacingOccurrences(of: ">", with: "&gt;")
        .replacingOccurrences(of: "\"", with: "&quot;")
}

/// Writes a contact sheet listing every rendered PNG with its ref, for a
/// human to eyeball before trusting the run (git-ignored: `content/_contact/`).
func writeContactSheet(entries: [RenderedEntry], to file: URL) throws {
    let sorted = entries.sorted { a, b in
        let ka = naturalSortKey(a.outputStem)
        let kb = naturalSortKey(b.outputStem)
        if ka.0 != kb.0 { return ka.0 < kb.0 }
        if ka.1 != kb.1 { return ka.1 < kb.1 }
        return ka.2 < kb.2
    }

    var html = """
    <!doctype html>
    <html lang="it">
    <head>
    <meta charset="utf-8">
    <title>ISOM — foglio di controllo</title>
    <style>
      :root { color-scheme: light; }
      body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: #f2f2f2; margin: 0; padding: 24px; color: #1a1a1a; }
      h1 { font-size: 18px; margin: 0 0 16px; }
      .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 12px; }
      figure { margin: 0; background: #fff; border: 1px solid #ddd; border-radius: 6px; padding: 8px; text-align: center; }
      figure img { max-width: 100%; height: 120px; object-fit: contain; background: #fff; display: block; margin: 0 auto; }
      figcaption { margin-top: 6px; font-size: 12px; color: #333; word-break: break-word; }
      figcaption small { color: #888; }
    </style>
    </head>
    <body>
    <h1>ISOM artwork — \(sorted.count) simboli</h1>
    <div class="grid">

    """

    for entry in sorted {
        let fileName = "\(entry.outputStem).png"
        html += """
        <figure>
          <img src="../artwork/isom/\(escapeHTML(fileName))" alt="\(escapeHTML(entry.ref))" loading="lazy">
          <figcaption>\(escapeHTML(entry.outputStem))<br><small>\(escapeHTML(entry.sourceFile))</small></figcaption>
        </figure>

        """
    }

    html += """
    </div>
    </body>
    </html>

    """

    try html.write(to: file, atomically: true, encoding: .utf8)
}
