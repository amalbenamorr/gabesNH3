import math
import random
import httpx
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

app = FastAPI()

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS, 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GCT_LAT = 33.9100
GCT_LON = 10.0900
EMISSION_RATE_1 = 20.0
H1 = 60.0

ZI_LAT = 33.8800
ZI_LON = 10.1000
EMISSION_RATE_2 = 0.1
H2 = 30.0

def get_risk_level_info(comp: float):
    if comp < 50:
        return "Faible", "#2ecc71"
    elif comp <= 200:
        return "Moyen", "#f39c12"
    else:
        return "Élevé", "#e74c3c"

def calculate_gaussian_plume(x: float, y: float, Q: float, H: float, u: float) -> float:
    if x <= 0: return 0.0
    u = max(u, 1.0)
    sigma_y = (0.08 * x) / (1 + 0.0001 * x)**0.5
    sigma_z = (0.06 * x) / (1 + 0.0015 * x)**0.5
    if sigma_y <= 0 or sigma_z <= 0: return 0.0
    
    coeff = (Q * 1e5) / (math.pi * u * sigma_y * sigma_z)
    exp_y = math.exp(-(y**2) / (2 * sigma_y**2))
    exp_z = math.exp(-(H**2) / (2 * sigma_z**2))
    return coeff * exp_y * exp_z

@app.get("/concentrations-grid")
async def get_concentrations_grid():
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(f"https://api.open-meteo.com/v1/forecast?latitude={GCT_LAT}&longitude={GCT_LON}&current_weather=true")
            weather_data = resp.json()
            meteo = weather_data.get("current_weather", {})
            temp = meteo.get("temperature", 20.0)
            wind_speed = (meteo.get("windspeed", 15.0) * 1000) / 3600 # km/h to m/s
            wind_dir = meteo.get("winddirection", 45.0)
        except:
            temp = 20.0
            wind_speed = 5.0
            wind_dir = 45.0
            meteo = {"temperature": temp, "windspeed": wind_speed, "winddirection": wind_dir}

    rad_dir = math.radians(wind_dir)

    points = []
    
    # Generate points from -8000 to 8000 with step 100
    for dy in range(-8000, 8001, 100):
        for dx in range(-8000, 8001, 100):
            # Jitter
            dx_jitter = dx + random.uniform(-100, 100)
            dy_jitter = dy + random.uniform(-100, 100)
            
            # coords
            lat = GCT_LAT + (dy_jitter / 111000)
            lng = GCT_LON + (dx_jitter / 92300)
            
            if lng > 10.130:
                continue

            # source 1 (GCT)
            x_wind1 = -dx_jitter * math.sin(rad_dir) - dy_jitter * math.cos(rad_dir)
            y_wind1 = -dx_jitter * math.cos(rad_dir) + dy_jitter * math.sin(rad_dir)
            c1 = calculate_gaussian_plume(x_wind1, y_wind1, EMISSION_RATE_1, H1, wind_speed)
            
            # source 2 (ZI)
            dy2 = (lat - ZI_LAT) * 111000
            dx2 = (lng - ZI_LON) * 92300
            x_wind2 = -dx2 * math.sin(rad_dir) - dy2 * math.cos(rad_dir)
            y_wind2 = -dx2 * math.cos(rad_dir) + dy2 * math.sin(rad_dir)
            c2 = calculate_gaussian_plume(x_wind2, y_wind2, EMISSION_RATE_2, H2, wind_speed)
            
            conc = c1 + c2
            
            if conc < 0.05:
                if random.random() > 0.05:
                    continue
                conc = random.uniform(0.05, 0.4)
                
            if 33.900 <= lat <= 33.920 and 10.085 <= lng <= 10.105:
                neighborhood = "Zone Industrielle"
            elif lat >= 33.920:
                neighborhood = "Ghannouch"
            elif lng >= 10.105:
                if lat >= 33.900:
                    neighborhood = "Chatt Essalem"
                else:
                    neighborhood = "Gabès Centre"
            elif lng < 10.085:
                if lat >= 33.900:
                    neighborhood = "Bouchemma"
                else:
                    neighborhood = "Chenini Nahal"
            else:
                neighborhood = "Gabès Sud"
                
            if neighborhood == "Zone Industrielle" and random.random() < 0.05:
                conc = random.uniform(250, 450)
                
            level_text, color = get_risk_level_info(conc)
                
            points.append({
                "lat": lat,
                "lng": lng,
                "concentration": round(conc, 2),
                "riskLevel": level_text,
                "color": color,
                "neighborhood": neighborhood
            })
            
    points.sort(key=lambda p: p["concentration"], reverse=True)
    
    return {
        "meteo": {
            "temperature": temp,
            "windSpeed": round(wind_speed, 2),
            "windDirection": wind_dir
        },
        "points": points
    }
