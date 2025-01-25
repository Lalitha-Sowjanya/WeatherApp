import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, LayersControl } from "react-leaflet";
import axios from "axios";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

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

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setPosition({ lat: latitude, lng: longitude });
        fetchWeather(latitude, longitude); 
      },
      (error) => {
        console.error("Error getting location:", error);
        setPosition({ lat: 17.387140, lng: 78.491684 }); 
      }
    );
  }, []);

  useEffect(() => {
    fetchWeather(position.lat, position.lng);
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
    <div
      style={{
        backgroundImage: `url(${require('./Weatherbg.png')})`,
        backgroundSize: 'cover',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
      }}
    >
      <nav style={{
        backgroundColor: 'rgb(255, 255, 255)',
        padding: '10px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
        textAlign: 'center'
      }}>
        <h1 style={{ margin: 0, fontSize: '24px', color: '#333' }}>WeatherApp.in</h1>
      </nav>

      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-around', 
        padding: '20px', 
        flexGrow: 1, 
        flexWrap: 'wrap' 
      }}>
        <div style={{ 
          marginLeft: '10px', 
          marginTop: '20px',
          flex: 1,
          borderRadius: '15px',
          maxWidth: '850px'  
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

        <div
          style={{
            marginLeft: "10px",
            flex: 1,
            display: 'flex',
            maxWidth: '400px', 
            marginTop: '20px',
            maxHeight: '520px',
          }}
        >
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
              <p><img src={icons.conditions} alt="Conditions" style={{ width: '25px', marginRight: '5px' }} /><strong>Conditions:</strong> {weather.weather[0].description}</p>
              <p><img src={icons.clouds} alt="Cloudiness" style={{ width: '25px', marginRight: '5px' }} /><strong>Cloudiness:</strong> {weather.clouds.all}%</p>
              <p><img src={icons.sunrise} alt="Sunrise" style={{ width: '25px', marginRight: '5px' }} /><strong>Sunrise:</strong> {new Date(weather.sys.sunrise * 1000).toLocaleTimeString()}</p>
              <p><img src={icons.sunset} alt="Sunset" style={{ width: '25px', marginRight: '5px' }} /><strong>Sunset:</strong> {new Date(weather.sys.sunset * 1000).toLocaleTimeString()}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default WeatherApp;
