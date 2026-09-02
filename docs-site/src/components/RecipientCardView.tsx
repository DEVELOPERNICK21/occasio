import Link from 'next/link';
import { WishCard } from '@/components/WishCard';
import type { RecipientCard } from '@/lib/recipientCard';

type Props = {
  card: RecipientCard;
};

export function RecipientCardView({ card }: Props) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--bg)] px-4 py-12">
      <div className="w-full max-w-sm">
        <p className="mb-6 text-center text-xs font-medium tracking-wide text-[var(--accent)]">
          Occasio
        </p>

        <WishCard card={card} />

        {card.isDemo ? (
          <p className="mt-4 text-center text-xs text-[var(--muted)]">
            Preview card — tap Generate link in the app for a real share URL.
          </p>
        ) : null}

        <div className="mt-8 text-center">
          <Link href="/" className="landing-btn-primary">
            Make your own
          </Link>
        </div>
      </div>
    </div>
  );
}
