declare namespace google.maps.places {
  class AutocompleteSuggestion {
    constructor();
    requestSuggestions(
      request: { input: string },
      callback: (
        predictions: AutocompletePrediction[],
        status: PlacesServiceStatus
      ) => void
    ): void;
  }
}
