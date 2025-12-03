import React, { useRef, useEffect } from 'react';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { StyleSheet, View, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

const MapComponent = ({ origin, destination, routeCoordinates, matches = [] }) => {
    const mapRef = useRef(null);

    useEffect(() => {
        if (mapRef.current && (origin || destination || (routeCoordinates && routeCoordinates.length > 0))) {
            // Fit to coordinates
            const coords = [];
            if (origin) coords.push(origin);
            if (destination) coords.push(destination);
            if (routeCoordinates && routeCoordinates.length > 0) {
                coords.push(...routeCoordinates);
            }

            // Add a small buffer to ensure markers are visible
            if (coords.length > 0) {
                // Calculate bounds with a small buffer
                let minLat = coords[0].latitude, maxLat = coords[0].latitude;
                let minLng = coords[0].longitude, maxLng = coords[0].longitude;
                
                coords.forEach(coord => {
                    minLat = Math.min(minLat, coord.latitude);
                    maxLat = Math.max(maxLat, coord.latitude);
                    minLng = Math.min(minLng, coord.longitude);
                    maxLng = Math.max(maxLng, coord.longitude);
                });
                
                // Add a small buffer (approximately 0.01 degrees)
                const latBuffer = (maxLat - minLat) * 0.1 || 0.01;
                const lngBuffer = (maxLng - minLng) * 0.1 || 0.01;
                
                mapRef.current.fitToCoordinates([
                    { latitude: minLat - latBuffer, longitude: minLng - lngBuffer },
                    { latitude: maxLat + latBuffer, longitude: maxLng + lngBuffer }
                ], {
                    edgePadding: { top: 100, right: 50, bottom: 300, left: 50 },
                    animated: true,
                });
            }
        }
    }, [origin, destination, routeCoordinates]);

    return (
        <View style={styles.container}>
            <MapView
                ref={mapRef}
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                initialRegion={{
                    latitude: 37.78825,
                    longitude: -122.4324,
                    latitudeDelta: 0.0922,
                    longitudeDelta: 0.0421,
                }}
            >
                {origin && <Marker coordinate={origin} title="Origin" pinColor="black" />}
                {destination && <Marker coordinate={destination} title="Destination" pinColor="black" />}

                {routeCoordinates && routeCoordinates.length > 0 && (
                    <Polyline
                        coordinates={routeCoordinates}
                        strokeWidth={4}
                        strokeColor="#000000" // Black route
                    />
                )}

                {matches.map((match, index) => (
                    match.routeCoordinates && match.routeCoordinates.length > 0 && (
                        <Polyline
                            key={`match-${index}`}
                            coordinates={match.routeCoordinates}
                            strokeWidth={3}
                            strokeColor="#276EF1" // Uber Blue for matches
                            lineDashPattern={[5, 5]}
                        />
                    )
                ))}
            </MapView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    map: {
        ...StyleSheet.absoluteFillObject,
    },
});

export default MapComponent;