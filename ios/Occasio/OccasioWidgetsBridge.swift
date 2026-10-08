import Foundation
import WidgetKit
import React

/// JS → widgets. Stores the snapshot in the App Group the widget extension
/// reads, then asks WidgetKit to redraw. Registered to JS as `OccasioWidgets`.
@objc(OccasioWidgets)
final class OccasioWidgetsModule: NSObject {
  private static let appGroup = "group.com.occasio.ios"
  private static let key = "snapshot.v1"

  @objc static func requiresMainQueueSetup() -> Bool { false }

  private func sharedDefaults(_ reject: RCTPromiseRejectBlock) -> UserDefaults? {
    // Without the App Group entitlement (not yet enabled in the Apple Developer
    // portal) UserDefaults silently falls back to private storage the widgets
    // cannot see — so fail loudly instead.
    guard
      FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: Self.appGroup) != nil,
      let defaults = UserDefaults(suiteName: Self.appGroup)
    else {
      reject("E_WIDGETS", "App Group \(Self.appGroup) is not available for this build.", nil)
      return nil
    }
    return defaults
  }

  @objc(setSnapshot:resolver:rejecter:)
  func setSnapshot(
    _ json: String,
    resolver resolve: RCTPromiseResolveBlock,
    rejecter reject: RCTPromiseRejectBlock
  ) {
    guard let defaults = sharedDefaults(reject) else { return }
    defaults.set(json, forKey: Self.key)
    WidgetCenter.shared.reloadAllTimelines()
    resolve(nil)
  }

  @objc(clear:rejecter:)
  func clear(
    _ resolve: RCTPromiseResolveBlock,
    rejecter reject: RCTPromiseRejectBlock
  ) {
    guard let defaults = sharedDefaults(reject) else { return }
    defaults.removeObject(forKey: Self.key)
    WidgetCenter.shared.reloadAllTimelines()
    resolve(nil)
  }
}
