"use client";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useCallback, useEffect, useRef, useState } from "react";
import SearchableDropdown from "../SearchableDropdown";
import { ArrowPathIcon } from "@heroicons/react/20/solid";

mapboxgl.accessToken =
  "pk.eyJ1IjoiZ2VuZXJhbGtodW4iLCJhIjoiY2t0bGl5NXduMXdmaTJ2bXA3NXgyMXR4aiJ9.dBaNof7U4QoJImXeDk1QXg";

interface StoreObj {
  id: string;
  lat?: string;
  long?: string;
  name: string;
  note: string;
  address?: string;
  phone?: string;
}

export default function MapboxMap() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [currentLocationMarker, setCurrentLocationMarker] =
    useState<mapboxgl.Marker | null>(null);
  const [businessMarker, setBusinessMarker] = useState<mapboxgl.Marker | null>(
    null
  );
  const [selectedBusiness, setSelectedBusiness] = useState<StoreObj | null>(
    null
  );
  const [checkInStatus, setCheckInStatus] = useState<
    "idle" | "tooFar" | "success" | "updateRequest" | "locationAdded"
  >("idle");
  const [currentUserLocation, setCurrentUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  // Store session updates for businesses that had no coordinates
  const [sessionUpdates, setSessionUpdates] = useState<
    Record<string, { lat: string; long: string }>
  >({});

  // Calculate distance between two coordinates in meters
  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  };

  const fitBothMarkers = useCallback(() => {
    if (!mapRef.current || !currentLocationMarker || !businessMarker) return;

    const currentLngLat = currentLocationMarker.getLngLat();
    const businessLngLat = businessMarker.getLngLat();

    // Create bounds that include both markers
    const bounds = new mapboxgl.LngLatBounds()
      .extend(currentLngLat)
      .extend(businessLngLat);

    // Different padding for mobile vs desktop
    const isMobile = window.innerWidth < 640;
    const padding = isMobile
      ? { top: 80, bottom: 200, left: 20, right: 20 } // Bottom padding for mobile panel
      : { top: 200, bottom: 100, left: 100, right: 100 }; // Top padding for desktop panel stack

    // Fit the map to show both markers with appropriate padding
    mapRef.current.fitBounds(bounds, {
      padding,
      maxZoom: 15, // Prevent zooming in too much
    });
  }, [currentLocationMarker, businessMarker]);

  const handleAddNewLocation = () => {
    if (!selectedBusiness || !currentUserLocation) return;

    // Store the update in session state
    const newCoordinates = {
      lat: currentUserLocation.lat.toString(),
      long: currentUserLocation.lng.toString(),
    };

    setSessionUpdates((prev) => ({
      ...prev,
      [selectedBusiness.id]: newCoordinates,
    }));

    // Simulate adding location to database by updating the selected business
    const updatedBusiness = {
      ...selectedBusiness,
      ...newCoordinates,
    };

    setSelectedBusiness(updatedBusiness);
    setCheckInStatus("locationAdded");

    // Add business marker at current location
    if (businessMarker) {
      businessMarker.setLngLat([
        currentUserLocation.lng,
        currentUserLocation.lat,
      ]);
    } else {
      const newBusinessMarker = new mapboxgl.Marker({ color: "blue" })
        .setLngLat([currentUserLocation.lng, currentUserLocation.lat])
        .addTo(mapRef.current!);
      setBusinessMarker(newBusinessMarker);
    }

    // Fit both markers
    setTimeout(() => {
      fitBothMarkers();
    }, 100);
  };

  // Helper function to get business with session updates applied
  const getBusinessWithSessionData = (business: StoreObj): StoreObj => {
    const sessionUpdate = sessionUpdates[business.id];
    if (sessionUpdate) {
      return {
        ...business,
        lat: sessionUpdate.lat,
        long: sessionUpdate.long,
      };
    }
    return business;
  };

  const handleBusinessSelect = (business: StoreObj | null) => {
    // Apply session updates to the business data
    const businessWithSessionData = business
      ? getBusinessWithSessionData(business)
      : null;

    setSelectedBusiness(businessWithSessionData);
    setCheckInStatus("idle");

    // Remove existing business marker if no business selected
    if (!businessWithSessionData) {
      if (businessMarker) {
        businessMarker.remove();
        setBusinessMarker(null);
      }
      return;
    }

    // Check if the selected business has coordinates
    if (
      businessWithSessionData &&
      businessWithSessionData.lat &&
      businessWithSessionData.long
    ) {
      const lng = parseFloat(businessWithSessionData.long);
      const lat = parseFloat(businessWithSessionData.lat);

      let currentBusinessMarker = businessMarker;

      // Add or update marker for business (blue)
      if (businessMarker) {
        businessMarker.setLngLat([lng, lat]);
      } else {
        const newBusinessMarker = new mapboxgl.Marker({ color: "blue" })
          .setLngLat([lng, lat])
          .addTo(mapRef.current!);
        setBusinessMarker(newBusinessMarker);
        currentBusinessMarker = newBusinessMarker;
      }

      // Refresh current location and fit markers logic...
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const currentLng = position.coords.longitude;
            const currentLat = position.coords.latitude;
            setCurrentUserLocation({ lat: currentLat, lng: currentLng });

            // Update current location marker
            if (currentLocationMarker) {
              currentLocationMarker.setLngLat([currentLng, currentLat]);
            } else {
              const newCurrentLocationMarker = new mapboxgl.Marker({
                color: "red",
              })
                .setLngLat([currentLng, currentLat])
                .addTo(mapRef.current!);
              setCurrentLocationMarker(newCurrentLocationMarker);
            }

            // Fit both markers in view with updated current location
            const currentLngLat = { lng: currentLng, lat: currentLat };
            const businessLngLat = currentBusinessMarker!.getLngLat();

            const bounds = new mapboxgl.LngLatBounds()
              .extend([currentLngLat.lng, currentLngLat.lat])
              .extend(businessLngLat);

            setTimeout(() => {
              // Different padding for mobile vs desktop
              const isMobile = window.innerWidth < 640;
              const padding = isMobile
                ? { top: 80, bottom: 200, left: 20, right: 20 }
                : { top: 200, bottom: 100, left: 100, right: 100 };

              mapRef.current?.fitBounds(bounds, {
                padding,
                maxZoom: 15,
              });
            }, 100);
          },
          (error) => {
            console.warn("Could not refresh current location:", error.message);

            // Fallback: If we can't get current location, fit view with existing markers
            if (currentLocationMarker && currentBusinessMarker) {
              const currentLngLat = currentLocationMarker.getLngLat();
              const businessLngLat = currentBusinessMarker.getLngLat();

              const bounds = new mapboxgl.LngLatBounds()
                .extend(currentLngLat)
                .extend(businessLngLat);

              setTimeout(() => {
                // Different padding for mobile vs desktop
                const isMobile = window.innerWidth < 640;
                const padding = isMobile
                  ? { top: 80, bottom: 200, left: 20, right: 20 }
                  : { top: 200, bottom: 100, left: 100, right: 100 };

                mapRef.current?.fitBounds(bounds, {
                  padding,
                  maxZoom: 15,
                });
              }, 100);
            } else {
              // Just zoom to business if no current location
              mapRef.current?.flyTo({ center: [lng, lat], zoom: 15 });
            }
          }
        );
      }
    } else {
      // Business selected but has no coordinates - remove business marker
      if (businessMarker) {
        businessMarker.remove();
        setBusinessMarker(null);
      }

      // Center on current location if available
      if (currentLocationMarker) {
        const currentLngLat = currentLocationMarker.getLngLat();
        mapRef.current?.flyTo({
          center: [currentLngLat.lng, currentLngLat.lat],
          zoom: 14,
        });
      } else {
        // Get current location if we don't have it
        handleAddCurrentLocation();
      }
    }
  };

  const handleActionButton = () => {
    if (!selectedBusiness || !currentUserLocation) return;

    // If store has coordinates (existing location)
    if (selectedBusiness.lat && selectedBusiness.long) {
      const storeLat = parseFloat(selectedBusiness.lat);
      const storeLng = parseFloat(selectedBusiness.long);

      const distance = calculateDistance(
        currentUserLocation.lat,
        currentUserLocation.lng,
        storeLat,
        storeLng
      );

      console.log("Distance:", distance, "meters");

      // Check if user is within 100 meters (you can adjust this threshold)
      if (distance <= 100) {
        setCheckInStatus("success");
      } else {
        setCheckInStatus("tooFar");
      }
    } else {
      // Store doesn't have coordinates - add new location
      handleAddNewLocation();
    }
  };

  const handleConfirmLocationUpdate = () => {
    setCheckInStatus("updateRequest");
  };

  const handleAddCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lng = position.coords.longitude;
        const lat = position.coords.latitude;
        setCurrentUserLocation({ lat, lng });

        // Add or update current location marker (red)
        if (currentLocationMarker) {
          // Reposition existing marker
          currentLocationMarker.setLngLat([lng, lat]);
        } else {
          // Create new marker and update state
          const newCurrentLocationMarker = new mapboxgl.Marker({ color: "red" })
            .setLngLat([lng, lat])
            .addTo(mapRef.current!);
          setCurrentLocationMarker(newCurrentLocationMarker);
        }

        // If business is selected, fit both markers, otherwise just center on current location
        if (businessMarker) {
          setTimeout(() => {
            fitBothMarkers();
          }, 100);
        } else {
          mapRef.current?.flyTo({ center: [lng, lat], zoom: 14 });
        }
      },
      (error) => {
        alert("Error getting location: " + error.message);
      }
    );
  }, [currentLocationMarker, businessMarker, fitBothMarkers]);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v11",
      center: [100.523186, 13.736717], // Bangkok, Thailand
      zoom: 10,
    });

    mapRef.current = map;

    // Wait for map to load before requesting location
    map.on("load", () => {
      handleAddCurrentLocation();
    });

    return () => {
      // Clean up markers when component unmounts
      if (currentLocationMarker) {
        currentLocationMarker.remove();
      }
      if (businessMarker) {
        businessMarker.remove();
      }
      map.remove();
    };
  }, []);

  const renderActionButton = () => {
    if (!selectedBusiness) return null;

    switch (checkInStatus) {
      case "success":
        return (
          <div className="bg-green-100 border border-green-400 text-green-700 px-3 py-2 rounded text-xs sm:text-sm leading-relaxed">
            ยืนยันตำแหน่งร้านสำเร็จ ขอบคุณค่ะ
          </div>
        );

      case "tooFar":
        return (
          <div className="space-y-2">
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-3 py-2 rounded text-xs sm:text-sm leading-relaxed">
              ตำแหน่งของท่านอยู่ห่างจากตำแหน่งที่บันทึกไว้
              ต้องการแจ้งตำแหน่งใหม่หรือไม่?
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleConfirmLocationUpdate}
                className="py-2.5 sm:py-2 px-4 rounded font-medium text-sm bg-orange-500 hover:bg-orange-600 text-white touch-manipulation"
              >
                ยืนยัน
              </button>
            </div>
          </div>
        );

      case "updateRequest":
        return (
          <div className="bg-blue-100 border border-blue-400 text-blue-700 px-3 py-2 rounded text-xs sm:text-sm leading-relaxed">
            ทำการส่งคำขอเพื่อแก้ไขตำแหน่งสำเร็จ ขอบคุณค่ะ
          </div>
        );

      case "locationAdded":
        return (
          <div className="bg-green-100 border border-green-400 text-green-700 px-3 py-2 rounded text-xs sm:text-sm leading-relaxed">
            บันทึกตำแหน่งร้านสำเร็จ ขอบคุณค่ะ
          </div>
        );

      default:
        return (
          <div className="flex justify-end">
            <button
              onClick={handleActionButton}
              className={`py-2.5 sm:py-2 px-4 rounded font-medium text-sm touch-manipulation ${
                selectedBusiness.lat && selectedBusiness.long
                  ? "bg-green-500 hover:bg-green-600 text-white"
                  : "bg-blue-500 hover:bg-blue-600 text-white"
              }`}
            >
              {selectedBusiness.lat && selectedBusiness.long
                ? "ยืนยัน ตำแหน่งร้าน"
                : "เพิ่ม/บันทึก ตำแหน่งร้าน"}
            </button>
          </div>
        );
    }
  };

  return (
    <div className="relative w-full h-screen">
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Top Controls - Always at top */}
      <div className="absolute top-4 left-4 z-10 space-y-4">
        <div className="flex gap-2 items-center">
          <button
            onClick={handleAddCurrentLocation}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-3 sm:px-4 py-2 rounded shadow-md text-sm sm:text-base"
            aria-label="Refresh current location"
          >
            <ArrowPathIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">รีเฟรช</span>
          </button>
          <SearchableDropdown
            onBusinessSelect={handleBusinessSelect}
            onRefocusCurrentLocation={() => {
              if (currentLocationMarker) {
                const currentLngLat = currentLocationMarker.getLngLat();
                mapRef.current?.flyTo({
                  center: [currentLngLat.lng, currentLngLat.lat],
                  zoom: 14,
                });
              } else {
                handleAddCurrentLocation();
              }
            }}
          />
        </div>

        {/* Business Detail Panel - Desktop only */}
        {selectedBusiness && (
          <div className="hidden sm:block">
            <div className="bg-white shadow-lg rounded-lg p-3">
              <div className="mb-3">
                <h3 className="text-base font-semibold text-gray-800 leading-tight">
                  {selectedBusiness.name}
                </h3>
                <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                  {selectedBusiness.note}
                </p>
              </div>

              <div className="space-y-2 mb-3">
                {selectedBusiness.address && (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                      ที่อยู่
                    </label>
                    <p className="text-xs text-gray-800 leading-relaxed">
                      {selectedBusiness.address}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  {selectedBusiness.phone && (
                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                        เบอร์โทรศัพท์
                      </label>
                      <p className="text-xs text-gray-800">
                        {selectedBusiness.phone}
                      </p>
                    </div>
                  )}

                  {selectedBusiness.lat && selectedBusiness.long && (
                    <div className={selectedBusiness.phone ? "" : "col-span-2"}>
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                        ตำแหน่ง
                      </label>
                      <p className="text-xs text-gray-800 font-mono">
                        {parseFloat(selectedBusiness.lat).toFixed(4)},{" "}
                        {parseFloat(selectedBusiness.long).toFixed(4)}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {renderActionButton()}
            </div>
          </div>
        )}
      </div>

      {/* Mobile Panel - Bottom */}
      {selectedBusiness && (
        <div className="sm:hidden absolute bottom-0 left-0 right-0 z-10">
          <div className="bg-white shadow-lg rounded-t-lg p-3 border-t">
            <div className="mb-2">
              <h3 className="text-base font-semibold text-gray-800 leading-tight truncate">
                {selectedBusiness.name}
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
                {selectedBusiness.note}
              </p>
            </div>

            {/* Compact info layout for mobile */}
            <div className="space-y-2 mb-3">
              {selectedBusiness.address && (
                <div>
                  <span className="text-xs font-medium text-gray-500">
                    ที่อยู่:{" "}
                  </span>
                  <span className="text-xs text-gray-800">
                    {selectedBusiness.address}
                  </span>
                </div>
              )}

              <div className="flex gap-4">
                {selectedBusiness.phone && (
                  <div>
                    <span className="text-xs font-medium text-gray-500">
                      โทร:{" "}
                    </span>
                    <span className="text-xs text-gray-800">
                      {selectedBusiness.phone}
                    </span>
                  </div>
                )}

                {selectedBusiness.lat && selectedBusiness.long && (
                  <div>
                    <span className="text-xs font-medium text-gray-500">
                      ตำแหน่ง:{" "}
                    </span>
                    <span className="text-xs text-gray-800 font-mono">
                      {parseFloat(selectedBusiness.lat).toFixed(4)},{" "}
                      {parseFloat(selectedBusiness.long).toFixed(4)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {renderActionButton()}
          </div>
        </div>
      )}
    </div>
  );
}
