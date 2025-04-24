import { GoogleMap, Marker } from "@react-google-maps/api";
import "./Map.css";

interface MapProps {
  location: google.maps.LatLngLiteral | null;
  isLoaded: boolean;
}

const Map = ({ location, isLoaded }: MapProps) => {
  const center = { lat: 40.7128, lng: -74.006 };

  if (!isLoaded) {
    return <div>Loading map...</div>;
  }

  return (
    <GoogleMap
      zoom={15}
      center={location || center}
      mapContainerClassName="mapContainer"
    >
      {location && <Marker position={location} />}
    </GoogleMap>
  );
};

export default Map;
