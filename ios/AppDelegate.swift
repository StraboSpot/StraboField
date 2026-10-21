import UIKit
import OrientationDirector

@main class AppDelegate: UIResponder, UIApplicationDelegate {
    var reactNativeDelegate: ReactNativeDelegate?
    var reactNativeFactory: RCTReactNativeFactory?

    func application(_ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil) -> Bool {

        let delegate = ReactNativeDelegate()
        let factory = RCTReactNativeFactory(delegate: delegate)
        delegate.dependencyProvider = RCTAppDependencyProvider()

        reactNativeDelegate = delegate
        reactNativeFactory = factory

        ModalStatusBarStyle.install()

        // The window and React Native root are created in SceneDelegate

        return true
    }

    func application(_ application: UIApplication, supportedInterfaceOrientationsFor window: UIWindow?) -> UIInterfaceOrientationMask {
        return SharedOrientationDirectorImpl.shared.supportedInterfaceOrientations
    }
}


// The status bar is view-controller-based (UIViewControllerBasedStatusBarAppearance = YES): under the UIScene
// lifecycle the app-wide UIApplication calls behind RN's <StatusBar> have no effect. iPhone shows light text over
// the app's black safe area; iPad keeps it hidden.
class RootViewController: UIViewController {
    override var preferredStatusBarStyle: UIStatusBarStyle { .darkContent }
    override var prefersStatusBarHidden: Bool { UIDevice.current.userInterfaceIdiom == .pad }

    // react-native-screens swizzles UIViewController to defer these to its screen controllers, which default to
    // dark text in light mode (invisible on black). Keep the decision here.
    override var childForStatusBarStyle: UIViewController? { nil }
    override var childForStatusBarHidden: UIViewController? { nil }
}

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


class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
    override func createRootViewController() -> UIViewController {
        RootViewController()
    }

    override func sourceURL(for bridge: RCTBridge) -> URL? {
        self.bundleURL()
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
