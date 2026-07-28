import { useEffect, useState } from 'react';
import { MapPin, Navigation, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useToast } from '@/hooks/use-toast';
import type { Reminder } from '@/types/reminder';

export const LocationTracker = () => {
  const [watchId, setWatchId] = useState<number | null>(null);
  const [nearbyReminders, setNearbyReminders] = useState<Reminder[]>([]);
  const { 
    latitude, 
    longitude, 
    accuracy, 
    loading, 
    error, 
    permissionGranted,
    requestLocation,
    startWatching,
    checkNearbyReminders 
  } = useGeolocation();
  const { toast } = useToast();

  useEffect(() => {
    if (latitude && longitude) {
      checkNearbyReminders(latitude, longitude).then(reminders => {
        if (reminders.length > 0 && reminders.length !== nearbyReminders.length) {
          setNearbyReminders(reminders);
          
          // Show notification for new nearby reminders
          if (reminders.length > nearbyReminders.length) {
            toast({
              title: "Nearby Reminder",
              description: `You have ${reminders.length} reminder(s) near your location!`,
            });
          }
        }
      });
    }
  }, [latitude, longitude, nearbyReminders.length]);

  const enableLocationTracking = async () => {
    const id = startWatching();
    if (id !== null) {
      setWatchId(id);
      toast({
        title: "Location Tracking Enabled",
        description: "You'll receive notifications when near reminder locations.",
      });
    }
  };

  const disableLocationTracking = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
      setNearbyReminders([]);
      toast({
        title: "Location Tracking Disabled",
        description: "Location-based reminders have been turned off.",
      });
    }
  };

  if (!navigator.geolocation) {
    return (
      <Card className="border-destructive/20">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2 text-destructive">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">Geolocation not supported by your browser</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center">
          <MapPin className="w-4 h-4 mr-2" />
          Location Services
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!permissionGranted ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Enable location services to receive notifications when you're near reminder locations.
            </p>
            <Button onClick={requestLocation} disabled={loading} className="w-full">
              <Navigation className="w-4 h-4 mr-2" />
              {loading ? 'Getting Location...' : 'Enable Location'}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <p className="font-medium">Current Location</p>
                {latitude && longitude && (
                  <p className="text-muted-foreground">
                    {latitude.toFixed(6)}, {longitude.toFixed(6)}
                  </p>
                )}
                {accuracy && (
                  <p className="text-xs text-muted-foreground">
                    Accuracy: ±{Math.round(accuracy)}m
                  </p>
                )}
              </div>
              <Badge variant={watchId ? "default" : "secondary"}>
                {watchId ? "Tracking" : "Inactive"}
              </Badge>
            </div>

            <div className="flex gap-2">
              {!watchId ? (
                <Button onClick={enableLocationTracking} size="sm" className="flex-1">
                  Start Tracking
                </Button>
              ) : (
                <Button onClick={disableLocationTracking} variant="outline" size="sm" className="flex-1">
                  Stop Tracking
                </Button>
              )}
              <Button onClick={requestLocation} variant="outline" size="sm">
                <Navigation className="w-4 h-4" />
              </Button>
            </div>

            {nearbyReminders.length > 0 && (
              <div className="mt-4 p-3 bg-primary/10 rounded-lg">
                <p className="text-sm font-medium text-primary">
                  {nearbyReminders.length} reminder(s) nearby
                </p>
                <div className="mt-2 space-y-1">
                  {nearbyReminders.slice(0, 3).map((reminder) => (
                    <p key={reminder.id} className="text-xs text-muted-foreground">
                      • {reminder.title}
                    </p>
                  ))}
                  {nearbyReminders.length > 3 && (
                    <p className="text-xs text-muted-foreground">
                      ... and {nearbyReminders.length - 3} more
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="flex items-center space-x-2 text-destructive">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};