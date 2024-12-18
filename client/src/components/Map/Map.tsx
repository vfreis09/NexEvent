import { GoogleMap, Marker } from "@react-google-maps/api";
import styles from "./Map.module.css";

type MapProps = {
  location: google.maps.LatLngLiteral | null;
};

const Map = ({ location }: MapProps) => {
  const center = { lat: 43, lng: -80 };

  return (
    <GoogleMap
      zoom={10}
      center={location || center}
      mapContainerClassName={styles.mapContainer}
    >
      {location && <Marker position={location} />}
    </GoogleMap>
  );
};

export default Map;
