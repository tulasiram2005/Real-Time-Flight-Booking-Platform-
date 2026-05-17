// Global state
let currentUser = null;
let currentFlight = null;
let currentBooking = null;
let selectedSeatIds = []; // Array to hold multiple selected seats
let allSeats = [];
let seatCount = 1; // Number of seats user wants to book

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    checkLoginStatus();
    setupAuthListeners();
    setMinDate();
});

function checkLoginStatus() {
    const user = localStorage.getItem('currentUser');
    if (user) {
        currentUser = JSON.parse(user);
        showMainSection();
    } else {
        showLoginSection();
    }
}

function setupAuthListeners() {
    // Tab switching
    document.getElementById('login-tab').addEventListener('click', () => switchTab('login'));
    document.getElementById('register-tab').addEventListener('click', () => switchTab('register'));
    
    // Forms
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('register-form').addEventListener('submit', handleRegister);
    document.getElementById('logout-btn').addEventListener('click', handleLogout);
    
    // Main booking listeners (will be set up after login)
    if (document.getElementById('search-form')) {
        document.getElementById('search-form').addEventListener('submit', handleSearch);
    }
    if (document.getElementById('booking-form')) {
        document.getElementById('booking-form').addEventListener('submit', handleBooking);
    }
    if (document.getElementById('back-btn')) {
        document.getElementById('back-btn').addEventListener('click', showResults);
    }
    if (document.getElementById('download-receipt')) {
        document.getElementById('download-receipt').addEventListener('click', downloadReceipt);
    }
    if (document.getElementById('new-search')) {
        document.getElementById('new-search').addEventListener('click', resetSearch);
    }
    if (document.getElementById('payment-form')) {
        document.getElementById('payment-form').addEventListener('submit', handlePayment);
    }
    if (document.getElementById('back-to-booking-btn')) {
        document.getElementById('back-to-booking-btn').addEventListener('click', showBookingSection);
    }
}

function switchTab(tab) {
    const loginTab = document.getElementById('login-tab');
    const registerTab = document.getElementById('register-tab');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    if (tab === 'login') {
        loginTab.classList.add('active');
        registerTab.classList.remove('active');
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
    } else {
        registerTab.classList.add('active');
        loginTab.classList.remove('active');
        registerForm.classList.remove('hidden');
        loginForm.classList.add('hidden');
    }
    document.getElementById('auth-message').textContent = '';
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    showLoader();
    
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Login failed');
        }
        
        const user = await response.json();
        currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        showMainSection();
    } catch (error) {
        showMessage('auth-message', error.message, 'error');
    } finally {
        hideLoader();
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    
    showLoader();
    
    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Registration failed');
        }
        
        const user = await response.json();
        currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        showMessage('auth-message', 'Registration successful!', 'success');
        setTimeout(() => showMainSection(), 1000);
    } catch (error) {
        showMessage('auth-message', error.message, 'error');
    } finally {
        hideLoader();
    }
}

function handleLogout() {
    localStorage.removeItem('currentUser');
    currentUser = null;
    showLoginSection();
}

function showLoginSection() {
    document.getElementById('login-section').classList.remove('hidden');
    document.getElementById('main-section').classList.add('hidden');
}

function showMainSection() {
    document.getElementById('login-section').classList.add('hidden');
    document.getElementById('main-section').classList.remove('hidden');
    
    if (currentUser) {
        document.getElementById('user-name').textContent = currentUser.name;
        const adminLink = document.getElementById('admin-link');
        if (adminLink) {
            if (currentUser.is_admin) {
                adminLink.classList.remove('hidden');
            } else {
                adminLink.classList.add('hidden');
            }
        }
    }
    
    // Load airports and airlines after login
    loadAirports();
    loadAirlines();
    
    // Setup event listeners for booking
    document.getElementById('search-form').addEventListener('submit', handleSearch);
    document.getElementById('booking-form').addEventListener('submit', handleBooking);
    document.getElementById('back-btn').addEventListener('click', showResults);
    document.getElementById('download-receipt').addEventListener('click', downloadReceipt);
    document.getElementById('new-search').addEventListener('click', resetSearch);
    document.getElementById('payment-form').addEventListener('submit', handlePayment);
    document.getElementById('back-to-booking-btn').addEventListener('click', showBookingSection);
}

function showMessage(elementId, message, type) {
    const element = document.getElementById(elementId);
    element.textContent = message;
    element.className = `message ${type}`;
}

