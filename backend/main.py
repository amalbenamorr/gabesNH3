import math
import random
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import os

app = FastAPI()

# Récupération de l'URL du frontend depuis les variables d'environnement (Railway)
# Par défaut, on garde localhost pour le développement
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS, 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SOURCE_LAT = 33.9100
SOURCE_LNG = 10.0950

class PointData(BaseModel):
    lat: float
    lng: float
    concentration: float
    riskLevel: str
    neighborhood: str

def get_risk_level(concentration: float) -> str:
    if concentration < 50:
        return "Vert"
    elif concentration <= 200:
        return "Orange"
    else:
        return "Rouge"

def calculate_gaussian_plume(x: float, y: float) -> float:
    Q = 20.1 * 1e5  
    u = 5.0
    H = 40.0

    if x <= 0: return 0.0
    
    sigma_y = (0.08 * x) / (1 + 0.0001 * x)**0.5
    sigma_z = (0.06 * x) / (1 + 0.0015 * x)**0.5
    
    if sigma_y <= 0 or sigma_z <= 0: return 0.0
    
    coeff = Q / (math.pi * u * sigma_y * sigma_z)
    exp_y = math.exp(-(y**2) / (2 * sigma_y**2))
    exp_z = math.exp(-(H**2) / (2 * sigma_z**2))
    
    return coeff * exp_y * exp_z

@app.get("/api/concentration", response_model=dict)
def get_concentration():
    points = []
    grid_size = 15
    lat_step = 0.004
    lng_step = 0.004
    
    angle_vent = math.radians(-45) 
    
    for i in range(-grid_size, grid_size):
        for j in range(-grid_size, grid_size):
            lat = SOURCE_LAT + (i * lat_step)
            lng = SOURCE_LNG + (j * lng_step)
            
            dy = (lat - SOURCE_LAT) * 111000
            dx = (lng - SOURCE_LNG) * 92300
            
            x_wind = dx * math.cos(angle_vent) - dy * math.sin(angle_vent)
            y_wind = dx * math.sin(angle_vent) + dy * math.cos(angle_vent)
            
            conc = calculate_gaussian_plume(x_wind, y_wind)
            conc += random.uniform(5, 15) 
            
            if lat > 33.910 and lng < 10.095:
                neighborhood = "Ghannouch"
            elif lat < 33.890 and lng >= 10.095:
                neighborhood = "Chatt Essalem"
            elif lat < 33.885 and lng < 10.100:
                neighborhood = "Gabès Centre"
            else:
                neighborhood = "Périphérie Zone Ind."
                
            level = get_risk_level(conc)
            
            if level == "Vert" and random.random() > 0.4:
                continue

            points.append({
                "lat": lat,
                "lng": lng,
                "concentration": round(conc, 2),
                "riskLevel": level,
                "neighborhood": neighborhood
            })
            
    return {"data": points}
