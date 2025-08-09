import TenantHeroSection from "@/components/public/tenant-hero-section";

const LandingPage = ({ params }: { params: { tenantSlug: string } }) => {
  const { tenantSlug } = params;

  // Example of how you would dynamically get colors, in a real app this
  // would likely come from a database or a configuration file.
  const themeColors: Record<string, { primary: string; secondary: string }> = {
  eubago: { primary: 'indigo', secondary: 'orange' },
  eubabuk: { primary: 'emerald', secondary: 'yellow' },
  lifnoki: { primary: 'orange', secondary: 'indigo' },
  default: { primary: 'emerald', secondary: 'gray' }
};
  const { primary, secondary } = themeColors[tenantSlug] || themeColors.default;
  return (
    <div>
      {/* You can have other components here */}
      <TenantHeroSection
        tenantSlug={tenantSlug}
        primaryColor={primary}
        secondaryColor={secondary}
      />
      {/* And more components below */}
    </div>
  );
};

export default LandingPage;
