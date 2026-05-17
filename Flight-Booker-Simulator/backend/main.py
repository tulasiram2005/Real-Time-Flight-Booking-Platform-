from fastapi import FastAPI, Depends, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import and_
from sqlalchemy.exc import IntegrityError
from datetime import datetime, timedelta
from typing import List, Optional
import random
import string
import io
import qrcode

from backend.database import engine, get_db, Base
from backend.models import Airport, Airline, Flight, Seat, Booking, User
from backend.pricing_engine import DynamicPricingEngine
from pydantic import BaseModel
import hashlib

# Import all models before creating tables
from backend import models

Base.metadata.create_all(bind=engine)

# Ensure a default admin user exists
def ensure_default_admin():
    db = next(get_db())
    try:
        admin = db.query(User).filter(User.email == "admin@bookmyflight.com").first()
        if not admin:
            admin = User(
                email="admin@bookmyflight.com",
                name="Administrator",
                password_hash=hashlib.sha256("admin123".encode()).hexdigest(),
                is_admin=True,
            )
            db.add(admin)
            db.commit()
            print("Created default admin: admin@bookmyflight.com / admin123")
    finally:
        db.close()

## ensure_default_admin() will be called after migrations

def generate_pin():
    """Generate a 6-digit numeric PIN"""
    return ''.join(random.choices(string.digits, k=6))

# Migration: Add unique_pin column if it doesn't exist
def migrate_database():
    """Add unique_pin column to bookings table if it doesn't exist"""
    from sqlalchemy import inspect, text
    
    inspector = inspect(engine)
    # Check if bookings table exists
    if 'bookings' not in inspector.get_table_names():
        return  # Table doesn't exist yet, will be created with schema
    
    columns = [col['name'] for col in inspector.get_columns('bookings')]
    
    if 'unique_pin' not in columns:
        print("Migrating database: Adding unique_pin column...")
        with engine.connect() as conn:
            # SQLite doesn't support adding NOT NULL columns easily, so we add it as nullable first
            try:
                conn.execute(text("ALTER TABLE bookings ADD COLUMN unique_pin VARCHAR(6)"))
                conn.commit()
                print("✓ Added unique_pin column")
                
                # Generate PINs for existing bookings that don't have one
                db = next(get_db())
                try:
                    bookings_without_pin = db.query(Booking).filter(
                        (Booking.unique_pin == None) | (Booking.unique_pin == "")
                    ).all()
                    
                    for booking in bookings_without_pin:
                        new_pin = generate_pin()
                        while db.query(Booking).filter(Booking.unique_pin == new_pin).first():
                            new_pin = generate_pin()
                        booking.unique_pin = new_pin
                    
                    db.commit()
                    if bookings_without_pin:
                        print(f"✓ Generated PINs for {len(bookings_without_pin)} existing bookings")
                finally:
                    db.close()
            except Exception as e:
                print(f"Migration warning: {e}")
                conn.rollback()

# Run migration on startup
migrate_database()

# Ensure users table has is_admin column
def migrate_users_table():
    from sqlalchemy import inspect, text
    inspector = inspect(engine)
    if 'users' not in inspector.get_table_names():
        return
    columns = [col['name'] for col in inspector.get_columns('users')]
    if 'is_admin' not in columns:
        print("Migrating database: Adding users.is_admin column...")
        with engine.connect() as conn:
            try:
                conn.execute(text("ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT 0"))
                conn.commit()
                print("✓ Added users.is_admin column")
            except Exception as e:
                print(f"Migration warning (users.is_admin): {e}")
                conn.rollback()

migrate_users_table()
ensure_default_admin()

app = FastAPI(title="Flight Booking Simulator")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="frontend"), name="static")

class FlightSearchParams(BaseModel):
    origin: Optional[str] = None
    destination: Optional[str] = None
    date: Optional[str] = None
    airline: Optional[str] = None
    sort_by: Optional[str] = "price"

class UserRegister(BaseModel):
    email: str
    name: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class BookingCreate(BaseModel):
    flight_id: int
    seat_id: int
    passenger_name: str
    passenger_email: str
    passenger_phone: str
    user_id: Optional[int] = None

class AdminFlightCreate(BaseModel):
    flight_number: str
    airline_id: int
    origin_id: int
    destination_id: int
    departure_time: str  # ISO format
    arrival_time: str    # ISO format
    base_price: float
    total_seats: int
    available_seats: int
    aircraft_type: str

