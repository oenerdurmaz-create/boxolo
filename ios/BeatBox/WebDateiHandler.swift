import Foundation
import WebKit

/// Liefert die Web-Dateien aus dem App-Bundle über das eigene Schema beatbox:// aus.
/// Gegenüber file:// hat die Seite so eine stabile Herkunft, damit localStorage
/// (Bestenlisten, Verlauf, Kalibrierung) dauerhaft erhalten bleibt.
final class WebDateiHandler: NSObject, WKURLSchemeHandler {
    static let schema = "beatbox"
    static let startURL = URL(string: "beatbox://localhost/index.html")!

    /// Nur diese Pfade werden ausgeliefert. Alles andere im Bundle bleibt unerreichbar.
    static let erlaubtePfade = ["index.html", "css/", "js/"]

    private let wurzel: URL

    init(wurzel: URL = Bundle.main.resourceURL ?? Bundle.main.bundleURL) {
        self.wurzel = wurzel
        super.init()
    }

    func webView(_ webView: WKWebView, start urlSchemeTask: WKURLSchemeTask) {
        guard let url = urlSchemeTask.request.url else {
            urlSchemeTask.didFailWithError(Self.fehler(NSURLErrorBadURL))
            return
        }
        var pfad = url.path
        while pfad.hasPrefix("/") { pfad.removeFirst() }
        if pfad.isEmpty { pfad = "index.html" }

        let erlaubt = Self.erlaubtePfade.contains { eintrag in
            pfad == eintrag || (eintrag.hasSuffix("/") && pfad.hasPrefix(eintrag))
        }
        guard erlaubt, !pfad.split(separator: "/").contains("..") else {
            urlSchemeTask.didFailWithError(Self.fehler(NSURLErrorNoPermissionsToReadFile))
            return
        }

        let datei = wurzel.appendingPathComponent(pfad)
        guard let daten = try? Data(contentsOf: datei) else {
            urlSchemeTask.didFailWithError(Self.fehler(NSURLErrorFileDoesNotExist))
            return
        }

        let kopf = [
            "Content-Type": Self.mimeTyp(datei.pathExtension),
            "Content-Length": String(daten.count),
            "Cache-Control": "no-cache"
        ]
        guard let antwort = HTTPURLResponse(url: url, statusCode: 200, httpVersion: "HTTP/1.1", headerFields: kopf) else {
            urlSchemeTask.didFailWithError(Self.fehler(NSURLErrorCannotParseResponse))
            return
        }
        urlSchemeTask.didReceive(antwort)
        urlSchemeTask.didReceive(daten)
        urlSchemeTask.didFinish()
    }

    func webView(_ webView: WKWebView, stop urlSchemeTask: WKURLSchemeTask) {
        /* Antworten werden synchron geliefert; es gibt nichts abzubrechen. */
    }

    static func mimeTyp(_ endung: String) -> String {
        switch endung.lowercased() {
        case "html": return "text/html; charset=utf-8"
        case "css": return "text/css; charset=utf-8"
        case "js": return "text/javascript; charset=utf-8"
        default: return "application/octet-stream"
        }
    }

    private static func fehler(_ code: Int) -> NSError {
        NSError(domain: NSURLErrorDomain, code: code)
    }
}
