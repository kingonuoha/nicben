import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EyebrowChip } from "@/components/ui/EyebrowChip";
import { CornerArrowButton } from "@/components/ui/CornerArrowButton";
import { SectionWrapper } from "@/components/ui/SectionWrapper";

export const metadata: Metadata = {
  title: "Styleguide | NICBEN",
  robots: {
    index: false,
    follow: false,
  },
};

export default function StyleguidePage() {
  return (
    <main className="min-h-screen py-12">
      <SectionWrapper background="surface" className="border-b border-line">
        <EyebrowChip dotColor="teal">Design System Reference</EyebrowChip>
        <h1 className="text-4xl md:text-5xl font-bold mt-4 heading-spark">
          NICBEN Token & Component Styleguide
        </h1>
        <p className="text-text-600 mt-2 max-w-2xl">
          Visual test harness verifying typography, design tokens, heading spark accent, and core UI primitives.
        </p>
      </SectionWrapper>

      {/* Typography & Spark Section */}
      <SectionWrapper background="tint-50">
        <h2 className="text-2xl font-bold text-ink-950 mb-6 pb-2 border-b border-line">
          1. Typography & Spark Accent (`quito3.png`)
        </h2>
        <div className="space-y-6 bg-surface p-8 rounded-2xl border border-line">
          <div>
            <span className="text-xs text-text-600 block mb-1">Display Heading with .heading-spark</span>
            <h1 className="text-4xl md:text-6xl font-bold heading-spark">
              Institutional Strength in Texas
            </h1>
          </div>
          <div>
            <span className="text-xs text-text-600 block mb-1">H2 Heading with .heading-spark</span>
            <h2 className="text-3xl font-bold heading-spark">
              Three Disciplines. One Standard.
            </h2>
          </div>
          <div>
            <span className="text-xs text-text-600 block mb-1">H3 Heading</span>
            <h3 className="text-xl font-semibold">
              Corporate Treasury & Capital Deployment
            </h3>
          </div>
          <div>
            <span className="text-xs text-text-600 block mb-1">Body Text & Script Font</span>
            <p className="text-text-600 max-w-xl">
              NICBEN Asset Holdings & Investments operates with disciplined capital allocation across commercial and residential property assets.
            </p>
            <p className="font-script text-2xl text-brand-700 mt-2">
              Building lasting value with Texas integrity.
            </p>
          </div>
        </div>
      </SectionWrapper>

      {/* Buttons */}
      <SectionWrapper background="tint-50">
        <h2 className="text-2xl font-bold text-ink-950 mb-6 pb-2 border-b border-line">
          2. Buttons & Arrows
        </h2>
        <div className="flex flex-wrap gap-4 items-center bg-surface p-8 rounded-2xl border border-line">
          <Button variant="primary" withArrow>
            Request Consultation
          </Button>
          <Button variant="secondary">
            View All Projects
          </Button>
          <Button variant="accent" withArrow>
            Submit Enquiry
          </Button>
          <Button variant="ghost">
            Learn More
          </Button>
          <CornerArrowButton ariaLabel="Corner sample" />
        </div>
      </SectionWrapper>

      {/* Cards & Three Pillars Equal Weight Validation */}
      <SectionWrapper background="tint-50">
        <h2 className="text-2xl font-bold text-ink-950 mb-6 pb-2 border-b border-line">
          3. Cards & Three-Pillar Equal Weight Grid
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card variant="surface" notched notchedCorner="top-right" className="flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <EyebrowChip dotColor="teal">Pillar 01</EyebrowChip>
                <CornerArrowButton ariaLabel="View Pillar 1" size="sm" />
              </div>
              <h3 className="text-xl font-bold mt-4">Project Management & Contracting</h3>
              <p className="text-text-600 text-sm mt-2">
                Turnkey construction oversight, contractor coordination, and capital expenditure execution.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-line text-xs font-semibold text-brand-700">
              COMMERCIAL & RESIDENTIAL
            </div>
          </Card>

          <Card variant="surface" notched notchedCorner="top-right" className="flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <EyebrowChip dotColor="teal">Pillar 02</EyebrowChip>
                <CornerArrowButton ariaLabel="View Pillar 2" size="sm" />
              </div>
              <h3 className="text-xl font-bold mt-4">Property Improvement & Maintenance</h3>
              <p className="text-text-600 text-sm mt-2">
                Asset value preservation, preventative maintenance schedules, and tenant improvement scopes.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-line text-xs font-semibold text-brand-700">
              FACILITY PRESERVATION
            </div>
          </Card>

          <Card variant="surface" notched notchedCorner="top-right" className="flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <EyebrowChip dotColor="sky">Pillar 03</EyebrowChip>
                <CornerArrowButton ariaLabel="View Pillar 3" size="sm" />
              </div>
              <h3 className="text-xl font-bold mt-4">Corporate Treasury & Investments</h3>
              <p className="text-text-600 text-sm mt-2">
                Internal capital allocation, liquidity preservation, and balance-sheet deployment.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-line text-xs font-semibold text-brand-700">
              PROPRIETARY CAPITAL ONLY
            </div>
          </Card>
        </div>
      </SectionWrapper>
    </main>
  );
}