function setMinDate() {
    const dateInput = document.getElementById('date');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.min = today;
        
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        dateInput.value = nextWeek.toISOString().split('T')[0];
    }
}

async function loadAirports() {
    try {
        const response = await fetch('/api/airports');
        const airports = await response.json();
        
        const originSelect = document.getElementById('origin');
        const destSelect = document.getElementById('destination');
        
        if (originSelect && destSelect) {
            originSelect.innerHTML = '<option value="">Select Origin</option>';
            destSelect.innerHTML = '<option value="">Select Destination</option>';
            
            airports.forEach(airport => {
                const option1 = new Option(`${airport.city} (${airport.code})`, airport.code);
                const option2 = new Option(`${airport.city} (${airport.code})`, airport.code);
                originSelect.add(option1);
                destSelect.add(option2);
            });
        }
    } catch (error) {
        console.error('Error loading airports:', error);
    }
}

async function loadAirlines() {
    try {
        const response = await fetch('/api/airlines');
        const airlines = await response.json();
        
        const airlineSelect = document.getElementById('airline');
        
        if (airlineSelect) {
            airlineSelect.innerHTML = '<option value="">All Airlines</option>';
            airlines.forEach(airline => {
                const option = new Option(`${airline.name} (${airline.code})`, airline.code);
                airlineSelect.add(option);
            });
        }
    } catch (error) {
        console.error('Error loading airlines:', error);
    }
}

async function handleSearch(e) {
    e.preventDefault();
    
    const params = {
        origin: document.getElementById('origin').value,
        destination: document.getElementById('destination').value,
        date: document.getElementById('date').value,
        airline: document.getElementById('airline').value || null,
        sort_by: document.getElementById('sort').value
    };
    
    showLoader();
    
    try {
        const response = await fetch('/api/flights/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params)
        });
        
        const flights = await response.json();
        displayFlights(flights);
    } catch (error) {
        console.error('Error searching flights:', error);
        alert('Error searching flights. Please try again.');
    } finally {
        hideLoader();
    }
}

function displayFlights(flights) {
    const container = document.getElementById('results-container');
    const resultsSection = document.getElementById('results-section');
    
    if (flights.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666;">No flights found. Please try different search criteria.</p>';
        resultsSection.classList.remove('hidden');
        return;
    }
    
    container.innerHTML = flights.map(flight => `
        <div class="flight-card">
            <div class="flight-header">
                <div>
                    <div class="flight-number">${flight.flight_number}</div>
                    <div class="airline-name">${flight.airline.name}</div>
                </div>
                <div class="price-info">
                    <div class="current-price">₹${flight.current_price.toFixed(2)}</div>
                    ${flight.base_price !== flight.current_price ? `<div class="base-price">₹${flight.base_price.toFixed(2)}</div>` : ''}
                    <span class="price-trend trend-${flight.price_trend}">
                        ${flight.price_trend === 'low' ? 'Good Deal' : flight.price_trend === 'moderate' ? 'Fair Price' : 'High Demand'}
                    </span>
                </div>
            </div>
            
            <div class="flight-route">
                <div class="route-info">
                    <div class="city">${flight.origin.city}</div>
                    <div class="airport-code">${flight.origin.code}</div>
                    <div class="time">${formatTime(flight.departure_time)}</div>
                </div>
                <div class="arrow">→</div>
                <div class="route-info">
                    <div class="city">${flight.destination.city}</div>
                    <div class="airport-code">${flight.destination.code}</div>
                    <div class="time">${formatTime(flight.arrival_time)}</div>
                </div>
            </div>
            
            <div class="flight-details">
                <div class="detail-item">
                    <div class="detail-label">Duration</div>
                    <div class="detail-value">${flight.duration_hours.toFixed(1)}h</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Aircraft</div>
                    <div class="detail-value">${flight.aircraft_type}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Available Seats</div>
                    <div class="detail-value">${flight.available_seats}/${flight.total_seats}</div>
                    ${flight.available_seats < 10 ? '<div class="seats-info">Only a few seats left!</div>' : ''}
                </div>
                <div>
                    <button class="btn btn-primary" onclick='selectFlight(${JSON.stringify(flight)})'>
                        Book Now
                    </button>
                </div>
            </div>
        </div>
    `).join('');
    
    resultsSection.classList.remove('hidden');
    resultsSection.scrollIntoView({ behavior: 'smooth' });
}

