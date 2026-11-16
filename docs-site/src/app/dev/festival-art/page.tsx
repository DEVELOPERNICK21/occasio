import { notFound } from 'next/navigation';
import { FestivalArt } from '@/components/FestivalArt';
import data from '@/lib/festivalMotifs.json';

export const metadata = { title: 'Festival art (dev)', robots: { index: false } };

/** Every festival drawing, unlit and lit, for checking them by eye. Not available in production. */
export default function FestivalArtGallery() {
  if (process.env.NODE_ENV === 'production') notFound();
  const ids = Object.keys(data.motifs);
  return (
    <main style={{ padding: 16, background: '#FFF8F0', minHeight: '100vh', fontFamily: 'system-ui' }}>
      <h1 style={{ fontSize: 18, margin: '0 0 12px' }}>Festival art: {ids.length} drawings (dark card = unlit, light card = lit)</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
        {ids.map((id) => (
          <figure key={id} style={{ margin: 0, background: '#fff', border: '1px solid #eadfd2', borderRadius: 12, padding: 8 }}>
            <div style={{ display: 'flex', gap: 6 }}>
              <div style={{ width: 64, height: 64, background: '#fff' }}><FestivalArt motif={id} lit={false} size={64} /></div>
              <div style={{ width: 64, height: 64, background: '#fff' }}><FestivalArt motif={id} lit size={64} /></div>
            </div>
            <div style={{ width: 138, height: 138, marginTop: 6 }}><FestivalArt motif={id} size={138} /></div>
            <figcaption style={{ fontSize: 12, marginTop: 4 }}>{id}</figcaption>
          </figure>
        ))}
      </div>
    </main>
  );
}
