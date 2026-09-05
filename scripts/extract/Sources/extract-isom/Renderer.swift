import CoreGraphics
import Foundation
import ImageIO
import PDFKit
import UniformTypeIdentifiers

enum RenderError: Error, CustomStringConvertible {
    case cannotOpenDocument(URL)
    case noFirstPage(URL)
    case emptyPage(URL)
    case cannotCreateContext(URL)
    case cannotMakeImage(URL)
    case cannotCreateDestination(URL)
    case cannotFinalizeDestination(URL)

    var description: String {
        switch self {
        case .cannotOpenDocument(let url):
            return "cannot open PDF: \(url.lastPathComponent)"
        case .noFirstPage(let url):
            return "PDF has no page 1: \(url.lastPathComponent)"
        case .emptyPage(let url):
            return "PDF page 1 has an empty media box: \(url.lastPathComponent)"
        case .cannotCreateContext(let url):
            return "cannot create a bitmap context for: \(url.lastPathComponent)"
        case .cannotMakeImage(let url):
            return "cannot create a CGImage for: \(url.lastPathComponent)"
        case .cannotCreateDestination(let url):
            return "cannot create a PNG destination for: \(url.lastPathComponent)"
        case .cannotFinalizeDestination(let url):
            return "cannot finalize the PNG for: \(url.lastPathComponent)"
        }
    }
}

/// Per the task spec: render every symbol at 8x on a white canvas. A
/// handful of the smallest point symbols (e.g. "110 Small elongated knoll",
/// media box 27pt wide) would land under the 300px width floor at a flat
/// 8x, so the scale is bumped — proportionally, on both axes, never
/// cropped — only for the few files that need it to clear that floor.
let baseRenderScale: CGFloat = 8
let minimumOutputWidth: CGFloat = 300

/// Renders page 1 of `pdfURL` onto an opaque white canvas and writes it as
/// a metadata-free PNG to `outputURL`. Never crops or recolours: the full
/// media box is drawn as printed, annotations included, scaled uniformly.
func renderFirstPageToPNG(pdfURL: URL, outputURL: URL) throws {
    guard let document = PDFDocument(url: pdfURL) else {
        throw RenderError.cannotOpenDocument(pdfURL)
    }
    guard let page = document.page(at: 0) else {
        throw RenderError.noFirstPage(pdfURL)
    }

    let box = page.bounds(for: .mediaBox)
    guard box.width > 0, box.height > 0 else {
        throw RenderError.emptyPage(pdfURL)
    }

    let renderScale = max(baseRenderScale, minimumOutputWidth / box.width)

    let pixelWidth = max(Int(minimumOutputWidth), Int((box.width * renderScale).rounded(.up)))
    let pixelHeight = max(1, Int((box.height * renderScale).rounded(.up)))

    guard let ctx = CGContext(
        data: nil,
        width: pixelWidth,
        height: pixelHeight,
        bitsPerComponent: 8,
        bytesPerRow: 0,
        space: CGColorSpaceCreateDeviceRGB(),
        bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue
    ) else {
        throw RenderError.cannotCreateContext(pdfURL)
    }

    // Fill white first, so any transparent regions in the drawing flatten
    // onto white rather than leaving a punch-through alpha hole (the
    // context itself carries no alpha channel, so the result is opaque).
    ctx.setFillColor(CGColor(red: 1, green: 1, blue: 1, alpha: 1))
    ctx.fill(CGRect(x: 0, y: 0, width: pixelWidth, height: pixelHeight))

    // Scale to the target resolution and align the media box origin to (0, 0)
    // before handing the context to PDFKit.
    ctx.scaleBy(x: renderScale, y: renderScale)
    ctx.translateBy(x: -box.origin.x, y: -box.origin.y)

    page.draw(with: .mediaBox, to: ctx)

    guard let image = ctx.makeImage() else {
        throw RenderError.cannotMakeImage(pdfURL)
    }

    try writePNG(image, to: outputURL)
}

/// Writes `image` as a PNG with no properties/metadata, so the same input
/// produces byte-identical output on every run.
func writePNG(_ image: CGImage, to url: URL) throws {
    guard let destination = CGImageDestinationCreateWithURL(
        url as CFURL,
        UTType.png.identifier as CFString,
        1,
        nil
    ) else {
        throw RenderError.cannotCreateDestination(url)
    }
    CGImageDestinationAddImage(destination, image, nil)
    guard CGImageDestinationFinalize(destination) else {
        throw RenderError.cannotFinalizeDestination(url)
    }
}
