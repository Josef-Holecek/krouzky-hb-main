import { Search, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, MapPin, Award } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const HeroSection = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const stats = [
    { icon: Users, label: "kroužků", value: "50+" },
    { icon: MapPin, label: "Havlíčkův Brod", value: "" },
    { icon: Award, label: "trenérů", value: "30+" },
  ];

  return (
    <section className="hero-gradient py-16 md:py-24">
      <div className="container">
        <div className="max-w-3xl mx-auto text-center">
          {/* Main Heading */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-brand-navy mb-4 animate-fade-in">
            Najděte ten pravý kroužek pro vás
          </h1>

          {/* Subheading */}
          <p className="text-xl md:text-2xl font-semibold text-gradient mb-4">
            V Havlíčkově Brodě
          </p>

          <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
            Všechny volnočasové aktivity pro děti i dospělé na jednom místě. 
            Sport, hudba, jazyky, technika a mnoho dalšího.
          </p>

          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Hledat"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 bg-card border-border"
              />
            </div>
            <Button size="lg" className="h-12" asChild>
              <Link href="/krouzky">
                Zobrazit kroužky
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-6 md:gap-10">
            {stats.map((stat, index) => (
              <div key={index} className="flex items-center gap-2 text-muted-foreground">
                <stat.icon className="h-5 w-5" />
                <span className="font-semibold text-foreground">{stat.value}</span>
                <span>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
