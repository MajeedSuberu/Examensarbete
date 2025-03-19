import json
from shapely.geometry import shape, Point

# Läs in massakrerna
with open("markers.geojson", "r", encoding="utf-8") as f:
    massacre_data = json.load(f)

# Läs in county-gränserna
with open("liberia-county-boundary.geojson", "r", encoding="utf-8") as f:
    county_data = json.load(f)

# Skapa en lista med county-gränser som Shapely-objekt
counties = []
for feature in county_data["features"]:
    county_name = feature["properties"].get("name")  # Byt om county-namnet ligger i en annan property
    county_shape = shape(feature["geometry"])
    counties.append((county_name, county_shape))

# Loopa igenom alla massakrer
for feature in massacre_data["features"]:
    point = Point(feature["geometry"]["coordinates"])  # Skapa en punkt från koordinaterna
    county_found = "Unknown"

    # Kolla vilken county massakern ligger i
    for county_name, county_shape in counties:
        if county_shape.contains(point):
            county_found = county_name
            break  # Stoppa loopen när vi hittat rätt county

    # Lägg till county i massakerns properties
    feature["properties"]["county"] = county_found

# Spara den uppdaterade filen
with open("markers_updated.geojson", "w", encoding="utf-8") as f:
    json.dump(massacre_data, f, indent=4, ensure_ascii=False)

print("Klart! Uppdaterad fil sparad som 'markers_updated.geojson'")
