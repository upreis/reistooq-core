import { useState } from "react";
import { Grid3X3, MessageSquare, ShoppingCart, Calendar, Users, Ticket, Mail, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";

const quickApps = [
  {
    name: "Chat Application",
    description: "New messages arrived",
    icon: MessageSquare,
    color: "bg-blue-100 text-blue-600",
    href: "/chat"
  },
  {
    name: "eCommerce App", 
    description: "New stock available",
    icon: ShoppingCart,
    color: "bg-green-100 text-green-600",
    href: "/ecommerce"
  },
  {
    name: "Notes App",
    description: "To-do and Daily tasks", 
    icon: FileText,
    color: "bg-purple-100 text-purple-600",
    href: "/notes"
  },
  {
    name: "Calendar App",
    description: "Get dates",
    icon: Calendar,
    color: "bg-orange-100 text-orange-600", 
    href: "/calendar"
  },
  {
    name: "Contact Application",
    description: "2 Unsaved Contacts",
    icon: Users,
    color: "bg-red-100 text-red-600",
    href: "/contacts"
  },
  {
    name: "Tickets App",
    description: "Submit tickets",
    icon: Ticket,
    color: "bg-indigo-100 text-indigo-600",
    href: "/tickets"
  },
  {
    name: "Email App",
    description: "Get new emails", 
    icon: Mail,
    color: "bg-cyan-100 text-cyan-600",
    href: "/email"
  },
  {
    name: "Blog App",
    description: "added new blog",
    icon: FileText,
    color: "bg-teal-100 text-teal-600",
    href: "/blog"
  }
];

const quickLinks = [
  "Pricing Page",
  "Authentication Design", 
  "Register Now",
  "404 Error Page",
  "Kanban App",
  "User Application",
  "Blog Design",
  "Shopping Cart"
];

export function QuickAppsModal() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Grid3X3 className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="sr-only">Quick Apps</DialogTitle>
        </DialogHeader>
        <div className="flex gap-6">
          {/* Apps Grid */}
          <div className="flex-1">
            <div className="grid grid-cols-2 gap-4">
              {quickApps.map((app, index) => (
                <Card key={index} className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${app.color}`}>
                      <app.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-sm">{app.name}</h3>
                      <p className="text-xs text-muted-foreground">{app.description}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            
            <div className="mt-6 flex items-center gap-4">
              <span className="text-sm text-muted-foreground">Frequently Asked Questions</span>
              <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
                Check
              </Button>
            </div>
          </div>
          
          {/* Quick Links */}
          <div className="w-48">
            <h3 className="font-semibold text-lg mb-4">Quick Links</h3>
            <div className="space-y-2">
              {quickLinks.map((link, index) => (
                <div key={index} className="text-sm text-muted-foreground hover:text-foreground cursor-pointer py-1">
                  {link}
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}