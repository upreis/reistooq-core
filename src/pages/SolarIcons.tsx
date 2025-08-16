
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Copy, Download, Heart } from "lucide-react";
import { useState } from "react";

const SolarIcons = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [favorites, setFavorites] = useState<number[]>([]);

  // Solar icon categories and sample icons
  const iconCategories = [
    {
      name: "Business",
      icons: [
        { id: 1, name: "chart-line", icon: "📈" },
        { id: 2, name: "briefcase", icon: "💼" },
        { id: 3, name: "calendar", icon: "📅" },
        { id: 4, name: "target", icon: "🎯" },
        { id: 5, name: "handshake", icon: "🤝" },
        { id: 6, name: "presentation", icon: "📊" },
      ]
    },
    {
      name: "Communication",
      icons: [
        { id: 7, name: "message", icon: "💬" },
        { id: 8, name: "phone", icon: "📞" },
        { id: 9, name: "email", icon: "✉️" },
        { id: 10, name: "notification", icon: "🔔" },
        { id: 11, name: "microphone", icon: "🎤" },
        { id: 12, name: "speaker", icon: "🔊" },
      ]
    },
    {
      name: "Technology",
      icons: [
        { id: 13, name: "laptop", icon: "💻" },
        { id: 14, name: "smartphone", icon: "📱" },
        { id: 15, name: "database", icon: "🗄️" },
        { id: 16, name: "cloud", icon: "☁️" },
        { id: 17, name: "wifi", icon: "📶" },
        { id: 18, name: "code", icon: "💻" },
      ]
    },
    {
      name: "Interface",
      icons: [
        { id: 19, name: "home", icon: "🏠" },
        { id: 20, name: "settings", icon: "⚙️" },
        { id: 21, name: "search", icon: "🔍" },
        { id: 22, name: "menu", icon: "☰" },
        { id: 23, name: "close", icon: "✕" },
        { id: 24, name: "plus", icon: "➕" },
      ]
    },
    {
      name: "Media",
      icons: [
        { id: 25, name: "play", icon: "▶️" },
        { id: 26, name: "pause", icon: "⏸️" },
        { id: 27, name: "camera", icon: "📷" },
        { id: 28, name: "image", icon: "🖼️" },
        { id: 29, name: "video", icon: "🎥" },
        { id: 30, name: "music", icon: "🎵" },
      ]
    },
    {
      name: "Navigation",
      icons: [
        { id: 31, name: "arrow-up", icon: "⬆️" },
        { id: 32, name: "arrow-down", icon: "⬇️" },
        { id: 33, name: "arrow-left", icon: "⬅️" },
        { id: 34, name: "arrow-right", icon: "➡️" },
        { id: 35, name: "compass", icon: "🧭" },
        { id: 36, name: "location", icon: "📍" },
      ]
    }
  ];

  const toggleFavorite = (iconId: number) => {
    setFavorites(prev => 
      prev.includes(iconId) 
        ? prev.filter(id => id !== iconId)
        : [...prev, iconId]
    );
  };

  const copyIcon = (iconName: string) => {
    navigator.clipboard.writeText(`<${iconName} />`);
  };

  const filteredCategories = iconCategories.map(category => ({
    ...category,
    icons: category.icons.filter(icon => 
      icon.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.icons.length > 0);

  return (
    <>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <span>🏠</span>
          <span>/</span>
          <span className="text-primary">Solar Icons</span>
        </div>

        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">Solar Icon Library</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Explore our comprehensive collection of beautiful, consistent icons designed for modern applications.
          </p>
        </div>

        {/* Search and Actions */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search icons..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">
                  {iconCategories.reduce((acc, cat) => acc + cat.icons.length, 0)} Icons
                </Badge>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Download All
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Icon Categories */}
        <div className="space-y-8">
          {filteredCategories.map((category) => (
            <Card key={category.name}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{category.name}</span>
                  <Badge variant="outline">{category.icons.length} icons</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                  {category.icons.map((icon) => (
                    <div
                      key={icon.id}
                      className="group relative p-4 border rounded-lg hover:border-primary hover:bg-primary/5 transition-all cursor-pointer"
                    >
                      <div className="text-center space-y-2">
                        <div className="text-2xl group-hover:scale-110 transition-transform">
                          {icon.icon}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {icon.name}
                        </p>
                      </div>
                      
                      {/* Action buttons - shown on hover */}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(icon.id);
                          }}
                        >
                          <Heart 
                            className={`w-3 h-3 ${
                              favorites.includes(icon.id) 
                                ? 'fill-red-500 text-red-500' 
                                : 'text-muted-foreground'
                            }`} 
                          />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyIcon(icon.name);
                          }}
                        >
                          <Copy className="w-3 h-3 text-muted-foreground" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Favorites Section */}
        {favorites.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Heart className="w-5 h-5 text-red-500" />
                <span>Favorite Icons</span>
                <Badge variant="outline">{favorites.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                {iconCategories
                  .flatMap(cat => cat.icons)
                  .filter(icon => favorites.includes(icon.id))
                  .map((icon) => (
                    <div
                      key={icon.id}
                      className="group relative p-4 border rounded-lg hover:border-primary hover:bg-primary/5 transition-all cursor-pointer"
                    >
                      <div className="text-center space-y-2">
                        <div className="text-2xl group-hover:scale-110 transition-transform">
                          {icon.icon}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {icon.name}
                        </p>
                      </div>
                      
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(icon.id);
                          }}
                        >
                          <Heart className="w-3 h-3 fill-red-500 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {filteredCategories.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-lg font-semibold mb-2">No icons found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search terms or browse through our categories.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
};

export default SolarIcons;