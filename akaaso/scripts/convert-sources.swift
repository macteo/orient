import Foundation
import PDFKit
let args = CommandLine.arguments
let url = URL(fileURLWithPath: args[1])
guard let doc = PDFDocument(url: url) else { print("cannot open"); exit(1) }
var out = ""
for i in 0..<doc.pageCount {
    if let p = doc.page(at: i) {
        out += "\n\n===== PAGE \(i+1) =====\n"
        out += p.string ?? ""
    }
}
try! out.write(toFile: args[2], atomically: true, encoding: .utf8)
print("\(url.lastPathComponent): \(doc.pageCount) pages -> \(args[2])")
