import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Facebook, Instagram, Users, Eye, MapPin, Mail, Building } from "lucide-react";
import jonathanAvatar from "@/assets/jonathan-avatar.jpg";

const AdminPerfil = () => {
  return (
    <div className="space-y-6">
      {/* Cover Image and Profile */}
      <Card>
        <div className="relative">
          {/* Cover Image */}
          <div className="h-48 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-600 rounded-t-lg relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/10 to-transparent"></div>
            <div className="absolute top-4 left-4 w-6 h-6 bg-white/20 rotate-45 rounded-sm"></div>
            <div className="absolute top-12 right-8 w-8 h-8 bg-white/15 rotate-12 rounded-sm"></div>
            <div className="absolute bottom-8 left-12 w-4 h-4 bg-white/25 rotate-45 rounded-sm"></div>
          </div>
          
          {/* Profile Info */}
          <div className="relative px-6 pb-6">
            <div className="flex flex-col md:flex-row items-start md:items-end space-y-4 md:space-y-0 md:space-x-6 -mt-16">
              <Avatar className="w-32 h-32 border-4 border-background">
                <AvatarImage src={jonathanAvatar} alt="David McMichael" />
                <AvatarFallback>DM</AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div>
                    <h1 className="text-2xl font-bold">David McMichael</h1>
                    <p className="text-muted-foreground">Designer</p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button size="sm">
                      <Facebook className="w-4 h-4" />
                    </Button>
                    <Button size="sm">
                      <Instagram className="w-4 h-4" />
                    </Button>
                    <Button>Add To Story</Button>
                  </div>
                </div>
                
                {/* Stats */}
                <div className="grid grid-cols-3 gap-8">
                  <div className="text-center">
                    <div className="text-2xl font-bold">938</div>
                    <div className="text-sm text-muted-foreground">Posts</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">3,586</div>
                    <div className="text-sm text-muted-foreground">Followers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">2,659</div>
                    <div className="text-sm text-muted-foreground">Following</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Profile Tabs */}
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile" className="flex items-center space-x-2">
            <Eye className="w-4 h-4" />
            <span>Profile</span>
          </TabsTrigger>
          <TabsTrigger value="followers" className="flex items-center space-x-2">
            <Users className="w-4 h-4" />
            <span>Followers</span>
          </TabsTrigger>
          <TabsTrigger value="friends" className="flex items-center space-x-2">
            <Users className="w-4 h-4" />
            <span>Friends</span>
          </TabsTrigger>
          <TabsTrigger value="gallery" className="flex items-center space-x-2">
            <Eye className="w-4 h-4" />
            <span>Gallery</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* About */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Introduction</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">
                    Hello, I am David McMichael. I love making websites and graphics. Lorem ipsum dolor sit 
                    amet, consectetur adipiscing elit.
                  </p>
                  
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Building className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">Sir, P P Institute Of Science</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">xyzjonathan@gmail.com</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="w-4 h-4 text-muted-foreground">🌐</span>
                      <span className="text-sm text-primary">www.xyz.com</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">Newyork, USA - 100001</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Post Something */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Share your thoughts</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea placeholder="Share your thoughts" className="min-h-[100px]" />
                  
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline">Photos / Video</Button>
                    <Button size="sm" variant="outline">Article</Button>
                  </div>
                  
                  <Button className="w-full">Post</Button>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="mt-6">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src="/placeholder.svg" alt="Nirav Joshi" />
                      <AvatarFallback>NJ</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Nirav Joshi</p>
                      <p className="text-xs text-muted-foreground">15 min ago</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="followers">
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-muted-foreground">Followers content would go here...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="friends">
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-muted-foreground">Friends content would go here...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gallery">
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-muted-foreground">Gallery content would go here...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPerfil;