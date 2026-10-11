import { LandingHero } from '@/components/LandingHero';
import { LandingAppShowcase } from '@/components/LandingAppShowcase';
import { LandingFrames } from '@/components/LandingFrames';
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
      <LandingOccasions />
      <LandingFrames />
      <LandingAppShowcase />
      <LandingHowItWorks />
      <LandingFeatures />
      <LandingVaultVignette />
      <LandingRecipientCta />
      <LandingClosingCta />
    </>
  );
}
