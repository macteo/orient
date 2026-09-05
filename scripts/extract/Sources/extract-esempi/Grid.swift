// Grid.swift — table-rule detection, cell cropping and page-text lookup for
// `sources/iof_descrizioni_punti_ital.pdf`.
//
// The §Esempi table (pages 17 – 28) and the IOF event example on page 3 are
// drawn with real rules, so the grid is found by looking at the pixels rather
// than by hard-coding coordinates: the rows are not the same height on every
// page and a fixed grid drifts until a sketch loses its treetops
// (akaaso/03-modules/005-pipeline-esempi.md).

import CoreGraphics
import Foundation
import ImageIO
import PDFKit
import UniformTypeIdentifiers

// MARK: - Rendered page

/// A band of consecutive pixel rows/columns that together make one drawn rule.
struct Band {
    let start: Int  // first pixel index of the rule, inclusive
    let end: Int  // last pixel index of the rule, inclusive
    var center: Double { (Double(start) + Double(end)) / 2 }
    var thickness: Int { end - start + 1 }
}

/// A page rendered onto white at `scale`, with its pixels kept for scanning.
///
/// Pixel row 0 is the visual top of the page. `pdfRect(of:)` converts back to
/// PDF user space, where y grows upwards.
struct RenderedPage {
    let image: CGImage
    let width: Int
    let height: Int
    let scale: CGFloat
    let pageBounds: CGRect
    let pixels: [UInt8]  // RGBX, 4 bytes per pixel
    let bytesPerRow: Int

    @inline(__always)
    func isDark(x: Int, y: Int) -> Bool {
        let o = y * bytesPerRow + x * 4
        let sum = Int(pixels[o]) + Int(pixels[o + 1]) + Int(pixels[o + 2])
        return sum < 360
    }

    /// PDF user-space rectangle for a rectangle given in pixels from the top-left.
    func pdfRect(of r: CGRect) -> CGRect {
        let sx = 1 / scale
        return CGRect(
            x: pageBounds.minX + r.minX * sx,
            y: pageBounds.minY + (CGFloat(height) - r.maxY) * sx,
            width: r.width * sx,
            height: r.height * sx)
    }
}

enum RenderError: Error, CustomStringConvertible {
    case context
    case image
    case png(String)

    var description: String {
        switch self {
        case .context: return "impossibile creare il contesto grafico"
        case .image: return "impossibile creare l'immagine dal contesto"
        case .png(let p): return "impossibile scrivere il PNG \(p)"
        }
    }
}

/// Renders `page` at `scale` onto an opaque white canvas.
func renderPage(_ page: PDFPage, scale: CGFloat) throws -> RenderedPage {
    let bounds = page.bounds(for: .mediaBox)
    let width = Int((bounds.width * scale).rounded())
    let height = Int((bounds.height * scale).rounded())
    let bytesPerRow = width * 4
    let raw = UnsafeMutableRawPointer.allocate(
        byteCount: bytesPerRow * height, alignment: 64)
    defer { raw.deallocate() }

    guard
        let ctx = CGContext(
            data: raw, width: width, height: height, bitsPerComponent: 8,
            bytesPerRow: bytesPerRow, space: CGColorSpaceCreateDeviceRGB(),
            bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue)
    else { throw RenderError.context }

    ctx.setFillColor(gray: 1, alpha: 1)
    ctx.fill(CGRect(x: 0, y: 0, width: width, height: height))
    ctx.interpolationQuality = .high
    ctx.setShouldAntialias(true)
    ctx.saveGState()
    ctx.scaleBy(x: scale, y: scale)
    page.draw(with: .mediaBox, to: ctx)
    ctx.restoreGState()

    guard let image = ctx.makeImage() else { throw RenderError.image }
    let pixels = [UInt8](
        UnsafeRawBufferPointer(start: raw, count: bytesPerRow * height))
    return RenderedPage(
        image: image, width: width, height: height, scale: scale,
        pageBounds: bounds, pixels: pixels, bytesPerRow: bytesPerRow)
}

// MARK: - Rule detection

