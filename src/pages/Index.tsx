import { Dashboard } from "@/components/Dashboard";
import { LocationTracker } from "@/components/LocationTracker";
import { AppFooter } from "@/components/AppFooter";

const Index = () => {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex-1 space-y-6">
        <Dashboard />
        <div className="container mx-auto px-4 pb-6">
          <LocationTracker />
        </div>
      </div>
      <AppFooter />
    </div>
  );
};

export default Index;
