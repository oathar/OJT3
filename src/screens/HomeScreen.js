import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Dimensions, Platform, KeyboardAvoidingView, Image } from 'react-native';
import * as Location from 'expo-location';
import { collection, addDoc, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../services/firebase';
import { getDirections } from '../services/directions';
import { checkMatch } from '../services/matching';
import MapComponent from '../components/MapComponent';
import { Ionicons } from '@expo/vector-icons';
import { authService } from '../services/auth/authService';

const { height } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
    const [role, setRole] = useState('rider');
    const [originText, setOriginText] = useState('');
    const [destText, setDestText] = useState('');
    const [originCoords, setOriginCoords] = useState(null);
    const [destCoords, setDestCoords] = useState(null);
    const [route, setRoute] = useState(null);
    const [myTripId, setMyTripId] = useState(null);
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(false);
    const [userName, setUserName] = useState('');

    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission to access location was denied');
                return;
            }

            let location = await Location.getCurrentPositionAsync({});
            setOriginCoords({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude
            });
            setOriginText("Current Location");
            
            // Get current user name
            try {
                const currentUser = await authService.getCurrentUser();
                if (currentUser) {
                    setUserName(currentUser.name || 'User');
                }
            } catch (error) {
                console.log('Error getting user name:', error);
            }
        })();
    }, []);

    useEffect(() => {
        if (!myTripId || !route) return;

        const q = query(collection(db, "trips"), where("role", "==", role === 'rider' ? 'driver' : 'rider'));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const newMatches = [];
            querySnapshot.forEach((doc) => {
                const otherTrip = doc.data();
                otherTrip.id = doc.id;

                if (otherTrip.id === myTripId) return;

                const matchResult = checkMatch(
                    { ...route, role, datetime: new Date().toISOString() },
                    otherTrip
                );

                if (matchResult.isMatch) {
                    newMatches.push({ ...otherTrip, ...matchResult });
                }
            });
            setMatches(newMatches);
        });

        return () => unsubscribe();
    }, [myTripId, route, role]);

    const handleGetRoute = async () => {
        if (!originText || !destText) return;
        setLoading(true);
        try {
            let start = originCoords;
            if (originText !== "Current Location") {
                const geocodedOrigin = await Location.geocodeAsync(originText);
                if (geocodedOrigin.length > 0) {
                    start = { latitude: geocodedOrigin[0].latitude, longitude: geocodedOrigin[0].longitude };
                    setOriginCoords(start);
                }
            }

            const geocodedDest = await Location.geocodeAsync(destText);
            let end = null;
            if (geocodedDest.length > 0) {
                end = { latitude: geocodedDest[0].latitude, longitude: geocodedDest[0].longitude };
                setDestCoords(end);
            }

            if (start && end) {
                const directions = await getDirections(start, end);
                if (directions) {
                    setRoute(directions);
                } else {
                    Alert.alert("Error", "Could not find route. Please check your API key and internet connection.");
                }
            } else {
                Alert.alert("Error", "Could not geocode locations. Please check your addresses.");
            }
        } catch (e) {
            console.error(e);
            Alert.alert("Error", `Failed to get route: ${e.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTrip = async () => {
        if (!route) {
            Alert.alert("Please get route first");
            return;
        }
        setLoading(true);
        try {
            const tripData = {
                role,
                origin: originCoords,
                destination: destCoords,
                encodedPolyline: route.encodedPolyline,
                datetime: new Date().toISOString(),
                status: 'active'
            };
            const docRef = await addDoc(collection(db, "trips"), tripData);
            setMyTripId(docRef.id);
            Alert.alert("Success", "Trip created! Waiting for matches...");
        } catch (e) {
            console.error(e);
            Alert.alert("Error", "Failed to create trip");
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await authService.logout();
            navigation.reset({
                index: 0,
                routes: [{ name: 'Auth' }],
            });
        } catch (error) {
            Alert.alert('Error', 'Failed to logout');
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>RideShare Lite</Text>
                <View style={styles.headerRight}>
                    <Text style={styles.welcomeText}>Hi, {userName}</Text>
                    <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                        <Ionicons name="log-out-outline" size={24} color="#000" />
                    </TouchableOpacity>
                </View>
            </View>
            
            <MapComponent
                origin={originCoords}
                destination={destCoords}
                routeCoordinates={route ? route.routeCoordinates : []}
                matches={matches}
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.bottomSheetWrapper}
            >
                <ScrollView style={styles.bottomSheet} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
                    <View style={styles.dragHandle} />

                    <View style={styles.toggleContainer}>
                        <TouchableOpacity
                            style={[styles.toggleButton, role === 'rider' && styles.activeToggle]}
                            onPress={() => setRole('rider')}
                        >
                            <Ionicons name="person" size={16} color={role === 'rider' ? 'black' : '#666'} style={{ marginRight: 5 }} />
                            <Text style={[styles.toggleText, role === 'rider' && styles.activeToggleText]}>Rider</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.toggleButton, role === 'driver' && styles.activeToggle]}
                            onPress={() => setRole('driver')}
                        >
                            <Ionicons name="car" size={18} color={role === 'driver' ? 'black' : '#666'} style={{ marginRight: 5 }} />
                            <Text style={[styles.toggleText, role === 'driver' && styles.activeToggleText]}>Driver</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.inputContainer}>
                        <View style={styles.inputWrapper}>
                            <View style={[styles.dot, { backgroundColor: 'black' }]} />
                            <TextInput
                                style={styles.input}
                                placeholder="Where from?"
                                value={originText}
                                onChangeText={setOriginText}
                                placeholderTextColor="#666"
                            />
                            {originText.length > 0 && (
                                <TouchableOpacity onPress={() => setOriginText('')}>
                                    <Ionicons name="close-circle" size={18} color="#ccc" />
                                </TouchableOpacity>
                            )}
                        </View>
                        <View style={styles.connectorLine} />
                        <View style={styles.inputWrapper}>
                            <View style={[styles.square, { backgroundColor: 'black' }]} />
                            <TextInput
                                style={styles.input}
                                placeholder="Where to?"
                                value={destText}
                                onChangeText={setDestText}
                                placeholderTextColor="#666"
                            />
                            {destText.length > 0 && (
                                <TouchableOpacity onPress={() => setDestText('')}>
                                    <Ionicons name="close-circle" size={18} color="#ccc" />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    <View style={styles.actionButtons}>
                        <TouchableOpacity
                            style={[styles.primaryButton, (!originText || !destText) && styles.disabledButton]}
                            onPress={handleGetRoute}
                            disabled={loading || !originText || !destText}
                        >
                            <Text style={styles.primaryButtonText}>{loading ? "Calculating..." : "Preview Route"}</Text>
                        </TouchableOpacity>

                        {route && !myTripId && (
                            <TouchableOpacity
                                style={styles.secondaryButton}
                                onPress={handleCreateTrip}
                                disabled={loading}
                            >
                                <Text style={styles.secondaryButtonText}>Confirm Trip</Text>
                            </TouchableOpacity>
                        )}

                        {/* Debug Button */}
                        <TouchableOpacity
                            style={[styles.secondaryButton, { backgroundColor: '#444', marginTop: 10 }]}
                            onPress={() => navigation.navigate('Chat', { tripId: 'debug_trip', myId: 'debug_me' })}
                        >
                            <Text style={styles.secondaryButtonText}>Test Chat UI</Text>
                        </TouchableOpacity>
                    </View>

                    {matches.length > 0 && (
                        <View style={styles.matchesSection}>
                            <Text style={styles.sectionTitle}>Available Rides</Text>
                            {matches.map((match) => (
                                <View key={match.id} style={styles.matchCard}>
                                    <View style={styles.matchHeader}>
                                        <View style={styles.avatarPlaceholder}>
                                            <Ionicons name="person" size={20} color="white" />
                                        </View>
                                        <View style={styles.matchDetails}>
                                            <Text style={styles.matchRole}>{match.role === 'driver' ? 'Driver' : 'Rider'}</Text>
                                            <View style={styles.matchMeta}>
                                                <Ionicons name="git-branch-outline" size={14} color="#666" />
                                                <Text style={styles.matchInfo}> {(match.overlap * 100).toFixed(0)}% Match</Text>
                                            </View>
                                        </View>
                                    </View>
                                    <TouchableOpacity
                                        style={styles.chatButton}
                                        onPress={() => navigation.navigate('Chat', { tripId: match.id, myId: myTripId })}
                                    >
                                        <Ionicons name="chatbubble-ellipses-outline" size={20} color="black" />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#000',
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    welcomeText: {
        fontSize: 16,
        color: '#666',
        marginRight: 15,
    },
    logoutButton: {
        padding: 5,
    },
    bottomSheetWrapper: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        maxHeight: height * 0.65,
    },
    bottomSheet: {
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: -4,
        },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 20,
    },
    dragHandle: {
        width: 40,
        height: 4,
        backgroundColor: '#e0e0e0',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 20,
    },
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: '#f3f3f3',
        borderRadius: 12,
        padding: 4,
        marginBottom: 20,
    },
    toggleButton: {
        flex: 1,
        flexDirection: 'row',
        paddingVertical: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 10,
    },
    activeToggle: {
        backgroundColor: 'white',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    toggleText: {
        fontWeight: '600',
        color: '#666',
        fontSize: 15,
    },
    activeToggleText: {
        color: 'black',
    },
    inputContainer: {
        marginBottom: 20,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f9f9f9',
        borderRadius: 12,
        paddingHorizontal: 15,
        height: 54,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    input: {
        flex: 1,
        marginLeft: 12,
        fontSize: 16,
        color: 'black',
        fontWeight: '500',
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    square: {
        width: 8,
        height: 8,
    },
    connectorLine: {
        width: 2,
        height: 12,
        backgroundColor: '#ddd',
        marginLeft: 18,
        marginVertical: 4,
    },
    actionButtons: {
        gap: 12,
    },
    primaryButton: {
        backgroundColor: 'black',
        paddingVertical: 18,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    disabledButton: {
        backgroundColor: '#ccc',
        shadowOpacity: 0,
        elevation: 0,
    },
    primaryButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    secondaryButton: {
        backgroundColor: '#276EF1',
        paddingVertical: 18,
        borderRadius: 12,
        alignItems: 'center',
    },
    secondaryButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    matchesSection: {
        marginTop: 30,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 15,
        color: '#1a1a1a',
    },
    matchCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: 'white',
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#f0f0f0',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    matchHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#ccc',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    matchDetails: {
        justifyContent: 'center',
    },
    matchRole: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1a1a1a',
    },
    matchMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    matchInfo: {
        fontSize: 14,
        color: '#666',
    },
    chatButton: {
        backgroundColor: '#f3f3f3',
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default HomeScreen;
