"use client";

import { Section, SectionHeader } from "@/components/ui/Section";
import { Accordion } from "@/components/ui/Accordion";
import { FAQ_ITEMS } from "@/lib/constants";

export function FAQ() {
  return (
    <Section id="faq">
      <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
        <SectionHeader
          label="FAQ"
          title="Common Questions"
          description="Everything you need to know about our 3D printing services, materials, and process."
        />
        <Accordion items={FAQ_ITEMS} />
      </div>
    </Section>
  );
}