/// Horizontal rules: rows whose longest dark run covers more than
/// `minRunFraction` of the page width. Consecutive rows are one rule.
func horizontalRules(_ p: RenderedPage, minRunFraction: Double = 0.40) -> [Band] {
    let threshold = Int(Double(p.width) * minRunFraction)
    var hits = [Bool](repeating: false, count: p.height)
    for y in 0..<p.height {
        var run = 0
        var best = 0
        for x in 0..<p.width {
            if p.isDark(x: x, y: y) {
                run += 1
                if run > best { best = run }
            } else {
                run = 0
            }
        }
        hits[y] = best > threshold
    }
    return group(hits)
}

/// Vertical rules inside the table body: columns where at least
/// `minCoverage` of the pixels between `top` and `bottom` are dark.
func verticalRules(
    _ p: RenderedPage, top: Int, bottom: Int, minCoverage: Double = 0.85
) -> [Band] {
    guard bottom > top else { return [] }
    let span = bottom - top + 1
    let need = Int(Double(span) * minCoverage)
    var hits = [Bool](repeating: false, count: p.width)
    for x in 0..<p.width {
        var dark = 0
        for y in top...bottom where p.isDark(x: x, y: y) { dark += 1 }
        hits[x] = dark >= need
    }
    return group(hits)
}

private func group(_ hits: [Bool]) -> [Band] {
    var bands: [Band] = []
    var i = 0
    while i < hits.count {
        guard hits[i] else {
            i += 1
            continue
        }
        var j = i
        while j + 1 < hits.count && hits[j + 1] { j += 1 }
        bands.append(Band(start: i, end: j))
        i = j + 1
    }
    return bands
}

/// The pixel rectangle of the cell between two horizontal and two vertical
/// rules, inset by `inset` pixels so no rule bleeds into the crop.
func cellRect(rows: [Band], cols: [Band], row: Int, col: Int, inset: Int = 3)
    -> CGRect
{
    let x0 = cols[col].end + 1 + inset
    let x1 = cols[col + 1].start - inset
    let y0 = rows[row].end + 1 + inset
    let y1 = rows[row + 1].start - inset
    return CGRect(x: x0, y: y0, width: max(1, x1 - x0), height: max(1, y1 - y0))
}

/// The pixel rectangle of a whole row between two vertical rules, the rules
/// included so the crop reads as a printed row with its border.
func rowRect(
    rows: [Band], left: Band, right: Band, row: Int, bleed: Int = 1
) -> CGRect {
    let x0 = max(0, left.start - bleed)
    let x1 = right.end + 1 + bleed
    let y0 = max(0, rows[row].start - bleed)
    let y1 = rows[row + 1].end + 1 + bleed
    return CGRect(x: x0, y: y0, width: x1 - x0, height: y1 - y0)
}

/// True when nothing is drawn in `rect` — used to tell the numbered control
/// rows of page 3 (column B carries the code) from the start row (B is empty).
func isBlank(_ p: RenderedPage, _ rect: CGRect) -> Bool {
    let r = rect.intersection(
        CGRect(x: 0, y: 0, width: p.width, height: p.height)
    ).integral
    guard r.width > 0, r.height > 0 else { return true }
    for y in Int(r.minY)..<Int(r.maxY) {
        for x in Int(r.minX)..<Int(r.maxX) where p.isDark(x: x, y: y) {
            return false
        }
    }
    return true
}

/// The vertical rules drawn inside one row, between `left` and `right`.
///
/// On page 3 this is what tells a description row from a heading or a route
/// line: only the numbered rows carry the A – H cell separators.
func innerRules(
    _ p: RenderedPage, rows: [Band], row: Int, left: Band, right: Band
) -> [Band] {
    let top = rows[row].end + 1
    let bottom = rows[row + 1].start - 1
    guard bottom > top else { return [] }
    return verticalRules(p, top: top, bottom: bottom).filter {
        $0.start > left.end && $0.end < right.start
    }
}

// MARK: - Cropping and PNG output

/// Crops `rect` (pixels, top-left origin) and redraws it onto opaque white.
func crop(_ p: RenderedPage, _ rect: CGRect) throws -> CGImage {
    let clipped = rect.intersection(
        CGRect(x: 0, y: 0, width: p.width, height: p.height)
    ).integral
    guard let sub = p.image.cropping(to: clipped) else { throw RenderError.image }
    let w = sub.width
    let h = sub.height
    guard
        let ctx = CGContext(
            data: nil, width: w, height: h, bitsPerComponent: 8,
            bytesPerRow: w * 4, space: CGColorSpaceCreateDeviceRGB(),
            bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue)
    else { throw RenderError.context }
    ctx.setFillColor(gray: 1, alpha: 1)
    ctx.fill(CGRect(x: 0, y: 0, width: w, height: h))
    ctx.draw(sub, in: CGRect(x: 0, y: 0, width: w, height: h))
    guard let out = ctx.makeImage() else { throw RenderError.image }
    return out
}

