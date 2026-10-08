import WidgetKit
import SwiftUI

// MARK: - Next up (small + lock screen)

struct NextUpView: View {
    let entry: UpcomingTimelineEntry
    @Environment(\.widgetFamily) private var family
    @Environment(\.colorScheme) private var scheme

    var body: some View {
        switch family {
        case .accessoryRectangular: rectangular
        case .accessoryInline: inline
        default: small(Theme(scheme: scheme))
        }
    }

    @ViewBuilder
    private func small(_ theme: Theme) -> some View {
        if let next = entry.items.first {
            let today = next.days == 0
            let primary = today ? Color.white : theme.ink
            let secondary = today ? Color(hex: 0xFDF6F2) : theme.muted
            VStack(alignment: .leading, spacing: 0) {
                HStack(spacing: 8) {
                    Avatar(text: next.initial, anniversary: next.isAnniversary)
                    Text("\(next.entry.label) · \(next.kindText)")
                        .font(.system(size: 12))
                        .foregroundColor(primary)
                        .lineLimit(2)
                }
                Spacer(minLength: 4)
                Text(next.daysText)
                    .font(.system(size: 30, weight: .bold, design: .rounded))
                    .minimumScaleFactor(0.6)
                    .lineLimit(1)
                    .foregroundColor(primary)
                Text(today && next.entry.autoSend ? "Auto-send is on" : next.dateText)
                    .font(.system(size: 12))
                    .foregroundColor(secondary)
                    .lineLimit(1)
                Text("Make a card →")
                    .font(.system(size: 12, weight: .bold))
                    .foregroundColor(today ? .white : theme.accentText)
                    .padding(.top, 8)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
            .widgetSurface(today ? theme.todayBackground : theme.card)
            .widgetURL(WidgetLinks.card(for: next))
        } else {
            VStack(alignment: .leading, spacing: 8) {
                Avatar(text: "+", anniversary: false)
                Text("Add someone you love")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundColor(theme.ink)
                Text("Save their birthday once. We'll keep count.")
                    .font(.system(size: 12))
                    .foregroundColor(theme.muted)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
            .widgetSurface(theme.card)
            .widgetURL(WidgetLinks.addPerson)
        }
    }

    @ViewBuilder
    private var rectangular: some View {
        if let next = entry.items.first {
            HStack(spacing: 8) {
                Image(systemName: next.isAnniversary ? "heart" : "gift")
                    .font(.title3)
                    .widgetAccentable()
                VStack(alignment: .leading, spacing: 1) {
                    Text("\(next.entry.label) · \(next.daysShort)")
                        .font(.headline)
                        .lineLimit(1)
                    Text("\(next.kindText), \(next.dateText)")
                        .font(.caption)
                        .lineLimit(1)
                }
                Spacer(minLength: 0)
            }
            .accessorySurface()
            .widgetURL(WidgetLinks.card(for: next))
        } else {
            HStack(spacing: 8) {
                Image(systemName: "plus.circle").font(.title3).widgetAccentable()
                Text("Add someone you love").font(.headline).lineLimit(2)
                Spacer(minLength: 0)
            }
            .accessorySurface()
            .widgetURL(WidgetLinks.addPerson)
        }
    }

    @ViewBuilder
    private var inline: some View {
        if let next = entry.items.first {
            Label("\(next.entry.label) · \(next.daysShort)", systemImage: next.isAnniversary ? "heart" : "gift")
                .widgetURL(WidgetLinks.card(for: next))
        } else {
            Label("Add someone you love", systemImage: "plus.circle")
                .widgetURL(WidgetLinks.addPerson)
        }
    }
}

// MARK: - Coming up (medium)

struct ComingUpView: View {
    let entry: UpcomingTimelineEntry
    @Environment(\.colorScheme) private var scheme

    var body: some View {
        let theme = Theme(scheme: scheme)
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text("Coming up")
                    .font(.system(size: 13, weight: .bold))
                    .foregroundColor(theme.ink)
                Spacer()
                Link(destination: WidgetLinks.quickCreate) {
                    Text("+ Quick wish")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundColor(.white)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 4)
                        .background(Capsule().fill(theme.accent))
                }
            }

            if entry.items.isEmpty {
                Link(destination: WidgetLinks.addPerson) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Add someone you love")
                            .font(.system(size: 14, weight: .bold))
                            .foregroundColor(theme.ink)
                        Text("Save their birthday once. We'll keep count.")
                            .font(.system(size: 12))
                            .foregroundColor(theme.muted)
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
                }
            } else {
                VStack(spacing: 0) {
                    ForEach(Array(entry.items.prefix(3))) { item in
                        Link(destination: WidgetLinks.card(for: item)) {
                            HStack(spacing: 10) {
                                Avatar(text: item.initial, anniversary: item.isAnniversary, size: 24)
                                Text("\(item.entry.label) · \(item.kindText)")
                                    .font(.system(size: 13))
                                    .foregroundColor(theme.ink)
                                    .lineLimit(1)
                                Spacer(minLength: 4)
                                Text(item.daysText)
                                    .font(.system(size: 13, weight: .bold))
                                    .foregroundColor(item.days <= 7 ? theme.accentText : theme.inkSoft)
                                    .lineLimit(1)
                            }
                            .frame(maxHeight: .infinity)
                        }
                    }
                }
                .frame(maxHeight: .infinity)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .widgetSurface(theme.card)
    }
}

// MARK: - Quick create (small)

struct QuickCreateView: View {
    @Environment(\.colorScheme) private var scheme

    var body: some View {
        let theme = Theme(scheme: scheme)
        VStack(alignment: .leading, spacing: 0) {
            Avatar(text: "+", anniversary: false)
            Spacer(minLength: 4)
            Text("Make a card")
                .font(.system(size: 17, weight: .bold, design: .rounded))
                .foregroundColor(.white)
            Text("Just a few taps")
                .font(.system(size: 12))
                .foregroundColor(Color(hex: 0xFDF6F2))
                .padding(.top, 2)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .widgetSurface(theme.todayBackground)
        .widgetURL(WidgetLinks.quickCreate)
    }
}
