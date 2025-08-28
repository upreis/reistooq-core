import { Card } from "@/components/ui/card";

export function WelcomeCard() {
  return (
    <Card className="relative overflow-hidden bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0">
      <div className="relative z-10 p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h2 className="text-xl font-semibold mb-1">Welcome Jonathan Deo</h2>
            <p className="text-blue-100 mb-6 text-sm">Check all the statistics</p>
            
            <div className="flex gap-8 text-white">
              <div>
                <div className="text-3xl font-bold">573</div>
                <div className="text-xs text-blue-200">New Leads</div>
              </div>
              <div>
                <div className="text-3xl font-bold">87%</div>
                <div className="text-xs text-blue-200">Conversion</div>
              </div>
            </div>
          </div>
          
          <div className="flex-shrink-0 relative">
            {/* Character illustration placeholder */}
            <div className="w-24 h-24 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full flex items-center justify-center relative">
              <div className="w-16 h-16 bg-white/30 rounded-full"></div>
              {/* Megaphone */}
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded transform rotate-12"></div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>
    </Card>
  );
}