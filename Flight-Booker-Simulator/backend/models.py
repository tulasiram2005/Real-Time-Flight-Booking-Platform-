from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean, Date
from sqlalchemy.orm import relationship
from backend.database import Base
from datetime import datetime
import hashlib

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(200), unique=True, index=True)
    name = Column(String(200))
    password_hash = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)
    is_admin = Column(Boolean, default=False)
    
    bookings = relationship("Booking", backref="user")

class Airport(Base):
    __tablename__ = "airports"
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(3), unique=True, index=True)
    name = Column(String(200))
    city = Column(String(100))
    country = Column(String(100))

class Airline(Base):
    __tablename__ = "airlines"
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(3), unique=True, index=True)
    name = Column(String(200))

class Flight(Base):
    __tablename__ = "flights"
    
    id = Column(Integer, primary_key=True, index=True)
    flight_number = Column(String(10), index=True)
    airline_id = Column(Integer, ForeignKey("airlines.id"))
    origin_id = Column(Integer, ForeignKey("airports.id"))
    destination_id = Column(Integer, ForeignKey("airports.id"))
    departure_time = Column(DateTime)
    arrival_time = Column(DateTime)
    base_price = Column(Float)
    total_seats = Column(Integer)
    available_seats = Column(Integer)
    aircraft_type = Column(String(50))
    
    airline = relationship("Airline")
    origin = relationship("Airport", foreign_keys=[origin_id])
    destination = relationship("Airport", foreign_keys=[destination_id])

class Seat(Base):
    __tablename__ = "seats"
    
    id = Column(Integer, primary_key=True, index=True)
    flight_id = Column(Integer, ForeignKey("flights.id"))
    seat_number = Column(String(5))
    seat_class = Column(String(20))
    is_available = Column(Boolean, default=True)
    
    flight = relationship("Flight", backref="seats")

class Booking(Base):
    __tablename__ = "bookings"
    
    id = Column(Integer, primary_key=True, index=True)
    pnr = Column(String(6), unique=True, index=True)
    unique_pin = Column(String(6), unique=True, index=True)
    flight_id = Column(Integer, ForeignKey("flights.id"))
    seat_id = Column(Integer, ForeignKey("seats.id"), unique=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    passenger_name = Column(String(200))
    passenger_email = Column(String(200))
    passenger_phone = Column(String(20))
    booking_date = Column(DateTime, default=datetime.utcnow)
    total_price = Column(Float)
    status = Column(String(20), default="pending")  # pending -> confirmed after payment
    
    flight = relationship("Flight")
    seat = relationship("Seat")
