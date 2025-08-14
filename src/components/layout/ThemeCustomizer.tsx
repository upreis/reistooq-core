import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Settings, Palette, Monitor, Smartphone, Layout, Square, Circle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";

export function ThemeCustomizer() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState("light");
  const [selectedDirection, setSelectedDirection] = useState("ltr");
  const [selectedColor, setSelectedColor] = useState("blue");
  const [selectedLayout, setSelectedLayout] = useState("vertical");
  const [selectedContainer, setSelectedContainer] = useState("boxed");
  const [selectedSidebar, setSelectedSidebar] = useState("full");
  const [selectedCard, setSelectedCard] = useState("shadow");
  const [borderRadius, setBorderRadius] = useState([12]);

  const themeColors = [
    { name: "blue", value: "hsl(210, 100%, 50%)", class: "bg-blue-500" },
    { name: "indigo", value: "hsl(230, 100%, 50%)", class: "bg-indigo-500" },
    { name: "purple", value: "hsl(270, 100%, 50%)", class: "bg-purple-500" },
    { name: "teal", value: "hsl(180, 100%, 35%)", class: "bg-teal-500" },
    { name: "cyan", value: "hsl(190, 100%, 45%)", class: "bg-cyan-500" },
    { name: "orange", value: "hsl(25, 100%, 50%)", class: "bg-orange-500" },
  ];

  return (
    <>
      {/* Floating Settings Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button
              size="icon"
              className="h-12 w-12 rounded-full bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 animate-pulse"
            >
              <Settings className="h-6 w-6" />
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Settings
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {/* Theme Option */}
              <div>
                <h3 className="font-semibold mb-3">Theme Option</h3>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={selectedTheme === "light" ? "default" : "outline"}
                    className={`justify-start ${
                      selectedTheme === "light" 
                        ? "bg-blue-500 hover:bg-blue-600 text-white" 
                        : ""
                    }`}
                    onClick={() => setSelectedTheme("light")}
                  >
                    <Circle className="mr-2 h-4 w-4 text-yellow-500 fill-current" />
                    Light
                  </Button>
                  <Button
                    variant={selectedTheme === "dark" ? "default" : "outline"}
                    className={`justify-start ${
                      selectedTheme === "dark" 
                        ? "bg-orange-500 hover:bg-orange-600 text-white" 
                        : ""
                    }`}
                    onClick={() => setSelectedTheme("dark")}
                  >
                    <Circle className="mr-2 h-4 w-4 text-orange-500 fill-current" />
                    Dark
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Theme Direction */}
              <div>
                <h3 className="font-semibold mb-3">Theme Direction</h3>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={selectedDirection === "ltr" ? "default" : "outline"}
                    className={`justify-start ${
                      selectedDirection === "ltr" 
                        ? "bg-orange-500 hover:bg-orange-600 text-white" 
                        : ""
                    }`}
                    onClick={() => setSelectedDirection("ltr")}
                  >
                    <Layout className="mr-2 h-4 w-4" />
                    LTR
                  </Button>
                  <Button
                    variant={selectedDirection === "rtl" ? "default" : "outline"}
                    className="justify-start"
                    onClick={() => setSelectedDirection("rtl")}
                  >
                    <Layout className="mr-2 h-4 w-4 scale-x-[-1]" />
                    RTL
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Theme Colors */}
              <div>
                <h3 className="font-semibold mb-3">Theme Colors</h3>
                <div className="grid grid-cols-3 gap-2">
                  {themeColors.map((color) => (
                    <Button
                      key={color.name}
                      variant="outline"
                      className={`h-12 w-full p-2 border-2 ${
                        selectedColor === color.name ? "border-primary" : "border-border"
                      }`}
                      onClick={() => setSelectedColor(color.name)}
                    >
                      <div className={`w-8 h-8 rounded ${color.class}`} />
                      {selectedColor === color.name && (
                        <div className="absolute top-1 right-1">
                          <div className="w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full" />
                          </div>
                        </div>
                      )}
                    </Button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Layout Type */}
              <div>
                <h3 className="font-semibold mb-3">Layout Type</h3>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={selectedLayout === "vertical" ? "default" : "outline"}
                    className={`justify-start ${
                      selectedLayout === "vertical" 
                        ? "bg-orange-500 hover:bg-orange-600 text-white" 
                        : ""
                    }`}
                    onClick={() => setSelectedLayout("vertical")}
                  >
                    <Smartphone className="mr-2 h-4 w-4" />
                    Vertical
                  </Button>
                  <Button
                    variant={selectedLayout === "horizontal" ? "default" : "outline"}
                    className="justify-start"
                    onClick={() => setSelectedLayout("horizontal")}
                  >
                    <Monitor className="mr-2 h-4 w-4" />
                    Horizontal
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Container Option */}
              <div>
                <h3 className="font-semibold mb-3">Container Option</h3>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={selectedContainer === "boxed" ? "default" : "outline"}
                    className={`justify-start ${
                      selectedContainer === "boxed" 
                        ? "bg-orange-500 hover:bg-orange-600 text-white" 
                        : ""
                    }`}
                    onClick={() => setSelectedContainer("boxed")}
                  >
                    <Square className="mr-2 h-4 w-4" />
                    Boxed
                  </Button>
                  <Button
                    variant={selectedContainer === "full" ? "default" : "outline"}
                    className="justify-start"
                    onClick={() => setSelectedContainer("full")}
                  >
                    <Square className="mr-2 h-4 w-4 fill-current" />
                    Full
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Sidebar Type */}
              <div>
                <h3 className="font-semibold mb-3">Sidebar Type</h3>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={selectedSidebar === "full" ? "default" : "outline"}
                    className={`justify-start ${
                      selectedSidebar === "full" 
                        ? "bg-orange-500 hover:bg-orange-600 text-white" 
                        : ""
                    }`}
                    onClick={() => setSelectedSidebar("full")}
                  >
                    <Layout className="mr-2 h-4 w-4" />
                    Full
                  </Button>
                  <Button
                    variant={selectedSidebar === "collapse" ? "default" : "outline"}
                    className="justify-start"
                    onClick={() => setSelectedSidebar("collapse")}
                  >
                    <Layout className="mr-2 h-4 w-4 scale-x-75" />
                    Collapse
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Card With */}
              <div>
                <h3 className="font-semibold mb-3">Card With</h3>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={selectedCard === "border" ? "default" : "outline"}
                    className="justify-start"
                    onClick={() => setSelectedCard("border")}
                  >
                    <Square className="mr-2 h-4 w-4" />
                    Border
                  </Button>
                  <Button
                    variant={selectedCard === "shadow" ? "default" : "outline"}
                    className={`justify-start ${
                      selectedCard === "shadow" 
                        ? "bg-orange-500 hover:bg-orange-600 text-white" 
                        : ""
                    }`}
                    onClick={() => setSelectedCard("shadow")}
                  >
                    <Square className="mr-2 h-4 w-4 drop-shadow-md" />
                    Shadow
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Theme Border Radius */}
              <div>
                <h3 className="font-semibold mb-3">Theme Border Radius</h3>
                <div className="space-y-4">
                  <Slider
                    value={borderRadius}
                    onValueChange={setBorderRadius}
                    max={24}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>0</span>
                    <span className="text-blue-500 font-medium">Current Value: {borderRadius[0]}</span>
                    <span>24</span>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}