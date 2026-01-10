import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dumbbell,
  Music,
  Languages,
  Cpu,
  Palette,
  Theater,
  FlaskConical,
  Sparkles,
} from "lucide-react";

const CategoriesSection = () => {
  const categories = [
    {
      id: "sport",
      name: "Sport",
      icon: Dumbbell,
      color: "bg-category-sport",
    },
    {
      id: "hudba",
      name: "Hudba",
      icon: Music,
      color: "bg-category-music",
    },
    {
      id: "jazyky",
      name: "Jazyky",
      icon: Languages,
      color: "bg-category-language",
    },
    {
      id: "technika",
      name: "Technika",
      icon: Cpu,
      color: "bg-category-tech",
    },
    {
      id: "umeni",
      name: "Umění",
      icon: Palette,
      color: "bg-category-art",
    },
    {
      id: "tanec",
      name: "Tanec",
      icon: Theater,
      color: "bg-category-dance",
    },
    {
      id: "veda",
      name: "Věda",
      icon: FlaskConical,
      color: "bg-category-science",
    },
    {
      id: "ostatni",
      name: "Ostatní",
      icon: Sparkles,
      color: "bg-category-other",
    },
  ];

  return (
    <section id="kategorie" className="py-16 md:py-20">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-brand-navy mb-4">
            Prozkoumejte kategorie
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Od sportu po umění - najdete u nás širokou škálu aktivit
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {categories.map((category) => (
            <Link key={category.id} href={`/krouzky?kategorie=${category.id}`}>
              <Card className="border border-border/50 shadow-soft hover:shadow-hover transition-all duration-300 hover:-translate-y-1 cursor-pointer">
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <div
                    className={`w-14 h-14 rounded-2xl ${category.color} flex items-center justify-center mb-3`}
                  >
                    <category.icon className="h-7 w-7 text-white" />
                  </div>
                  <span className="font-medium text-foreground text-sm">
                    {category.name}
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoriesSection;
