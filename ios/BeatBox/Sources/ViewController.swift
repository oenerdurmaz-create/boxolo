import UIKit
import WebKit

final class ViewController: UIViewController {
    private var webView: WKWebView!

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .black

        let config = WKWebViewConfiguration()
        config.allowsInlineMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = []
        // Lautstaerketasten sollen direkt wirken:
        config.preferences.javaScriptCanOpenWindowsAutomatically = false

        webView = WKWebView(frame: view.bounds, configuration: config)
        webView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        webView.isOpaque = false
        webView.backgroundColor = .black
        webView.scrollView.bounces = false
        webView.scrollView.isScrollEnabled = false
        webView.navigationDelegate = self
        view.addSubview(webView)

        ladeSpiel()

        NotificationCenter.default.addObserver(
            self,
            selector: #selector(appWurdeAktiv),
            name: .init("BeatBoxSceneDidBecomeActive"),
            object: nil
        )
    }

    private func ladeSpiel() {
        guard let url = Bundle.main.url(forResource: "boxreaktion/index", withExtension: "html") else {
            // Sollte nie passieren; Bundle-Inhalt pruefen.
            return
        }
        let basis = url.deletingLastPathComponent().deletingLastPathComponent()
        webView.loadFileURL(url, allowingReadAccessTo: basis)
    }

    @objc private func appWurdeAktiv() {
        // Das Spiel selbst baut den AudioContext auf visibilitychange neu.
        // Falls WKWebView trotzdem haengt: sanftes Neuladen der Seite.
        if webView.url == nil { ladeSpiel() }
    }
}

extension ViewController: WKNavigationDelegate {
    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        ladeSpiel()
    }
}