class AdminFlightUpdate(BaseModel):
    flight_number: Optional[str] = None
    airline_id: Optional[int] = None
    origin_id: Optional[int] = None
    destination_id: Optional[int] = None
    departure_time: Optional[str] = None
    arrival_time: Optional[str] = None
    base_price: Optional[float] = None
    total_seats: Optional[int] = None
    available_seats: Optional[int] = None
    aircraft_type: Optional[str] = None

class PaymentRequest(BaseModel):
    booking_ids: List[int]
    payment_method: str  # "card", "upi", "netbanking", etc.
    payment_details: Optional[dict] = None

@app.get("/")
async def read_root():
    return FileResponse("frontend/index.html")

@app.get("/admin")
async def admin_page():
    return FileResponse("frontend/admin.html")

def hash_password(password: str) -> str:
    """Hash password using SHA256"""
    return hashlib.sha256(password.encode()).hexdigest()

def require_admin(db: Session, admin_user_id: Optional[int]):
    if not admin_user_id:
        raise HTTPException(status_code=401, detail="Admin user not provided")
    user = db.query(User).filter(User.id == admin_user_id).first()
    if not user or not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin privileges required")
    return user

@app.post("/api/auth/register")
async def register_user(user_data: UserRegister, db: Session = Depends(get_db)):
    """Register a new user"""
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = hash_password(user_data.password)
    new_user = User(
        email=user_data.email,
        name=user_data.name,
        password_hash=hashed_password
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {
        "id": new_user.id,
        "email": new_user.email,
        "name": new_user.name,
        "is_admin": new_user.is_admin,
        "message": "Registration successful"
    }

@app.post("/api/auth/login")
async def login_user(login_data: UserLogin, db: Session = Depends(get_db)):
    """Login user"""
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    hashed_password = hash_password(login_data.password)
    if user.password_hash != hashed_password:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "is_admin": user.is_admin,
        "message": "Login successful"
    }

@app.get("/api/airports")
async def get_airports(db: Session = Depends(get_db)):
    """Get all airports"""
    airports = db.query(Airport).all()
    return [
        {
            "id": a.id,
            "code": a.code,
            "name": a.name,
            "city": a.city,
            "country": a.country
        }
        for a in airports
    ]

@app.get("/api/airlines")
async def get_airlines(db: Session = Depends(get_db)):
    """Get all airlines"""
    airlines = db.query(Airline).all()
    return [
        {
            "id": a.id,
            "code": a.code,
            "name": a.name
        }
        for a in airlines
    ]

@app.post("/api/flights/search")
async def search_flights(params: FlightSearchParams, db: Session = Depends(get_db)):
    """Search flights with filters and dynamic pricing"""
    query = db.query(Flight)
    
    if params.origin:
        origin_airport = db.query(Airport).filter(Airport.code == params.origin).first()
        if origin_airport:
            query = query.filter(Flight.origin_id == origin_airport.id)
    
    if params.destination:
        dest_airport = db.query(Airport).filter(Airport.code == params.destination).first()
        if dest_airport:
            query = query.filter(Flight.destination_id == dest_airport.id)
    
    if params.date:
        search_date = datetime.strptime(params.date, "%Y-%m-%d").date()
        query = query.filter(
            and_(
                Flight.departure_time >= datetime.combine(search_date, datetime.min.time()),
                Flight.departure_time < datetime.combine(search_date + timedelta(days=1), datetime.min.time())
            )
        )
    
    if params.airline:
        airline = db.query(Airline).filter(Airline.code == params.airline).first()
        if airline:
            query = query.filter(Flight.airline_id == airline.id)
    
    flights = query.all()
    
    results = []
    for flight in flights:
        current_price = DynamicPricingEngine.calculate_price(
            flight.base_price,
            flight.total_seats,
            flight.available_seats,
            flight.departure_time
        )
        
        price_trend = DynamicPricingEngine.get_price_trend(
            flight.base_price,
            flight.total_seats,
            flight.available_seats
        )
        
        duration = (flight.arrival_time - flight.departure_time).total_seconds() / 3600
        
        results.append({
            "id": flight.id,
            "flight_number": flight.flight_number,
            "airline": {
                "code": flight.airline.code,
                "name": flight.airline.name
            },
            "origin": {
                "code": flight.origin.code,
                "name": flight.origin.name,
                "city": flight.origin.city
            },
            "destination": {
                "code": flight.destination.code,
                "name": flight.destination.name,
                "city": flight.destination.city
            },
            "departure_time": flight.departure_time.isoformat(),
            "arrival_time": flight.arrival_time.isoformat(),
            "duration_hours": round(duration, 2),
            "base_price": flight.base_price,
            "current_price": current_price,
            "price_trend": price_trend,
            "available_seats": flight.available_seats,
            "total_seats": flight.total_seats,
            "aircraft_type": flight.aircraft_type
        })
    
    if params.sort_by == "price":
        results.sort(key=lambda x: x["current_price"])
    elif params.sort_by == "duration":
        results.sort(key=lambda x: x["duration_hours"])
    elif params.sort_by == "departure":
        results.sort(key=lambda x: x["departure_time"])
    
    return results

