import polyline from '@mapbox/polyline';

// OpenRouteService API key - replace with your own key
const OPENROUTESERVICE_API_KEY = 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjBlNTZjNDZhZjk5NzQzYzk5NDg1OWY0OThhODExMjA3IiwiaCI6Im11cm11cjY0In0=';

export const getDirections = async (startLoc, destinationLoc) => {
    try {
        // Format coordinates for OpenRouteService API (longitude, latitude)
        const coordinates = [
            [startLoc.longitude, startLoc.latitude],
            [destinationLoc.longitude, destinationLoc.latitude]
        ];

        // Prepare request body for OpenRouteService directions API
        const requestBody = {
            coordinates: coordinates,
            format: 'geojson',
            instructions_format: 'text',
            language: 'en',
            units: 'km',
            geometry: true,
            geometry_simplify: false,
            instructions: false,
            elevation: false
        };

        // Make request to OpenRouteService API
        const response = await fetch('https://api.openrouteservice.org/v2/directions/driving-car/geojson', {
            method: 'POST',
            headers: {
                'Authorization': OPENROUTESERVICE_API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`OpenRouteService API error: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const data = await response.json();

        if (data.features && data.features.length > 0) {
            // Extract route coordinates from GeoJSON response
            const routeGeometry = data.features[0].geometry;
            const coordinates = routeGeometry.coordinates;
            
            // Convert coordinates to the format expected by the app (latitude, longitude)
            const routeCoordinates = coordinates.map(coord => ({
                latitude: coord[1],
                longitude: coord[0]
            }));

            // Calculate distance and duration
            let distance = 'Unknown';
            let duration = 'Unknown';
            
            if (data.features[0].properties) {
                const properties = data.features[0].properties;
                if (properties.summary) {
                    const summary = properties.summary;
                    distance = `${summary.distance.toFixed(1)} km`;
                    duration = `${Math.round(summary.duration / 60)} min`;
                }
            }

            // Encode polyline for storage/transmission
            const encodedPolyline = polyline.encode(routeCoordinates.map(coord => [coord.latitude, coord.longitude]));

            return {
                routeCoordinates,
                encodedPolyline,
                distance,
                duration
            };
        }
        
        return null;
    } catch (error) {
        console.error("Error fetching directions from OpenRouteService:", error);
        return null;
    }
};