import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, Send, Paperclip, Smile, Phone, Video, MoreVertical } from "lucide-react";
import { useState } from "react";

const Chats = () => {
  const [selectedChat, setSelectedChat] = useState(1);
  const [message, setMessage] = useState("");

  const contacts = [
    {
      id: 1,
      name: "Andrew McDownland",
      lastMessage: "The video conference is...",
      time: "15 min",
      avatar: "/placeholder.svg",
      online: true,
      unread: 2
    },
    {
      id: 2,
      name: "Christopher Jamil",
      lastMessage: "Most of the time I work...",
      time: "30 min",
      avatar: "/placeholder.svg",
      online: false,
      unread: 0
    },
    {
      id: 3,
      name: "Addie Minstra",
      lastMessage: "After you get up and ru...",
      time: "2 hrs",
      avatar: "/placeholder.svg",
      online: true,
      unread: 1
    },
    {
      id: 4,
      name: "Sarah Johnson",
      lastMessage: "Hey, how are you doing?",
      time: "1 day",
      avatar: "/placeholder.svg",
      online: false,
      unread: 0
    }
  ];

  const messages = [
    {
      id: 1,
      sender: "Andrew McDownland",
      content: "Hey! How are you doing?",
      time: "10:30 AM",
      isOwn: false
    },
    {
      id: 2,
      sender: "Me",
      content: "I'm doing great! Just working on some projects. How about you?",
      time: "10:32 AM",
      isOwn: true
    },
    {
      id: 3,
      sender: "Andrew McDownland",
      content: "Same here! Working on the new design system. Would love to get your feedback on it.",
      time: "10:35 AM",
      isOwn: false
    },
    {
      id: 4,
      sender: "Me",
      content: "Sure! I'd be happy to take a look. Send it over when you're ready.",
      time: "10:36 AM",
      isOwn: true
    }
  ];

  const currentContact = contacts.find(contact => contact.id === selectedChat);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <span>🏠</span>
          <span>/</span>
          <span className="text-primary">Chats</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
          {/* Contacts List */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Chats</CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input placeholder="Search contacts..." className="pl-10" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-1">
                {contacts.map((contact) => (
                  <div
                    key={contact.id}
                    onClick={() => setSelectedChat(contact.id)}
                    className={`p-4 cursor-pointer transition-colors hover:bg-muted/50 ${
                      selectedChat === contact.id ? "bg-muted" : ""
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={contact.avatar} alt={contact.name} />
                          <AvatarFallback>{contact.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        {contact.online && (
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-sm truncate">{contact.name}</p>
                          <span className="text-xs text-muted-foreground">{contact.time}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-muted-foreground truncate">{contact.lastMessage}</p>
                          {contact.unread > 0 && (
                            <Badge className="h-5 w-5 flex items-center justify-center p-0 bg-primary">
                              {contact.unread}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Chat Area */}
          <Card className="lg:col-span-3 flex flex-col">
            {/* Chat Header */}
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={currentContact?.avatar} alt={currentContact?.name} />
                      <AvatarFallback>{currentContact?.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    {currentContact?.online && (
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background"></div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium">{currentContact?.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {currentContact?.online ? "Online" : "Last seen recently"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="icon">
                    <Phone className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Video className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            {/* Messages */}
            <CardContent className="flex-1 p-4 overflow-y-auto">
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.isOwn ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        msg.isOwn
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                      <p className={`text-xs mt-1 ${
                        msg.isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                      }`}>
                        {msg.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>

            {/* Message Input */}
            <div className="p-4 border-t">
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="icon">
                  <Paperclip className="w-4 h-4" />
                </Button>
                <div className="flex-1 relative">
                  <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="pr-10"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        setMessage("");
                      }
                    }}
                  />
                  <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 transform -translate-y-1/2">
                    <Smile className="w-4 h-4" />
                  </Button>
                </div>
                <Button size="icon">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Chats;