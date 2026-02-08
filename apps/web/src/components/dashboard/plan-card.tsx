import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Check,
  Sparkles,
  Crown,
  Car,
  MessageSquare,
  Phone,
  AlertTriangle,
  Zap,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface PlanCardProps {
  name: string;
  price: number;
  duration: string;
  vehicleLimit: number;
  popular?: boolean;
  bestValue?: boolean;
  onSelect: () => void;
  current?: boolean;
}

const features = [
  { icon: Car, text: (limit: number) => `Up to ${limit} vehicles` },
  { icon: MessageSquare, text: () => "WhatsApp alerts" },
  { icon: Phone, text: () => "Anonymous VoIP calls" },
  { icon: AlertTriangle, text: () => "Emergency reporting" },
];

export function PlanCard({
  name,
  price,
  duration,
  vehicleLimit,
  popular,
  bestValue,
  onSelect,
  current,
}: PlanCardProps) {
  const isHighlighted = popular || bestValue;

  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-all duration-300",
        "hover:shadow-xl hover:-translate-y-1",
        isHighlighted
          ? "border-2 border-primary shadow-lg shadow-primary/10"
          : "border hover:border-primary/50"
      )}
    >
      {/* Background gradient for highlighted cards */}
      {isHighlighted && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-primary/3 to-transparent" />
      )}

      {/* Decorative corner accent */}
      {popular && (
        <div className="absolute -top-10 -right-10 h-20 w-20 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full blur-xl" />
      )}

      {/* Badge */}
      {(popular || bestValue) && (
        <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 z-10">
          <Badge
            className={cn(
              "px-4 py-1.5 text-xs font-bold shadow-lg",
              "flex items-center gap-1.5",
              popular
                ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground border-0"
                : "bg-gradient-to-r from-amber-500 to-amber-600 text-white border-0"
            )}
          >
            {popular ? (
              <>
                <Crown className="h-3.5 w-3.5" aria-hidden="true" />
                Most Popular
              </>
            ) : (
              <>
                <Star className="h-3.5 w-3.5" aria-hidden="true" />
                Best Value
              </>
            )}
          </Badge>
        </div>
      )}

      <CardHeader className={cn("relative text-center", isHighlighted ? "pt-10" : "pt-8")}>
        <h3 className="text-xl font-bold tracking-tight">{name}</h3>
        <div className="mt-4 flex items-baseline justify-center gap-1">
          <span className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
            &#8377;{price}
          </span>
          <span className="text-muted-foreground font-medium">/{duration}</span>
        </div>
        {/* Price per month calculation for annual plans */}
        {duration === "year" && (
          <p className="text-sm text-muted-foreground mt-2">
            <span className="text-emerald-600 font-semibold">
              &#8377;{Math.round(price / 12)}
            </span>
            /month
          </p>
        )}
      </CardHeader>

      <CardContent className="relative space-y-6 pb-8">
        {/* Features list */}
        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center gap-3">
              <div
                className={cn(
                  "rounded-full p-1.5",
                  isHighlighted ? "bg-primary/10" : "bg-emerald-500/10"
                )}
              >
                <Check
                  className={cn(
                    "h-3.5 w-3.5",
                    isHighlighted ? "text-primary" : "text-emerald-600"
                  )}
                  aria-hidden="true"
                />
              </div>
              <span className="text-sm text-muted-foreground">
                {feature.text(vehicleLimit)}
              </span>
            </li>
          ))}
        </ul>

        {/* CTA Button */}
        <Button
          className={cn(
            "w-full min-h-[48px] font-semibold text-base transition-all duration-300",
            popular && !current && "shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30",
            current && "cursor-default"
          )}
          variant={popular ? "default" : "outline"}
          onClick={onSelect}
          disabled={current}
        >
          {current ? (
            <span className="flex items-center gap-2">
              <Check className="h-4 w-4" aria-hidden="true" />
              Current Plan
            </span>
          ) : (
            <span className="flex items-center gap-2">
              {popular && <Zap className="h-4 w-4" aria-hidden="true" />}
              Get Started
            </span>
          )}
        </Button>

        {/* Decorative sparkles for popular plan */}
        {popular && !current && (
          <Sparkles
            className="absolute bottom-4 right-4 h-5 w-5 text-primary/30"
            aria-hidden="true"
          />
        )}
      </CardContent>
    </Card>
  );
}