function formatTime(isoString) {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

async function selectFlight(flight) {
    currentFlight = flight;
    selectedSeatIds = [];
    seatCount = parseInt(document.getElementById('seat-count')?.value || '1');
    
    showLoader();
    
    try {
        const response = await fetch(`/api/flights/${flight.id}/seats`);
        allSeats = await response.json();
        
        const bookingSection = document.getElementById('booking-section');
        const bookingDetails = document.getElementById('booking-details');
        
        bookingDetails.innerHTML = `
            <div class="booking-summary">
                <h3>Flight Details</h3>
                <div class="summary-item">
                    <span>Flight:</span>
                    <span>${flight.flight_number} - ${flight.airline.name}</span>
                </div>
                <div class="summary-item">
                    <span>Route:</span>
                    <span>${flight.origin.city} → ${flight.destination.city}</span>
                </div>
                <div class="summary-item">
                    <span>Departure:</span>
                    <span>${formatTime(flight.departure_time)}</span>
                </div>
                <div class="summary-item">
                    <span>Arrival:</span>
                    <span>${formatTime(flight.arrival_time)}</span>
                </div>
                <div class="summary-item">
                    <span>Total Price:</span>
                    <span>₹${flight.current_price.toFixed(2)}</span>
                </div>
            </div>
        `;
        
        // Create visual seat map
        createSeatMap(allSeats);
        
        // Pre-fill passenger info from logged-in user
        if (currentUser) {
            document.getElementById('passenger-name').value = currentUser.name;
            document.getElementById('passenger-email').value = currentUser.email;
        }
        
        document.getElementById('results-section').classList.add('hidden');
        bookingSection.classList.remove('hidden');
        bookingSection.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        console.error('Error loading seats:', error);
        alert('Error loading seats. Please try again.');
    } finally {
        hideLoader();
    }
}

function createSeatMap(seats) {
    const container = document.getElementById('seat-map-container');
    container.innerHTML = '';
    
    // Organize seats by class
    const economySeats = seats.filter(s => s.seat_class === 'economy');
    const businessSeats = seats.filter(s => s.seat_class === 'business');
    
    // Create seat map for each class
    if (businessSeats.length > 0) {
        const businessSection = document.createElement('div');
        businessSection.className = 'seat-map-section';
        businessSection.innerHTML = '<h4>Business Class</h4>';
        businessSection.appendChild(createSeatGrid(businessSeats));
        container.appendChild(businessSection);
    }
    
    if (economySeats.length > 0) {
        const economySection = document.createElement('div');
        economySection.className = 'seat-map-section';
        economySection.innerHTML = '<h4>Economy Class</h4>';
        economySection.appendChild(createSeatGrid(economySeats));
        container.appendChild(economySection);
    }
}

function createSeatGrid(seats) {
    const grid = document.createElement('div');
    grid.className = 'seat-grid';
    
    // Parse seat numbers to determine layout (assuming format like "1A", "1B", etc.)
    const seatsByRow = {};
    seats.forEach(seat => {
        // Try multiple formats: "1A", "1-A", etc.
        let match = seat.seat_number.match(/(\d+)([A-Z])/);
        if (!match) {
            match = seat.seat_number.match(/(\d+)-([A-Z])/);
        }
        if (!match) {
            // If format doesn't match, use seat number as-is and create a simple grid
            const row = 1; // Default row
            if (!seatsByRow[row]) {
                seatsByRow[row] = [];
            }
            seatsByRow[row].push({...seat, col: seat.seat_number, row: row});
        } else {
            const row = parseInt(match[1]);
            if (!seatsByRow[row]) {
                seatsByRow[row] = [];
            }
            seatsByRow[row].push({...seat, col: match[2], row: row});
        }
    });
    
    // Create rows
    Object.keys(seatsByRow).sort((a, b) => a - b).forEach(rowNum => {
        const row = document.createElement('div');
        row.className = 'seat-row';
        
        const rowLabel = document.createElement('div');
        rowLabel.className = 'row-label';
        rowLabel.textContent = rowNum;
        row.appendChild(rowLabel);
        
        // Sort seats by column
        seatsByRow[rowNum].sort((a, b) => a.col.localeCompare(b.col));
        
        seatsByRow[rowNum].forEach((seat, index) => {
            // Add aisle separator after column D (typically)
            if (index === 2 && seatsByRow[rowNum].length > 4) {
                const aisle = document.createElement('div');
                aisle.className = 'aisle-gap';
                row.appendChild(aisle);
            }
            
            const seatBtn = document.createElement('button');
            seatBtn.type = 'button'; // Prevent form submission
            seatBtn.className = `seat-btn ${seat.is_available ? 'seat-available' : 'seat-occupied'}`;
            seatBtn.textContent = seat.col;
            seatBtn.dataset.seatId = seat.id;
            seatBtn.dataset.seatNumber = seat.seat_number;
            seatBtn.disabled = !seat.is_available;
            
            if (seat.is_available) {
                seatBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Seat button clicked:', seat.id, seat.seat_number); // Debug
                    selectSeat(seat.id, seat.seat_number);
                });
            }
            
            row.appendChild(seatBtn);
        });
        
        grid.appendChild(row);
    });
    
    return grid;
}

