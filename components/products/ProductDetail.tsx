"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Feather,
  Shield,
  Droplets,
  Palette,
  Printer,
  Gift,
  Heart,
  Ruler,
} from "lucide-react";
import { Section } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import type { CatalogProduct } from "@/types";
import { fadeUp, staggerContainer } from "@/lib/animations";
import { BRAND } from "@/lib/constants";

interface ProductDetailProps {
  product: CatalogProduct;
}

export function ProductDetail({ product }: ProductDetailProps) {
  const [activeImage, setActiveImage] = useState(0);

  return (
    <>
      {/* Hero */}
      <section className="relative bg-[#A8D8F0] px-6 pt-32 pb-16 md:px-12 lg:px-20">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="mb-4 block text-sm font-medium uppercase tracking-[0.2em] text-brand-black/60">
              {product.category.replace(/-/g, " ")}
            </span>
            <h1 className="font-heading text-4xl font-bold text-brand-black md:text-6xl">
              {product.name}
            </h1>
            <p className="mt-4 text-xl text-brand-black/70">{product.tagline}</p>
            <p className="mt-6 text-lg leading-relaxed text-brand-black/60">
              {product.description}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              {product.highlights.slice(0, 4).map((item) => (
                <span
                  key={item}
                  className="rounded-full bg-white/70 px-4 py-2 text-sm font-medium text-brand-black backdrop-blur-sm"
                >
                  {item}
                </span>
              ))}
            </div>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Button href="/contact" variant="primary" size="lg" magnetic>
                Order Now
              </Button>
              <Button
                href={`https://wa.me/${BRAND.whatsapp.replace(/\D/g, "")}?text=Hi! I'm interested in the ${product.name}`}
                variant="outline"
                size="lg"
                magnetic
                external
              >
                WhatsApp Us
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative aspect-square overflow-hidden rounded-3xl shadow-premium-lg"
          >
            <Image
              src={product.images[activeImage].src}
              alt={product.images[activeImage].alt}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </motion.div>
        </div>

        {/* Thumbnail strip */}
        <div className="mx-auto mt-8 flex max-w-7xl gap-3 overflow-x-auto pb-2">
          {product.images.map((image, index) => (
            <button
              key={image.src}
              onClick={() => setActiveImage(index)}
              className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 transition-all ${
                activeImage === index
                  ? "border-brand-black scale-105"
                  : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                className="object-cover"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      </section>

      {/* Features */}
      <Section className="bg-white">
        <div className="text-center mb-16">
          <span className="text-sm font-medium uppercase tracking-[0.2em] text-brand-gold">
            Features
          </span>
          <h2 className="mt-4 font-heading text-4xl font-bold text-brand-black md:text-5xl">
            Why You&apos;ll Love It
          </h2>
        </div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {product.features.map((feature, index) => {
            const icons = [Printer, Feather, Droplets, Shield, Palette];
            const Icon = icons[index % icons.length];
            return (
              <motion.div
                key={feature.title}
                variants={fadeUp}
                className="rounded-3xl bg-brand-bg p-8 shadow-premium"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-gold/10">
                  <Icon className="h-6 w-6 text-brand-gold" />
                </div>
                <h3 className="font-heading text-xl font-bold text-brand-black mb-3">
                  {feature.title}
                </h3>
                <p className="text-brand-black/60 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </motion.div>
      </Section>

      {/* Gallery showcase */}
      <Section>
        <div className="grid gap-6 md:grid-cols-2">
          {product.images.slice(1, 5).map((image, index) => (
            <motion.div
              key={image.src}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
              className="relative aspect-[4/3] overflow-hidden rounded-3xl shadow-premium"
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </motion.div>
          ))}
        </div>
      </Section>

      {/* Use cases & specs */}
      <Section className="bg-white">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <span className="text-sm font-medium uppercase tracking-[0.2em] text-brand-gold">
              Perfect For
            </span>
            <h2 className="mt-4 font-heading text-3xl font-bold text-brand-black md:text-4xl">
              Every Moment
            </h2>
            <div className="mt-8 flex flex-wrap gap-3">
              {product.useCases.map((useCase) => (
                <span
                  key={useCase}
                  className="rounded-full border border-brand-black/10 bg-brand-bg px-6 py-3 text-sm font-semibold text-brand-black"
                >
                  {useCase}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-brand-bg p-8 shadow-premium">
            <div className="flex items-center gap-3 mb-6">
              <Ruler className="h-6 w-6 text-brand-gold" />
              <h3 className="font-heading text-xl font-bold">Specifications</h3>
            </div>
            <dl className="space-y-4">
              <div className="flex justify-between border-b border-brand-black/5 pb-4">
                <dt className="text-brand-black/60">Height</dt>
                <dd className="font-semibold">{product.dimensions.height}</dd>
              </div>
              <div className="flex justify-between border-b border-brand-black/5 pb-4">
                <dt className="text-brand-black/60">Width</dt>
                <dd className="font-semibold">{product.dimensions.width}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-brand-black/60">Material</dt>
                <dd className="font-semibold">{product.material}</dd>
              </div>
            </dl>
          </div>
        </div>
      </Section>

      {/* How to use */}
      <Section>
        <div className="text-center mb-16">
          <span className="text-sm font-medium uppercase tracking-[0.2em] text-brand-gold">
            Easy To Use
          </span>
          <h2 className="mt-4 font-heading text-4xl font-bold text-brand-black">
            Simple Steps for Everyday Smiles
          </h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {product.steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
              className="rounded-3xl bg-white p-8 shadow-premium"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-gold text-sm font-bold text-brand-black">
                {index + 1}
              </span>
              <h3 className="mt-4 font-heading text-lg font-bold text-brand-black">
                {step.title}
              </h3>
              <p className="mt-2 text-sm text-brand-black/60 leading-relaxed">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* Quality & gift CTA */}
      <section className="grid md:grid-cols-2">
        <div className="relative aspect-square md:aspect-auto md:min-h-[400px]">
          <Image
            src="/products/happy-cloud-charm-keychain/quality.png"
            alt="Quality details"
            fill
            className="object-cover"
            sizes="50vw"
          />
        </div>
        <div className="relative aspect-square md:aspect-auto md:min-h-[400px]">
          <Image
            src="/products/happy-cloud-charm-keychain/gift.png"
            alt="Perfect gift"
            fill
            className="object-cover"
            sizes="50vw"
          />
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-brand-black py-24 text-center px-6">
        <Heart className="mx-auto h-8 w-8 text-brand-gold mb-6" />
        <h2 className="font-heading text-3xl font-bold text-white md:text-4xl">
          {product.tagline}
        </h2>
        <p className="mt-4 text-white/50 max-w-md mx-auto">
          Order your Happy Cloud Charm today and spread a little happiness
          everywhere you go.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button href="/contact" variant="gold" size="lg" magnetic>
            <Gift className="h-4 w-4" />
            Place Order
          </Button>
          <Button
            href="https://www.instagram.com/mr_printer.in/"
            variant="outline"
            size="lg"
            external
            className="border-white/20 text-white hover:bg-white hover:text-brand-black"
          >
            View on Instagram
          </Button>
        </div>
      </section>
    </>
  );
}
