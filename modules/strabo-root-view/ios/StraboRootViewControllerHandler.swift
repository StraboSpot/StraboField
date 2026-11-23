import ExpoModulesCore

// expo-updates builds the window's root view controller through ExpoReactDelegate once it has picked a bundle, and
// that path only asks the registered handlers (falling back to ExpoRootViewController), never the app's factory
// delegate. Registering this handler keeps RootViewController in charge of the status bar after an update launches.
public final class StraboRootViewControllerHandler: ExpoReactDelegateHandler {
  public override func createRootViewController() -> UIViewController? {
    RootViewController()
  }
}
