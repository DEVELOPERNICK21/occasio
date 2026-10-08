import Foundation

/// Identifiers shared with the app target. Keep in sync with
/// `ios/Occasio/OccasioWidgetsBridge.swift` and `Occasio.entitlements`.
enum WidgetShared {
    static let appGroup = "group.com.occasio.ios"
    static let snapshotKey = "snapshot.v1"
}

/// One upcoming birthday or anniversary, as the app wrote it.
/// Privacy: `label` is a relationship ("Mom"), never a person's name.
struct WidgetEntryData: Codable, Hashable {
    let id: String
    let label: String
    let relationship: String
    let kind: String
    let dates: [String]
    let autoSend: Bool
}

struct WidgetSnapshotData: Codable {
    let v: Int
    let signedIn: Bool
    let entries: [WidgetEntryData]
}

struct Upcoming: Identifiable, Hashable {
    let entry: WidgetEntryData
    let date: Date
    let days: Int

    var id: String { entry.id + "-" + entry.kind }
    var isAnniversary: Bool { entry.kind == "anniversary" }
    var kindText: String { isAnniversary ? "Anniversary" : "Birthday" }
    var initial: String { entry.label.first.map { String($0).uppercased() } ?? "" }

    var daysText: String {
        switch days {
        case 0: return "Today"
        case 1: return "Tomorrow"
        default: return "\(days) days"
        }
    }

    /// Short form for the lock screen: "3d".
    var daysShort: String {
        switch days {
        case 0: return "Today"
        case 1: return "Tmrw"
        default: return "\(days)d"
        }
    }

    var dateText: String {
        date.formatted(.dateTime.weekday(.abbreviated).day().month(.abbreviated))
    }
}

enum WidgetStore {
    /// Empty when nothing is stored, the user signed out, or the data is unreadable.
    static func load() -> [WidgetEntryData] {
        guard
            let defaults = UserDefaults(suiteName: WidgetShared.appGroup),
            let json = defaults.string(forKey: WidgetShared.snapshotKey),
            let data = json.data(using: .utf8),
            let snapshot = try? JSONDecoder().decode(WidgetSnapshotData.self, from: data),
            snapshot.signedIn
        else {
            return []
        }
        return snapshot.entries
    }
}

enum WidgetCalendar {
    /// `yyyy-MM-dd` (a local calendar day) → that day at local midnight.
    static func date(fromISO iso: String, calendar: Calendar = .current) -> Date? {
        let parts = iso.split(separator: "-").compactMap { Int($0) }
        guard parts.count == 3 else { return nil }
        return calendar.date(from: DateComponents(year: parts[0], month: parts[1], day: parts[2]))
    }

    /// Soonest first. Each entry uses its first date that is `day` or later.
    static func upcoming(
        _ entries: [WidgetEntryData],
        on day: Date,
        calendar: Calendar = .current
    ) -> [Upcoming] {
        let today = calendar.startOfDay(for: day)
        return entries
            .compactMap { entry -> Upcoming? in
                for iso in entry.dates {
                    guard let date = date(fromISO: iso, calendar: calendar) else { continue }
                    let days = calendar.dateComponents([.day], from: today, to: date).day ?? -1
                    if days >= 0 { return Upcoming(entry: entry, date: date, days: days) }
                }
                return nil
            }
            .sorted { ($0.days, $0.entry.label) < ($1.days, $1.entry.label) }
    }
}

/// Deep links the widgets open. The contract is
/// `src/features/widgets/domain/widgetLinks.ts`.
enum WidgetLinks {
    static let quickCreate = URL(string: "occasio://create/quick")!
    static let vault = URL(string: "occasio://vault")!
    static let addPerson = URL(string: "occasio://vault/add")!

    static func card(personId: String, kind: String) -> URL {
        var components = URLComponents()
        components.scheme = "occasio"
        components.host = "card"
        components.path = "/new"
        components.queryItems = [
            URLQueryItem(name: "person", value: personId),
            URLQueryItem(name: "occasion", value: kind),
        ]
        return components.url ?? vault
    }

    static func card(for item: Upcoming) -> URL {
        card(personId: item.entry.id, kind: item.entry.kind)
    }
}

/// What the widget gallery and redacted placeholders show.
enum WidgetSample {
    static func entries(from now: Date = Date(), calendar: Calendar = .current) -> [WidgetEntryData] {
        func iso(daysAhead: Int) -> [String] {
            (0..<2).compactMap { year in
                guard
                    let day = calendar.date(byAdding: .day, value: daysAhead, to: calendar.startOfDay(for: now)),
                    let shifted = calendar.date(byAdding: .year, value: year, to: day)
                else { return nil }
                let c = calendar.dateComponents([.year, .month, .day], from: shifted)
                return String(format: "%04d-%02d-%02d", c.year ?? 0, c.month ?? 1, c.day ?? 1)
            }
        }
        return [
            WidgetEntryData(id: "sample-mom", label: "Mom", relationship: "mom", kind: "birthday", dates: iso(daysAhead: 3), autoSend: true),
            WidgetEntryData(id: "sample-partner", label: "Partner", relationship: "partner", kind: "anniversary", dates: iso(daysAhead: 12), autoSend: false),
            WidgetEntryData(id: "sample-dad", label: "Dad", relationship: "dad", kind: "birthday", dates: iso(daysAhead: 41), autoSend: false),
        ]
    }
}
