
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Pricing = () => {
  const plans = [
    {
      name: "SILVER",
      price: "Free",
      icon: "🥈",
      features: [
        { name: "3 Members", included: true },
        { name: "Single Device", included: true },
        { name: "50GB Storage", included: false },
        { name: "Monthly Backups", included: false },
        { name: "Permissions & workflows", included: false }
      ],
      buttonText: "Choose Silver",
      buttonVariant: "outline" as const
    },
    {
      name: "BRONZE", 
      price: "$10.99",
      period: "/mo",
      icon: "🥉",
      popular: true,
      features: [
        { name: "5 Members", included: true },
        { name: "Multiple Device", included: true },
        { name: "80GB Storage", included: true },
        { name: "Monthly Backups", included: false },
        { name: "Permissions & workflows", included: false }
      ],
      buttonText: "Choose Bronze",
      buttonVariant: "default" as const
    },
    {
      name: "GOLD",
      price: "$22.99", 
      period: "/mo",
      icon: "🥇",
      features: [
        { name: "Unlimited Members", included: true },
        { name: "Multiple Device", included: true },
        { name: "150GB Storage", included: true },
        { name: "Monthly Backups", included: true },
        { name: "Permissions & workflows", included: true }
      ],
      buttonText: "Choose Gold",
      buttonVariant: "default" as const
    }
  ];

  return (
    <>
      <div className="space-y-8">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <span>🏠</span>
          <span>/</span>
          <span className="text-primary">Pricing</span>
        </div>

        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">
            Flexible Plans Tailored to Fit Your<br />
            Community's Unique Needs!
          </h1>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center">
          <Tabs defaultValue="monthly" className="w-auto">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
              <TabsTrigger value="yearly">Yearly</TabsTrigger>
            </TabsList>
            
            <TabsContent value="monthly" className="mt-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
                {plans.map((plan, index) => (
                  <Card key={plan.name} className={`relative ${plan.popular ? 'border-primary shadow-lg' : ''}`}>
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-yellow-500 text-yellow-50 hover:bg-yellow-600">
                          POPULAR
                        </Badge>
                      </div>
                    )}
                    
                    <CardHeader className="text-center space-y-4">
                      <div className="text-sm font-medium text-muted-foreground">{plan.name}</div>
                      
                      <div className="text-6xl">{plan.icon}</div>
                      
                      <div className="space-y-2">
                        <div className="flex items-baseline justify-center">
                          {plan.price !== "Free" && <span className="text-2xl">$</span>}
                          <span className="text-4xl font-bold">
                            {plan.price === "Free" ? "Free" : plan.price.replace("$", "")}
                          </span>
                          {plan.period && <span className="text-lg text-muted-foreground">{plan.period}</span>}
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-6">
                      <div className="space-y-3">
                        {plan.features.map((feature, featureIndex) => (
                          <div key={featureIndex} className="flex items-center space-x-3">
                            {feature.included ? (
                              <Check className="w-5 h-5 text-green-500" />
                            ) : (
                              <X className="w-5 h-5 text-red-500" />
                            )}
                            <span className={feature.included ? "" : "line-through text-muted-foreground"}>
                              {feature.name}
                            </span>
                          </div>
                        ))}
                      </div>
                      
                      <Button 
                        className="w-full" 
                        variant={plan.buttonVariant}
                      >
                        {plan.buttonText}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="yearly" className="mt-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
                {plans.map((plan, index) => (
                  <Card key={plan.name} className={`relative ${plan.popular ? 'border-primary shadow-lg' : ''}`}>
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-yellow-500 text-yellow-50 hover:bg-yellow-600">
                          POPULAR
                        </Badge>
                      </div>
                    )}
                    
                    <CardHeader className="text-center space-y-4">
                      <div className="text-sm font-medium text-muted-foreground">{plan.name}</div>
                      
                      <div className="text-6xl">{plan.icon}</div>
                      
                      <div className="space-y-2">
                        <div className="flex items-baseline justify-center">
                          {plan.price !== "Free" && <span className="text-2xl">$</span>}
                          <span className="text-4xl font-bold">
                            {plan.price === "Free" ? "Free" : (parseFloat(plan.price.replace("$", "")) * 10).toFixed(0)}
                          </span>
                          {plan.period && <span className="text-lg text-muted-foreground">/yr</span>}
                        </div>
                        {plan.price !== "Free" && (
                          <div className="text-sm text-green-600">Save 20% annually</div>
                        )}
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-6">
                      <div className="space-y-3">
                        {plan.features.map((feature, featureIndex) => (
                          <div key={featureIndex} className="flex items-center space-x-3">
                            {feature.included ? (
                              <Check className="w-5 h-5 text-green-500" />
                            ) : (
                              <X className="w-5 h-5 text-red-500" />
                            )}
                            <span className={feature.included ? "" : "line-through text-muted-foreground"}>
                              {feature.name}
                            </span>
                          </div>
                        ))}
                      </div>
                      
                      <Button 
                        className="w-full" 
                        variant={plan.buttonVariant}
                      >
                        {plan.buttonText}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default Pricing;