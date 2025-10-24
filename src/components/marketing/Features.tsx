import type { ComponentType } from "react";

import {
  ArrowRightIcon,
  Edit3Icon,
  ListIcon,
  LockKeyholeIcon,
  SmartphoneIcon,
  SwatchBookIcon,
  TagIcon,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { cn } from "@/lib/utils";

const featuresListPrepared = [
  {
    icon: SwatchBookIcon,
    title: "Generowanie przepisów z AI",
    description:
      "Wklej tekst przepisu z dowolnego źródła, a AI automatycznie wyodrębni składniki, kroki i nazwę. Zaoszczędź czas na ręcznym formatowaniu i od razu przejdź do gotowania.",
    cardBorderColor: "border-primary/40 hover:border-primary",
    avatarTextColor: "text-primary",
    avatarBgColor: "bg-primary/10",
  },
  {
    icon: ListIcon,
    title: "Automatyczne rozdzielenie treści",
    description:
      "System inteligentnie oddziela składniki od instrukcji, rozpoznaje strukturę przepisu i porządkuje dane. Nie musisz niczego formatować ręcznie.",
    cardBorderColor: "border-green-600/40 hover:border-green-600 dark:border-green-400/40 dark:hover:border-green-400",
    avatarTextColor: "text-green-600 dark:text-green-400",
    avatarBgColor: "bg-green-600/10 dark:bg-green-400/10",
  },
  {
    icon: Edit3Icon,
    title: "Edycja i tworzenie manualne",
    description:
      "Dostosuj każdy przepis do swoich potrzeb lub stwórz nowy od zera. Dodawaj, usuwaj i przestawiaj składniki oraz kroki za pomocą prostego interfejsu drag-and-drop.",
    cardBorderColor: "border-amber-600/40 hover:border-amber-600 dark:border-amber-400/40 dark:hover:border-amber-400",
    avatarTextColor: "text-amber-600 dark:text-amber-400",
    avatarBgColor: "bg-amber-600/10 dark:bg-amber-400/10",
  },
  {
    icon: TagIcon,
    title: "System tagów i kategorii",
    description:
      "Organizuj przepisy według własnych kategorii. Dodawaj tagi podczas zapisywania, a system będzie podpowiadał wcześniej użyte, aby zachować spójność Twojej kolekcji.",
    cardBorderColor: "border-destructive/40 hover:border-destructive",
    avatarTextColor: "text-destructive",
    avatarBgColor: "bg-destructive/10",
  },
  {
    icon: LockKeyholeIcon,
    title: "Bezpieczna prywatna kolekcja",
    description:
      "Twoje przepisy są dostępne tylko dla Ciebie. Buduj osobistą cyfrową książkę kucharską bez obaw o prywatność, z pełnym dostępem z każdego urządzenia.",
    cardBorderColor: "border-violet-600/40 hover:border-violet-600 dark:border-violet-400/40 dark:hover:border-violet-400",
    avatarTextColor: "text-violet-600 dark:text-violet-400",
    avatarBgColor: "bg-violet-600/10 dark:bg-violet-400/10",
  },
  {
    icon: SmartphoneIcon,
    title: "Responsywny dostęp wszędzie",
    description:
      "Korzystaj z aplikacji na komputerze podczas przygotowań lub na telefonie bezpośrednio w kuchni. Interfejs dostosowuje się do każdego urządzenia.",
    cardBorderColor: "border-sky-600/40 hover:border-sky-600 dark:border-sky-400/40 dark:hover:border-sky-400",
    avatarTextColor: "text-sky-600 dark:text-sky-400",
    avatarBgColor: "bg-sky-600/10 dark:bg-sky-400/10",
  },
];

type Features = {
  icon: ComponentType;
  title: string;
  description: string;
  cardBorderColor: string;
  avatarTextColor: string;
  avatarBgColor: string;
}[];

const Features = ({ featuresList = featuresListPrepared }: { featuresList?: Features }) => {
  return (
    <section className="py-8 sm:py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12 space-y-4 sm:mb-16 lg:mb-24">
          <h2 className="text-2xl font-semibold md:text-3xl lg:text-4xl">Wszystko, czego potrzebujesz do cyfrowej książki kucharskiej</h2>
          <p className="text-muted-foreground text-xl">
            Odkryj funkcje zaprojektowane z myślą o oszczędności Twojego czasu. Inteligentne przetwarzanie AI, łatwa edycja i pełna kontrola nad Twoją kolekcją przepisów.
          </p>
          <Button variant="outline" className="rounded-lg text-base shadow-none has-[>svg]:px-6" size="lg">
            Zobacz wszystkie funkcje
            <ArrowRightIcon />
          </Button>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featuresList.map((features, index) => (
            <Card key={index} className={cn("shadow-none transition-colors duration-300", features.cardBorderColor)}>
              <CardContent>
                <Avatar className={cn("mb-6 size-10 rounded-md", features.avatarTextColor)}>
                  <AvatarFallback className={cn("rounded-md [&>svg]:size-6", features.avatarBgColor)}>
                    <features.icon />
                  </AvatarFallback>
                </Avatar>
                <h6 className="mb-2 text-lg font-semibold">{features.title}</h6>
                <p className="text-muted-foreground">{features.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
