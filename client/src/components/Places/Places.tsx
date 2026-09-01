import usePlacesAutocomplete, {
  getGeocode,
  getLatLng,
} from "use-places-autocomplete";
import { useState } from "react";
import { Input } from "@/components/ui/input";

interface PlacesProps {
  setPosition: (position: google.maps.LatLngLiteral, address: string) => void;
  isDisabled?: boolean;
}

const Places = ({ setPosition, isDisabled = false }: PlacesProps) => {
  const {
    ready,
    value,
    setValue,
    suggestions: { status, data },
    clearSuggestions,
  } = usePlacesAutocomplete();

  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleSelect = async (address: string) => {
    setValue(address, false);
    clearSuggestions();
    setShowSuggestions(false);
    const results = await getGeocode({ address });
    const { lat, lng } = await getLatLng(results[0]);
    setPosition({ lat, lng }, results[0].formatted_address);
  };

  return (
    <div className="relative">
      <Input
        type="text"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setShowSuggestions(true);
        }}
        disabled={!ready || isDisabled}
        placeholder="Search a location"
      />
      {showSuggestions && status === "OK" && !isDisabled && (
        <ul className="absolute z-10 mt-1 w-full rounded border border-border bg-popover shadow-lg">
          {data.map(({ place_id, description }) => (
            <li key={place_id}>
              <button
                type="button"
                onClick={() => handleSelect(description)}
                className="w-full px-3 py-2 text-left text-sm text-popover-foreground hover:bg-muted"
              >
                {description}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Places;