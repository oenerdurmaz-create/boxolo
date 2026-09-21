import UIKit
import WebKit

/// Vollbild-Webansicht für das BeatBox-Web-Paket.
final class SpielViewController: UIViewController, WKNavigationDelegate, WKScriptMessageHandler {
    /// Hintergrund wie in css/style.css (--boden: #0d1f3a), damit beim Start nichts weiß aufblitzt.
    static let bodenfarbe = UIColor(red: 13 / 255, green: 31 / 255, blue: 58 / 255, alpha: 1)

    /// Name der Nachricht, die js/main.js für Vibration sendet.
    static let vibrationsNachricht = "vibrieren"

    private var webView: WKWebView!
    private let leichterSchlag = UIImpactFeedbackGenerator(style: .light)
    private let harterSchlag = UIImpactFeedbackGenerator(style: .heavy)

    override func loadView() {
        let konfiguration = WKWebViewConfiguration()
        konfiguration.setURLSchemeHandler(WebDateiHandler(), forURLScheme: WebDateiHandler.schema)
        konfiguration.websiteDataStore = .default()
        konfiguration.allowsInlineMediaPlayback = true
        konfiguration.mediaTypesRequiringUserActionForPlayback = []
        konfiguration.preferences.javaScriptCanOpenWindowsAutomatically = false

        let inhalte = WKUserContentController()
        inhalte.add(SchwacherNachrichtenEmpfaenger(ziel: self), name: Self.vibrationsNachricht)
        konfiguration.userContentController = inhalte

        let ansicht = WKWebView(frame: .zero, configuration: konfiguration)
        ansicht.isOpaque = false
        ansicht.backgroundColor = Self.bodenfarbe
        ansicht.scrollView.backgroundColor = Self.bodenfarbe
        ansicht.scrollView.bounces = false
        ansicht.scrollView.contentInsetAdjustmentBehavior = .never
        ansicht.allowsLinkPreview = false
        ansicht.allowsBackForwardNavigationGestures = false
        ansicht.navigationDelegate = self
        #if DEBUG
        if #available(iOS 16.4, *) {
            ansicht.isInspectable = true
        }
        #endif

        webView = ansicht
        view = ansicht
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        leichterSchlag.prepare()
        harterSchlag.prepare()
        webView.load(URLRequest(url: WebDateiHandler.startURL))
    }

    override var prefersStatusBarHidden: Bool { true }
    override var prefersHomeIndicatorAutoHidden: Bool { true }
    override var preferredScreenEdgesDeferringSystemGestures: UIRectEdge { .all }
    override var supportedInterfaceOrientations: UIInterfaceOrientationMask { .portrait }

    // MARK: - Navigation

    /// Nur das eigene Schema ist erlaubt. Die App lädt nichts aus dem Netz.
    func webView(
        _ webView: WKWebView,
        decidePolicyFor navigationAction: WKNavigationAction,
        decisionHandler: @escaping (WKNavigationActionPolicy) -> Void
    ) {
        let schema = navigationAction.request.url?.scheme?.lowercased()
        decisionHandler(schema == WebDateiHandler.schema ? .allow : .cancel)
    }

    /// Beendet iOS den Webinhalt-Prozess (z. B. bei Speichermangel), wird neu geladen.
    func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
        webView.load(URLRequest(url: WebDateiHandler.startURL))
    }

    // MARK: - Haptik

    /// js/main.js sendet die Dauer in Millisekunden: 12 bei Treffer, 40 bei Fehler.
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard message.name == Self.vibrationsNachricht else { return }
        let dauer = (message.body as? NSNumber)?.doubleValue ?? 15
        if dauer >= 30 {
            harterSchlag.impactOccurred()
            harterSchlag.prepare()
        } else {
            leichterSchlag.impactOccurred()
            leichterSchlag.prepare()
        }
    }
}

/// Verhindert einen Speicherzyklus: WKUserContentController hält seine Empfänger stark.
private final class SchwacherNachrichtenEmpfaenger: NSObject, WKScriptMessageHandler {
    weak var ziel: WKScriptMessageHandler?

    init(ziel: WKScriptMessageHandler) {
        self.ziel = ziel
        super.init()
    }

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        ziel?.userContentController(userContentController, didReceive: message)
    }
}
