import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, LayersControl } from "react-leaflet";
import axios from "axios";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import debounce from "lodash.debounce";  // Import debounce to reduce API calls

const icons = {
  location: "./Icons/location.png",
  temperature: "./Icons/Temperature.png",
  humidity: "./Icons/Humidity.png",
  wind: "./Icons/wind.png",
  pressure: "./Icons/pressure.png",
  visibility: "./Icons/visibility.png",
  conditions: "./Icons/conditions.png",
  clouds: "./Icons/cloud.png",
  sunrise: "./Icons/sunrise.png",
  sunset: "./Icons/sunset.png",
};

const customIcon = L.icon({
  iconUrl: "./Location.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const { BaseLayer } = LayersControl;

function WeatherApp() {
  const [position, setPosition] = useState({ lat: 17.387140, lng: 78.491684 });
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [uniqueDates, setUniqueDates] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
 
  const fetchWeather = async (lat, lon) => {
    try {
      const apiKey = "999cd62fae53aa8073bdff634c02d48e";
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`
      );
      setWeather(response.data);
    } catch (error) {
      console.error("Error fetching weather data:", error);
    }
  };

  const fetchForecast = async (lat, lon) => {
    try {
      const apiKey = "999cd62fae53aa8073bdff634c02d48e";
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`
      );
      setForecast(response.data.list); // This will give 3-hour intervals
      extractUniqueDates(response.data.list);
    } catch (error) {
      console.error("Error fetching forecast data:", error);
    }
  };

  const extractUniqueDates = (forecastData) => {
    // Extract unique dates from the forecast data
    const dates = forecastData.map(item => new Date(item.dt * 1000).toLocaleDateString());
    const uniqueDatesList = [...new Set(dates)]; // Remove duplicates by converting to a Set
    setUniqueDates(uniqueDatesList);
    if (uniqueDatesList.length > 0) {
      setSelectedDate(uniqueDatesList[0]);  // Set the initial selected date to the first date
    }
  };

  const filterForecastByDate = (date) => {
    // Filter forecast by the selected date
    return forecast.filter(item => new Date(item.dt * 1000).toLocaleDateString() === date);
  };

  const handleSearchInput = debounce(async (query) => {
    setSearchQuery(query);
    if (query.length > 0) {  // Start fetching after 1 character
      try {
        const apiKey = "4540560483084f2e9a27195642c9a6a7";
        const response = await axios.get(
          `https://api.opencagedata.com/geocode/v1/json?q=${query}&key=${apiKey}`
        );
        setSuggestions(response.data.results);
       // Set loading to false after the response
      } catch (error) {
        console.error("Error fetching autocomplete data:", error);
      }
    } else {
      setSuggestions([]);  // Clear suggestions if the query is empty
        // Set loading to false even if there are no results
    }
  },50);

  const handleSuggestionClick = (lat, lng) => {
    setPosition({ lat, lng });
    fetchWeather(lat, lng);
    fetchForecast(lat, lng);
    setSearchQuery(""); // Clear input after selection
    setSuggestions([]); // Clear suggestions after selection
  };

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setPosition({ lat: latitude, lng: longitude });
        fetchWeather(latitude, longitude);
        fetchForecast(latitude, longitude); // Fetch 5-day 3-hour forecast
      },
      (error) => {
        console.error("Error getting location:", error);
        setPosition({ lat: 17.387140, lng: 78.491684 });
      }
    );
  }, []);

  useEffect(() => {
    fetchWeather(position.lat, position.lng);
    fetchForecast(position.lat, position.lng); // Fetch forecast whenever position changes
  }, [position.lat, position.lng]);

  const LocationMarker = () => {
    const map = useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;
        setPosition({ lat, lng });
      },
    });

    useEffect(() => {
      if (map) {
        map.setView([position.lat, position.lng], map.getZoom());
      }
    }, [map]);

    return position === null ? null : <Marker icon={customIcon} position={position}></Marker>;
  };


  return (
    <div style={{
      backgroundImage: `url(${require('./Weatherbg.png')})`,
      backgroundSize: 'cover',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      width: '100%',
    }}>
      <nav style={{
        backgroundColor: 'rgb(255, 255, 255)',
        padding: '10px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
        textAlign: 'center',
        position: 'relative',
        height: '40px',
        flexWrap: 'wrap',
        gap: '10px',
      }}>
        <h1 style={{ margin: 0, fontSize: '24px', color: '#333' }}>WeatherApp.in</h1>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          position: 'absolute',
          right: '20px',  // Align search bar to the right
          top: '50%',
          transform: 'translateY(-50%)',  // Vertically center the search input
        }}>
          <label htmlFor="searchInput" style={{ fontSize: '16px', fontWeight: 'bold', color: '#333' }}>Enter Location :</label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchInput(e.target.value)} // Update search query on typing
            placeholder="Search for a location..."
            style={{
              padding: '10px',
              fontSize: '16px',
              width: '250px',
              borderRadius: '5px',
              marginRight: '10px',
              marginBottom: '20px',
              marginTop: '20px',
            }}
          />
        </div>
      </nav>
    
      {/* Suggestions Box */}
      {suggestions.length > 0 && (
  <div style={{
    maxHeight: '200px', // Set a fixed height
    overflowY: 'auto',  // Enable scrolling when content exceeds height
    background: 'white',
    borderRadius: '5px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
    position: 'absolute',
    top: '60px', // Ensure it's 20px below the input field
    zIndex: 1000, // Ensure it appears above other content
    width: '290px',
    padding: '10px',
    textAlign: 'left',
    right: '20px',  // Align suggestions to the right
    boxSizing: 'border-box',  // Ensure padding doesn't affect width
  }}>
    {suggestions.map((suggestion, index) => (
      <div
        key={index}
        style={{
          padding: '10px',
          cursor: 'pointer',
          width: '100%',  // Ensure suggestions take up the full width of the container
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
        }}
        onClick={() => handleSuggestionClick(suggestion.geometry.lat, suggestion.geometry.lng)}
      >
        {suggestion.formatted}
      </div>
    ))}
  </div>
)}

    
      {/* The map and weather info sections */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-around',
        padding: '20px',
        flexGrow: 1,
        flexWrap: 'wrap',
      }}>
        {/* Map Container */}
        <div style={{
          marginLeft: '10px',
          marginTop: '20px',
          flex: 1,
          borderRadius: '15px',
          maxWidth: '850px',
          minWidth: '300px',
        }}>
          <MapContainer
  style={{
    height: "530px",
    width: "100%",
    borderRadius: '15px',
    maxWidth: "850px",
  }}
  center={position}
  zoom={13}
