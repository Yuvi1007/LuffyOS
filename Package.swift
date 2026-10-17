// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "LuffyDesktop",
    platforms: [.macOS(.v13)],
    products: [
        .executable(name: "LuffyDesktop", targets: ["LuffyDesktop"])
    ],
    targets: [
        .executableTarget(
            name: "LuffyDesktop",
            path: "Sources/LuffyDesktop",
            exclude: ["Info.plist", "Resources"]
        )
    ]
)
