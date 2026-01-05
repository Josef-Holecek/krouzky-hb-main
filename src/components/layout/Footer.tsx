'use client';

import Link from 'next/link';
import { Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-brand-navy text-white/90">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="inline-block mb-4">
              <span className="text-2xl font-extrabold text-white">
                Kroužky <span className="text-brand-cyan">Vysočina</span>
              </span>
            </Link>
            <p className="text-white/70 max-w-md">
              Centrální katalog volnočasových kroužků a trenérů v Havlíčkově Brodě 
              pro děti i dospělé. Sport, hudba, jazyky, technika a mnoho dalšího.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-white mb-4">Rychlé odkazy</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/krouzky" className="text-white/70 hover:text-white transition-colors">
                  Kroužky
                </Link>
              </li>
              <li>
                <Link href="/treneri" className="text-white/70 hover:text-white transition-colors">
                  Trenéři
                </Link>
              </li>
              <li>
                <Link href="/kategorie" className="text-white/70 hover:text-white transition-colors">
                  Kategorie
                </Link>
              </li>
              <li>
                <Link href="/o-nas" className="text-white/70 hover:text-white transition-colors">
                  O nás
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-white mb-4">Kontakt</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-white/70">
                <MapPin className="h-4 w-4" />
                Havlíčkův Brod, Vysočina
              </li>
              <li className="flex items-center gap-2 text-white/70">
                <Mail className="h-4 w-4" />
                info@krouzky-hb.cz
              </li>
              <li className="flex items-center gap-2 text-white/70">
                <Phone className="h-4 w-4" />
                +420 123 456 789
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-8 pt-8 text-center text-white/50 text-sm">
          <p>© {new Date().getFullYear()} Kroužky Vysočina. Všechna práva vyhrazena.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
