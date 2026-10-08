import { reportCardMailto } from '@/lib/contact';

/**
 * A card is user-made content shown to someone else, so the person who receives
 * it must have a visible way to flag it (App Store guideline 1.2). Reports go to
 * the published support address and abusive cards are removed on request.
 */
export function ReportCardLink({ slug }: { slug: string }) {
  return (
    <a className="report-card-link" href={reportCardMailto(slug)}>
      Report this card
    </a>
  );
}
