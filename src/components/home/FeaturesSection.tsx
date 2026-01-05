import { Search, UserCheck, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const FeaturesSection = () => {
  const features = [
    {
      icon: Search,
      title: "Snadné vyhledávání",
      description:
        "Filtrujte kroužky podle věku, kategorie, lokality nebo času. Najděte přesně to, co hledáte.",
    },
    {
      icon: UserCheck,
      title: "Prověření trenéři",
      description:
        "Všichni trenéři mají ověřené zkušenosti a certifikace. Můžete jim důvěřovat.",
    },
    {
      icon: Clock,
      title: "Aktuální informace",
      description:
        "Ceny, časy, volná místa - vše aktualizované přímo trenéry. Žádné překvapení.",
    },
  ];

  return (
    <section className="py-16 md:py-20 bg-card">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-brand-navy mb-4">
            Proč kroužky HB?
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Vše, co potřebujete vědět o volnočasových aktivitách ve městě, 
            najdete na jednom místě.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="border border-border/50 shadow-soft hover:shadow-hover transition-all duration-300"
            >
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
