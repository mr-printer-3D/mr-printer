import Link from "next/link";
import Image from "next/image";
import { Mail, Phone, MapPin, MessageCircle, Share2, Code2 } from "lucide-react";
import { BRAND, NAV_LINKS, SERVICES } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="bg-brand-black text-white">
      <div className="mx-auto max-w-7xl px-6 py-20 md:px-12 lg:px-20">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-3 mb-6">
              <Image
                src="/images/logo.png"
                alt={BRAND.name}
                width={56}
                height={56}
                className="h-14 w-14 rounded-full object-cover"
              />
              <div>
                <p className="font-heading text-xl font-bold">{BRAND.name}</p>
                <p className="text-sm text-brand-gold">{BRAND.tagline}</p>
              </div>
            </Link>
            <p className="text-white/50 text-sm leading-relaxed">
              Premium 3D printing studio crafting world-class custom products,
              corporate gifts, and personalized creations.
            </p>
          </div>

          <div>
            <h4 className="font-heading text-sm font-semibold uppercase tracking-wider text-brand-gold mb-6">
              Navigation
            </h4>
            <ul className="space-y-3">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/60 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-heading text-sm font-semibold uppercase tracking-wider text-brand-gold mb-6">
              Services
            </h4>
            <ul className="space-y-3">
              {SERVICES.slice(0, 6).map((service) => (
                <li key={service}>
                  <span className="text-sm text-white/60">{service}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-heading text-sm font-semibold uppercase tracking-wider text-brand-gold mb-6">
              Contact
            </h4>
            <ul className="space-y-4">
              <li>
                <a
                  href={`mailto:${BRAND.email}`}
                  className="flex items-center gap-3 text-sm text-white/60 hover:text-white transition-colors"
                >
                  <Mail className="h-4 w-4 text-brand-gold shrink-0" />
                  {BRAND.email}
                </a>
              </li>
              <li>
                <a
                  href={`tel:${BRAND.phone}`}
                  className="flex items-center gap-3 text-sm text-white/60 hover:text-white transition-colors"
                >
                  <Phone className="h-4 w-4 text-brand-gold shrink-0" />
                  {BRAND.phone}
                </a>
              </li>
              <li>
                <a
                  href={`https://wa.me/${BRAND.whatsapp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-sm text-white/60 hover:text-white transition-colors"
                >
                  <MessageCircle className="h-4 w-4 text-brand-gold shrink-0" />
                  WhatsApp
                </a>
              </li>
              <li>
                <a
                  href={BRAND.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-sm text-white/60 hover:text-white transition-colors"
                >
                  <Share2 className="h-4 w-4 text-brand-gold shrink-0" />
                  Instagram
                </a>
              </li>
              <li>
                <a
                  href={BRAND.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-sm text-white/60 hover:text-white transition-colors"
                >
                  <Code2 className="h-4 w-4 text-brand-gold shrink-0" />
                  GitHub
                </a>
              </li>
              <li className="flex items-start gap-3 text-sm text-white/60">
                <MapPin className="h-4 w-4 text-brand-gold shrink-0 mt-0.5" />
                {BRAND.address}
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 md:flex-row">
          <p className="text-sm text-white/40">
            &copy; {new Date().getFullYear()} {BRAND.name}. All rights reserved.
          </p>
          <p className="text-sm text-white/40">{BRAND.tagline}</p>
        </div>
      </div>
    </footer>
  );
}
