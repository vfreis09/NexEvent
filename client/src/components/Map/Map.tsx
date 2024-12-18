import { useState, useMemo, useCallback, useRef } from "react";
import { GoogleMap, Marker } from "@react-google-maps/api";
import Places from "../Places/Places";
import styles from "./Map.module.css";

type LatLngLiteral = google.maps.LatLngLiteral;

const Map = () => {
  const [location, setLocation] = useState<LatLngLiteral>();
  const mapRef = useRef<google.maps.Map | null>(null);
  const center = useMemo<LatLngLiteral>(() => ({ lat: 43, lng: -80 }), []);

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <Places
        setPosition={(position) => {
          setLocation(position);
          mapRef.current?.panTo(position);
        }}
      />
      <GoogleMap
        zoom={10}
        center={location || center}
        mapContainerClassName={styles.mapContainer}
        onLoad={onLoad}
      >
        {location && <Marker position={location} />}
      </GoogleMap>
    </div>
  );
};

export default Map;
