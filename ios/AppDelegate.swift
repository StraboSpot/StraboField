import UIKit
import OrientationDirector

@main class AppDelegate: UIResponder, UIApplicationDelegate {
    var window: UIWindow?

    var reactNativeDelegate: ReactNativeDelegate?
    var reactNativeFactory: RCTReactNativeFactory?

    func application(_ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil) -> Bool {

        let delegate = ReactNativeDelegate()
        let factory = RCTReactNativeFactory(delegate: delegate)
        delegate.dependencyProvider = RCTAppDependencyProvider()

        reactNativeDelegate = delegate
        reactNativeFactory = factory

        window = UIWindow(frame: UIScreen.main.bounds)

        factory.startReactNative(
            withModuleName: "StraboSpot2",
            in: window,
            launchOptions: launchOptions
        )

        return true
    }

    func application(_ application: UIApplication, supportedInterfaceOrientationsFor window: UIWindow?) -> UIInterfaceOrientationMask {
        return SharedOrientationDirectorImpl.shared.supportedInterfaceOrientations
    }

    func application(_ app: UIApplication,
    open url: URL,
    options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        return RCTLinkingManager.application(app, open: url, options: options)
    }
}


class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
    override func sourceURL(for bridge: RCTBridge) -> URL? {
        self.bundleURL()
    }

    override func bundleURL() -> URL? {
        #if DEBUG
        #if targetEnvironment(simulator)
        // Simulator: Metro on the host, reachable via localhost
        return RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
        #else
        // Physical device, offline: point directly at the Mac's USB link-local IP
        // Run ifconfig | grep "inet " in terminal to get inet ip
        return URL(string: "http://169.254.144.132:8081/index.bundle?platform=ios&dev=true")
        #endif
        #else
        return Bundle.main.url(forResource: "main", withExtension: "jsbundle")
        #endif
    }
}
