import './App.css';
import React, { useState, useEffect } from 'react';

function App() {
    const [movies, setMovies] = useState([]);
    const [token, setToken] = useState(localStorage.getItem('token') || '');
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
    const [bookings, setBookings] = useState([]);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [isRegister, setIsRegister] = useState(false);

    const [selectedMovie, setSelectedMovie] = useState(null);
    const [selectedShowtime, setSelectedShowtime] = useState('');
    const [seats, setSeats] = useState(1);

    useEffect(() => {
        fetchMovies();
        if (token) fetchMyBookings();
    }, [token]);

    const fetchMovies = async () => {
        const res = await fetch('http://localhost:5000/api/movies');
        const data = await res.json();
        if (Array.isArray(data)) setMovies(data);
    };

    const fetchMyBookings = async () => {
        const res = await fetch('http://localhost:5000/api/bookings/my-bookings', {
            headers: { 'x-auth-token': token }
        });
        const data = await res.json();
        if (Array.isArray(data)) setBookings(data);
    };

    const handleAuth = async (e) => {
        e.preventDefault();
        const url = isRegister ? 'register' : 'login';
        const body = isRegister ? { name, email, password } : { email, password };

        const res = await fetch(`http://localhost:5000/api/auth/${url}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const data = await res.json();

        if (data.token) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            setToken(data.token);
            setUser(data.user);
            setEmail(''); setPassword(''); setName('');
        } else {
            alert(data.msg || 'Authentication Error');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken('');
        setUser(null);
        setBookings([]);
    };

    const handleBooking = async (e) => {
        e.preventDefault();
        if (!token) return alert('Please login to reserve tickets');

        const res = await fetch('http://localhost:5000/api/bookings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token
            },
            body: JSON.stringify({
                movieId: selectedMovie.$loki,
                showtime: selectedShowtime,
                seatsBooked: parseInt(seats)
            })
        });
        const data = await res.json();
        if (res.ok) {
            alert('Tickets booked successfully!');
            setSelectedMovie(null);
            fetchMovies();
            fetchMyBookings();
        } else {
            alert(data.msg || 'Booking failure');
        }
    };

    return (
        <div>
            <nav className="navbar navbar-dark bg-dark mb-4">
                <div className="container">
                    <span className="navbar-brand mb-0 h1">🎬 IMovies</span>
                    <div>
                        {user ? (
                            <div className="d-flex align-items-center gap-3">
                                <span className="text-white">Hello, {user.name}</span>
                                <button onClick={handleLogout} className="btn btn-outline-light btn-sm">Logout</button>
                            </div>
                        ) : (
                            <span className="text-white-50 small">Log in below to reserve seats</span>
                        )}
                    </div>
                </div>
            </nav>

            <div className="container">
                <div className="row">
                    <div className="col-md-8">
                        <h3 className="mb-3">Now Showing</h3>
                        <div className="row">
                            {movies.map(movie => (
                                <div className="col-md-6 mb-3" key={movie.$loki}>
                                    <div className="card h-100 p-3">
                                        <h5>{movie.title}</h5>
                                        <p className="text-muted mb-1">Genre: {movie.genre} | {movie.duration} mins</p>
                                        <p className="fw-bold text-success">Available Seats: {movie.availableSeats}</p>
                                        <button
                                            onClick={() => { setSelectedMovie(movie); setSelectedShowtime(movie.showtimes[0]); }}
                                            className="btn btn-primary w-100 mt-auto"
                                            disabled={movie.availableSeats <= 0}
                                        >
                                            {movie.availableSeats > 0 ? 'Select Movie' : 'Housefull'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {selectedMovie && (
                            <div className="card p-4 mt-4 border-primary">
                                <h4>Reserve Seats for: <span className="text-primary">{selectedMovie.title}</span></h4>
                                <form onSubmit={handleBooking} className="row g-3 mt-1">
                                    <div className="col-md-6">
                                        <label className="form-label">Choose Showtime</label>
                                        <select className="form-select" value={selectedShowtime} onChange={e => setSelectedShowtime(e.target.value)}>
                                            {selectedMovie.showtimes.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">Number of Tickets</label>
                                        <input type="number" min="1" max="10" className="form-control" value={seats} onChange={e => setSeats(e.target.value)} />
                                    </div>
                                    <div className="col-12 d-flex gap-2">
                                        <button type="submit" className="btn btn-success">Confirm Order</button>
                                        <button type="button" onClick={() => setSelectedMovie(null)} className="btn btn-secondary">Cancel</button>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>

                    <div className="col-md-4">
                        {!token ? (
                            <div className="card p-3 mb-4">
                                <h4>{isRegister ? 'Create Account' : 'Sign In'}</h4>
                                <form onSubmit={handleAuth} className="mt-2">
                                    {isRegister && (
                                        <div className="mb-3">
                                            <input type="text" placeholder="Name" className="form-control" value={name} onChange={e => setName(e.target.value)} required />
                                        </div>
                                    )}
                                    <div className="mb-3">
                                        <input type="email" placeholder="Email Address" className="form-control" value={email} onChange={e => setEmail(e.target.value)} required />
                                    </div>
                                    <div className="mb-3">
                                        <input type="password" placeholder="Password" className="form-control" value={password} onChange={e => setPassword(e.target.value)} required />
                                    </div>
                                    <button type="submit" className="btn btn-dark w-100">{isRegister ? 'Register' : 'Login'}</button>
                                    <p className="text-center mt-3 mb-0 small">
                                        <span style={{ cursor: 'pointer' }} className="text-primary" onClick={() => setIsRegister(!isRegister)}>
                                            {isRegister ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
                                        </span>
                                    </p>
                                </form>
                            </div>
                        ) : (
                            <div className="card p-3 mb-4">
                                <h4>My Bookings</h4>
                                {bookings.length === 0 ? <p className="text-muted small">No tickets booked yet.</p> : (
                                    <ul className="list-group list-group-flush mt-2">
                                        {bookings.map(b => (
                                            <li className="list-group-item px-0" key={b.$loki}>
                                                <div className="fw-bold">{b.movie?.title || 'Movie'}</div>
                                                <div className="small text-muted">{b.showtime} • {b.seatsBooked} Seat(s)</div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default App;
