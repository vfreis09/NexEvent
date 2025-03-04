import usePlacesAutocomplete, {
  getGeocode,
  getLatLng,
} from "use-places-autocomplete";
import { useState } from "react";
import { Form, Dropdown } from "react-bootstrap";

interface PlacesProps {
  setPosition: (position: google.maps.LatLngLiteral) => void;
}

const Places = ({ setPosition }: PlacesProps) => {
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
    setPosition({ lat, lng });
  };

  return (
    <div>
      <Form.Control
        type="text"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setShowSuggestions(true);
        }}
        disabled={!ready}
        placeholder="Search a location"
      />
      {showSuggestions && status === "OK" && (
        <Dropdown show>
          <Dropdown.Menu style={{ width: "100%" }}>
            {data.map(({ place_id, description }) => (
              <Dropdown.Item
                key={place_id}
                onClick={() => handleSelect(description)}
              >
                {description}
              </Dropdown.Item>
            ))}
          </Dropdown.Menu>
        </Dropdown>
      )}
    </div>
  );
};

export default Places;
