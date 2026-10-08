import SwiftUI

/// Colours mirror `design-tokens.json`; dark variants keep the same warmth.
extension Color {
    init(hex: UInt32) {
        self.init(
            .sRGB,
            red: Double((hex >> 16) & 0xFF) / 255,
            green: Double((hex >> 8) & 0xFF) / 255,
            blue: Double(hex & 0xFF) / 255,
            opacity: 1
        )
    }
}

struct Theme {
    let scheme: ColorScheme
    private var dark: Bool { scheme == .dark }

    var card: Color { Color(hex: dark ? 0x2A2220 : 0xFDF6F2) }
    var border: Color { Color(hex: dark ? 0x4D4340 : 0xEDD5CA) }
    var ink: Color { Color(hex: dark ? 0xFDF6F2 : 0x2A2220) }
    var inkSoft: Color { Color(hex: dark ? 0xEDD5CA : 0x4D4340) }
    var muted: Color { Color(hex: dark ? 0xB8A9A5 : 0x857371) }
    var accent: Color { Color(hex: 0xE8615D) }
    var accentText: Color { Color(hex: dark ? 0xF2918D : 0xC94E4A) }
    var todayBackground: Color { Color(hex: dark ? 0xD9534F : 0xE8615D) }
    var roseSoft: Color { Color(hex: dark ? 0x5A3340 : 0xFCE3E8) }
    var roseDeep: Color { Color(hex: dark ? 0xF4C0D1 : 0x993556) }
    var amberSoft: Color { Color(hex: dark ? 0x4A3A20 : 0xFDEBD0) }
    var amberDeep: Color { Color(hex: dark ? 0xFAC775 : 0x854F0B) }

    func avatarFill(anniversary: Bool) -> Color { anniversary ? amberSoft : roseSoft }
    func avatarInk(anniversary: Bool) -> Color { anniversary ? amberDeep : roseDeep }
}

extension View {
    /// iOS 17 requires `containerBackground`; iOS 16 takes a plain background.
    @ViewBuilder
    func widgetSurface(_ color: Color) -> some View {
        if #available(iOS 17.0, *) {
            containerBackground(color, for: .widget)
        } else {
            padding(14).background(color)
        }
    }
}

struct Avatar: View {
    let text: String
    let anniversary: Bool
    var size: CGFloat = 30
    @Environment(\.colorScheme) private var scheme

    var body: some View {
        let theme = Theme(scheme: scheme)
        Text(text)
            .font(.system(size: size * 0.42, weight: .bold, design: .rounded))
            .foregroundColor(theme.avatarInk(anniversary: anniversary))
            .frame(width: size, height: size)
            .background(Circle().fill(theme.avatarFill(anniversary: anniversary)))
    }
}

extension View {
    /// Lock-screen widgets draw no card, but iOS 17 still wants a container background.
    @ViewBuilder
    func accessorySurface() -> some View {
        if #available(iOS 17.0, *) {
            containerBackground(for: .widget) { Color.clear }
        } else {
            self
        }
    }
}
