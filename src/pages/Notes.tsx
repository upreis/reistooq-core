
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Search, Trash2 } from "lucide-react";
import { useState } from "react";

const Notes = () => {
  const [selectedNote, setSelectedNote] = useState(1);
  const [selectedColor, setSelectedColor] = useState("blue");

  const notes = [
    {
      id: 1,
      title: "Lorem ipsum dolor sit amet, ...",
      date: "6/3/2023",
      color: "blue",
      content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
    },
    {
      id: 2,
      title: "Sed ut perspiciatis unde omn...",
      date: "6/2/2023",
      color: "pink",
      content: "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium."
    },
    {
      id: 3,
      title: "consectetur, adipisci velit, se...",
      date: "5/1/2023",
      color: "yellow",
      content: "consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt."
    },
    {
      id: 4,
      title: "Lorem ipsum dolor sit amet, ...",
      date: "5/31/2023",
      color: "green",
      content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit."
    }
  ];

  const colorClasses = {
    blue: "bg-blue-100 border-blue-200 hover:bg-blue-150",
    pink: "bg-pink-100 border-pink-200 hover:bg-pink-150",
    yellow: "bg-yellow-100 border-yellow-200 hover:bg-yellow-150",
    green: "bg-green-100 border-green-200 hover:bg-green-150"
  };

  const noteColors = [
    { name: "yellow", class: "bg-yellow-400 hover:bg-yellow-500" },
    { name: "blue", class: "bg-blue-400 hover:bg-blue-500" },
    { name: "pink", class: "bg-pink-400 hover:bg-pink-500" },
    { name: "green", class: "bg-green-400 hover:bg-green-500" },
    { name: "purple", class: "bg-purple-400 hover:bg-purple-500" }
  ];

  const currentNote = notes.find(note => note.id === selectedNote);

  return (
    <>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <span>🏠</span>
          <span>/</span>
          <span className="text-primary">Notes</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Notes List */}
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input placeholder="Search Notes" className="pl-10" />
            </div>

            {/* All Notes Section */}
            <div>
              <h3 className="font-medium mb-3">All Notes</h3>
              <div className="space-y-2">
                {notes.map((note) => (
                  <Card
                    key={note.id}
                    className={`cursor-pointer transition-colors ${
                      selectedNote === note.id ? colorClasses[note.color as keyof typeof colorClasses] : "hover:bg-muted/50"
                    }`}
                    onClick={() => setSelectedNote(note.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm mb-1">{note.title}</h4>
                          <p className="text-xs text-muted-foreground">{note.date}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          {/* Note Editor */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Edit Note</CardTitle>
                  <Button>Add Note</Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={currentNote?.content}
                  className="min-h-[300px] resize-none"
                  placeholder="Start writing your note..."
                />

                <div className="space-y-3">
                  <h4 className="font-medium">Change Note Color</h4>
                  <div className="flex space-x-2">
                    {noteColors.map((color) => (
                      <button
                        key={color.name}
                        onClick={() => setSelectedColor(color.name)}
                        className={`w-8 h-8 rounded-full transition-colors ${color.class} ${
                          selectedColor === color.name ? "ring-2 ring-offset-2 ring-foreground" : ""
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default Notes;