// Make function globally accessible
window.updateSeatSelection = function() {
    seatCount = parseInt(document.getElementById('seat-count').value);
    // Reset selections if needed
    if (selectedSeatIds.length > seatCount) {
        selectedSeatIds = selectedSeatIds.slice(0, seatCount);
        updateSeatMapDisplay();
    }
    updateSeatSummary();
};

function selectSeat(seatId, seatNumber) {
    console.log('Seat selected:', seatId, seatNumber);
    
    const seatIndex = selectedSeatIds.findIndex(s => s.id === seatId);
    
    if (seatIndex > -1) {
        // Deselect seat
        selectedSeatIds.splice(seatIndex, 1);
    } else {
        // Select seat if we haven't reached the limit
        if (selectedSeatIds.length < seatCount) {
            selectedSeatIds.push({ id: seatId, number: seatNumber });
        } else {
            alert(`You can only select ${seatCount} seat(s). Please deselect a seat first.`);
            return;
        }
    }
    
    updateSeatMapDisplay();
    updateSeatSummary();
}

function updateSeatMapDisplay() {
    // Update UI - remove selected class from all seats
    document.querySelectorAll('.seat-btn').forEach(btn => {
        btn.classList.remove('seat-selected');
    });
    
    // Add selected class to selected seats
    selectedSeatIds.forEach(seat => {
        const selectedBtn = document.querySelector(`[data-seat-id="${seat.id}"]`);
        if (selectedBtn) {
            selectedBtn.classList.add('seat-selected');
        }
    });
}

function updateSeatSummary() {
    const summaryDiv = document.getElementById('seat-selection-summary');
    const infoDiv = document.getElementById('selected-seat-info');
    
    if (selectedSeatIds.length === 0) {
        infoDiv.classList.add('hidden');
        summaryDiv.innerHTML = '';
        document.getElementById('confirm-booking-btn').disabled = true;
    } else {
        const seatNumbers = selectedSeatIds.map(s => s.number).join(', ');
        infoDiv.textContent = `Selected: ${seatNumbers} (${selectedSeatIds.length} of ${seatCount} seat(s))`;
        infoDiv.classList.remove('hidden');
        
        const totalPrice = currentFlight ? (currentFlight.current_price * selectedSeatIds.length).toFixed(2) : '0.00';
        summaryDiv.innerHTML = `
            <div class="price-summary">
                <div class="price-line">
                    <span>Price per seat:</span>
                    <span>₹${currentFlight?.current_price?.toFixed(2) || '0.00'}</span>
                </div>
                <div class="price-line">
                    <span>Number of seats:</span>
                    <span>${selectedSeatIds.length}</span>
                </div>
                <div class="price-line total">
                    <span>Total Amount:</span>
                    <span>₹${totalPrice}</span>
                </div>
            </div>
        `;
        
        // Enable booking button if all seats selected
        const confirmBtn = document.getElementById('confirm-booking-btn');
        if (confirmBtn) {
            confirmBtn.disabled = selectedSeatIds.length !== seatCount;
        }
    }
}

function showResults() {
    document.getElementById('booking-section').classList.add('hidden');
    document.getElementById('results-section').classList.remove('hidden');
    document.getElementById('results-section').scrollIntoView({ behavior: 'smooth' });
}