>

            <LayersControl position="topright">
              <BaseLayer checked name="OpenStreetMap">
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution="&copy; OpenStreetMap contributors"
                />
              </BaseLayer>
              <BaseLayer name="Satellite">
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                />
              </BaseLayer>
            </LayersControl>
            <LocationMarker />
          </MapContainer>
        </div>
    
        {/* Weather Information */}
        <div style={{
          marginLeft: '10px',
          flex: 1,
          display: 'flex',
          maxWidth: '400px',
          marginTop: '20px',
          maxHeight: '520px',
          minWidth: '250px', // Add minWidth for responsiveness

        }}>

          {weather && (
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.8)',
                borderRadius: '15px',
                padding: '20px',
                width: '100%',
                maxWidth: '400px',
                maxHeight: '520px',
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
                transition: 'transform 0.2s',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              <h2 style={{ textAlign: 'center', color: '#333', marginBottom: '15px' }}>
                {weather.name} <img src={icons.location} alt="Location" style={{ width: '25px', marginLeft: '5px' }} />
              </h2>
              <p><img src={icons.temperature} alt="Temperature" style={{ width: '25px', marginRight: '5px' }} /><strong>Temperature:</strong> {weather.main.temp}°C</p>
              <p><img src={icons.humidity} alt="Humidity" style={{ width: '25px', marginRight: '5px' }} /><strong>Humidity:</strong> {weather.main.humidity}%</p>
              <p><img src={icons.wind} alt="Wind Speed" style={{ width: '25px', marginRight: '5px' }} /><strong>Wind Speed:</strong> {weather.wind.speed} m/s</p>
              <p><img src={icons.pressure} alt="Pressure" style={{ width: '25px', marginRight: '5px' }} /><strong>Pressure:</strong> {weather.main.pressure} hPa</p>
              <p><img src={icons.visibility} alt="Visibility" style={{ width: '25px', marginRight: '5px' }} /><strong>Visibility:</strong> {(weather.visibility / 1000).toFixed(2)} km</p>
              <p><img src={icons.conditions} alt="Conditions" style={{ width: '25px', marginRight: '5px' }} /><strong>Description:</strong> {weather.weather[0].description}</p>
              <p><img src={icons.clouds} alt="Cloudiness" style={{ width: '25px', marginRight: '5px' }} /><strong>Cloudiness:</strong> {weather.clouds.all}%</p>
              <p><img src={icons.sunrise} alt="Sunrise" style={{ width: '25px', marginRight: '5px' }} /><strong>Sunrise:</strong> {new Date(weather.sys.sunrise * 1000).toLocaleTimeString()}</p>
              <p><img src={icons.sunset} alt="Sunset" style={{ width: '25px', marginRight: '5px' }} /><strong>Sunset:</strong> {new Date(weather.sys.sunset * 1000).toLocaleTimeString()}</p>
            </div>
          )}
        </div>
        </div>

      {/* Forecast section below */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        marginTop: '20px',
      }}>
        <nav style={{
          backgroundColor: 'rgb(255, 255, 255)',
          padding: '10px',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
          textAlign: 'center',
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
          boxSizing: 'border-box',
          overflowX: 'hidden',
          height:'65px',
          marginBottom:'30px',
          flexWrap: 'wrap',
          gap: '10px',
        }}>
          <h1 style={{ margin: 0, fontSize: '24px', color: '#333', position: 'absolute' }}>Day-wise Weather Outlook</h1>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            position: 'absolute',
            right: '20px',
          }}>
            <label htmlFor="dateSelect" style={{ fontSize: '16px', fontWeight: 'bold', color: '#333' }}>Select Date :</label>
            <select 
              id="dateSelect"
              value={selectedDate} 
              onChange={(e) => setSelectedDate(e.target.value)} 
              style={{ padding: '10px', fontSize: '16px', marginTop: '5px' }}
            >
              {uniqueDates.map((date, index) => (
                <option key={index} value={date}>{date}</option>
              ))}
            </select>
          </div>
        </nav>

        <div style={{
          marginLeft:'20px',
          marginBottom:'30px',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'flex-start',
          gap: '10px',
          width: '100%',
          maxWidth: '1290px',
        }}>
          {filterForecastByDate(selectedDate).map((forecastItem, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                flexDirection: 'column',
                width: 'calc(25% - 10px)', 
                minWidth: '250px',         
                backgroundColor: 'rgba(255, 255, 255, 0.7)',
                borderRadius: '10px',
                padding: '20px',
                boxSizing: 'border-box',
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
                textAlign: 'left',
              }}
            >
              <p style={{ fontSize: '16px', textAlign:'center' }}>
                <strong>{new Date(forecastItem.dt * 1000).toLocaleDateString()} -{' '}
                {new Date(forecastItem.dt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>
              </p>
              <p><img src={icons.temperature} alt="Temperature" style={{ width: '25px', marginRight: '5px' }} /><strong>Temp: </strong> {forecastItem.main.temp}°C</p>
              <p><img src={icons.humidity} alt="Humidity" style={{ width: '25px', marginRight: '5px' }} /><strong>Humidity: </strong> {forecastItem.main.humidity}%</p>
              <p><img src={icons.conditions} alt="conditions" style={{ width: '25px', marginRight: '5px' }} /><strong>Description: </strong> {weather.weather[0].description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>    
  );
}

export default WeatherApp;
