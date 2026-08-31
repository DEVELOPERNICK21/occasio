import UIKit

/// Pins Dynamic Type to a fixed category so UIKit traitCollection does not
/// propagate the user's accessibility text-size setting into the app.
final class FixedContentSizeWindow: UIWindow {
  private static let lockedCategory = UIContentSizeCategory.large

  override var traitCollection: UITraitCollection {
    UITraitCollection(traitsFrom: [
      super.traitCollection,
      UITraitCollection(preferredContentSizeCategory: Self.lockedCategory),
    ])
  }
}