async function handleBooking(e) {
    e.preventDefault();
    
    if (selectedSeatIds.length === 0) {
        alert('Please select at least one seat first');
        return;
    }
    
    if (selectedSeatIds.length !== seatCount) {
        alert(`Please select exactly ${seatCount} seat(s)`);
        return;
    }
    
    showLoader();
    
    try {
        // Create bookings for each selected seat
        const bookingPromises = selectedSeatIds.map(seat => {
            const bookingData = {
                flight_id: currentFlight.id,
                seat_id: seat.id,
                passenger_name: document.getElementById('passenger-name').value,
                passenger_email: document.getElementById('passenger-email').value,
                passenger_phone: document.getElementById('passenger-phone').value,
                user_id: currentUser ? currentUser.id : null
            };
            
            return fetch('/api/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bookingData)
            }).then(async res => {
                if (!res.ok) {
                    let errorData;
                    try {
                        errorData = await res.json();
                    } catch (e) {
                        errorData = { detail: `HTTP ${res.status}: ${res.statusText}` };
                    }
                    const errorMsg = errorData.detail || 'Booking failed';
                    console.error('Booking API error:', errorMsg, errorData);
                    throw new Error(errorMsg);
                }
                const bookingResponse = await res.json();
                console.log('Booking created successfully:', bookingResponse);
                
                // Validate response has required fields
                if (!bookingResponse.id) {
                    console.error('Booking response missing ID:', bookingResponse);
                    throw new Error('Booking created but missing ID in response');
                }
                
                return bookingResponse;
            });
        });
        
        const bookings = await Promise.all(bookingPromises);
        
        // Debug: Log booking data
        console.log('Bookings created:', bookings);
        bookings.forEach((b, index) => {
            console.log(`Booking ${index}:`, {
                id: b?.id,
                pnr: b?.pnr,
                status: b?.status,
                seat_number: b?.seat_number
            });
        });
        
        // Validate bookings have IDs
        const invalidBookings = bookings.filter(b => !b || !b.id);
        if (invalidBookings.length > 0) {
            console.error('Bookings missing IDs:', invalidBookings);
            alert('Error: Bookings were created but missing IDs. Please try again.');
            return;
        }
        
        currentBooking = bookings; // Store all bookings (pending status)
        showPaymentPage(bookings);
    } catch (error) {
        console.error('Error creating booking:', error);
        alert('Error creating booking. One or more seats may have been taken. Please try again.');
        // Reload seat map
        if (currentFlight) {
            selectFlight(currentFlight);
        }
    } finally {
        hideLoader();
    }
}

function showPaymentPage(bookings) {
    const paymentSection = document.getElementById('payment-section');
    const paymentSummary = document.getElementById('payment-summary');
    const errorDiv = document.getElementById('payment-error');
    
    // Clear any previous errors
    if (errorDiv) {
        errorDiv.classList.add('hidden');
        errorDiv.textContent = '';
    }
    
    const bookingsArray = Array.isArray(bookings) ? bookings : [bookings];
    const totalAmount = bookingsArray.reduce((sum, b) => sum + (b.total_price || 0), 0);
    const booking = bookingsArray[0];
    
    paymentSummary.innerHTML = `
        <div class="payment-summary-card">
            <h3>Payment Summary</h3>
            <div class="payment-summary-item">
                <span>Flight:</span>
                <span>${booking.flight_number}</span>
            </div>
            <div class="payment-summary-item">
                <span>Route:</span>
                <span>${booking.flight_details.origin} → ${booking.flight_details.destination}</span>
            </div>
            <div class="payment-summary-item">
                <span>Passenger:</span>
                <span>${booking.passenger_name}</span>
            </div>
            <div class="payment-summary-item">
                <span>Number of Seats:</span>
                <span>${bookingsArray.length}</span>
            </div>
            <div class="payment-summary-item total">
                <span>Total Amount:</span>
                <span class="total-amount">₹${totalAmount.toFixed(2)}</span>
            </div>
        </div>
    `;
    
    document.getElementById('booking-section').classList.add('hidden');
    paymentSection.classList.remove('hidden');
    paymentSection.scrollIntoView({ behavior: 'smooth' });
}

