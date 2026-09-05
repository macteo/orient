import Foundation

/// The result of parsing one `ISOM <ref> <name>.pdf` source filename.
struct ParsedSymbol {
    /// The symbol reference as printed in the filename, e.g. "204", "105.1", "701-703".
    let ref: String
    /// The stem used for the output PNG, e.g. "204", "105.1", "701-703", "101", "101b".
    let outputStem: String
}

enum NamingError: Error, CustomStringConvertible {
    case cannotParse(String)

    var description: String {
        switch self {
        case .cannotParse(let name):
            return "cannot parse a symbol reference from filename: \(name)"
        }
    }
}

/// Source files to skip outright: definition figures, minimum-dimension charts,
/// the legend/screens sheet, the running-speed chart, and the licence stub.
private let excludedMarkers = ["Def_", "min_dim_", "Screens", "Running speed", "by-nd"]

func isExcludedSourceFile(_ filename: String) -> Bool {
    excludedMarkers.contains { filename.contains($0) }
}

/// True for tokens shaped like `204`, `105.1`, or `701-703` — the three ref
/// shapes that appear in `sources/iof-isom-2017-2-revision-6-links/`.
func isValidRefToken(_ token: String) -> Bool {
    let pattern = #"^(\d{3}(\.\d)?|\d{3}-\d{3})$"#
    return token.range(of: pattern, options: .regularExpression) != nil
}

/// Parses `ISOM <ref>[ <name>].pdf` into a ref and an output stem.
///
/// Naming rules:
/// - `ISOM 204 Boulder.pdf` -> ref "204", output "204.png"
/// - `ISOM 701-703.pdf` -> ref "701-703", output "701-703.png" (one file, several symbols)
/// - `ISOM 105.1 Earth wall.pdf` -> ref "105.1", output "105.1.png" (a distinct symbol number)
/// - `ISOM 101 Contour-1.pdf` -> ref "101", output "101.png" (first of a pair)
/// - `ISOM 101 Contour-2.pdf` -> ref "101", output "101b.png" (second of a pair)
func parseSymbolFilename(_ filename: String) throws -> ParsedSymbol {
    guard filename.hasPrefix("ISOM "), filename.hasSuffix(".pdf") else {
        throw NamingError.cannotParse(filename)
    }

    let start = filename.index(filename.startIndex, offsetBy: 5)
    let end = filename.index(filename.endIndex, offsetBy: -4)
    guard start < end else {
        throw NamingError.cannotParse(filename)
    }
    let core = String(filename[start..<end])

    let token: String
    let rest: String
    if let spaceIndex = core.firstIndex(of: " ") {
        token = String(core[core.startIndex..<spaceIndex])
        rest = String(core[core.index(after: spaceIndex)...])
    } else {
        token = core
        rest = ""
    }

    guard isValidRefToken(token) else {
        throw NamingError.cannotParse(filename)
    }

    var outputStem = token
    if rest.hasSuffix("-1") {
        outputStem = token
    } else if rest.hasSuffix("-2") {
        outputStem = token + "b"
    }

    return ParsedSymbol(ref: token, outputStem: outputStem)
}
