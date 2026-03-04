'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Target, Heart, Dumbbell, Monitor, ArrowRight } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-brand-navy via-brand-navy/95 to-brand-cyan/20 text-white py-20 md:py-28">
        <div className="container text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-6">
            O nás
          </h1>
          <p className="text-lg md:text-xl text-white/80 max-w-3xl mx-auto leading-relaxed">
            Jsme platforma, která spojuje děti, rodiče a trenéry v Havlíčkově Brodě a na Vysočině.
            Pomáháme najít ten správný kroužek pro každého.
          </p>
        </div>
      </section>

      {/* About the Platform */}
      <section className="py-16 md:py-20">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">
              <span className="text-brand-navy">Kroužky</span>{' '}
              <span className="text-gradient">Vysočina</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <Card className="text-center border-none shadow-md">
                <CardContent className="pt-8 pb-6">
                  <div className="mx-auto w-14 h-14 rounded-full bg-brand-cyan/10 flex items-center justify-center mb-4">
                    <Users className="h-7 w-7 text-brand-cyan" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Pro všechny</h3>
                  <p className="text-muted-foreground text-sm">
                    Kroužky pro děti i dospělé — sport, hudba, jazyky, technika a mnoho dalšího.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center border-none shadow-md">
                <CardContent className="pt-8 pb-6">
                  <div className="mx-auto w-14 h-14 rounded-full bg-brand-cyan/10 flex items-center justify-center mb-4">
                    <Target className="h-7 w-7 text-brand-cyan" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Snadné hledání</h3>
                  <p className="text-muted-foreground text-sm">
                    Centrální katalog kroužků a trenérů na jednom místě. Filtrujte podle kategorie, věku nebo lokality.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center border-none shadow-md">
                <CardContent className="pt-8 pb-6">
                  <div className="mx-auto w-14 h-14 rounded-full bg-brand-cyan/10 flex items-center justify-center mb-4">
                    <Heart className="h-7 w-7 text-brand-cyan" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Komunita</h3>
                  <p className="text-muted-foreground text-sm">
                    Propojujeme trenéry s rodinami a budujeme aktivní komunitu na Vysočině.
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="prose prose-lg max-w-none text-muted-foreground">
              <p>
                <strong className="text-foreground">Kroužky Vysočina</strong> je webová platforma vytvořená s cílem
                usnadnit rodičům a dětem v Havlíčkově Brodě a okolí nalezení ideálního volnočasového kroužku.
                Věříme, že každé dítě by mělo mít možnost rozvíjet své talenty a vášně — ať už jde o sport,
                umění, techniku nebo cokoliv jiného.
              </p>
              <p>
                Naším posláním je přehledně soustředit nabídku kroužků a trenérů na jednom místě,
                aby rodiče nemuseli trávit hodiny hledáním po různých webech a sociálních sítích.
                Trenéři zde mohou snadno prezentovat svoji nabídku a oslovit nové zájemce.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* WAFK Section */}
      <section className="py-16 md:py-20 bg-muted/30">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">WAFK Challenge</h2>
              <p className="text-muted-foreground text-lg">
                Workout Away From Keyboard
              </p>
            </div>

            <Card className="border-none shadow-lg overflow-hidden">
              <CardContent className="p-0">
                <div className="bg-gradient-to-r from-brand-navy to-brand-navy/90 p-8 md:p-12 text-white">
                  <div className="flex flex-col md:flex-row gap-8 items-center">
                    <div className="flex-shrink-0">
                      <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
                        <div className="text-center">
                          <Dumbbell className="h-10 w-10 md:h-14 md:w-14 text-brand-cyan mx-auto mb-1" />
                          <span className="text-xs md:text-sm font-bold text-brand-cyan">WAFK</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 text-center md:text-left">
                      <h3 className="text-2xl font-bold mb-4 text-brand-cyan">Co je WAFK Challenge?</h3>
                      <p className="text-white/85 leading-relaxed mb-4">
                        WAFK Challenge je jednodenní přátelská soutěž pro děti, dospělé sportovce i nesportovce.
                        Chceme popularizovat workout mezi širokou veřejnost a ukázat lidem správnou techniku cviků.
                      </p>
                      <p className="text-white/85 leading-relaxed mb-4">
                        <strong className="text-brand-cyan">&quot;Workout Away From Keyboard&quot;</strong> znamená
                        v překladu <em>&quot;Cvičení pryč od klávesnice&quot;</em>.
                      </p>
                      <p className="text-white/85 leading-relaxed">
                        Naší snahou je ukázat lidem, že cvičení (v různých formách) je skvělým komplementem
                        k práci nebo hraní na počítači. Zdravý pohyb a aktivní životní styl jsou důležité
                        pro každého — bez ohledu na věk nebo sportovní zkušenosti.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-8 md:p-12 bg-card">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
                    <div>
                      <div className="mx-auto w-12 h-12 rounded-full bg-brand-cyan/10 flex items-center justify-center mb-3">
                        <Dumbbell className="h-6 w-6 text-brand-cyan" />
                      </div>
                      <h4 className="font-semibold mb-1">Workout pro každého</h4>
                      <p className="text-sm text-muted-foreground">Pro sportovce i úplné začátečníky</p>
                    </div>
                    <div>
                      <div className="mx-auto w-12 h-12 rounded-full bg-brand-cyan/10 flex items-center justify-center mb-3">
                        <Monitor className="h-6 w-6 text-brand-cyan" />
                      </div>
                      <h4 className="font-semibold mb-1">Pryč od obrazovky</h4>
                      <p className="text-sm text-muted-foreground">Zdravý doplněk k digitálnímu životu</p>
                    </div>
                    <div>
                      <div className="mx-auto w-12 h-12 rounded-full bg-brand-cyan/10 flex items-center justify-center mb-3">
                        <Heart className="h-6 w-6 text-brand-cyan" />
                      </div>
                      <h4 className="font-semibold mb-1">Správná technika</h4>
                      <p className="text-sm text-muted-foreground">Naučíme vás cvičit bezpečně a efektivně</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-20">
        <div className="container text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Chcete se zapojit?</h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
            Prohlédněte si nabídku kroužků nebo se zaregistrujte jako trenér a oslovte nové zájemce.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-brand-cyan hover:bg-brand-cyan/90">
              <Link href="/krouzky">
                Prohlédnout kroužky
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/registrace">
                Registrovat se
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