@app.get("/api/flights/{flight_id}/seats")
async def get_flight_seats(flight_id: int, db: Session = Depends(get_db)):
    """Get all seats for a flight with availability status"""
    flight = db.query(Flight).filter(Flight.id == flight_id).first()
    if not flight:
        raise HTTPException(status_code=404, detail="Flight not found")
    
    # Get all seats for the flight
    all_seats = db.query(Seat).filter(Seat.flight_id == flight_id).order_by(Seat.seat_number).all()
    
    return [
        {
            "id": s.id,
            "seat_number": s.seat_number,
            "seat_class": s.seat_class,
            "is_available": s.is_available
        }
        for s in all_seats
    ]

# Admin flight management endpoints
@app.get("/api/admin/flights")
async def admin_list_flights(admin_user_id: Optional[int] = None, db: Session = Depends(get_db)):
    require_admin(db, admin_user_id)
    flights = db.query(Flight).all()
    return [
        {
            "id": f.id,
            "flight_number": f.flight_number,
            "airline_id": f.airline_id,
            "origin_id": f.origin_id,
            "destination_id": f.destination_id,
            "departure_time": f.departure_time.isoformat(),
            "arrival_time": f.arrival_time.isoformat(),
            "base_price": f.base_price,
            "total_seats": f.total_seats,
            "available_seats": f.available_seats,
            "aircraft_type": f.aircraft_type,
        }
        for f in flights
    ]

@app.post("/api/admin/flights")
async def admin_create_flight(payload: AdminFlightCreate, admin_user_id: Optional[int] = None, db: Session = Depends(get_db)):
    require_admin(db, admin_user_id)
    try:
        new_flight = Flight(
            flight_number=payload.flight_number,
            airline_id=payload.airline_id,
            origin_id=payload.origin_id,
            destination_id=payload.destination_id,
            departure_time=datetime.fromisoformat(payload.departure_time),
            arrival_time=datetime.fromisoformat(payload.arrival_time),
            base_price=payload.base_price,
            total_seats=payload.total_seats,
            available_seats=payload.available_seats,
            aircraft_type=payload.aircraft_type,
        )
        db.add(new_flight)
        db.commit()
        db.refresh(new_flight)
        return {"id": new_flight.id}
    except Exception:
        db.rollback()
        raise

@app.put("/api/admin/flights/{flight_id}")
async def admin_update_flight(flight_id: int, payload: AdminFlightUpdate, admin_user_id: Optional[int] = None, db: Session = Depends(get_db)):
    require_admin(db, admin_user_id)
    flight = db.query(Flight).filter(Flight.id == flight_id).first()
    if not flight:
        raise HTTPException(status_code=404, detail="Flight not found")
    try:
        if payload.flight_number is not None:
            flight.flight_number = payload.flight_number
        if payload.airline_id is not None:
            flight.airline_id = payload.airline_id
        if payload.origin_id is not None:
            flight.origin_id = payload.origin_id
        if payload.destination_id is not None:
            flight.destination_id = payload.destination_id
        if payload.departure_time is not None:
            flight.departure_time = datetime.fromisoformat(payload.departure_time)
        if payload.arrival_time is not None:
            flight.arrival_time = datetime.fromisoformat(payload.arrival_time)
        if payload.base_price is not None:
            flight.base_price = payload.base_price
        if payload.total_seats is not None:
            diff = payload.total_seats - flight.total_seats
            flight.total_seats = payload.total_seats
            flight.available_seats = max(0, flight.available_seats + diff)
        if payload.available_seats is not None:
            flight.available_seats = payload.available_seats
        if payload.aircraft_type is not None:
            flight.aircraft_type = payload.aircraft_type
        db.commit()
        db.refresh(flight)
        return {"success": True}
    except Exception:
        db.rollback()
        raise

