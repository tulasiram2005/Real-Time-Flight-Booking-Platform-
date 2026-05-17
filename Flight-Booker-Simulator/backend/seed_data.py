from datetime import datetime, timedelta
from backend.database import SessionLocal, engine
from backend.models import Base, Airport, Airline, Flight, Seat

def seed_database():
    """Populate database with sample data"""
    
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        airports = [
            Airport(code="DEL", name="Indira Gandhi International Airport", city="New Delhi", country="India"),
            Airport(code="BOM", name="Chhatrapati Shivaji Maharaj International Airport", city="Mumbai", country="India"),
            Airport(code="BLR", name="Kempegowda International Airport", city="Bangalore", country="India"),
            Airport(code="CCU", name="Netaji Subhas Chandra Bose International Airport", city="Kolkata", country="India"),
            Airport(code="MAA", name="Chennai International Airport", city="Chennai", country="India"),
            Airport(code="HYD", name="Rajiv Gandhi International Airport", city="Hyderabad", country="India"),
            Airport(code="COK", name="Cochin International Airport", city="Kochi", country="India"),
            Airport(code="PNQ", name="Pune International Airport", city="Pune", country="India"),
            Airport(code="GAU", name="Lokpriya Gopinath Bordoloi International Airport", city="Guwahati", country="India"),
            Airport(code="IXC", name="Chandigarh Airport", city="Chandigarh", country="India"),
        ]
        db.add_all(airports)
        db.commit()
        
        airlines = [
            Airline(code="BMF", name="BookMyFlight"),
            Airline(code="BMF1", name="BookMyFlight Express"),
            Airline(code="BMF2", name="BookMyFlight Premium"),
            Airline(code="BMF3", name="BookMyFlight Connect"),
            Airline(code="BMF4", name="BookMyFlight Regional"),
            Airline(code="BMF5", name="BookMyFlight Domestic"),
        ]
        db.add_all(airlines)
        db.commit()
        
        # Set base date to 7 days from today at midnight
        today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        base_date = today + timedelta(days=7)
        
        # Flight configs: (flight_num, airline_id, origin_id, dest_id, dep_hours, arr_hours, base_price, seats, aircraft)
        # Using Indian airport IDs: 1=DEL, 2=BOM, 3=BLR, 4=CCU, 5=MAA, 6=HYD, 7=COK, 8=PNQ, 9=GAU, 10=IXC
        # Each route will have at least 3 flights per day with different departure times
        
        flight_configs = []
        flight_counter = 101
        
        # Route definitions: (origin_id, dest_id, duration_hours, base_price, aircraft)
        routes = [
            # Delhi routes
            (1, 2, 2, 3500.00, "Boeing 737"),  # DEL -> BOM (Delhi to Mumbai)
            (1, 3, 2.5, 4200.00, "Boeing 777"),  # DEL -> BLR (Delhi to Bangalore)
            (1, 4, 2, 4500.00, "Airbus A320"),  # DEL -> CCU (Delhi to Kolkata)
            (1, 5, 2.5, 4800.00, "Boeing 787"),  # DEL -> MAA (Delhi to Chennai)
            (1, 6, 2, 4000.00, "Airbus A320"),  # DEL -> HYD (Delhi to Hyderabad)
            (1, 7, 3, 5200.00, "Boeing 777"),  # DEL -> COK (Delhi to Kochi)
            (1, 8, 1.5, 3200.00, "Airbus A320"),  # DEL -> PNQ (Delhi to Pune)
            (1, 9, 3, 5500.00, "Boeing 737"),  # DEL -> GAU (Delhi to Guwahati)
            (1, 10, 1, 2800.00, "Airbus A320"),  # DEL -> IXC (Delhi to Chandigarh)
            
            # Mumbai routes
            (2, 1, 2, 3500.00, "Boeing 737"),  # BOM -> DEL (Mumbai to Delhi)
            (2, 3, 1.5, 3800.00, "Airbus A320"),  # BOM -> BLR (Mumbai to Bangalore)
            (2, 5, 1.5, 4200.00, "Airbus A350"),  # BOM -> MAA (Mumbai to Chennai)
            (2, 6, 1.5, 3700.00, "Airbus A320"),  # BOM -> HYD (Mumbai to Hyderabad)
            (2, 7, 2, 4500.00, "Boeing 777"),  # BOM -> COK (Mumbai to Kochi)
            (2, 8, 0.5, 1800.00, "Airbus A320"),  # BOM -> PNQ (Mumbai to Pune)
            (2, 10, 2, 3400.00, "Airbus A320"),  # BOM -> IXC (Mumbai to Chandigarh)
            
            # Bangalore routes
            (3, 1, 2.5, 4200.00, "Boeing 777"),  # BLR -> DEL (Bangalore to Delhi)
            (3, 2, 1.5, 3800.00, "Airbus A320"),  # BLR -> BOM (Bangalore to Mumbai)
            (3, 5, 1, 2800.00, "Airbus A320"),  # BLR -> MAA (Bangalore to Chennai)
            (3, 6, 1, 2600.00, "Airbus A320"),  # BLR -> HYD (Bangalore to Hyderabad)
            (3, 7, 1.5, 3200.00, "Airbus A320"),  # BLR -> COK (Bangalore to Kochi)
            
            # Kolkata routes
            (4, 1, 2, 4500.00, "Airbus A320"),  # CCU -> DEL (Kolkata to Delhi)
            (4, 2, 2.5, 4400.00, "Boeing 737"),  # CCU -> BOM (Kolkata to Mumbai)
            (4, 3, 2, 3900.00, "Airbus A320"),  # CCU -> BLR (Kolkata to Bangalore)
            (4, 5, 2, 4000.00, "Airbus A320"),  # CCU -> MAA (Kolkata to Chennai)
            
            # Chennai routes
            (5, 1, 2.5, 4800.00, "Boeing 787"),  # MAA -> DEL (Chennai to Delhi)
            (5, 2, 1.5, 4200.00, "Airbus A350"),  # MAA -> BOM (Chennai to Mumbai)
            (5, 3, 1, 2800.00, "Airbus A320"),  # MAA -> BLR (Chennai to Bangalore)
            (5, 4, 2, 4000.00, "Airbus A320"),  # MAA -> CCU (Chennai to Kolkata)
            (5, 7, 1.5, 3200.00, "Airbus A320"),  # MAA -> COK (Chennai to Kochi)
            
            # Hyderabad routes
            (6, 1, 2, 4000.00, "Airbus A320"),  # HYD -> DEL (Hyderabad to Delhi)
            (6, 2, 1.5, 3700.00, "Airbus A320"),  # HYD -> BOM (Hyderabad to Mumbai)
            (6, 3, 1, 2600.00, "Airbus A320"),  # HYD -> BLR (Hyderabad to Bangalore)
            
            # Kochi routes
            (7, 1, 3, 5200.00, "Boeing 777"),  # COK -> DEL (Kochi to Delhi)
            (7, 2, 2, 4500.00, "Boeing 777"),  # COK -> BOM (Kochi to Mumbai)
            (7, 3, 1.5, 3200.00, "Airbus A320"),  # COK -> BLR (Kochi to Bangalore)
            (7, 5, 1.5, 3200.00, "Airbus A320"),  # COK -> MAA (Kochi to Chennai)
            
            # Pune routes
            (8, 1, 1.5, 3200.00, "Airbus A320"),  # PNQ -> DEL (Pune to Delhi)
            (8, 2, 0.5, 1800.00, "Airbus A320"),  # PNQ -> BOM (Pune to Mumbai)
            
            # Guwahati routes
            (9, 1, 3, 5500.00, "Boeing 737"),  # GAU -> DEL (Guwahati to Delhi)
            
            # Chandigarh routes
            (10, 1, 1, 2800.00, "Airbus A320"),  # IXC -> DEL (Chandigarh to Delhi)
            (10, 2, 2, 3400.00, "Airbus A320"),  # IXC -> BOM (Chandigarh to Mumbai)
        ]
        
        # Generate 3 flights per day for each route (morning, afternoon, evening)
        for origin_id, dest_id, duration, base_price, aircraft in routes:
            # Determine seats based on aircraft type
            if "737" in aircraft:
                seats = 180
            elif "A320" in aircraft:
                seats = 150
            elif "777" in aircraft:
                seats = 300
            elif "787" in aircraft:
                seats = 280
            elif "A350" in aircraft:
                seats = 220
            elif "A380" in aircraft:
                seats = 350
            else:
                seats = 200
            
            # 3 flights per day: Morning (6 AM), Afternoon (2 PM), Evening (8 PM)
            departure_times = [6, 14, 20]
            
            for i, dep_hour in enumerate(departure_times):
                airline_id = ((flight_counter + i) % 6) + 1  # Cycle through 6 airlines
                arr_hour = dep_hour + duration  # Can be float for durations like 2.5 hours
                
                flight_num = f"BMF{flight_counter}"
                flight_configs.append((
                    flight_num,
                    airline_id,
                    origin_id,
                    dest_id,
                    dep_hour,
                    arr_hour,
                    base_price,
                    seats,
                    aircraft
                ))
                flight_counter += 1
        
        flights = []
        for config in flight_configs:
            flight_num, airline_id, origin_id, dest_id, dep_hours, arr_hours, price, seats, aircraft = config
            
            departure = base_date + timedelta(hours=dep_hours)
            arrival = base_date + timedelta(hours=arr_hours)
            
            flight = Flight(
                flight_number=flight_num,
                airline_id=airline_id,
                origin_id=origin_id,
                destination_id=dest_id,
                departure_time=departure,
                arrival_time=arrival,
                base_price=price,
                total_seats=seats,
                available_seats=seats,
                aircraft_type=aircraft
            )
            flights.append(flight)
        
        db.add_all(flights)
        db.commit()
        
        seat_classes = {
            "Boeing 737": {"economy": 150, "business": 30},
            "Airbus A320": {"economy": 120, "business": 30},
            "Boeing 777": {"economy": 240, "business": 60},
            "Airbus A350": {"economy": 180, "business": 40},
            "Boeing 787": {"economy": 220, "business": 60},
            "Airbus A380": {"economy": 280, "business": 70},
        }
        
        for flight in flights:
            classes = seat_classes.get(flight.aircraft_type, {"economy": 140, "business": 40})
            
            seat_num = 1
            for class_type, count in classes.items():
                for i in range(count):
                    row = (seat_num - 1) // 6 + 1
                    col = chr(65 + ((seat_num - 1) % 6))
                    seat_number = f"{row}{col}"
                    
                    seat = Seat(
                        flight_id=flight.id,
                        seat_number=seat_number,
                        seat_class=class_type,
                        is_available=True
                    )
                    db.add(seat)
                    seat_num += 1
        
        db.commit()
        
        print("Database seeded successfully!")
        print(f"- {len(airports)} airports")
        print(f"- {len(airlines)} airlines")
        print(f"- {len(flights)} flights")
        print(f"- Seats generated for all flights")
        
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
