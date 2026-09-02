import { LandingHero } from '@/components/LandingHero';
import { LandingAppShowcase } from '@/components/LandingAppShowcase';
import {
  LandingClosingCta,
  LandingFeatures,
  LandingHowItWorks,
  LandingOccasions,
  LandingRecipientCta,
  LandingTrustStrip,
  LandingVaultVignette,
} from '@/components/LandingSections';

export default function LandingPage() {
  return (
    <>
      <LandingHero />
      <LandingTrustStrip />
      <LandingAppShowcase />
      <LandingOccasions />
      <LandingHowItWorks />
      <LandingFeatures />
      <LandingVaultVignette />
      <LandingRecipientCta />
      <LandingClosingCta />
    </>
  );
}
