import UIKit

final class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession,
               options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = scene as? UIWindowScene else { return }
        let window = UIWindow(windowScene: windowScene)
        window.rootViewController = ViewController()
        window.makeKeyAndVisible()
        self.window = window
    }

    func sceneDidBecomeActive(_ scene: UIScene) {
        // WKWebView: Ton nach App-Wechsel zuverlaessig wiederherstellen.
        // Das Spiel baut den AudioContext selbst neu (visibilitychange);
        // hier nur Sicherheitshalber neu laden, wenn der ViewController besteht.
        NotificationCenter.default.post(name: .init("BeatBoxSceneDidBecomeActive"), object: nil)
    }
}
