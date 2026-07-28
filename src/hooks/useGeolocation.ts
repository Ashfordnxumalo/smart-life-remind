import { useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { updateCurrentLocation } from '@/lib/firestore/location';
import { useToast } from '@/hooks/use-toast';
import type { Reminder } from '@/types/reminder';
import { toISO } from '@/lib/firestore/utils';

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  loading: boolean;
  error: string | null;
  permissionGranted: boolean;
}

export const useGeolocation = () => {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    loading: false,
    error: null,
    permissionGranted: false,
  });

  const { toast } = useToast();

  const updateLocation = async (latitude: number, longitude: number, accuracy: number | null) => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      await updateCurrentLocation(user.uid, { latitude, longitude, accuracy });
    } catch (error) {
      console.error('Error updating location:', error);
    }
  };

  const requestLocation = async () => {
    if (!navigator.geolocation) {
      setState(prev => ({ ...prev, error: 'Geolocation not supported' }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
        });
      });

      const { latitude, longitude, accuracy } = position.coords;

      setState({
        latitude,
        longitude,
        accuracy,
        loading: false,
        error: null,
        permissionGranted: true,
      });

      await updateLocation(latitude, longitude, accuracy);

      toast({
        title: "Location Updated",
        description: "Your location has been recorded for location-based reminders.",
      });
    } catch (error: unknown) {
      let errorMessage = 'Failed to get location';
      const geoError = error as GeolocationPositionError;

      if (geoError.code === 1) {
        errorMessage = 'Location access denied. Please enable location permissions.';
      } else if (geoError.code === 2) {
        errorMessage = 'Location unavailable';
      } else if (geoError.code === 3) {
        errorMessage = 'Location request timeout';
      }

      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
        permissionGranted: false,
      }));

      toast({
        title: "Location Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const startWatching = () => {
    if (!navigator.geolocation) return null;

    return navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setState(prev => ({
          ...prev,
          latitude,
          longitude,
          accuracy,
          permissionGranted: true,
        }));
        updateLocation(latitude, longitude, accuracy);
      },
      (error) => {
        console.error('Geolocation watch error:', error);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 60000, // 1 minute
        timeout: 10000,
      }
    );
  };

  const checkNearbyReminders = async (userLat: number, userLng: number): Promise<Reminder[]> => {
    const user = auth.currentUser;
    if (!user) return [];

    try {
      const q = query(
        collection(db, 'users', user.uid, 'reminders'),
        where('completed', '==', false)
      );
      const snap = await getDocs(q);

      const nearbyReminders = snap.docs
        .map((d) => {
          const data = d.data();
          return {
            id: d.id,
            title: data.title as string,
            description: (data.description as string) ?? "",
            category: data.category as Reminder["category"],
            priority: data.priority as Reminder["priority"],
            dueDate: data.dueDate as string,
            dueTime: (data.dueTime as string) ?? null,
            completed: Boolean(data.completed),
            completedAt: toISO(data.completedAt),
            assignedMemberId: (data.assignedMemberId as string) ?? null,
            reminderLocation: (data.reminderLocation as string) ?? null,
            locationLat: (data.locationLat as number) ?? null,
            locationLng: (data.locationLng as number) ?? null,
            locationRadius: (data.locationRadius as number) ?? 500,
            notificationPreferences: (data.notificationPreferences as Reminder["notificationPreferences"]) ?? ["app"],
            createdAt: toISO(data.createdAt) ?? "",
            updatedAt: toISO(data.updatedAt) ?? "",
          } satisfies Reminder;
        })
        .filter((reminder) => {
          if (reminder.locationLat == null || reminder.locationLng == null) return false;

          const distance = calculateDistance(userLat, userLng, reminder.locationLat, reminder.locationLng);
          return distance <= (reminder.locationRadius || 500);
        });

      return nearbyReminders;
    } catch (error) {
      console.error('Error checking nearby reminders:', error);
      return [];
    }
  };

  // Calculate distance between two coordinates in meters
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lng2 - lng1) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  return {
    ...state,
    requestLocation,
    startWatching,
    checkNearbyReminders,
  };
};
