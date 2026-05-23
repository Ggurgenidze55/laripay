'use client';

import { useEffect } from 'react';
import { registerGsap, ScrollTrigger } from '@/lib/gsap-client';
import { useLandingPerformance } from '@/hooks/use-landing-performance';
import { ScrollProgress } from './scroll-progress';
import { HeroSection } from './hero-section';
import { InfrastructureScroll } from './infrastructure-scroll';
import { DeveloperExperience } from './developer-experience';
import { PaymentInfrastructure } from './payment-infrastructure';
import { PaymentChannelsSection } from './payment-channels-section';
import { CommerceStackSection } from './commerce-stack-section';
import { PlatformTeaserSection } from './platform-teaser-section';
import { DashboardPreviewScroll } from './dashboard-preview-scroll';
import { AnalyticsSection } from './analytics-section';
import { WebhookSystem } from './webhook-system';
import { IntegrationsSection } from './integrations-section';
import { SecuritySection } from './security-section';
import { EnterpriseFooter } from './enterprise-footer';

export function LandingExperience() {
  const { lite, ready } = useLandingPerformance();

  useEffect(() => {
    if (!ready || lite) return;
    registerGsap();
    const t = setTimeout(() => ScrollTrigger.refresh(), 400);
    const onResize = () => ScrollTrigger.refresh();
    window.addEventListener('resize', onResize);
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', onResize);
    };
  }, [lite, ready]);

  return (
    <>
      <ScrollProgress />
      <div className="relative overflow-x-hidden">
        <HeroSection />
        <InfrastructureScroll />
        <DeveloperExperience />
        <PaymentInfrastructure />
        <PaymentChannelsSection />
        <CommerceStackSection />
        <PlatformTeaserSection />
        <DashboardPreviewScroll />
        <AnalyticsSection />
        <WebhookSystem />
        <IntegrationsSection />
        <SecuritySection />
        <EnterpriseFooter />
      </div>
    </>
  );
}
