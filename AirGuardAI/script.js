let reports = JSON.parse(localStorage.getItem("airguardReports")) || [];

function submitReport() {
    const location = document.getElementById("location").value.trim();
    const pollution = document.getElementById("pollution").value;

    if (location === "") {
        alert("Please enter your location!");
        return;
    }

    let risk = "MODERATE";
    let suggestion = "Monitor air quality and avoid unnecessary pollution.";

    if (
        pollution === "Vehicle Smoke" ||
        pollution === "Factory Smoke" ||
        pollution === "Waste Burning"
    ) {
        risk = "HIGH";
        suggestion = "Avoid the affected area and report the source to the authorities.";
    } 

    const report = {
        location: location,
        pollution: pollution,
        risk: risk,
        suggestion: suggestion,
        time: new Date().toLocaleString()
    };

    reports.unshift(report);
    localStorage.setItem("airguardReports", JSON.stringify(reports));

    addPollutionMarker(report.location, report.pollution, report.risk);

    document.getElementById("result").innerHTML = `
        <h3>✅ Report Submitted!</h3>
        <p><b>Location:</b> ${report.location}</p>
        <p><b>Pollution:</b> ${report.pollution}</p>
        <p><b>Demo Risk:</b> ${report.risk}</p>
        <p><b>Suggestion:</b> ${report.suggestion}</p>
    `;

    displayHistory();

    alert("Report submitted successfully!");
}

function displayHistory() {
    const history = document.getElementById("history");

    history.innerHTML = "<h3>📋 Report History</h3>";

    reports.forEach(function(report) {
        const item = document.createElement("div");

        const title = document.createElement("h4");
        title.textContent = report.pollution;

        const details = document.createElement("p");
        details.textContent =
            "Location: " + report.location +
            " | Risk: " + report.risk +
            " | Time: " + report.time;

        item.appendChild(title);
        item.appendChild(details);
        history.appendChild(item);
    });


    document.getElementById("totalReports").textContent = reports.length;
    document.getElementById("highRisk").textContent = reports.filter(r => r.risk === "HIGH").length;
    document.getElementById("moderateRisk").textContent = reports.filter(r => r.risk === "MODERATE").length;
}

let map;
let pollutionMarkers = [];

function initializeMap() {
    const mapElement = document.getElementById("map");

    if (!mapElement || typeof L === "undefined" || map) {
        return;
    }

    map = L.map("map").setView([11.3410, 77.7172], 10);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19
    }).addTo(map);
}
async function addPollutionMarker(location, pollution, risk) {
    if (!map) return;

    try {
        const url =
            "https://nominatim.openstreetmap.org/search?format=json&q=" +
            encodeURIComponent(location);

        const response = await fetch(url);
        const data = await response.json();

        if (data.length === 0) {
            alert("Location not found! Please enter a valid location.");
            return;
        }

        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);

        map.setView([lat, lon], 13);

        const marker = L.marker([lat, lon]).addTo(map);

        marker.bindPopup(
            "<b>" + pollution + "</b><br>" +
            "Location: " + location + "<br>" +
            "Demo Risk: " + risk
        ).openPopup();

        pollutionMarkers.push(marker);

    } catch (error) {
        console.error("Location error:", error);
        alert("Unable to find location. Check your internet connection.");
    }
}

window.addEventListener("load", initializeMap);
window.addEventListener("load", function () {
    initializeMap();
    displayHistory();
});
async function getAirQuality() {
    const location = document.getElementById("aqiLocation").value.trim();
    const result = document.getElementById("aqiResult");

    if (!location) {
        result.textContent = "Please enter a city name!";
        return;
    }

    result.textContent = "Loading air quality data...";

    try {
        // Find city coordinates
        const geoResponse = await fetch(
            "https://geocoding-api.open-meteo.com/v1/search?name=" +
            encodeURIComponent(location) + "&count=1&language=en&format=json"
        );

        const geoData = await geoResponse.json();

        if (!geoData.results || geoData.results.length === 0) {
            result.textContent = "City not found. Try another city.";
            return;
        }

        const city = geoData.results[0];

        // Get air quality data
        const airResponse = await fetch(
            "https://air-quality-api.open-meteo.com/v1/air-quality?latitude=" +
            city.latitude + "&longitude=" + city.longitude +
            "&current=us_aqi,pm2_5,pm10"
        );

        const airData = await airResponse.json();

        if (!airData.current || airData.current.us_aqi == null) {
            result.textContent = "Air quality data is currently unavailable.";
            return;
        }

        const aqi = airData.current.us_aqi;
        let status;

        if (aqi <= 50) status = "🟢 Good";
        else if (aqi <= 100) status = "🟡 Moderate";
        else if (aqi <= 150) status = "🟠 Unhealthy for Sensitive Groups";
        else if (aqi <= 200) status = "🔴 Unhealthy";
        else if (aqi <= 300) status = "🟣 Very Unhealthy";
        else status = "🟤 Hazardous";

        result.innerHTML = `
            <h3>🌍 Air Quality: ${city.name}</h3>
            <p><b>US AQI:</b> ${aqi}</p>
            <p><b>Status:</b> ${status}</p>
            <p><b>PM2.5:</b> ${airData.current.pm2_5 ?? "N/A"} µg/m³</p>
            <p><b>PM10:</b> ${airData.current.pm10 ?? "N/A"} µg/m³</p>
            <p><small>Updated: ${airData.current.time}</small></p>
            <p><small>Data is model-based and may not represent a nearby monitoring station.</small></p>
        `;

    } catch (error) {
        console.error("AQI Error:", error);
        result.textContent =
            "Unable to fetch air quality. Check your internet connection.";
    }
}

function predictPollution() {
    const aqi = Number(document.getElementById("predictionAQI").value);
    const result = document.getElementById("predictionResult");

    if (document.getElementById("predictionAQI").value === "" ||
        aqi < 0 || aqi > 500) {
        result.textContent = "Please enter a valid AQI from 0 to 500.";
        return;
    }

    let status;
    let suggestion;

    if (aqi <= 50) {
        status = "🟢 Good";
        suggestion = "Air quality is good. Continue eco-friendly habits.";
    } else if (aqi <= 100) {
        status = "🟡 Moderate";
        suggestion = "Sensitive people should consider reducing prolonged outdoor exertion.";
    } else if (aqi <= 150) {
        status = "🟠 Unhealthy for Sensitive Groups";
        suggestion = "Sensitive groups should reduce prolonged outdoor exertion.";
    } else if (aqi <= 200) {
        status = "🔴 Unhealthy";
        suggestion = "Consider reducing outdoor activities.";
    } else if (aqi <= 300) {
        status = "🟣 Very Unhealthy";
        suggestion = "Avoid prolonged outdoor exertion where possible.";
    } else {
        status = "🟤 Hazardous";
        suggestion = "Follow local air-quality alerts and limit outdoor exposure.";
    }

    result.innerHTML =
        "<h3>Air Quality Status: " + status + "</h3>" +
        "<p>Entered AQI: " + aqi + "</p>" +
        "<p>" + suggestion + "</p>";
}
