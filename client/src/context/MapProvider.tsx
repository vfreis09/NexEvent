import React, { createContext, useContext } from "react";
import { useLoadScript, Libraries } from "@react-google-maps/api";

const MapContext = createContext<any>(null);

interface MapProviderProps {
  children: React.ReactNode;
}

const apiKey = import.meta.env.VITE_PUBLIC_API_KEY as string;

const libraries: Libraries = ["places"];

const MapProvider: React.FC<MapProviderProps> = ({ children }) => {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: apiKey,
    libraries,
  });

  if (loadError) {
    return <div>Error loading map: {loadError.message}</div>;
  }

  return (
    <MapContext.Provider value={{ isLoaded, loadError }}>
      {isLoaded ? children : <div>Loading...</div>}
    </MapContext.Provider>
  );
};

export const useMapContext = () => {
  return useContext(MapContext);
};

export default MapProvider;
