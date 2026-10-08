import WidgetKit
import SwiftUI

struct UpcomingTimelineEntry: TimelineEntry {
    let date: Date
    let items: [Upcoming]
    /// True for the gallery / placeholder, where sample data stands in.
    let isSample: Bool
}

/// Days-left is computed on the device, so the widget keeps counting down
/// without the app: one entry now and one just after each of the next 14 midnights.
struct UpcomingProvider: TimelineProvider {
    func placeholder(in context: Context) -> UpcomingTimelineEntry {
        sampleEntry()
    }

    func getSnapshot(in context: Context, completion: @escaping (UpcomingTimelineEntry) -> Void) {
        let real = entry(at: Date(), entries: WidgetStore.load())
        completion(context.isPreview && real.items.isEmpty ? sampleEntry() : real)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<UpcomingTimelineEntry>) -> Void) {
        let calendar = Calendar.current
        let now = Date()
        let stored = WidgetStore.load()

        var moments = [now]
        var midnight = calendar.startOfDay(for: now)
        for _ in 0..<14 {
            guard let next = calendar.date(byAdding: .day, value: 1, to: midnight) else { break }
            midnight = next
            moments.append(next.addingTimeInterval(5))
        }

        let entries = moments.map { entry(at: $0, entries: stored) }
        let refresh = moments.last.map { $0.addingTimeInterval(3600) } ?? now.addingTimeInterval(86_400)
        completion(Timeline(entries: entries, policy: .after(refresh)))
    }

    private func entry(at date: Date, entries: [WidgetEntryData]) -> UpcomingTimelineEntry {
        UpcomingTimelineEntry(date: date, items: WidgetCalendar.upcoming(entries, on: date), isSample: false)
    }

    private func sampleEntry() -> UpcomingTimelineEntry {
        let now = Date()
        return UpcomingTimelineEntry(
            date: now,
            items: WidgetCalendar.upcoming(WidgetSample.entries(from: now), on: now),
            isSample: true
        )
    }
}

/// The quick-create widget has nothing to count down.
struct StaticProvider: TimelineProvider {
    struct Entry: TimelineEntry { let date: Date }

    func placeholder(in context: Context) -> Entry { Entry(date: Date()) }
    func getSnapshot(in context: Context, completion: @escaping (Entry) -> Void) { completion(Entry(date: Date())) }
    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> Void) {
        completion(Timeline(entries: [Entry(date: Date())], policy: .never))
    }
}
