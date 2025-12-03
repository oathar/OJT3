import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const MapComponent = ({ origin, destination, routeCoordinates, matches = [] }) => {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>Map View (Web Fallback)</Text>
            <Text>Origin: {origin ? `${origin.latitude.toFixed(4)}, ${origin.longitude.toFixed(4)}` : 'Not set'}</Text>
            <Text>Destination: {destination ? `${destination.latitude.toFixed(4)}, ${destination.longitude.toFixed(4)}` : 'Not set'}</Text>
            <Text>Route Points: {routeCoordinates?.length || 0}</Text>
            <Text>Matches on map: {matches.length}</Text>
            
            {routeCoordinates && routeCoordinates.length > 0 && (
                <View style={styles.routeInfo}>
                    <Text>Route Preview:</Text>
                    <Text>Start: {routeCoordinates[0]?.latitude.toFixed(4)}, {routeCoordinates[0]?.longitude.toFixed(4)}</Text>
                    <Text>End: {routeCoordinates[routeCoordinates.length - 1]?.latitude.toFixed(4)}, {routeCoordinates[routeCoordinates.length - 1]?.longitude.toFixed(4)}</Text>
                </View>
            )}
            
            <View style={styles.placeholder}>
                <Text>Map rendering is optimized for Android/iOS in this MVP.</Text>
                <Text>Please use an Android/iOS emulator or device for the full map experience.</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        height: '50%',
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
        padding: 20,
    },
    text: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#333',
    },
    routeInfo: {
        marginTop: 10,
        padding: 10,
        backgroundColor: '#e0e0e0',
        borderRadius: 5,
    },
    placeholder: {
        marginTop: 20,
        padding: 15,
        backgroundColor: '#fff',
        borderRadius: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
    }
});

export default MapComponent;