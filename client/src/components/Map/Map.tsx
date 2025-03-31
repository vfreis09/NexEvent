import { useEffect, useState } from "react";
import { GoogleMap, Marker } from "@react-google-maps/api";
import "./Map.css";

interface MapProps {
  location: google.maps.LatLngLiteral | null;
  isLoaded: boolean;
}

const Map = ({ location, isLoaded }: MapProps) => {
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);

  const center = { lat: 40.7128, lng: -74.006 };

  const onMapLoad = (map: google.maps.Map) => {
    setMapInstance(map);
  };

  useEffect(() => {
    if (mapInstance && location) {
      new google.maps.Marker({
        position: location,
        map: mapInstance,
        title: "Event Location",
      });
    }
  }, [mapInstance, location]);

  if (!isLoaded) {
    return <div>Loading map...</div>;
  }

  return (
    <GoogleMap
      zoom={15}
      center={location || center}
      mapContainerClassName="mapContainer"
      onLoad={onMapLoad}
    >
      {location && <Marker position={location} />}
    </GoogleMap>
  );
};

export default Map;
