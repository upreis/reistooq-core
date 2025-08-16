import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Shield, Bell, CreditCard } from "lucide-react";
import jonathanAvatar from "@/assets/jonathan-avatar.jpg";

const AccountSettings = () => {
  const [selectedAvatar, setSelectedAvatar] = useState<string>(jonathanAvatar);

  const avatarOptions = [
    { id: 1, src: jonathanAvatar, alt: "Avatar 1" },
    { id: 2, src: "/placeholder.svg", alt: "Avatar 2" },
    { id: 3, src: "/placeholder.svg", alt: "Avatar 3" },
    { id: 4, src: "/placeholder.svg", alt: "Avatar 4" },
    { id: 5, src: "/placeholder.svg", alt: "Avatar 5" },
    { id: 6, src: "/placeholder.svg", alt: "Avatar 6" }
  ];

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <span>🏠</span>
        <span>/</span>
        <span className="text-primary">Account Setting</span>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="account" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="account" className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-primary rounded-full"></div>
            <span>Account</span>
          </TabsTrigger>
          <TabsTrigger value="notification" className="flex items-center space-x-2">
            <Bell className="w-4 h-4" />
            <span>Notification</span>
          </TabsTrigger>
          <TabsTrigger value="bills" className="flex items-center space-x-2">
            <CreditCard className="w-4 h-4" />
            <span>Bills</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center space-x-2">
            <Shield className="w-4 h-4" />
            <span>Security</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Change Profile */}
            <Card>
              <CardHeader>
                <CardTitle>Change Profile</CardTitle>
                <p className="text-sm text-muted-foreground">Change your profile picture from here</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col items-center space-y-4">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src={selectedAvatar} alt="Profile" />
                    <AvatarFallback>JD</AvatarFallback>
                  </Avatar>
                  
                  {/* Avatar Selection Grid */}
                  <div className="grid grid-cols-3 gap-3">
                    {avatarOptions.map((avatar) => (
                      <button
                        key={avatar.id}
                        onClick={() => setSelectedAvatar(avatar.src)}
                        className={`relative group ${
                          selectedAvatar === avatar.src ? 'ring-2 ring-primary' : ''
                        }`}
                      >
                        <Avatar className="w-16 h-16 transition-transform group-hover:scale-105">
                          <AvatarImage src={avatar.src} alt={avatar.alt} />
                          <AvatarFallback>{avatar.id}</AvatarFallback>
                        </Avatar>
                      </button>
                    ))}
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button size="sm">Upload</Button>
                    <Button variant="outline" size="sm">Reset</Button>
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    Allowed JPG, GIF or PNG. Max size of 800K
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Change Password */}
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <p className="text-sm text-muted-foreground">To change your password please confirm here</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input id="currentPassword" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input id="newPassword" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input id="confirmPassword" type="password" />
                </div>
                <Button className="w-full">Update Password</Button>
              </CardContent>
            </Card>
          </div>

          {/* Personal Details */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Details</CardTitle>
              <p className="text-sm text-muted-foreground">To change your personal detail, edit and save from here</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="yourName">Your Name</Label>
                  <Input id="yourName" defaultValue="Mathew Anderson" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="storeName">Store Name</Label>
                  <Input id="storeName" defaultValue="Macima Studio" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Select defaultValue="us">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="us">United States</SelectItem>
                      <SelectItem value="br">Brazil</SelectItem>
                      <SelectItem value="ca">Canada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select defaultValue="inr">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inr">India (INR)</SelectItem>
                      <SelectItem value="usd">USA (USD)</SelectItem>
                      <SelectItem value="eur">Europe (EUR)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" defaultValue="info@MatDash.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" defaultValue="+91 1234567895" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" defaultValue="814 Howard Street, 120065, India" />
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <Button>Save Changes</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notification" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <p className="text-sm text-muted-foreground">Manage your notification preferences</p>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Notification settings content would go here...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bills" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Billing Information</CardTitle>
              <p className="text-sm text-muted-foreground">Manage your billing and payment methods</p>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Billing information content would go here...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <p className="text-sm text-muted-foreground">Manage your security and privacy settings</p>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Security settings content would go here...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AccountSettings;