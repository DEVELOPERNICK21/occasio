/**
 * The architecture rules, run as tests (they also run as `npm run arch:check`):
 *
 *   ui -> application -> domain <- data      inside a feature
 *   src/app  ->  features  ->  shared        between them
 *   features depend on each other only as scripts/architecture/features.json says
 *
 * The second half proves the checker itself catches what it claims to catch, because a rule
 * nobody has seen fail is a rule nobody can trust.
 */
import * as path from 'path';

const { buildGraph, classify, ROOT } = require('../../scripts/architecture/graph');
const { rules, config } = require('../../scripts/architecture/rules');

type Violation = { rule: string; file: string; to: string; message: string };

describe('the app follows the architecture', () => {
  const violations: Violation[] = rules(buildGraph());

  it('has no layering or dependency violations', () => {
    const report = violations.map((v) => `${v.rule}: ${v.file}${v.to ? ` -> ${v.to}` : ''}`);
    expect(report).toEqual([]);
  });

  it('keeps the feature map in features.json honest: every feature on disk is in it, and the reverse', () => {
    const onDisk = new Set<string>(
      buildGraph()
        .filter((node: { info: { area: string } }) => node.info.area === 'feature')
        .map((node: { info: { feature: string } }) => node.info.feature),
    );
    expect([...onDisk].sort()).toEqual(Object.keys(config.features).sort());
  });
});

describe('the checker catches violations', () => {
  const file = (relative: string) => path.join(ROOT, relative);
  const node = (relative: string, imports: Array<{ to?: string; pkg?: string; source?: string }>, source = '') => ({
    file: file(relative),
    info: classify(file(relative)),
    source,
    imports: imports.map((item) => ({
      spec: item.to ?? item.pkg,
      typeOnly: false,
      target: item.to ? { kind: 'file', file: file(item.to) } : { kind: 'package', name: item.pkg, spec: item.pkg },
    })),
  });
  // A tiny graph uses none of the declared dependencies, so "declared but unused" is not what these test.
  const rulesOf = (graph: unknown[]) =>
    (rules(graph) as Violation[]).map((v) => v.rule).filter((rule) => rule !== 'feature-dependency-stale');

  const ui = 'src/features/history/ui/screens/A.tsx';
  const data = 'src/features/history/data/repo.ts';
  const application = 'src/features/history/application/useA.ts';
  const domain = 'src/features/history/domain/rule.ts';

  it('a screen importing a data file', () => {
    expect(rulesOf([node(ui, [{ to: data }]), node(data, [])])).toContain('ui-imports-data');
  });

  it('a screen importing an SDK', () => {
    expect(rulesOf([node(ui, [{ pkg: '@react-native-firebase/firestore' }])])).toContain('ui-imports-sdk');
    expect(rulesOf([node(ui, [{ pkg: 'react-native-purchases' }])])).toContain('ui-imports-sdk');
  });

  it('a hard-coded colour outside the tokens, but not in the tokens or the artwork files', () => {
    expect(rulesOf([node(ui, [], "const s = { color: '#FF0000' };")])).toContain('hard-coded-colour');
    expect(rulesOf([node(ui, [], "const s = { backgroundColor: 'rgba(0,0,0,.4)' };")])).toContain('hard-coded-colour');
    expect(rulesOf([node(ui, [], "const s = { color: colors.ink };")])).not.toContain('hard-coded-colour');
    expect(rulesOf([node('src/shared/theme/tokens.ts', [], "export const c = '#FF0000';")])).not.toContain('hard-coded-colour');
    expect(rulesOf([node('src/shared/ui/Pip.tsx', [], "const body = '#FF8A3D';")])).not.toContain('hard-coded-colour');
  });

  it('a screen calling fetch', () => {
    expect(rulesOf([node(ui, [], 'const r = await fetch(url);')])).toContain('ui-uses-fetch');
    expect(rulesOf([node(ui, [], 'const r = await client.fetch(url);')])).not.toContain('ui-uses-fetch');
  });

  it('a hook importing a screen', () => {
    expect(rulesOf([node(application, [{ to: ui }]), node(ui, [])])).toContain('application-imports-ui');
  });

  it('a repository importing React, UI or a screen library', () => {
    expect(rulesOf([node(data, [{ pkg: 'react' }])])).toContain('data-imports-view');
    expect(rulesOf([node(data, [{ pkg: 'react-native' }])])).toContain('data-imports-view');
    expect(rulesOf([node(data, [{ to: ui }]), node(ui, [])])).toContain('data-imports-view');
    // A device or billing SDK is not a view library.
    expect(rulesOf([node(data, [{ pkg: 'react-native-sound' }])])).not.toContain('data-imports-view');
  });

  it('domain importing a package, a data file, or using any', () => {
    expect(rulesOf([node(domain, [{ pkg: 'react' }])])).toContain('domain-impure');
    expect(rulesOf([node(domain, [{ to: data }]), node(data, [])])).toContain('domain-impure');
    expect(rulesOf([node(domain, [], 'const x: any = 1;')])).toContain('domain-any');
  });

  it('domain importing another feature\'s domain is fine, and a pure shared constant is too', () => {
    const other = 'src/features/create/domain/types.ts';
    expect(rulesOf([node(domain, [{ to: other }]), node(other, [])])).not.toContain('domain-impure');
    const shared = 'src/shared/config/constant.ts';
    expect(rulesOf([node(domain, [{ to: shared }]), node(shared, [])])).not.toContain('domain-impure');
  });

  it('domain importing shared that itself imports a package', () => {
    const shared = 'src/shared/config/impure.ts';
    expect(rulesOf([node(domain, [{ to: shared }]), node(shared, [{ pkg: 'react-native' }])])).toContain('domain-impure');
  });

  it('one feature importing another feature\'s UI or data', () => {
    expect(rulesOf([node(ui, [{ to: 'src/features/vault/ui/components/B.tsx' }]), node('src/features/vault/ui/components/B.tsx', [])])).toContain('feature-imports-foreign-ui');
    expect(rulesOf([node(application, [{ to: 'src/features/vault/data/r.ts' }]), node('src/features/vault/data/r.ts', [])])).toContain('feature-imports-foreign-data');
  });

  it('a dependency between features that features.json does not allow', () => {
    // history may not depend on widgets
    expect(rulesOf([node(application, [{ to: 'src/features/widgets/domain/w.ts' }]), node('src/features/widgets/domain/w.ts', [])])).toContain('feature-dependency-undeclared');
  });

  it('shared importing a feature or the app shell, and a feature importing the app shell', () => {
    expect(rulesOf([node('src/shared/ui/X.tsx', [{ to: 'src/features/history/domain/rule.ts' }]), node(domain, [])])).toContain('shared-imports-feature');
    expect(rulesOf([node('src/shared/ui/X.tsx', [{ to: 'src/app/accountGates.ts' }]), node('src/app/accountGates.ts', [])])).toContain('shared-imports-feature');
    expect(rulesOf([node(application, [{ to: 'src/app/accountGates.ts' }]), node('src/app/accountGates.ts', [])])).toContain('feature-imports-app');
  });

  it('the app shell may import any feature\'s screens, hooks and rules, but not its data layer', () => {
    const shell = 'src/app/navigation/Nav.tsx';
    expect(rulesOf([node(shell, [{ to: ui }, { to: application }, { to: domain }]), node(ui, []), node(application, []), node(domain, [])])).toEqual([]);
    expect(rulesOf([node(shell, [{ to: data }]), node(data, [])])).toContain('app-imports-data');
  });

  it('domain layers of two features importing each other in a loop', () => {
    const a = 'src/features/billing/domain/a.ts';
    const b = 'src/features/auth/domain/b.ts';
    // billing -> auth is declared; auth -> billing is not, and both are a loop
    const found = rulesOf([node(a, [{ to: b }]), node(b, [{ to: a }])]);
    expect(found).toContain('domain-cycle');
  });
});