@app.delete("/api/admin/flights/{flight_id}")
async def admin_delete_flight(flight_id: int, admin_user_id: Optional[int] = None, db: Session = Depends(get_db)):
    require_admin(db, admin_user_id)
    flight = db.query(Flight).filter(Flight.id == flight_id).first()
    if not flight:
        raise HTTPException(status_code=404, detail="Flight not found")
    try:
        # Cascade delete seats and dependent bookings is not set; prevent deletion if bookings exist
        bookings_exist = db.query(Booking).filter(Booking.flight_id == flight_id).first()
        if bookings_exist:
            raise HTTPException(status_code=400, detail="Cannot delete flight with existing bookings")
        db.query(Seat).filter(Seat.flight_id == flight_id).delete()
        db.delete(flight)
        db.commit()
        return {"success": True}
    except HTTPException:
        db.rollback(); raise
    except Exception:
        db.rollback(); raise

def generate_pnr():
    """Generate a 6-character alphanumeric PNR"""
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

def generate_pin():
    """Generate a 6-digit numeric PIN"""
    return ''.join(random.choices(string.digits, k=6))

@app.post("/api/bookings")
async def create_booking(booking: BookingCreate, db: Session = Depends(get_db)):
    """Create a new booking with concurrent seat management"""
    try:
        flight = db.query(Flight).filter(Flight.id == booking.flight_id).with_for_update().first()
        if not flight:
            raise HTTPException(status_code=404, detail="Flight not found")
        
        seat = db.query(Seat).filter(
            Seat.id == booking.seat_id,
            Seat.is_available == True
        ).with_for_update().first()
        
        if not seat:
            raise HTTPException(status_code=400, detail="Seat not available")
        
        current_price = DynamicPricingEngine.calculate_price(
            flight.base_price,
            flight.total_seats,
            flight.available_seats,
            flight.departure_time
        )
        
        seat.is_available = False
        flight.available_seats -= 1
        
        pnr = generate_pnr()
        while db.query(Booking).filter(Booking.pnr == pnr).first():
            pnr = generate_pnr()
        
        unique_pin = generate_pin()
        while db.query(Booking).filter(Booking.unique_pin == unique_pin).first():
            unique_pin = generate_pin()
        
        new_booking = Booking(
            pnr=pnr,
            unique_pin=unique_pin,
            flight_id=booking.flight_id,
            seat_id=booking.seat_id,
            user_id=booking.user_id,
            passenger_name=booking.passenger_name,
            passenger_email=booking.passenger_email,
            passenger_phone=booking.passenger_phone,
            total_price=current_price,
            status="pending"  # Will be confirmed after payment
        )
        
        db.add(new_booking)
        db.commit()
        db.refresh(new_booking)
        
        return {
            "id": new_booking.id,
            "pnr": new_booking.pnr,
            "unique_pin": new_booking.unique_pin,
            "flight_number": flight.flight_number,
            "passenger_name": new_booking.passenger_name,
            "seat_number": seat.seat_number,
            "total_price": new_booking.total_price,
            "booking_date": new_booking.booking_date.isoformat(),
            "status": new_booking.status,
            "flight_details": {
                "origin": flight.origin.city,
                "destination": flight.destination.city,
                "departure_time": flight.departure_time.isoformat(),
                "arrival_time": flight.arrival_time.isoformat()
            }
        }
    except HTTPException:
        db.rollback()
        raise
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Seat already booked. Please select another seat.")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Booking failed. Please try again.")

