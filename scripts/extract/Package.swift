// swift-tools-version:5.9
import PackageDescription

let package = Package(
    name: "extract",
    platforms: [
        .macOS(.v13)
    ],
    targets: [
        .executableTarget(name: "extract-isom"),
        .executableTarget(name: "extract-esempi"),
    ]
)
