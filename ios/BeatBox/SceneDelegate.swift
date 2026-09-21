import UIKit

/// Legt das einzige Fenster an und zeigt darin die Webansicht.
final class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    func scene(
        _ scene: UIScene,
        willConnectTo session: UISceneSession,
        options connectionOptions: UIScene.ConnectionOptions
    ) {
        guard let fensterSzene = scene as? UIWindowScene else { return }
        let fenster = UIWindow(windowScene: fensterSzene)
        fenster.backgroundColor = SpielViewController.bodenfarbe
        fenster.rootViewController = SpielViewController()
        fenster.makeKeyAndVisible()
        window = fenster
    }

    func sceneDidBecomeActive(_ scene: UIScene) {
        Audiositzung.aktivieren()
    }
}
