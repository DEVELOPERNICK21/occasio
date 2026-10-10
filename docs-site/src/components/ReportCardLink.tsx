import { reportCardMailto } from '@/lib/contact';

/**
 * A card is user-made content shown to someone else, so the person who receives
 * it must have a visible way to flag it (App Store guideline 1.2). Reports go to
 * the published support address and abusive cards are removed on request.
 * Copyright complaints go to the DMCA page, which has the notice procedure.
 */
export function ReportCardLink({ slug }: { slug: string }) {
  return (
    <div className="report-card-links">
      <a className="report-card-link" href={reportCardMailto(slug)}>
        Report this card
      </a>
      <a
        className="report-card-link"
        href={`/dmca?card=${encodeURIComponent(slug)}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        Copyright
      </a>
    </div>
  );
}
