#!/usr/bin/env python3
"""
Where the bytes of an Android APK are, by area, and what one phone would download.

    python3 scripts/size/apk_report.py android/app/build/outputs/apk/release/app-release.apk
    python3 scripts/size/apk_report.py new.apk old.apk      # adds a "before" column

Build it first (offline once Gradle has cached everything):
    cd android && ./gradlew --offline assembleRelease bundleRelease

Sizes are the compressed size inside the APK. "One phone" is the base plus that phone's own CPU
type, which is what Google Play sends from the bundle; the universal APK carries every CPU type.
"""
import collections
import sys
import zipfile


def areas(path):
    sizes = collections.Counter()
    with zipfile.ZipFile(path) as apk:
        for entry in apk.infolist():
            name = entry.filename
            if name.startswith('lib/'):
                area = 'lib/' + name.split('/')[1]
            elif name.startswith('classes') and name.endswith('.dex'):
                area = 'dex (Java code)'
            elif name.startswith('res/') and name.rsplit('.', 1)[-1] in ('mp3', 'wav', 'm4a', 'ogg'):
                area = 'sounds'
            elif name.startswith('res/'):
                area = 'res (other)'
            elif name.startswith('assets/'):
                area = 'assets (JS bundle)'
            elif name == 'resources.arsc':
                area = 'resources.arsc'
            else:
                area = 'other'
            sizes[area] += entry.compress_size
    return sizes


def mb(value):
    return value / 1048576


def one_phone(sizes, abi):
    return sum(v for k, v in sizes.items() if not k.startswith('lib/') or k == 'lib/' + abi)


def main(argv):
    if len(argv) < 2:
        print(__doc__)
        return 1
    after = areas(argv[1])
    before = areas(argv[2]) if len(argv) > 2 else None
    keys = sorted(set(after) | set(before or {}), key=lambda k: -max(after.get(k, 0), (before or {}).get(k, 0)))
    head = f'{"area":22s} {"MB":>8s}' + (f' {"before":>8s}' if before else '')
    print(head)
    for key in keys:
        row = f'{key:22s} {mb(after.get(key, 0)):8.2f}'
        if before:
            row += f' {mb(before.get(key, 0)):8.2f}'
        print(row)
    total = f'{"TOTAL (universal APK)":22s} {mb(sum(after.values())):8.2f}'
    if before:
        total += f' {mb(sum(before.values())):8.2f}'
    print(total)
    print()
    for label, abi in (('arm64 phone', 'arm64-v8a'), ('32-bit ARM phone', 'armeabi-v7a')):
        row = f'{label:22s} {mb(one_phone(after, abi)):8.1f}'
        if before:
            row += f' {mb(one_phone(before, abi)):8.1f}'
        print(row + '  MB download, estimated')
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv))
