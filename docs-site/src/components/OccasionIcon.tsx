type Props = {
  templateType: string;
  className?: string;
};

/** Minimal line icons — matches editorial card mock above the greeting. */
export function OccasionIcon({ templateType, className = '' }: Props) {
  const shared = `${className}`.trim();

  switch (templateType) {
    case 'birthday':
      return (
        <svg
          className={shared}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M5 14c0-2 1.5-4 3.5-4.5" />
          <path d="M19 14c0-2-1.5-4-3.5-4.5" />
          <path d="M12 4v3" />
          <path d="M9.5 7.5 12 10l2.5-2.5" />
          <rect x="7" y="13" width="10" height="7" rx="1.5" />
          <path d="M9 16h6" />
        </svg>
      );
    case 'anniversary':
      return (
        <svg className={shared} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
          <path d="M12 20c-3.5-2.5-6-5.2-6-8.5a4 4 0 0 1 7-2.5 4 4 0 0 1 7 2.5c0 3.3-2.5 6-6 8.5Z" />
        </svg>
      );
    case 'mothers_day':
    case 'fathers_day':
      return (
        <svg className={shared} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
        </svg>
      );
    case 'thank_you':
      return (
        <svg className={shared} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M12 21V11" />
          <path d="M12 11c0-4 3-6 7-6 0 4-3 6-7 6Z" />
          <path d="M12 16c0-3-2.5-5-6-5 0 3 2.5 5 6 5Z" />
        </svg>
      );
    case 'congratulations':
      return (
        <svg className={shared} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="m12 3 2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.5l-5.4 3 1.2-6L3.3 9.3l6.1-.7Z" />
        </svg>
      );
    case 'just_because':
      return (
        <svg className={shared} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M12 3c.6 4.4 2.6 6.4 7 7-4.4.6-6.4 2.6-7 7-.6-4.4-2.6-6.4-7-7 4.4-.6 6.4-2.6 7-7Z" />
        </svg>
      );
    case 'proposal':
      return (
        <svg className={shared} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
          <path d="M12 21 4 9.5a5.5 5.5 0 0 1 9.8-3.5A5.5 5.5 0 0 1 20 9.5Z" />
        </svg>
      );
    case 'sorry':
      return (
        <svg className={shared} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
          <path d="M12 3c-4 4-7 7.5-7 11a7 7 0 0 0 14 0c0-3.5-3-7-7-11Z" />
        </svg>
      );
    default:
      return (
        <svg className={shared} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
          <path d="M12 3 4 9v10a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V9Z" />
          <path d="M9 14h6" />
        </svg>
      );
  }
}
