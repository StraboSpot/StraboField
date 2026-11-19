import UIKit
internal import Expo
import OrientationDirector

// ExpoAppDelegate forwards app life-cycle events to Expo modules; ExpoReactNativeFactory lets expo-updates pick the
// bundle to launch. SceneDelegate stays our own: ExpoAppSceneDelegate needs ExpoReactNativeFactoryProvider, which
// can't be adopted from this Swift 5 target (Expo is built in Swift 6 mode and the conformance fails to load).
@main class AppDelegate: ExpoAppDelegate {
    var window: UIWindow?
    var reactNativeDelegate: ReactNativeDelegate?
    var reactNativeFactory: RCTReactNativeFactory?

    override func application(_ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil) -> Bool {

        SentryCorruptReportGuard.install()

        let delegate = ReactNativeDelegate()
        let factory = ExpoReactNativeFactory(delegate: delegate)
        delegate.dependencyProvider = RCTAppDependencyProvider()

        reactNativeDelegate = delegate
        reactNativeFactory = factory

        ModalStatusBarStyle.install()

        // The window and React Native root are created in SceneDelegate
        return super.application(application, didFinishLaunchingWithOptions: launchOptions)
    }

    override func application(_ application: UIApplication, supportedInterfaceOrientationsFor window: UIWindow?) -> UIInterfaceOrientationMask {
        return SharedOrientationDirectorImpl.shared.supportedInterfaceOrientations
    }
}


// RootViewController (status bar ownership) lives in modules/strabo-root-view, which hands it to Expo as a React
// delegate handler; expo-updates creates the root view controller through those handlers, not this delegate.

// Small-screen ModalWrappers are opaque fullscreen RN Modals on a light background, but RN's modal controller just
// mirrors the style already showing (light), so give fullscreen presentations dark text. Transparent modals are
// presented over full screen and leave the status bar to RootViewController.
enum ModalStatusBarStyle {
    static func install() {
        let selector = #selector(getter: UIViewController.preferredStatusBarStyle)
        guard let modalClass = NSClassFromString("RCTFabricModalHostViewController"),
              let method = class_getInstanceMethod(modalClass, selector) else { return }

        typealias StyleGetter = @convention(c) (AnyObject, Selector) -> UIStatusBarStyle
        let original = unsafeBitCast(method_getImplementation(method), to: StyleGetter.self)
        let replacement: @convention(block) (UIViewController) -> UIStatusBarStyle = { controller in
            controller.modalPresentationStyle == .fullScreen ? .darkContent : original(controller, selector)
        }
        class_replaceMethod(modalClass, selector, imp_implementationWithBlock(replacement),
                            method_getTypeEncoding(method))
    }
}


class ReactNativeDelegate: ExpoReactNativeFactoryDelegate {
    override func sourceURL(for bridge: RCTBridge) -> URL? {
        bridge.bundleURL ?? self.bundleURL()
    }

  override func bundleURL() -> URL? {
          #if DEBUG
          #if targetEnvironment(simulator)
          // Simulator: Metro on the host, reachable via localhost
          return RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
          #else

          // ============================================
          // MANUALLY TOGGLE ONE OF THE TWO BLOCKS BELOW
          // ============================================

          // --- HOME (on Wi-Fi, uses dev menu IP) ---
          return RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")

          // --- TRAVELING (USB link-local, no hotspot data) ---
          // Run `ifconfig | grep "inet "` to get the current IP, then uncomment:
          // return URL(string: "http://169.254.149.39:8081/index.bundle?platform=ios&dev=true")

          #endif
          #else
          return Bundle.main.url(forResource: "main", withExtension: "jsbundle")
          #endif
      }
}
