import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const FAQ = () => {
  const faqs = [
    {
      id: "1",
      question: "What is an Admin Dashboard?",
      answer: "An admin dashboard is a centralized interface that allows administrators to manage and monitor various aspects of a system, application, or website. It provides tools for user management, data analysis, content control, and system configuration."
    },
    {
      id: "2", 
      question: "What should an admin dashboard template include?",
      answer: "A comprehensive admin dashboard template should include user management tools, analytics and reporting features, customizable widgets, responsive design, data visualization components, security features, and integration capabilities with third-party services."
    },
    {
      id: "3",
      question: "Why should I buy admin templates from adminmart?",
      answer: "Adminmart offers high-quality, professionally designed templates that are regularly updated, well-documented, and come with excellent customer support. Our templates are built with modern technologies and best practices to ensure optimal performance and security."
    },
    {
      id: "4",
      question: "Do adminmart offers a money back guarantee?", 
      answer: "Yes, we offer a 30-day money-back guarantee on all our products. If you're not satisfied with your purchase, you can request a full refund within 30 days of purchase, no questions asked."
    }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <span>🏠</span>
          <span>/</span>
          <span className="text-primary">FAQ</span>
        </div>

        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">Frequently asked questions</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Get to know more about ready-to-use admin dashboard templates
          </p>
        </div>

        {/* FAQ Accordion */}
        <Card className="max-w-4xl mx-auto">
          <CardContent className="p-6">
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq) => (
                <AccordionItem key={faq.id} value={faq.id}>
                  <AccordionTrigger className="text-left">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        {/* Still have questions section */}
        <Card className="max-w-4xl mx-auto bg-blue-50 border-blue-200">
          <CardContent className="p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="flex -space-x-2">
                <Avatar className="w-12 h-12 border-2 border-background">
                  <AvatarImage src="/placeholder.svg" alt="Support 1" />
                  <AvatarFallback>S1</AvatarFallback>
                </Avatar>
                <Avatar className="w-12 h-12 border-2 border-background">
                  <AvatarImage src="/placeholder.svg" alt="Support 2" />
                  <AvatarFallback>S2</AvatarFallback>
                </Avatar>
                <Avatar className="w-12 h-12 border-2 border-background">
                  <AvatarImage src="/placeholder.svg" alt="Support 3" />
                  <AvatarFallback>S3</AvatarFallback>
                </Avatar>
              </div>
            </div>
            <h3 className="text-xl font-semibold mb-2">Still have questions</h3>
            <p className="text-muted-foreground mb-6">
              Can't find the answer you're looking for? Please chat to our friendly team.
            </p>
            <Button>Chat with us</Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default FAQ;