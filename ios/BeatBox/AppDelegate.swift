import UIKit

/// Einstiegspunkt der App. Das Fenster richtet der SceneDelegate ein.
@main
final class AppDelegate: UIResponder, UIApplicationDelegate {
    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
    ) -> Bool {
        Audiositzung.aktivieren()
        return true
    }
}
