import Image from 'next/image';

type Props = {
  src: string;
  alt: string;
  priority?: boolean;
  className?: string;
  variant?: 'default' | 'hero' | 'showcase';
};

/** Device frame for real app screenshots on the landing page. */
export function LandingPhoneFrame({
  src,
  alt,
  priority = false,
  className = '',
  variant = 'default',
}: Props) {
  const variantClass =
    variant === 'hero'
      ? 'landing-phone--hero'
      : variant === 'showcase'
        ? 'landing-phone--showcase'
        : '';

  return (
    <div className={`landing-phone ${variantClass} ${className}`.trim()}>
      <div className="landing-phone-side landing-phone-side--left" aria-hidden />
      <div className="landing-phone-side landing-phone-side--right" aria-hidden />
      <div className="landing-phone-screen">
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          sizes="(max-width: 768px) 260px, 300px"
          className="landing-phone-image"
        />
      </div>
    </div>
  );
}
