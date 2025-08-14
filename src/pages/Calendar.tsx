import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date(2025, 7)); // August 2025
  const [viewMode, setViewMode] = useState<"Month" | "Week" | "Day" | "Agenda">("Month");

  const events = [
    { id: 1, title: "Thrice event For two Days", date: 4, duration: 2, color: "bg-purple-500" },
    { id: 2, title: "Lunch with Mr.Raw", date: 12, color: "bg-blue-500" },
    { id: 3, title: "Going For Party of ...", date: 15, color: "bg-blue-500" },
    { id: 4, title: "Learn ReactJs", date: 17, color: "bg-green-500" },
    { id: 5, title: "Research of makin...", date: 19, color: "bg-purple-500" },
    { id: 6, title: "Launching meetku...", date: 20, color: "bg-pink-500" },
    { id: 7, title: "Learn lonic", date: 23, color: "bg-yellow-500" },
    { id: 8, title: "Learn lonic", date: 24, color: "bg-yellow-500" },
  ];

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const renderCalendarDays = () => {
    const days = [];
    const prevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 0).getDate();
    
    // Previous month days
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      days.push(
        <div key={`prev-${prevMonth - i}`} className="h-24 p-2 border border-muted text-muted-foreground bg-muted/20">
          <div className="text-sm">{prevMonth - i}</div>
        </div>
      );
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const dayEvents = events.filter(event => event.date === day);
      
      days.push(
        <div key={day} className="h-24 p-2 border border-muted hover:bg-muted/50 transition-colors">
          <div className="text-sm font-medium mb-1">{day}</div>
          <div className="space-y-1">
            {dayEvents.map((event) => (
              <div
                key={event.id}
                className={`text-xs px-2 py-1 rounded text-white truncate ${event.color}`}
              >
                {event.title}
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Next month days to fill the grid
    const totalDays = days.length;
    const remainingDays = 42 - totalDays; // 6 rows × 7 days
    for (let day = 1; day <= remainingDays; day++) {
      days.push(
        <div key={`next-${day}`} className="h-24 p-2 border border-muted text-muted-foreground bg-muted/20">
          <div className="text-sm">{day}</div>
        </div>
      );
    }

    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <span>🏠</span>
          <span>/</span>
          <span className="text-primary">Calendar</span>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button variant="outline" size="sm">Today</Button>
                <Button variant="ghost" size="sm" onClick={() => navigateMonth('prev')}>
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </Button>
                <Button variant="ghost" size="sm" onClick={() => navigateMonth('next')}>
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>

              <h2 className="text-xl font-bold text-primary">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>

              <div className="flex items-center space-x-2">
                {["Month", "Week", "Day", "Agenda"].map((mode) => (
                  <Button
                    key={mode}
                    variant={viewMode === mode ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode(mode as typeof viewMode)}
                  >
                    {mode}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Calendar Header */}
            <div className="grid grid-cols-7 mb-2">
              {dayNames.map((day) => (
                <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-0 border border-muted rounded-lg overflow-hidden">
              {renderCalendarDays()}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Calendar;