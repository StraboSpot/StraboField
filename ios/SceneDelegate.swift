import UIKit

// iOS 27 requires UIScene lifecycle adoption; apps without it crash at launch.
class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    func scene(_ scene: UIScene,
    willConnectTo session: UISceneSession,
    options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = scene as? UIWindowScene,
              let appDelegate = UIApplication.shared.delegate as? AppDelegate,
              let factory = appDelegate.reactNativeFactory else { return }

        window = UIWindow(windowScene: windowScene)

        // Scenes don't receive launchOptions, so pass a cold-start URL through for Linking.getInitialURL()
        var launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
        if let url = connectionOptions.urlContexts.first?.url {
            launchOptions = [.url: url]
        }

        factory.startReactNative(
            withModuleName: "StraboSpot2",
            in: window,
            launchOptions: launchOptions
        )
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        // RCTLinkingManager.application(_:open:options:) does nothing in a scene app
        RCTLinkingManager.scene(scene, openURLContexts: URLContexts)
    }
}