/// The PNG chunks worth keeping: the pixels and the colour space, nothing else.
private let pngChunksKept: Set<String> = ["IHDR", "PLTE", "tRNS", "sRGB", "IDAT", "IEND"]

/// Drops every other chunk (ImageIO writes an `eXIf` block of its own), so the
/// file carries no metadata and is the same bytes on every run.
private func stripPNGMetadata(_ data: Data) -> Data {
    guard data.count > 8 else { return data }
    var out = Data(data[0..<8])  // signature
    var i = 8
    while i + 8 <= data.count {
        let length = data[i..<(i + 4)].reduce(0) { $0 << 8 | Int($1) }
        guard let type = String(data: data[(i + 4)..<(i + 8)], encoding: .ascii) else { break }
        let end = i + 12 + length
        guard end <= data.count else { break }
        if pngChunksKept.contains(type) { out.append(data[i..<end]) }
        i = end
    }
    return out
}

/// Writes a PNG with no metadata beyond the pixels — the same bytes every run.
func writePNG(_ image: CGImage, to url: URL) throws {
    let data = NSMutableData()
    guard
        let dest = CGImageDestinationCreateWithData(
            data, UTType.png.identifier as CFString, 1, nil)
    else { throw RenderError.png(url.path) }
    let options: [CFString: Any] = [kCGImagePropertyPNGDictionary: [CFString: Any]()]
    CGImageDestinationAddImage(dest, image, options as CFDictionary)
    guard CGImageDestinationFinalize(dest) else { throw RenderError.png(url.path) }
    try stripPNGMetadata(data as Data).write(to: url, options: .atomic)
}

// MARK: - Text layer

/// The text layer of one page, read back cell by cell.
///
/// `PDFPage.selection(for:)` is what does the work: it returns exactly the
/// characters drawn inside a rectangle, with the source's own line breaks.
/// (Walking `characterBounds(at:)` by hand looks equivalent and is not — a few
/// glyphs report degenerate bounds and drop out of the string.)
struct PageText {
    let page: PDFPage

    init(_ page: PDFPage) { self.page = page }

    /// The text printed inside `rect` (PDF user space), lines still separated.
    func text(in rect: CGRect) -> String {
        page.selection(for: rect)?.string ?? ""
    }
}

/// Compounds that keep their hyphen when the source breaks the line on it.
/// Every other end-of-line hyphen in §Esempi is orthographic wrapping
/// (`depressio-ne`, `vegeta-zione`) and is dropped.
private let hyphenatedCompounds: Set<String> = [
    "sud-est", "sud-ovest", "nord-est", "nord-ovest", "semi-aperto",
]

/// Joins the wrapped lines of a cell into the one string the page prints.
func joinWrappedLines(_ raw: String) -> String {
    let lines =
        raw
        .components(separatedBy: .newlines)
        .map { $0.trimmingCharacters(in: .whitespaces) }
        .filter { !$0.isEmpty }
    guard var out = lines.first else { return "" }
    for next in lines.dropFirst() {
        if out.hasSuffix("/") {
            out += next  // "Terreno pietroso/sassoso" broken after the slash
        } else if out.hasSuffix("-") {
            let stem = out.dropLast()
            let lastWord = stem.split(separator: " ").last.map(String.init) ?? ""
            let firstWord =
                next.split(separator: " ").first.map(String.init) ?? ""
            let tail = firstWord.trimmingCharacters(
                in: CharacterSet.letters.inverted)
            let candidate = "\(lastWord)-\(tail)".lowercased()
            if hyphenatedCompounds.contains(candidate) {
                out += next  // sud-est: the hyphen belongs to the word
            } else {
                out = String(stem) + next  // vegeta-zione: wrapping only
            }
        } else {
            out += " " + next
        }
    }
    while out.contains("  ") {
        out = out.replacingOccurrences(of: "  ", with: " ")
    }
    return out.trimmingCharacters(in: .whitespaces)
}
