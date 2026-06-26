"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { Section, SectionHeader } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { TESTIMONIALS } from "@/lib/constants";
import { staggerContainer, fadeUp } from "@/lib/animations";

export function Testimonials() {
  return (
    <Section id="testimonials" className="bg-white">
      <SectionHeader
        label="Testimonials"
        title="What Our Clients Say"
        description="Trusted by leading brands and businesses across India."
        align="center"
      />

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="grid gap-6 md:grid-cols-3"
      >
        {TESTIMONIALS.map((testimonial) => (
          <motion.div key={testimonial.author} variants={fadeUp}>
            <Card className="h-full flex flex-col">
              <div className="mb-6 flex gap-1">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 fill-brand-gold text-brand-gold"
                  />
                ))}
              </div>

              <blockquote className="flex-1 text-brand-black/70 leading-relaxed italic">
                &ldquo;{testimonial.quote}&rdquo;
              </blockquote>

              <div className="mt-8 border-t border-brand-black/5 pt-6">
                <p className="font-heading font-bold text-brand-black">
                  {testimonial.author}
                </p>
                <p className="text-sm text-brand-black/50">{testimonial.role}</p>
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </Section>
  );
}
