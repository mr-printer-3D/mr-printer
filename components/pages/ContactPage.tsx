"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, MessageCircle, Upload, Send, Code2 } from "lucide-react";
import { Section, SectionHeader } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { BRAND } from "@/lib/constants";

export function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <>
      <section className="relative flex min-h-[50vh] items-center justify-center bg-brand-black px-6 pt-32 pb-12 md:px-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <span className="mb-4 block text-sm font-medium uppercase tracking-[0.2em] text-brand-gold">
            Contact
          </span>
          <h1 className="font-heading text-5xl font-bold text-white md:text-7xl">
            Let&apos;s Talk
          </h1>
          <p className="mt-6 max-w-xl text-lg text-white/50 mx-auto">
            Tell us about your project and we&apos;ll get back to you within 24 hours.
          </p>
        </motion.div>
      </section>

      <Section>
        <div className="grid gap-16 lg:grid-cols-5">
          {/* Contact info */}
          <div className="lg:col-span-2">
            <SectionHeader label="Get in Touch" title="We'd Love to Hear From You" />
            <div className="space-y-6">
              {[
                { icon: Mail, label: "Email", value: BRAND.email, href: `mailto:${BRAND.email}` },
                { icon: Phone, label: "Phone", value: BRAND.phone, href: `tel:${BRAND.phone}` },
                {
                  icon: MessageCircle,
                  label: "WhatsApp",
                  value: "Chat with us",
                  href: `https://wa.me/${BRAND.whatsapp.replace(/\D/g, "")}`,
                },
                {
                  icon: Code2,
                  label: "GitHub",
                  value: "@mr-printer-3D",
                  href: BRAND.github,
                },
                { icon: MapPin, label: "Address", value: BRAND.address },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-gold/10">
                    <item.icon className="h-5 w-5 text-brand-gold" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-brand-black/50">
                      {item.label}
                    </p>
                    {item.href ? (
                      <a
                        href={item.href}
                        className="font-medium text-brand-black hover:text-brand-gold transition-colors"
                      >
                        {item.value}
                      </a>
                    ) : (
                      <p className="font-medium text-brand-black">{item.value}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-3"
          >
            {submitted ? (
              <div className="flex flex-col items-center justify-center rounded-3xl bg-white p-16 shadow-premium text-center">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-brand-gold/10">
                  <Send className="h-7 w-7 text-brand-gold" />
                </div>
                <h3 className="font-heading text-2xl font-bold text-brand-black">
                  Thank You!
                </h3>
                <p className="mt-3 text-brand-black/60">
                  We&apos;ve received your inquiry and will get back to you within 24
                  hours.
                </p>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="rounded-3xl bg-white p-8 shadow-premium md:p-12 space-y-6"
              >
                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-brand-black">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full rounded-xl border border-brand-black/10 bg-brand-bg px-4 py-3 text-brand-black outline-none transition-colors focus:border-brand-gold"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-brand-black">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      className="w-full rounded-xl border border-brand-black/10 bg-brand-bg px-4 py-3 text-brand-black outline-none transition-colors focus:border-brand-gold"
                      placeholder="john@company.com"
                    />
                  </div>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-brand-black">
                      Phone
                    </label>
                    <input
                      type="tel"
                      className="w-full rounded-xl border border-brand-black/10 bg-brand-bg px-4 py-3 text-brand-black outline-none transition-colors focus:border-brand-gold"
                      placeholder="+91 98765 43210"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-brand-black">
                      Company
                    </label>
                    <input
                      type="text"
                      className="w-full rounded-xl border border-brand-black/10 bg-brand-bg px-4 py-3 text-brand-black outline-none transition-colors focus:border-brand-gold"
                      placeholder="Your Company"
                    />
                  </div>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-brand-black">
                      Quantity
                    </label>
                    <input
                      type="text"
                      className="w-full rounded-xl border border-brand-black/10 bg-brand-bg px-4 py-3 text-brand-black outline-none transition-colors focus:border-brand-gold"
                      placeholder="e.g. 100 pieces"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-brand-black">
                      Budget
                    </label>
                    <input
                      type="text"
                      className="w-full rounded-xl border border-brand-black/10 bg-brand-bg px-4 py-3 text-brand-black outline-none transition-colors focus:border-brand-gold"
                      placeholder="e.g. ₹50,000"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-brand-black">
                    Delivery Date
                  </label>
                  <input
                    type="date"
                    className="w-full rounded-xl border border-brand-black/10 bg-brand-bg px-4 py-3 text-brand-black outline-none transition-colors focus:border-brand-gold"
                  />
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-brand-black">
                      Upload Logo
                    </label>
                    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-brand-black/20 bg-brand-bg px-4 py-6 transition-colors hover:border-brand-gold">
                      <Upload className="h-5 w-5 text-brand-black/40" />
                      <span className="text-sm text-brand-black/50">
                        Choose file or drag & drop
                      </span>
                      <input type="file" accept="image/*" className="hidden" />
                    </label>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-brand-black">
                      Upload Reference Image
                    </label>
                    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-brand-black/20 bg-brand-bg px-4 py-6 transition-colors hover:border-brand-gold">
                      <Upload className="h-5 w-5 text-brand-black/40" />
                      <span className="text-sm text-brand-black/50">
                        Choose file or drag & drop
                      </span>
                      <input type="file" accept="image/*" className="hidden" />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-brand-black">
                    Notes
                  </label>
                  <textarea
                    rows={4}
                    className="w-full resize-none rounded-xl border border-brand-black/10 bg-brand-bg px-4 py-3 text-brand-black outline-none transition-colors focus:border-brand-gold"
                    placeholder="Tell us about your project, design preferences, or any special requirements..."
                  />
                </div>

                <Button type="submit" variant="primary" size="lg" magnetic className="w-full sm:w-auto">
                  Submit Inquiry
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            )}
          </motion.div>
        </div>
      </Section>
    </>
  );
}
