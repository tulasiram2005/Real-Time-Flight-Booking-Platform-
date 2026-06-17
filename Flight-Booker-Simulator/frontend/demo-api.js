(function () {
    const API_PREFIX = '/api/';
    const nativeFetch = window.fetch.bind(window);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const stateKey = 'bookMyFlightDemoState';
    const airports = [
        { id: 1, code: 'DEL', name: 'Indira Gandhi International Airport', city: 'Delhi', country: 'India' },
        { id: 2, code: 'BOM', name: 'Chhatrapati Shivaji Maharaj International Airport', city: 'Mumbai', country: 'India' },
        { id: 3, code: 'BLR', name: 'Kempegowda International Airport', city: 'Bengaluru', country: 'India' },
        { id: 4, code: 'MAA', name: 'Chennai International Airport', city: 'Chennai', country: 'India' },
        { id: 5, code: 'HYD', name: 'Rajiv Gandhi International Airport', city: 'Hyderabad', country: 'India' },
        { id: 6, code: 'DXB', name: 'Dubai International Airport', city: 'Dubai', country: 'UAE' }
    ];

    const airlines = [
        { id: 1, code: 'AI', name: 'Air India' },
        { id: 2, code: 'IX', name: 'Air India Express' },
        { id: 3, code: '6E', name: 'IndiGo' },
        { id: 4, code: 'UK', name: 'Vistara' }
    ];

    const routePairs = [
        ['DEL', 'BOM', 'AI 241', 5200, 'Airbus A320', 2.2],
        ['DEL', 'BLR', '6E 611', 6200, 'Airbus A321neo', 2.8],
        ['BOM', 'DXB', 'IX 193', 11800, 'Boeing 737 MAX', 3.1],
        ['BLR', 'MAA', 'UK 802', 4100, 'Airbus A320', 1.1],
        ['HYD', 'DEL', '6E 224', 5700, 'Airbus A321neo', 2.3],
        ['MAA', 'BOM', 'AI 574', 5400, 'Airbus A320', 2.0],
        ['BOM', 'DEL', 'UK 944', 6900, 'Boeing 787', 2.1],
        ['BLR', 'DXB', 'AI 917', 13750, 'Boeing 787', 3.7]
    ];

    function pad(value) {
        return String(value).padStart(2, '0');
    }

    function departureDate(hourOffset) {
        const date = new Date(tomorrow);
        date.setHours(7 + hourOffset, (hourOffset * 11) % 60, 0, 0);
        return date;
    }

    function buildFlights() {
        return routePairs.map((route, index) => {
            const [originCode, destinationCode, flightNumber, basePrice, aircraftType, durationHours] = route;
            const departure = departureDate(index * 2);
            const arrival = new Date(departure.getTime() + durationHours * 60 * 60 * 1000);
            const airlineCode = flightNumber.split(' ')[0];
            const airline = airlines.find(item => item.code === airlineCode) || airlines[0];
            const totalSeats = index % 2 === 0 ? 144 : 180;
            const availableSeats = Math.max(6, totalSeats - 42 - index * 9);
            const demandFactor = 1 + (1 - availableSeats / totalSeats) * 0.42 + (index % 3) * 0.05;
            const currentPrice = Math.round(basePrice * demandFactor);
            return {
                id: index + 1,
                flight_number: flightNumber,
                airline,
                airline_id: airline.id,
                origin: airports.find(item => item.code === originCode),
                origin_id: airports.find(item => item.code === originCode).id,
                destination: airports.find(item => item.code === destinationCode),
                destination_id: airports.find(item => item.code === destinationCode).id,
                departure_time: departure.toISOString(),
                arrival_time: arrival.toISOString(),
                duration_hours: durationHours,
                aircraft_type: aircraftType,
                base_price: basePrice,
                current_price: currentPrice,
                price_trend: currentPrice < basePrice * 1.12 ? 'low' : currentPrice < basePrice * 1.25 ? 'moderate' : 'high',
                total_seats: totalSeats,
                available_seats: availableSeats
            };
        });
    }

    function initialState() {
        return {
            users: [
                { id: 1, email: 'admin@bookmyflight.com', name: 'Administrator', password: 'admin123', is_admin: true },
                { id: 2, email: 'demo@bookmyflight.com', name: 'Demo Traveller', password: 'demo123', is_admin: false }
            ],
            flights: buildFlights(),
            bookings: [],
            nextUserId: 3,
            nextBookingId: 1001,
            nextFlightId: 20
        };
    }

    function getState() {
        const saved = localStorage.getItem(stateKey);
        if (!saved) {
            const fresh = initialState();
            localStorage.setItem(stateKey, JSON.stringify(fresh));
            return fresh;
        }
        return JSON.parse(saved);
    }

    function setState(state) {
        localStorage.setItem(stateKey, JSON.stringify(state));
    }

    function json(data, status = 200) {
        return new Response(JSON.stringify(data), {
            status,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    function generateSeats(flightId) {
        const occupiedSeed = Number(flightId) * 7;
        const seats = [];
        const columns = ['A', 'B', 'C', 'D', 'E', 'F'];
        for (let row = 1; row <= 24; row += 1) {
            columns.forEach((column, colIndex) => {
                const id = Number(`${flightId}${pad(row)}${colIndex + 1}`);
                seats.push({
                    id,
                    seat_number: `${row}${column}`,
                    seat_class: row <= 4 ? 'business' : 'economy',
                    is_available: (row + colIndex + occupiedSeed) % 9 !== 0
                });
            });
        }
        return seats;
    }

    function bookingPayload(booking, flight, seatNumber, status = 'pending') {
        return {
            id: booking.id,
            pnr: booking.pnr,
            unique_pin: booking.unique_pin,
            status,
            passenger_name: booking.passenger_name,
            passenger_email: booking.passenger_email,
            passenger_phone: booking.passenger_phone,
            seat_number: seatNumber,
            total_price: flight.current_price,
            flight_number: flight.flight_number,
            booking_date: booking.booking_date,
            qr_code: booking.qr_code,
            flight_details: {
                origin: flight.origin.city,
                destination: flight.destination.city,
                departure_time: flight.departure_time,
                arrival_time: flight.arrival_time
            }
        };
    }

    function ticketSvgDataUrl(booking) {
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 180 180">
            <rect width="180" height="180" rx="18" fill="#ffffff"/>
            <rect x="22" y="22" width="136" height="136" rx="8" fill="#101828"/>
            <rect x="34" y="34" width="28" height="28" fill="#ffffff"/>
            <rect x="118" y="34" width="28" height="28" fill="#ffffff"/>
            <rect x="34" y="118" width="28" height="28" fill="#ffffff"/>
            <rect x="72" y="44" width="12" height="12" fill="#ffffff"/>
            <rect x="92" y="44" width="18" height="18" fill="#ffffff"/>
            <rect x="76" y="76" width="20" height="20" fill="#ffffff"/>
            <rect x="110" y="76" width="10" height="34" fill="#ffffff"/>
            <rect x="76" y="116" width="34" height="10" fill="#ffffff"/>
            <rect x="126" y="126" width="18" height="18" fill="#ffffff"/>
            <text x="90" y="171" text-anchor="middle" font-family="Arial" font-size="12" fill="#344054">${booking.pnr}</text>
        </svg>`;
        return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
    }

    async function readBody(options) {
        if (!options || !options.body) return {};
        return typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
    }

    async function handleApi(path, options = {}) {
        const state = getState();
        const method = (options.method || 'GET').toUpperCase();
        const url = new URL(path, window.location.origin);
        const cleanPath = url.pathname;

        if (cleanPath === '/api/auth/login' && method === 'POST') {
            const body = await readBody(options);
            const user = state.users.find(item => item.email === body.email && item.password === body.password);
            if (!user) return json({ detail: 'Invalid email or password. Try demo@bookmyflight.com / demo123.' }, 401);
            return json({ id: user.id, email: user.email, name: user.name, is_admin: user.is_admin, message: 'Login successful' });
        }

        if (cleanPath === '/api/auth/register' && method === 'POST') {
            const body = await readBody(options);
            if (state.users.some(item => item.email === body.email)) return json({ detail: 'Email already registered' }, 400);
            const user = { id: state.nextUserId, email: body.email, name: body.name, password: body.password, is_admin: false };
            state.nextUserId += 1;
            state.users.push(user);
            setState(state);
            return json({ id: user.id, email: user.email, name: user.name, is_admin: false, message: 'Registration successful' });
        }

        if (cleanPath === '/api/airports') return json(airports);
        if (cleanPath === '/api/airlines') return json(airlines);

        if (cleanPath === '/api/flights/search' && method === 'POST') {
            const body = await readBody(options);
            let flights = state.flights.filter(flight => {
                const originOk = !body.origin || flight.origin.code === body.origin;
                const destinationOk = !body.destination || flight.destination.code === body.destination;
                const airlineOk = !body.airline || flight.airline.code === body.airline;
                return originOk && destinationOk && airlineOk && flight.origin.code !== flight.destination.code;
            });
            if (flights.length === 0) flights = state.flights.slice(0, 4);
            flights.sort((a, b) => {
                if (body.sort_by === 'duration') return a.duration_hours - b.duration_hours;
                if (body.sort_by === 'departure') return new Date(a.departure_time) - new Date(b.departure_time);
                return a.current_price - b.current_price;
            });
            return json(flights);
        }

        const seatsMatch = cleanPath.match(/^\/api\/flights\/(\d+)\/seats$/);
        if (seatsMatch) {
            const flightId = Number(seatsMatch[1]);
            const bookedSeatIds = state.bookings.filter(item => item.flight_id === flightId).map(item => item.seat_id);
            return json(generateSeats(flightId).map(seat => ({
                ...seat,
                is_available: seat.is_available && !bookedSeatIds.includes(seat.id)
            })));
        }

        if (cleanPath === '/api/bookings' && method === 'POST') {
            const body = await readBody(options);
            const flight = state.flights.find(item => item.id === Number(body.flight_id));
            if (!flight) return json({ detail: 'Flight not found' }, 404);
            const seat = generateSeats(flight.id).find(item => item.id === Number(body.seat_id));
            if (!seat || !seat.is_available) return json({ detail: 'Seat is not available' }, 409);
            const booking = {
                id: state.nextBookingId,
                flight_id: flight.id,
                seat_id: seat.id,
                pnr: `BMF${Math.floor(100000 + Math.random() * 899999)}`,
                unique_pin: `${Math.floor(100000 + Math.random() * 899999)}`,
                passenger_name: body.passenger_name,
                passenger_email: body.passenger_email,
                passenger_phone: body.passenger_phone,
                booking_date: new Date().toISOString(),
                status: 'pending'
            };
            state.nextBookingId += 1;
            booking.qr_code = ticketSvgDataUrl(booking);
            state.bookings.push(booking);
            flight.available_seats = Math.max(0, flight.available_seats - 1);
            setState(state);
            return json(bookingPayload(booking, flight, seat.seat_number));
        }

        if (cleanPath === '/api/payments' && method === 'POST') {
            const body = await readBody(options);
            const bookings = body.booking_ids.map(id => {
                const booking = state.bookings.find(item => item.id === Number(id));
                if (!booking) return null;
                booking.status = 'confirmed';
                const flight = state.flights.find(item => item.id === booking.flight_id);
                const seat = generateSeats(flight.id).find(item => item.id === booking.seat_id);
                return bookingPayload(booking, flight, seat.seat_number, 'confirmed');
            }).filter(Boolean);
            setState(state);
            return json({ success: true, payment_method: body.payment_method, bookings });
        }

        if (cleanPath === '/api/admin/flights') {
            if (method === 'GET') return json(state.flights);
            if (method === 'POST') {
                const body = await readBody(options);
                const origin = airports.find(item => item.id === Number(body.origin_id)) || airports[0];
                const destination = airports.find(item => item.id === Number(body.destination_id)) || airports[1];
                const airline = airlines.find(item => item.id === Number(body.airline_id)) || airlines[0];
                const flight = {
                    id: state.nextFlightId,
                    ...body,
                    origin,
                    destination,
                    airline,
                    duration_hours: 2,
                    current_price: Number(body.base_price),
                    price_trend: 'low'
                };
                state.nextFlightId += 1;
                state.flights.push(flight);
                setState(state);
                return json(flight);
            }
        }

        const adminFlightMatch = cleanPath.match(/^\/api\/admin\/flights\/(\d+)$/);
        if (adminFlightMatch) {
            const id = Number(adminFlightMatch[1]);
            const index = state.flights.findIndex(item => item.id === id);
            if (index === -1) return json({ detail: 'Flight not found' }, 404);
            if (method === 'DELETE') {
                state.flights.splice(index, 1);
                setState(state);
                return json({ ok: true });
            }
            if (method === 'PUT') {
                const body = await readBody(options);
                state.flights[index] = { ...state.flights[index], ...body };
                setState(state);
                return json(state.flights[index]);
            }
        }

        return json({ detail: 'Demo endpoint not implemented' }, 404);
    }

    window.fetch = function (resource, options) {
        const url = typeof resource === 'string' ? resource : resource.url;
        if (url && new URL(url, window.location.origin).pathname.startsWith(API_PREFIX)) {
            return handleApi(url, options);
        }
        return nativeFetch(resource, options);
    };
}());
