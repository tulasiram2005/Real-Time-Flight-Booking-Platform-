# Flight Booking Simulator with Dynamic Pricing ✈️

A full-stack web-based flight booking system that simulates real-world airline reservation systems with dynamic pricing, seat management, and booking confirmations.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Database Configuration](#database-configuration)
- [Running the Application](#running-the-application)
- [API Endpoints](#api-endpoints)
- [User Roles](#user-roles)
- [Key Features Explained](#key-features-explained)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

The **Flight Booking Simulator** is an educational full-stack project designed to teach core concepts of:

- **API Development** - RESTful APIs using FastAPI
- **Database Design** - Transactional consistency and schema design with SQLAlchemy
- **Dynamic Pricing Algorithms** - Real-time fare calculation based on demand and availability
- **Concurrency Control** - Handling simultaneous seat bookings
- **Full-Stack Integration** - Frontend-backend communication and state management

The system mimics real airline booking workflows, including flight search, dynamic pricing, seat selection, booking confirmations with Passenger Name Records (PNR), and downloadable receipts with QR codes.

---

## Vercel Live Demo

The repository root includes Vercel configuration for a static browser demo of the simulator. It preserves the main booking experience using `frontend/demo-api.js`, which supplies realistic in-browser data for auth, flights, seats, bookings, payments, and admin management.

```bash
npm run dev
npm run build
```

Use `demo@bookmyflight.com` / `demo123` for the traveller flow and `admin@bookmyflight.com` / `admin123` for the admin demo.

---

## Features

### 🛫 Core Functionality

- **Flight Search & Filtering**
  - Search flights by origin, destination, and date
  - Filter by price range, airline, and departure time
  - Real-time seat availability display

- **Dynamic Pricing Engine**
  - Price adjustments based on seat availability
  - Demand-based pricing simulation
  - Time-to-departure pricing multipliers
  - Real-time price updates

- **Seat Management**
  - Real-time seat inventory tracking
  - Multiple seat classes (Economy, Business, First Class)
  - Concurrent booking with conflict resolution

- **Booking & Confirmations**
  - Multi-step booking workflow
  - Unique Passenger Name Record (PNR) generation
  - PIN-based booking reference
  - Booking status tracking (pending, confirmed)

- **Receipt & Documentation**
  - PDF receipt generation
  - QR code embedded in receipts
  - Downloadable booking confirmations

- **Admin Dashboard**
  - Flight management (add, edit, delete)
  - Pricing configuration
  - Booking analytics
  - Revenue tracking

---

## Tech Stack

### Backend
- **Framework:** FastAPI 0.104.1
- **Server:** Uvicorn 0.24.0
- **ORM:** SQLAlchemy 2.0.23
- **Database:** PostgreSQL (psycopg2-binary 2.9.9)
- **Validation:** Pydantic 2.5.0
- **PDF Generation:** ReportLab 4.0.7
- **QR Code:** qrcode[pil]
- **Date Handling:** python-dateutil 2.8.2

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Responsive styling
- **JavaScript (Vanilla)** - Dynamic interactions
- **Fetch API** - Asynchronous data fetching

### Database
- **PostgreSQL** - Relational database for data persistence
- **SQLAlchemy ORM** - Database abstraction layer

---

## Project Structure

```
Flight-Booker-Simulator-main/
├── backend/
│   ├── __init__.py
│   ├── main.py                 # FastAPI application & endpoints
│   ├── models.py               # SQLAlchemy ORM models
│   ├── database.py             # Database configuration
│   ├── pricing_engine.py       # Dynamic pricing logic
│   └── seed_data.py            # Database seeding script
├── frontend/
│   ├── index.html              # Main booking interface
│   ├── admin.html              # Admin dashboard
│   ├── script.js               # Frontend logic & API calls
│   └── styles.css              # Responsive styling
├── requirements.txt            # Python dependencies
└── README.md                   # Project documentation
```

### Backend Modules

#### `main.py`
Main FastAPI application containing:
- Flight search endpoints with filtering
- Dynamic pricing calculations
- Booking workflow endpoints
- PDF receipt generation
- QR code generation
- Admin flight management endpoints
- User authentication

#### `models.py`
SQLAlchemy ORM models:
- **User** - User accounts and admin status
- **Airport** - Airport information (code, name, city, country)
- **Airline** - Airline details
- **Flight** - Flight information with pricing and capacity
- **Seat** - Individual seat tracking
- **Booking** - Booking records with PNR and status

#### `database.py`
Database configuration:
- PostgreSQL connection setup
- SQLAlchemy engine initialization
- Session management
- Database URL configuration

#### `pricing_engine.py`
Dynamic pricing logic:
- Base price calculations
- Availability-based multipliers
- Demand simulation
- Time-to-departure adjustments

#### `seed_data.py`
Database initialization:
- Sample airports and airlines
- Demo flights with realistic data
- Initial seat allocation

### Frontend Components

#### `index.html`
User-facing booking interface with:
- Flight search form
- Results display
- Seat selection map
- Booking confirmation
- Receipt display

#### `admin.html`
Administrative interface with:
- Flight management
- Pricing configuration
- Booking analytics
- System settings

#### `script.js`
Frontend logic:
- API communication
- State management
- Form validation
- Dynamic UI updates
- Receipt generation

#### `styles.css`
Responsive design:
- Mobile-first approach
- Flexbox/Grid layouts
- Smooth animations
- Professional color scheme

---

## Prerequisites

Before you begin, ensure you have the following installed:

- **Python 3.8+** - Download from [python.org](https://www.python.org/)
- **PostgreSQL 12+** - Download from [postgresql.org](https://www.postgresql.org/)
- **pip** - Python package manager (comes with Python)
- **Git** - Version control (optional)

### Check Installation

```bash
python --version
psql --version
```

---

## Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/Flight-Booker-Simulator.git
cd Flight-Booker-Simulator-main
```

### 2. Create Virtual Environment

```bash
# On Windows
python -m venv venv
venv\Scripts\activate

# On macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Set Up Environment Variables

Create a `.env` file in the project root:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/flight_booker

# Server Configuration
HOST=0.0.0.0
PORT=8000
DEBUG=True

# JWT Configuration (optional)
SECRET_KEY=your-secret-key-here
```

---

## Database Configuration

### 1. Create PostgreSQL Database

```bash
# Open PostgreSQL CLI
psql -U postgres

# Create database
CREATE DATABASE flight_booker;

# Create user (optional)
CREATE USER flight_user WITH PASSWORD 'your_password';
ALTER ROLE flight_user SET client_encoding TO 'utf8';
ALTER ROLE flight_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE flight_user SET default_transaction_deferrable TO on;
GRANT ALL PRIVILEGES ON DATABASE flight_booker TO flight_user;

# Exit psql
\q
```

### 2. Configure Database URL

Update the `DATABASE_URL` in your `.env` or in `backend/database.py`:

```python
DATABASE_URL = "postgresql://flight_user:your_password@localhost:5432/flight_booker"
```

### 3. Initialize Database

The application automatically creates tables on first run using SQLAlchemy:

```python
Base.metadata.create_all(bind=engine)
```

To seed initial data (airports, airlines, flights):

```bash
python -c "from backend.seed_data import seed_database; seed_database()"
```

---

## Running the Application

### 1. Start the Backend Server

```bash
# Make sure virtual environment is activated
python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

Expected output:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete
```

### 2. Access the Application

- **User Interface:** http://localhost:8000/
- **Admin Dashboard:** http://localhost:8000/admin
- **API Documentation:** http://localhost:8000/docs

### Default Admin Credentials

- **Email:** `admin@bookmyflight.com`
- **Password:** `admin123`

⚠️ **Change these credentials in production!**

---

## API Endpoints

### Authentication

```
POST /api/login
- Login user
- Request: { "email": "user@example.com", "password": "pass123" }
- Response: { "user_id": 1, "name": "John Doe", "is_admin": false }

POST /api/register
- Register new user
- Request: { "email": "user@example.com", "name": "John Doe", "password": "pass123" }
```

### Flight Search

```
GET /api/search-flights
- Search flights with filters
- Query params: origin_code, destination_code, date, sort_by
- Response: List of flights with current pricing

GET /api/flights
- Get all flights
- Response: List of all flights with details
```

### Pricing

```
GET /api/flight-price/{flight_id}
- Get dynamic price for a flight
- Response: { "base_price": 150, "current_price": 180, "multiplier": 1.2 }
```

### Seat Management

```
GET /api/flight-seats/{flight_id}
- Get seats for a flight
- Response: List of seats with availability status

POST /api/hold-seat/{seat_id}
- Hold a seat temporarily
- Request: { "passenger_email": "user@example.com" }
```

### Booking

```
POST /api/book-flight
- Create a booking
- Request: {
    "flight_id": 1,
    "seat_id": 5,
    "passenger_name": "John Doe",
    "passenger_email": "john@example.com",
    "passenger_phone": "+1234567890"
  }
- Response: { "pnr": "ABC123", "booking_id": 1, "status": "pending" }

GET /api/booking/{booking_id}
- Get booking details
- Response: Full booking information with receipt

POST /api/cancel-booking/{booking_id}
- Cancel a booking
- Response: { "status": "cancelled", "message": "Booking cancelled" }
```

### Admin Endpoints

```
POST /api/admin/flights
- Add new flight
- Request: { flight details }

PUT /api/admin/flights/{flight_id}
- Update flight details

DELETE /api/admin/flights/{flight_id}
- Delete a flight

GET /api/admin/bookings
- Get all bookings with analytics

GET /api/admin/revenue
- Get revenue statistics
```

### Receipt & Documentation

```
GET /api/receipt/{booking_id}
- Download booking receipt as PDF
- Response: PDF file with booking details and QR code
```

---

## User Roles

### 👤 Customer
- Search flights
- View dynamic prices
- Make bookings
- View booking history
- Download receipts
- Cancel bookings (if allowed)

### 👨‍💼 Administrator
- Manage flights (CRUD operations)
- View all bookings
- Manage pricing configuration
- View revenue analytics
- User management
- System configuration

---

## Key Features Explained

### 🎯 Dynamic Pricing Engine

The pricing engine adjusts prices in real-time based on:

1. **Seat Availability**
   - Lower availability → Higher prices
   - More availability → Lower prices

2. **Time to Departure**
   - Last-minute bookings cost more
   - Early bookings cost less

3. **Demand Simulation**
   - Increased booking activity → Higher prices
   - Low booking activity → Lower prices

**Formula:**
```
Final Price = Base Price × Availability Multiplier × Time Multiplier × Demand Multiplier
```

### 🔐 Concurrent Booking

The system handles simultaneous bookings through:

- **Optimistic Locking** - Version control on seat records
- **Transaction Isolation** - SERIALIZABLE transaction level
- **Unique Constraints** - Prevents double-booking
- **Status Tracking** - Pending → Confirmed workflow

### 🎫 PNR & Receipt System

- **PNR Generation** - 6-character unique identifier
- **PIN** - 6-digit numeric code for security
- **QR Code** - Encoded PNR for mobile check-in
- **PDF Receipt** - Professional booking confirmation
- **Email Notification** - Automated confirmation emails

---

## Example Workflow

### 1. User Search
```
GET /api/search-flights?origin=JFK&destination=LAX&date=2024-05-15
```

### 2. View Pricing
```
GET /api/flight-price/42
Response: Current price = $250 (base: $150, multiplier: 1.67)
```

### 3. Select Seat
```
GET /api/flight-seats/42
Response: Available seats with layout
```

### 4. Hold Seat
```
POST /api/hold-seat/156
```

### 5. Complete Booking
```
POST /api/book-flight
{
  "flight_id": 42,
  "seat_id": 156,
  "passenger_name": "Jane Doe",
  "passenger_email": "jane@example.com",
  "passenger_phone": "+1-555-0100"
}
Response: {"pnr": "AB45CD", "booking_id": 89, "status": "pending"}
```

### 6. Download Receipt
```
GET /api/receipt/89
Response: PDF with QR code and booking details
```

---

## Troubleshooting

### Database Connection Error

**Error:** `could not connect to server: Connection refused`

**Solution:**
1. Ensure PostgreSQL is running
2. Check DATABASE_URL configuration
3. Verify credentials

```bash
# Check PostgreSQL status (Linux/Mac)
sudo systemctl status postgresql

# Start PostgreSQL (Windows)
pg_ctl -D "C:\Program Files\PostgreSQL\data" start
```

### Port Already in Use

**Error:** `Address already in use`

**Solution:**
```bash
# Change port
python -m uvicorn backend.main:app --port 8001

# Or kill existing process
# Linux/Mac
lsof -ti:8000 | xargs kill -9

# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

### Module Not Found

**Error:** `ModuleNotFoundError: No module named 'fastapi'`

**Solution:**
```bash
# Reinstall dependencies
pip install -r requirements.txt --upgrade
```

### CORS Issues

**Error:** `Cross-Origin Request Blocked`

**Solution:**
The backend already includes CORS middleware. If issues persist, modify `backend/main.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## Performance Optimization

### Database Indexing
Indexes are created on frequently queried columns:
- `flight_number`
- `airport.code`
- `seat.is_available`
- `booking.pnr`

### Caching
Consider implementing caching for:
- Flight lists (5-minute TTL)
- Airport data (24-hour TTL)
- Pricing calculations (1-minute TTL)

### Connection Pooling
SQLAlchemy connection pooling is configured with:
```python
pool_size=20
max_overflow=40
pool_pre_ping=True
```

---

## Security Considerations

### Current Implementation
- ✅ Password hashing (SHA-256)
- ✅ Input validation (Pydantic)
- ✅ CORS protection
- ✅ Transactional consistency

### Production Recommendations
- 🔒 Use OAuth2 with JWT tokens
- 🔒 Implement HTTPS/TLS
- 🔒 Add rate limiting
- 🔒 Use bcrypt for password hashing
- 🔒 Implement API key authentication
- 🔒 Add request logging and monitoring
- 🔒 Use environment variables for secrets

---

## Development Guidelines

### Adding New Features

1. **Create Database Model**
   ```python
   class NewModel(Base):
       __tablename__ = "new_models"
       # Define columns
   ```

2. **Create API Endpoint**
   ```python
   @app.get("/api/new-endpoint")
   def new_endpoint(db: Session = Depends(get_db)):
       # Implementation
       return result
   ```

3. **Update Frontend**
   - Add HTML form/button
   - Create fetch request
   - Handle response

4. **Test**
   - Unit tests for logic
   - Integration tests for API
   - UI testing in browser

### Code Style
- Follow PEP 8 for Python
- Use meaningful variable names
- Add docstrings to functions
- Comment complex logic

---

## Testing

### Manual Testing

1. **User Flow**
   - Register new account
   - Search flights
   - View prices
   - Make booking
   - Download receipt

2. **Admin Flow**
   - Login as admin
   - Add new flight
   - Modify pricing
   - View analytics

3. **Edge Cases**
   - Book last seat
   - Cancel booking
   - Search with no results
   - Concurrent bookings

### Automated Testing
```bash
# Install pytest
pip install pytest pytest-asyncio httpx

# Run tests
pytest tests/ -v
```

---

## Deployment

### Local Deployment
Already covered in "Running the Application" section.

### Docker Deployment

```dockerfile
FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```bash
docker build -t flight-booker .
docker run -p 8000:8000 flight-booker
```

### Cloud Deployment
- **Heroku** - `Procfile` configuration
- **AWS** - EC2 or Elastic Beanstalk
- **Google Cloud** - App Engine or Cloud Run
- **DigitalOcean** - App Platform

---

## Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Guidelines
- Write clear commit messages
- Add tests for new features
- Update documentation
- Follow code style

---

## Learning Resources

### Backend
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [SQLAlchemy ORM](https://docs.sqlalchemy.org/)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)

### Frontend
- [MDN Web Docs](https://developer.mozilla.org/)
- [JavaScript Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
- [CSS Grid & Flexbox](https://css-tricks.com/)

### Full Stack
- [REST API Design](https://restfulapi.net/)
- [Database Design](https://www.databasestar.com/)
- [System Design](https://github.com/donnemartin/system-design-primer)

---

## Frequently Asked Questions (FAQ)

**Q: How do I change the admin password?**
A: Update the database directly or modify `backend/main.py` seed logic.

**Q: Can I use MySQL instead of PostgreSQL?**
A: Yes, but update the `DATABASE_URL` format:
```
mysql://user:password@localhost/flight_booker
```

**Q: How are prices calculated dynamically?**
A: Check `backend/pricing_engine.py` for the formula and multiplier logic.

**Q: Is this production-ready?**
A: No, this is an educational project. Add authentication, validation, and security measures before production use.

**Q: Can multiple users book simultaneously?**
A: Yes, the system uses database constraints to prevent double-booking.

---

## Future Enhancements

- [ ] Multi-language support
- [ ] Payment gateway integration (Stripe, PayPal)
- [ ] Email notifications
- [ ] Mobile app (React Native/Flutter)
- [ ] Advanced analytics dashboard
- [ ] Seat upgrade functionality
- [ ] Loyalty program integration
- [ ] Multi-city flight bookings
- [ ] Real-time flight status updates
- [ ] Airport lounge access booking

---

## License

This project is open source and available under the [MIT License](LICENSE).

---

## Contact & Support

For questions, issues, or suggestions:

- 📧 Email: support@bookmyflight.com
- 🐛 Report Bugs: [GitHub Issues](https://github.com/yourusername/Flight-Booker-Simulator/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/yourusername/Flight-Booker-Simulator/discussions)

---

## Acknowledgments

- FastAPI team for the excellent framework
- SQLAlchemy for ORM functionality
- PostgreSQL for reliable database
- All contributors and testers

---

**Last Updated:** April 2024

**Version:** 1.0.0

Made with ❤️ for learning full-stack development
