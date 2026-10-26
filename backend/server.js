const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const loki = require('lokijs');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

/
const db = new loki('imovies.db');
const users = db.addCollection('users');
const movies = db.addCollection('movies');
const bookings = db.addCollection('bookings');

console.log('Temporary In-Memory Database successfully connected');


const auth = (req, res, next) => {
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).json({ msg: 'Authorization denied' });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretkey123');
        req.user = decoded.user;
        next();
    } catch (err) {
        res.status(400).json({ msg: 'Token validation failed' });
    }
};


app.post('/api/auth/register', async (req, res) => {
    const { name, email, password } = req.body;
    try {
        let user = users.findOne({ email });
        if (user) return res.status(400).json({ msg: 'User already exists' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user = users.insert({ name, email, password: hashedPassword });

        const payload = { user: { id: user.$loki } };
        jwt.sign(payload, process.env.JWT_SECRET || 'supersecretkey123', { expiresIn: 3600 }, (err, token) => {
            if (err) throw err;
            res.json({ token, user: { name, email } });
        });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        let user = users.findOne({ email });
        if (!user) return res.status(400).json({ msg: 'Invalid Credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: 'Invalid Credentials' });

        const payload = { user: { id: user.$loki } };
        jwt.sign(payload, process.env.JWT_SECRET || 'supersecretkey123', { expiresIn: 3600 }, (err, token) => {
            if (err) throw err;
            res.json({ token, user: { name: user.name, email } });
        });
    } catch (err) {
        res.status(500).send('Server error');
    }
});


app.get('/api/movies', (req, res) => {
    res.json(movies.find());
});

app.get('/api/movies/seed', (req, res) => {
    const seedMovies = [
        { title: "Inception", genre: "Sci-Fi", duration: 148, showtimes: ["12:00 PM", "3:30 PM", "7:00 PM"], availableSeats: 40 },
        { title: "The Dark Knight", genre: "Action", duration: 152, showtimes: ["1:00 PM", "4:30 PM", "8:00 PM"], availableSeats: 35 },
        { title: "Interstellar", genre: "Adventure", duration: 169, showtimes: ["11:00 AM", "5:00 PM"], availableSeats: 28 }
    ];
    movies.clear();
    seedMovies.forEach(m => movies.insert(m));
    res.json({ msg: "Database seeded successfully!" });
});


app.post('/api/bookings', auth, (req, res) => {
    const { movieId, showtime, seatsBooked } = req.body;
    try {
        const movie = movies.findOne({ $loki: parseInt(movieId) });
        if (!movie) return res.status(404).json({ msg: 'Movie not found' });
        if (movie.availableSeats < seatsBooked) return res.status(400).json({ msg: 'Not enough seats available' });

        movie.availableSeats -= seatsBooked;
        movies.update(movie);

        const booking = bookings.insert({
            user: req.user.id,
            movie: { title: movie.title, genre: movie.genre },
            showtime,
            seatsBooked
        });

        res.json(booking);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

app.get('/api/bookings/my-bookings', auth, (req, res) => {
    try {
        const userBookings = bookings.find({ user: req.user.id });
        res.json(userBookings);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});


const PORT = 5000; 
app.listen(PORT, () => console.log(`Server successfully started on port ${PORT}`));