async function handlePayment(e) {
    e.preventDefault();
    
    if (!currentBooking || currentBooking.length === 0) {
        alert('No bookings to process. Please complete the booking first.');
        return;
    }
    
    // Ensure we have booking IDs
    const bookingsArray = Array.isArray(currentBooking) ? currentBooking : [currentBooking];
    
    console.log('Processing payment for bookings:', bookingsArray);
    console.log('Current booking state:', currentBooking);
    
    const bookingIds = bookingsArray.map(b => {
        if (!b) {
            console.error('Null booking found:', b);
            return null;
        }
        if (b.id === undefined || b.id === null) {
            console.error('Booking missing ID:', b);
            return null;
        }
        return b.id;
    }).filter(id => id !== null && id !== undefined);
    
    console.log('Extracted booking IDs:', bookingIds);
    
    if (bookingIds.length === 0) {
        console.error('No valid booking IDs found. Bookings array:', bookingsArray);
        const errorMsg = 'Invalid booking data. Booking IDs are missing. Please complete a new booking.';
        const errorDiv = document.getElementById('payment-error');
        if (errorDiv) {
            errorDiv.textContent = errorMsg;
            errorDiv.classList.remove('hidden');
        }
        alert(errorMsg);
        return;
    }
    
    const paymentMethodElement = document.querySelector('input[name="payment-method"]:checked');
    if (!paymentMethodElement) {
        alert('Please select a payment method');
        return;
    }
    const paymentMethod = paymentMethodElement.value;
    
    showLoader();
    
    try {
        const response = await fetch('/api/payments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                booking_ids: bookingIds,
                payment_method: paymentMethod,
                payment_details: {}
            })
        });
        
        if (!response.ok) {
            let errorData;
            try {
                errorData = await response.json();
            } catch (e) {
                errorData = { detail: `Server error: ${response.status} ${response.statusText}` };
            }
            const errorMsg = errorData.detail || errorData.message || 'Payment failed';
            console.error('Payment error:', errorMsg, errorData);
            
            // Show error in UI
            const errorDiv = document.getElementById('payment-error');
            if (errorDiv) {
                errorDiv.textContent = `Error: ${errorMsg}`;
                errorDiv.classList.remove('hidden');
                errorDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
            alert(`Payment Error: ${errorMsg}`);
            return;
        }
        
        // Clear any previous errors
        const errorDiv = document.getElementById('payment-error');
        if (errorDiv) {
            errorDiv.classList.add('hidden');
            errorDiv.textContent = '';
        }
        
        const paymentResult = await response.json();
        
        // Validate response
        if (!paymentResult.success || !paymentResult.bookings) {
            console.error('Invalid payment response:', paymentResult);
            alert('Invalid payment response. Please try again.');
            return;
        }
        
        // Update currentBooking with confirmed bookings
        currentBooking = paymentResult.bookings;
        
        showConfirmation(paymentResult.bookings);
    } catch (error) {
        console.error('Error processing payment:', error);
        const errorMsg = error.message || 'An unexpected error occurred. Please try again.';
        alert(`Error: ${errorMsg}`);
    } finally {
        hideLoader();
    }
}

function showBookingSection() {
    document.getElementById('payment-section').classList.add('hidden');
    document.getElementById('booking-section').classList.remove('hidden');
    document.getElementById('booking-section').scrollIntoView({ behavior: 'smooth' });
}

