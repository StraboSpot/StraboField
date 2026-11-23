import UIKit

// The status bar is view-controller-based (UIViewControllerBasedStatusBarAppearance = YES): under the UIScene
// lifecycle the app-wide UIApplication calls behind RN's <StatusBar> have no effect. iPhone shows light text over
// the app's black safe area; iPad keeps it hidden.
public class RootViewController: UIViewController {
  public override var preferredStatusBarStyle: UIStatusBarStyle { .darkContent }
  public override var prefersStatusBarHidden: Bool { UIDevice.current.userInterfaceIdiom == .pad }

  // react-native-screens swizzles UIViewController to defer these to its screen controllers, which default to
  // dark text in light mode (invisible on black). Keep the decision here.
  public override var childForStatusBarStyle: UIViewController? { nil }
  public override var childForStatusBarHidden: UIViewController? { nil }
}
