import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

interface EventFormProps {
  isEditing: boolean;
}

const apiKey = import.meta.env.VITE_PUBLIC_API_KEY as string;
const mapID = import.meta.env.VITE_PUBLIC_MAP_ID as string;

const EventForm: React.FC<EventFormProps> = ({ isEditing }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDateTime, setEventDateTime] = useState("");
  const [location, setLocation] = useState("");
  const [latLng, setLatLng] = useState<{ lat: number; lng: number } | null>(null);

  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const eventId = id ? parseInt(id) : null;

  useEffect(() => {
    if (isEditing && eventId && !isNaN(eventId)) {
      const fetchEvent = async () => {
        try {
          const response = await fetch(
            `http://localhost:3000/api/events/${eventId}`
          );
          if (!response.ok) {
            throw new Error("Failed to fetch event details");
          }
          const data = await response.json();
          const formattedDateTime = new Date(data.event_datetime).toISOString().slice(0, 16);
          setTitle(data.title);
          setDescription(data.description);
          setEventDateTime(formattedDateTime);
          setLocation(data.location || "");
          setLatLng(data.latLng || null);
        } catch (error) {
          console.error("Error fetching event:", error);
        }
      };

      fetchEvent();
    }
  }, [isEditing, eventId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = `http://localhost:3000/api/events/${isEditing ? `${eventId}` : ""}`;
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          title,
          description,
          eventDateTime,
          location,
          latLng,
        }),
      });

      if (!response.ok) {
        throw new Error(isEditing ? "Event update failed" : "Event creation failed");
      }

      const result = await response.json();
      console.log("Success:", result);
      navigate("/");
      alert(isEditing ? "Event updated successfully" : "Event created successfully");
    } catch (error) {
      console.error(isEditing ? "Event update failed" : "Event creation failed", error);
    }
  };

  // Map script loading
  useEffect(() => {
    const loadGoogleMapsScript = () => {
      if (!document.getElementById("google-maps-script")) {
        const script = document.createElement("script");
        script.id = "google-maps-script";
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry,marker&callback=initMap`;
        script.async = true;
        script.defer = true;
        document.body.appendChild(script);
      }
    };

    if (!window.google) {
      window.initMap = initMap; // Ensure `initMap` is set before script loads
      loadGoogleMapsScript();
    } else {
      initMap();
    }
  }, []);

  // Initialize the map
  const initMap = () => {
    if (!window.google) {
      console.error("Google Maps not loaded properly.");
      return;
    }

    const map = new google.maps.Map(document.getElementById("map") as HTMLElement, {
      center: latLng || { lat: -34.397, lng: 150.644 },
      zoom: 8,
      mapId: mapID,
    });

    // Create a Geocoder instance
    const geocoder = new google.maps.Geocoder();

    // Create an AdvancedMarkerElement instance
    const marker = new google.maps.marker.AdvancedMarkerElement({
      map,
      position: latLng,
      gmpDraggable: true,
    });

    // Update position if latLng changes
    if (latLng) {
      marker.position = latLng;
      map.setCenter(latLng);
    }

    // Add click listener for the map to place the marker
    map.addListener("click", (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        const position = {
          lat: e.latLng.lat(),
          lng: e.latLng.lng(),
        };
        marker.position = position;
        setLatLng(position);

        // Reverse geocoding to get the address from the clicked position
        geocoder.geocode({ location: position }, (results, status) => {
          if (status === "OK" && results && results[0]) {
            // Set the location state with the formatted address
            setLocation(results[0].formatted_address);
          } else {
            console.error("Geocode was unsuccessful for the following reason:", status);
            setLocation("Unknown location");
          }
        });
      }
    });

    // Initialize the Autocomplete functionality for the location search
    const input = document.getElementById("location-search") as HTMLInputElement;
    const autocomplete = new google.maps.places.Autocomplete(input);

    // Restrict the search to certain types (optional)
    autocomplete.setTypes(["geocode"]);

    // Listen for when a user selects a place
    autocomplete.addListener("place_changed", () => {
    const place = autocomplete.getPlace();
    if (!place.geometry || !place.geometry.location) {
      console.error("Place details or location are unavailable.");
      return;
    }

    // Set the position of the marker to the selected place
    const position = place.geometry.location;
    marker.position = position;
    setLatLng({ lat: position.lat(), lng: position.lng() });

    // Update the map's center and zoom
    map.setCenter(position);
    map.setZoom(15);

    // Update the location state with the place's formatted address
    setLocation(place.formatted_address || "Unknown location");
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Title:</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>
      <div>
        <label>Description:</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </div>
      <div>
        <label>Event Date and Time:</label>
        <input
          type="datetime-local"
          value={eventDateTime}
          onChange={(e) => setEventDateTime(e.target.value)}
          required
        />
      </div>
      <div>
        <label>Search Location:</label>
        <input
          type="text"
          id="location-search"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Enter location"
        />
      </div>
      <div id="map" style={{ width: "100%", height: "400px", marginTop: "10px" }}></div>
      <button type="submit">
        {isEditing ? "Update Event" : "Create Event"}
      </button>
    </form>
  );
};

export default EventForm;
