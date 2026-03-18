const path = require('path');
const fs = require('fs');
const express = require('express');
const OS = require('os');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const app = express();
const cors = require('cors');
const serverless = require('serverless-http');

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '/')));
app.use(cors());

// In-memory country data — used in test mode (NODE_ENV=test)
const countriesData = [
    { id: 1, name: 'India',          capital: 'New Delhi',    population: '1.4 billion',  continent: 'Asia',          currency: 'Indian Rupee' },
    { id: 2, name: 'United States',  capital: 'Washington DC',population: '331 million',  continent: 'North America', currency: 'US Dollar' },
    { id: 3, name: 'Germany',        capital: 'Berlin',       population: '83 million',   continent: 'Europe',        currency: 'Euro' },
    { id: 4, name: 'Brazil',         capital: 'Brasilia',     population: '215 million',  continent: 'South America', currency: 'Brazilian Real' },
    { id: 5, name: 'Japan',          capital: 'Tokyo',        population: '125 million',  continent: 'Asia',          currency: 'Japanese Yen' },
    { id: 6, name: 'Australia',      capital: 'Canberra',     population: '26 million',   continent: 'Oceania',       currency: 'Australian Dollar' },
    { id: 7, name: 'South Africa',   capital: 'Pretoria',     population: '60 million',   continent: 'Africa',        currency: 'South African Rand' },
    { id: 8, name: 'Canada',         capital: 'Ottawa',       population: '38 million',   continent: 'North America', currency: 'Canadian Dollar' },
    { id: 9, name: 'France',         capital: 'Paris',        population: '68 million',   continent: 'Europe',        currency: 'Euro' },
    { id: 10, name: 'Argentina',     capital: 'Buenos Aires', population: '46 million',   continent: 'South America', currency: 'Argentine Peso' }
];

// MongoDB connection — skipped in test mode
if (process.env.NODE_ENV !== 'test') {
    mongoose.connect(process.env.MONGO_URI, {
        user: process.env.MONGO_USERNAME,
        pass: process.env.MONGO_PASSWORD,
        useNewUrlParser: true,
        useUnifiedTopology: true
    }, function(err) {
        if (err) {
            console.log("error!! " + err);
        } else {
            // console.log("MongoDB Connection Successful")
        }
    });
}

var Schema = mongoose.Schema;
var countrySchema = new Schema({
    name: String,
    id: Number,
    capital: String,
    population: String,
    continent: String,
    currency: String
});
var countryModel = mongoose.model('countries', countrySchema);

app.post('/country', function(req, res) {
    const requestedId = parseInt(req.body.id);

    if (process.env.NODE_ENV === 'test') {
        const country = countriesData.find(c => c.id === requestedId);
        if (country) { return res.status(200).json(country); }
        return res.status(404).json({ error: 'Country not found' });
    }

    countryModel.findOne({ id: req.body.id }, function(err, countryData) {
        if (err) {
            res.send("Error in Country Data");
        } else {
            res.send(countryData);
        }
    });
});

app.get('/', async (req, res) => {
    res.sendFile(path.join(__dirname, '/', 'index.html'));
});

app.get('/api-docs', (req, res) => {
    fs.readFile('oas.json', 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading file:', err);
            res.status(500).send('Error reading file');
        } else {
            res.json(JSON.parse(data));
        }
    });
});

app.get('/os', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.send({
        "os": OS.hostname(),
        "env": process.env.NODE_ENV
    });
});

app.get('/live', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.send({ "status": "live" });
});

app.get('/ready', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.send({ "status": "ready" });
});

app.listen(3000, () => { console.log("Server successfully running on port - " + 3000); });
module.exports = app;

//module.exports.handler = serverless(app)
