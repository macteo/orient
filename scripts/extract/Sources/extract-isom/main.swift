import Foundation

// extract-isom
//
// Renders page 1 of every IOF ISOM 2017-2 per-symbol PDF onto a white
// canvas at 8x and writes the PNGs to content/artwork/isom/, plus a
// contact sheet at content/_contact/isom.html.
//
// Usage: cd scripts/extract && swift run extract-isom
// See scripts/extract/README.md.

let fm = FileManager.default

func fail(_ message: String) -> Never {
    FileHandle.standardError.write(("extract-isom: " + message + "\n").data(using: .utf8)!)
    exit(1)
}

/// Walks up from `start` looking for the repo root: a directory that has
/// both a `.git` entry and a `sources` directory. Falls back to two levels
/// up from `start` (the layout when invoked as `cd scripts/extract && swift
/// run extract-isom`).
func findRepoRoot(from start: URL) -> URL {
    var dir = start.standardizedFileURL
    for _ in 0..<12 {
        let gitMarker = dir.appendingPathComponent(".git")
        let sourcesMarker = dir.appendingPathComponent("sources")
        if fm.fileExists(atPath: gitMarker.path), fm.fileExists(atPath: sourcesMarker.path) {
            return dir
        }
        let parent = dir.deletingLastPathComponent()
        if parent.path == dir.path { break }
        dir = parent
    }
    return start.deletingLastPathComponent().deletingLastPathComponent()
}

let cwd = URL(fileURLWithPath: fm.currentDirectoryPath)
let repoRoot = findRepoRoot(from: cwd)
let sourceDir = repoRoot.appendingPathComponent("sources/iof-isom-2017-2-revision-6-links")
let targetDir = repoRoot.appendingPathComponent("content/artwork/isom")
let contactDir = repoRoot.appendingPathComponent("content/_contact")
let contactFile = contactDir.appendingPathComponent("isom.html")

guard fm.fileExists(atPath: sourceDir.path) else {
    fail("source directory not found: \(sourceDir.path)")
}

let allEntries: [String]
do {
    allEntries = try fm.contentsOfDirectory(atPath: sourceDir.path)
} catch {
    fail("cannot list \(sourceDir.path): \(error)")
}

let pdfFiles = allEntries
    .filter { $0.lowercased().hasSuffix(".pdf") }
    .filter { !isExcludedSourceFile($0) }
    .sorted()

guard !pdfFiles.isEmpty else {
    fail("no candidate PDFs found in \(sourceDir.path)")
}

// Render everything into a scratch directory first; only replace the
// committed target once every file has succeeded.
let tempDir = URL(fileURLWithPath: NSTemporaryDirectory())
    .appendingPathComponent("extract-isom-\(UUID().uuidString)", isDirectory: true)
do {
    try fm.createDirectory(at: tempDir, withIntermediateDirectories: true)
} catch {
    fail("cannot create scratch directory \(tempDir.path): \(error)")
}

var rendered: [RenderedEntry] = []
var failures: [String] = []

for filename in pdfFiles {
    let sourceURL = sourceDir.appendingPathComponent(filename)
    do {
        let parsed = try parseSymbolFilename(filename)
        let outputURL = tempDir.appendingPathComponent("\(parsed.outputStem).png")
        try renderFirstPageToPNG(pdfURL: sourceURL, outputURL: outputURL)
        rendered.append(RenderedEntry(ref: parsed.ref, outputStem: parsed.outputStem, sourceFile: filename))
    } catch {
        failures.append("\(filename): \(error)")
    }
}

guard failures.isEmpty else {
    FileHandle.standardError.write("extract-isom: \(failures.count) file(s) failed:\n".data(using: .utf8)!)
    for failure in failures {
        FileHandle.standardError.write("  - \(failure)\n".data(using: .utf8)!)
    }
    fail("aborting without touching \(targetDir.path); partial output left at \(tempDir.path)")
}

// Replace content/artwork/isom/ with the freshly rendered directory. Two
// renames (old -> backup, temp -> live) rather than a single filesystem
// call, but each rename is atomic and the backup is only removed once the
// swap has succeeded, so a crash mid-way never leaves the target missing.
do {
    try fm.createDirectory(at: targetDir.deletingLastPathComponent(), withIntermediateDirectories: true)
    if fm.fileExists(atPath: targetDir.path) {
        let backupURL = targetDir.deletingLastPathComponent()
            .appendingPathComponent(".isom-old-\(UUID().uuidString)", isDirectory: true)
        try fm.moveItem(at: targetDir, to: backupURL)
        do {
            try fm.moveItem(at: tempDir, to: targetDir)
        } catch {
            try? fm.moveItem(at: backupURL, to: targetDir)
            throw error
        }
        try? fm.removeItem(at: backupURL)
    } else {
        try fm.moveItem(at: tempDir, to: targetDir)
    }
} catch {
    fail("cannot replace \(targetDir.path): \(error)")
}

do {
    try fm.createDirectory(at: contactDir, withIntermediateDirectories: true)
    try writeContactSheet(entries: rendered, to: contactFile)
} catch {
    fail("cannot write contact sheet \(contactFile.path): \(error)")
}

print("extract-isom: wrote \(rendered.count) PNG(s) to \(targetDir.path)")
print("extract-isom: contact sheet at \(contactFile.path)")
