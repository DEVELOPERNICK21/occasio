import WidgetKit
import SwiftUI

struct NextUpWidget: Widget {
    let kind = "OccasioNextUp"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: UpcomingProvider()) { entry in
            NextUpView(entry: entry)
        }
        .configurationDisplayName("Next up")
        .description("The next birthday or anniversary you saved, with a countdown.")
        .supportedFamilies([.systemSmall, .accessoryRectangular, .accessoryInline])
    }
}

struct ComingUpWidget: Widget {
    let kind = "OccasioComingUp"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: UpcomingProvider()) { entry in
            ComingUpView(entry: entry)
        }
        .configurationDisplayName("Coming up")
        .description("Your next few dates, plus a shortcut to make a card.")
        .supportedFamilies([.systemMedium])
    }
}

struct QuickCreateWidget: Widget {
    let kind = "OccasioQuickCreate"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: StaticProvider()) { _ in
            QuickCreateView()
        }
        .configurationDisplayName("Make a card")
        .description("Start a card in one tap.")
        .supportedFamilies([.systemSmall])
    }
}

@main
struct OccasioWidgetBundle: WidgetBundle {
    var body: some Widget {
        NextUpWidget()
        ComingUpWidget()
        QuickCreateWidget()
    }
}
