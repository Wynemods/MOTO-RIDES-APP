import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Text,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import ApiService from '../services/api.service';

interface Location {
  latitude: number;
  longitude: number;
  address: string;
  name?: string;
}

interface LocationSearchProps {
  placeholder: string;
  value: string;
  onLocationSelect: (location: Location) => void;
  style?: any;
}

export default function LocationSearch({
  placeholder,
  value,
  onLocationSelect,
  style,
}: LocationSearchProps) {
  const [searchText, setSearchText] = useState(value);
  const [suggestions, setSuggestions] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    setSearchText(value);
  }, [value]);

  const searchPlaces = async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoading(true);
    try {
      const places = await ApiService.searchPlaces(query);
      setSuggestions(places);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Search places error:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTextChange = (text: string) => {
    setSearchText(text);
    searchPlaces(text);
  };

  const handleLocationSelect = (location: Location) => {
    setSearchText(location.address);
    setShowSuggestions(false);
    onLocationSelect(location);
  };

  const handleFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const renderSuggestion = ({ item }: { item: Location }) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => handleLocationSelect(item)}
    >
      <MaterialIcons name="location-on" size={20} color="#666" />
      <View style={styles.suggestionText}>
        <Text style={styles.suggestionName}>{item.name || item.address}</Text>
        {item.name && (
          <Text style={styles.suggestionAddress}>{item.address}</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, style]}>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#666"
        value={searchText}
        onChangeText={handleTextChange}
        onFocus={handleFocus}
        autoCorrect={false}
        autoCapitalize="none"
      />
      
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#000" />
        </View>
      )}

      {showSuggestions && suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <FlatList
            data={suggestions}
            keyExtractor={(item, index) => `${item.latitude}-${item.longitude}-${index}`}
            renderItem={renderSuggestion}
            style={styles.suggestionsList}
            keyboardShouldPersistTaps="handled"
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  input: {
    fontSize: 16,
    color: '#000',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    position: 'absolute',
    right: 12,
    top: 8,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    maxHeight: 200,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  suggestionsList: {
    maxHeight: 200,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  suggestionText: {
    marginLeft: 12,
    flex: 1,
  },
  suggestionName: {
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
  },
  suggestionAddress: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
});