function showConfirmation(bookings) {
    const confirmationSection = document.getElementById('confirmation-section');
    const confirmationDetails = document.getElementById('confirmation-details');
    
    // Handle both single booking (legacy) and multiple bookings
    const bookingsArray = Array.isArray(bookings) ? bookings : [bookings];
    const totalAmount = bookingsArray.reduce((sum, b) => sum + (b.total_price || 0), 0);
    const allSeats = bookingsArray.map(b => b.seat_number).join(', ');
    const allPNRs = bookingsArray.map(b => b.pnr).join(', ');
    const allPINs = bookingsArray.map(b => b.unique_pin || 'N/A').join(', ');
    
    const booking = bookingsArray[0]; // Use first booking for flight details
    
    // Generate QR code images HTML
    const qrCodesHTML = bookingsArray.map(b => `
        <div class="qrcode-ticket">
            <div class="qrcode-container">
                <img src="/api/bookings/${b.id}/qrcode" alt="QR Code" class="qrcode-image">
            </div>
            <div class="ticket-info">
                <div class="ticket-pnr">PNR: ${b.pnr}</div>
                <div class="ticket-pin">PIN: ${b.unique_pin || 'N/A'}</div>
                <div class="ticket-seat">Seat: ${b.seat_number}</div>
            </div>
        </div>
    `).join('');
    
    confirmationDetails.innerHTML = `
        <div class="confirmation-card">
            <div class="confirmation-header">
                <h3 style="text-align: center; margin-bottom: 10px;">✓ Booking Confirmed!</h3>
                <p style="text-align: center; opacity: 0.9; margin-bottom: 20px;">Your flight reservation has been successfully processed</p>
            </div>
            <div class="pnr-section">
                <div class="pnr-label">Booking Reference Number(s)</div>
                <div class="pnr">${allPNRs}</div>
                ${bookingsArray.length > 1 ? `<div class="pnr-note">Multiple bookings created for ${bookingsArray.length} seat(s)</div>` : ''}
            </div>
            <div class="pin-section">
                <div class="pin-label">Unique PIN(s) for Ticket Verification</div>
                <div class="pin">${allPINs}</div>
                <div class="pin-note">Keep this PIN safe. You'll need it along with your PNR for ticket verification.</div>
            </div>
            <div class="qrcode-section">
                <h4>Your Ticket QR Codes</h4>
                <div class="qrcode-grid">
                    ${qrCodesHTML}
                </div>
            </div>
            <div class="confirmation-details">
                <div class="detail-section">
                    <h4>Passenger Information</h4>
                    <div class="detail-row">
                        <span>Name:</span>
                        <span>${booking.passenger_name}</span>
                    </div>
                    <div class="detail-row">
                        <span>Email:</span>
                        <span>${booking.passenger_email}</span>
                    </div>
                    <div class="detail-row">
                        <span>Phone:</span>
                        <span>${booking.passenger_phone}</span>
                    </div>
                </div>
                
                <div class="detail-section">
                    <h4>Flight Information</h4>
                    <div class="detail-row">
                        <span>Flight Number:</span>
                        <span>${booking.flight_number}</span>
                    </div>
                    <div class="detail-row">
                        <span>Route:</span>
                        <span>${booking.flight_details.origin} → ${booking.flight_details.destination}</span>
                    </div>
                    <div class="detail-row">
                        <span>Departure:</span>
                        <span>${formatTime(booking.flight_details.departure_time)}</span>
                    </div>
                    <div class="detail-row">
                        <span>Arrival:</span>
                        <span>${formatTime(booking.flight_details.arrival_time)}</span>
                    </div>
                </div>
                
                <div class="detail-section">
                    <h4>Seat Information</h4>
                    <div class="detail-row">
                        <span>Selected Seats:</span>
                        <span class="seat-numbers">${allSeats}</span>
                    </div>
                    <div class="detail-row">
                        <span>Number of Seats:</span>
                        <span>${bookingsArray.length}</span>
                    </div>
                </div>
                
                <div class="detail-section total-section">
                    <div class="detail-row total-row">
                        <span>Total Amount Paid:</span>
                        <span class="total-amount">₹${totalAmount.toFixed(2)}</span>
                    </div>
                    <div class="detail-row">
                        <span>Booking Date:</span>
                        <span>${formatTime(booking.booking_date || new Date().toISOString())}</span>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('booking-section').classList.add('hidden');
    document.getElementById('payment-section').classList.add('hidden');
    confirmationSection.classList.remove('hidden');
    confirmationSection.scrollIntoView({ behavior: 'smooth' });
}

function downloadReceipt() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Handle both single and multiple bookings
    const bookings = Array.isArray(currentBooking) ? currentBooking : [currentBooking];
    const booking = bookings[0];
    const totalAmount = bookings.reduce((sum, b) => sum + (b.total_price || 0), 0);
    const allSeats = bookings.map(b => b.seat_number).join(', ');
    const allPNRs = bookings.map(b => b.pnr).join(', ');
    const allPINs = bookings.map(b => b.unique_pin || 'N/A').join(', ');
    
    // Helper function to safely format text for PDF (handle encoding issues)
    const safeText = (text) => {
        if (!text) return '';
        return String(text)
            .replace(/→/g, 'to')
            .replace(/₹/g, 'INR')
            .replace(/[^\x20-\x7E\s]/g, '') // Keep only printable ASCII and whitespace
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim();
    };
    
    // Helper to format price
    const formatPrice = (amount) => {
        return `INR ${parseFloat(amount).toFixed(2)}`;
    };
    
    let y = 20;
    
    // Header with gradient effect simulation
    doc.setFillColor(102, 126, 234);
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont(undefined, 'bold');
    doc.text('BookMyFlight', 105, 18, { align: 'center' });
    
    doc.setFontSize(16);
    doc.setFont(undefined, 'normal');
    doc.text('Booking Confirmation Receipt', 105, 28, { align: 'center' });
    
    doc.setTextColor(0, 0, 0);
    y = 50;
    
    // PNR Section
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('BOOKING REFERENCE NUMBER', 20, y);
    y += 8;
    
    doc.setFontSize(18);
    doc.setTextColor(102, 126, 234);
    doc.text(allPNRs, 20, y);
    y += 12;
    
    // PIN Section
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('UNIQUE PIN FOR VERIFICATION', 20, y);
    y += 8;
    
    doc.setFontSize(18);
    doc.setTextColor(118, 75, 162);
    doc.text(allPINs, 20, y);
    y += 15;
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    if (bookings.length > 1) {
        doc.text(`Multiple bookings created for ${bookings.length} seat(s)`, 20, y);
        y += 8;
    }
    
    // Separator line
    doc.setDrawColor(200, 200, 200);
    doc.line(20, y, 190, y);
    y += 12;
    
    // Passenger Information Section
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('PASSENGER INFORMATION', 20, y);
    y += 8;
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Name: ${safeText(booking.passenger_name)}`, 25, y);
    y += 7;
    doc.text(`Email: ${safeText(booking.passenger_email)}`, 25, y);
    y += 7;
    doc.text(`Phone: ${safeText(booking.passenger_phone)}`, 25, y);
    y += 12;
    
    // Flight Information Section
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('FLIGHT INFORMATION', 20, y);
    y += 8;
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Flight Number: ${safeText(booking.flight_number)}`, 25, y);
    y += 7;
    const routeText = `${safeText(booking.flight_details.origin)} to ${safeText(booking.flight_details.destination)}`;
    doc.text(`Route: ${routeText}`, 25, y);
    y += 7;
    doc.text(`Departure: ${formatTime(booking.flight_details.departure_time)}`, 25, y);
    y += 7;
    doc.text(`Arrival: ${formatTime(booking.flight_details.arrival_time)}`, 25, y);
    y += 12;
    
    // Seat Information Section
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('SEAT INFORMATION', 20, y);
    y += 8;
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Selected Seats: ${safeText(allSeats)}`, 25, y);
    y += 7;
    doc.text(`Number of Seats: ${bookings.length}`, 25, y);
    y += 12;
    
    // Price Breakdown
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('PRICE BREAKDOWN', 20, y);
    y += 8;
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    
    // Always show price per seat
    const pricePerSeat = booking.total_price || 0;
    doc.text(`Price per seat: ${formatPrice(pricePerSeat)}`, 25, y);
    y += 7;
    doc.text(`Number of seats: ${bookings.length}`, 25, y);
    y += 7;
    
    // Total
    doc.setDrawColor(200, 200, 200);
    doc.line(20, y, 190, y);
    y += 8;
    
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(40, 167, 69);
    doc.text(`Total Amount: ${formatPrice(totalAmount)}`, 20, y);
    y += 15;
    
    // Footer
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.setDrawColor(200, 200, 200);
    doc.line(20, y, 190, y);
    y += 10;
    
    doc.text(`Booking Date: ${formatTime(booking.booking_date || new Date().toISOString())}`, 20, y);
    y += 6;
    doc.text(`Status: ${safeText(booking.status).toUpperCase()}`, 20, y);
    y += 10;
    
    // Footer note
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text('Thank you for choosing BookMyFlight!', 105, y, { align: 'center' });
    y += 5;
    doc.text('This is your official booking confirmation receipt.', 105, y, { align: 'center' });
    y += 5;
    doc.text('Please keep this receipt for your records.', 105, y, { align: 'center' });
    
    // Save PDF
    const fileName = bookings.length > 1 ? `booking-${allPNRs.split(',')[0]}-multiple.pdf` : `booking-${booking.pnr}.pdf`;
    doc.save(fileName);
}

function resetSearch() {
    document.getElementById('confirmation-section').classList.add('hidden');
    document.getElementById('search-section').classList.remove('hidden');
    document.getElementById('search-form').reset();
    document.getElementById('booking-form').reset();
    document.getElementById('seat-count').value = '1';
    setMinDate();
    currentFlight = null;
    currentBooking = null;
    selectedSeatIds = [];
    seatCount = 1;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showLoader() {
    document.getElementById('loader').classList.remove('hidden');
}

function hideLoader() {
    document.getElementById('loader').classList.add('hidden');
}
