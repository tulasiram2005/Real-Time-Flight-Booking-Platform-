# Flight Booking Simulator with Dynamic Pricing

## Project Overview
A full-stack flight booking simulator that mimics real-world airline reservation systems with dynamic pricing capabilities.

## Tech Stack
- **Backend**: FastAPI (Python 3.11)
- **Frontend**: HTML, CSS, Vanilla JavaScript
- **Database**: PostgreSQL
- **Server**: Uvicorn (ASGI)

## Features Implemented
1. **Flight Search & Data Management**
   - Comprehensive schema for flights, airlines, and airports
   - Flight search with filtering (origin, destination, date, airline)
   - Sorting by price and duration

2. **Dynamic Pricing Engine**
   - Real-time fare calculation based on seat availability
   - Time-to-departure pricing multipliers
   - Simulated demand-based price adjustments

3. **Booking Workflow**
   - Multi-step booking process
   - Passenger details form
   - Seat selection system
   - PNR (Passenger Name Record) generation
   - Concurrent booking management with transactional integrity

4. **User Interface**
   - Responsive web design
   - Clean airline-themed interface
   - Downloadable booking receipts (PDF)
   - Real-time price updates

## Project Structure
```
/
├── backend/
│   ├── main.py              # FastAPI application entry point
│   ├── models.py            # SQLAlchemy database models
│   ├── database.py          # Database configuration
│   ├── pricing_engine.py   # Dynamic pricing algorithm
│   └── seed_data.py         # Sample data population
├── frontend/
│   ├── index.html           # Main UI
│   ├── styles.css           # Styling
│   └── script.js            # Frontend logic
├── requirements.txt         # Python dependencies
└── replit.md               # Project documentation
```

## Database Schema
- **airports**: Airport codes and names
- **airlines**: Airline information
- **flights**: Flight schedules and routes
- **seats**: Seat inventory with availability tracking
- **bookings**: Passenger bookings with PNR

## API Endpoints
- `GET /api/airports` - List all airports
- `GET /api/airlines` - List all airlines
- `GET /api/flights/search` - Search flights with filters
- `GET /api/flights/{flight_id}/seats` - Get available seats
- `POST /api/bookings` - Create a new booking
- `GET /api/bookings/{pnr}` - Retrieve booking details

## Recent Changes
- Initial project setup (November 02, 2025)
- Database schema design and models created
- FastAPI backend with dynamic pricing implemented
- Frontend UI with booking workflow built
- Sample data populated for testing

## User Preferences
None specified yet.

## Running the Application
The application runs on port 5000 and is accessible via the Replit webview.
Command: `uvicorn backend.main:app --host 0.0.0.0 --port 5000`

## Environment Variables
- DATABASE_URL: PostgreSQL connection string (auto-configured)
