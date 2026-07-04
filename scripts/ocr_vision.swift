import Foundation
import Vision
import AppKit

if CommandLine.arguments.count < 3 {
    fputs("Usage: ocr_vision.swift <image-path> <output-path>\n", stderr)
    exit(2)
}

let imagePath = CommandLine.arguments[1]
let outputPath = CommandLine.arguments[2]
let imageUrl = URL(fileURLWithPath: imagePath)

guard let image = NSImage(contentsOf: imageUrl),
      let tiffData = image.tiffRepresentation,
      let bitmap = NSBitmapImageRep(data: tiffData),
      let cgImage = bitmap.cgImage else {
    fputs("Failed to load image: \(imagePath)\n", stderr)
    exit(1)
}

let request = VNRecognizeTextRequest()
if ProcessInfo.processInfo.environment["OCR_FAST"] == "1" {
    request.recognitionLevel = .fast
} else {
    request.recognitionLevel = .accurate
}
request.usesLanguageCorrection = true
request.recognitionLanguages = ["zh-Hans", "zh-Hant", "en-US"]

let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])
do {
    try handler.perform([request])
    let observations = request.results as? [VNRecognizedTextObservation] ?? []
    let text = observations
        .compactMap { $0.topCandidates(1).first?.string }
        .joined(separator: "\n")
    try text.write(toFile: outputPath, atomically: true, encoding: String.Encoding.utf8)
} catch {
    fputs("OCR failed: \(error)\n", stderr)
    exit(1)
}