@app.post("/api/payments")
async def process_payment(payment: PaymentRequest, db: Session = Depends(get_db)):
    """Process payment and confirm bookings"""
    try:
        if not payment.booking_ids or len(payment.booking_ids) == 0:
            raise HTTPException(status_code=400, detail="No booking IDs provided")
        
        # Verify all bookings exist
        all_bookings = db.query(Booking).filter(
            Booking.id.in_(payment.booking_ids)
        ).all()
        
        if len(all_bookings) != len(payment.booking_ids):
            found_ids = [b.id for b in all_bookings]
            missing_ids = [bid for bid in payment.booking_ids if bid not in found_ids]
            raise HTTPException(
                status_code=404, 
                detail=f"Some bookings not found. Missing IDs: {missing_ids}"
            )
        
        # Check status of all bookings
        pending_bookings = [b for b in all_bookings if b.status == "pending"]
        confirmed_bookings = [b for b in all_bookings if b.status == "confirmed"]
        
        if len(pending_bookings) == 0:
            if confirmed_bookings:
                confirmed_ids = [b.id for b in confirmed_bookings]
                raise HTTPException(
                    status_code=400,
                    detail=f"All bookings are already confirmed. Confirmed IDs: {confirmed_ids}"
                )
            else:
                # Check for other statuses
                other_status = {}
                for b in all_bookings:
                    if b.status not in other_status:
                        other_status[b.status] = []
                    other_status[b.status].append(b.id)
                raise HTTPException(
                    status_code=400,
                    detail=f"Bookings are not in pending status: {other_status}"
                )
        
        # Use only pending bookings
        bookings = pending_bookings
        
        if len(bookings) < len(payment.booking_ids):
            # Some were already confirmed
            pending_ids = [b.id for b in bookings]
            already_confirmed = [bid for bid in payment.booking_ids if bid not in pending_ids]
            raise HTTPException(
                status_code=400,
                detail=f"Some bookings are already confirmed. Already confirmed IDs: {already_confirmed}"
            )
        
        # In a real system, you would process the payment here
        # For simulation, we'll just confirm the bookings
        
        total_amount = sum(b.total_price for b in bookings)
        
        # Update all bookings to confirmed
        for booking in bookings:
            booking.status = "confirmed"
        
        db.commit()
        
        # Return updated booking information with all necessary details
        updated_bookings = []
        for booking in bookings:
            db.refresh(booking)
            # Ensure relationships are loaded
            flight = booking.flight
            seat = booking.seat
            # Get unique_pin safely (may not exist in old databases)
            unique_pin = getattr(booking, 'unique_pin', None) or generate_pin()
            # If it didn't exist, save it
            if not hasattr(booking, 'unique_pin') or not booking.unique_pin:
                booking.unique_pin = unique_pin
                db.commit()
            updated_bookings.append({
                "id": booking.id,
                "pnr": booking.pnr,
                "unique_pin": unique_pin,
                "seat_number": seat.seat_number,
                "total_price": booking.total_price,
                "status": booking.status,
                "flight_number": flight.flight_number,
                "passenger_name": booking.passenger_name,
                "passenger_email": booking.passenger_email,
                "passenger_phone": booking.passenger_phone,
                "booking_date": booking.booking_date.isoformat(),
                "flight_details": {
                    "origin": flight.origin.city,
                    "destination": flight.destination.city,
                    "departure_time": flight.departure_time.isoformat(),
                    "arrival_time": flight.arrival_time.isoformat()
                }
            })
        
        return {
            "success": True,
            "message": "Payment processed successfully",
            "total_amount": total_amount,
            "bookings": updated_bookings,
            "payment_method": payment.payment_method
        }
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        import traceback
        error_detail = f"Payment processing failed: {str(e)}\n{traceback.format_exc()}"
        print(error_detail)  # Log for debugging
        raise HTTPException(status_code=500, detail=f"Payment processing failed: {str(e)}")

@app.get("/api/bookings/{booking_id}/qrcode")
async def get_booking_qrcode(booking_id: int, db: Session = Depends(get_db)):
    """Generate QR code for a booking"""
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Create QR code data - include PNR and PIN for verification
    qr_data = f"PNR:{booking.pnr}|PIN:{booking.unique_pin}|Flight:{booking.flight.flight_number}|Seat:{booking.seat.seat_number}"
    
    # Generate QR code
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(qr_data)
    qr.make(fit=True)
    
    # Create image
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Convert to bytes
    img_io = io.BytesIO()
    img.save(img_io, 'PNG')
    img_io.seek(0)
    
    return StreamingResponse(img_io, media_type="image/png")

@app.get("/api/bookings/{pnr}")
async def get_booking(pnr: str, db: Session = Depends(get_db)):
    """Retrieve booking by PNR"""
    booking = db.query(Booking).filter(Booking.pnr == pnr).first()
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    return {
        "id": booking.id,
        "pnr": booking.pnr,
        "unique_pin": booking.unique_pin,
        "flight_number": booking.flight.flight_number,
        "passenger_name": booking.passenger_name,
        "passenger_email": booking.passenger_email,
        "passenger_phone": booking.passenger_phone,
        "seat_number": booking.seat.seat_number,
        "total_price": booking.total_price,
        "booking_date": booking.booking_date.isoformat(),
        "status": booking.status,
        "flight_details": {
            "airline": booking.flight.airline.name,
            "origin": {
                "code": booking.flight.origin.code,
                "city": booking.flight.origin.city
            },
            "destination": {
                "code": booking.flight.destination.code,
                "city": booking.flight.destination.city
            },
            "departure_time": booking.flight.departure_time.isoformat(),
            "arrival_time": booking.flight.arrival_time.isoformat()
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)
