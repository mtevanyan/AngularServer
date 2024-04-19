// server.js
const express = require('express');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const cors = require('cors'); // Import the cors middleware

const fs = require('node:fs');

const app = express();
const port = 3000;

// Secret key for JWT
const secretKey = 'angularTest';

// Sample user data (usually this would come from a database)
let users =[]
let countryCode = [];

try {
    const data = fs.readFileSync('data.json', 'utf8');
    const res = JSON.parse(data)
    users = res.users;
    countryCode = res.countryCodes
} catch (err) {
    console.error(err);
}

app.use(cors());


// Middleware to parse JSON body
app.use(bodyParser.json());

// Authentication endpoint
app.post('/checkPhone', (req, res) => {
    const {username} = req.body;

    // Check if username and password are correct
    const user = users.find(u => u.username === username);

    if (!user) {
        return res.status(401).json({message: 'Invalid username'});
    }
    res.json({message: 'Success'});
});

app.post('/login', (req, res) => {
    const {username, password} = req.body;

    // Check if username and password are correct
    const user = users.find(u => u.username === username && u.password === password);

    if (!user) {
        return res.status(401).json({message: 'Invalid username or password'});
    }

    // Generate JWT token
    const token = jwt.sign({sub: user.id, username: user.username}, secretKey, {expiresIn: '1h'});
    res.json({token});
});

app.get('/GetCountryCode', (req, res) => {
    res.json({message: 'Success', result:countryCode});
});


// Authorization middleware
function authorizeUser(req, res, next) {
    const token = req.headers.authorization;

    if (!token) {
        return res.status(401).json({message: 'Missing token'});
    }

    // Verify JWT token
    jwt.verify(token, secretKey, (err, decoded) => {
        if (err) {
            return res.status(403).json({message: 'Invalid token'});
        }
        req.user = decoded;
        next();
    });
}

// Protected endpoint accessible only by authenticated users
app.get('/getUserData', authorizeUser, (req, res) => {
    const result = users.find(user => user.id === req.user.sub)
    if (!result) {
        return res.status(404).json({message: 'Not Found'});
    }
    res.json({message: 'Success', result:result.userData});
});

app.get('/getBankAccounts', authorizeUser, (req, res) => {
    const result = users.find(user => user.id === req.user.sub)
    if (!result) {
        return res.status(404).json({message: 'Not Found'});
    }
    res.json({message: 'Success', result:result.bankAccounts});
});


app.get('/getAdditionalData', authorizeUser, (req, res) => {
    const result = users.find(user => user.id === req.user.sub)
    if (!result) {
        return res.status(404).json({message: 'Not Found'});
    }
    res.json({message: 'Success', result:{description:result.description}});
});

app.get('/getTransactions', authorizeUser, (req, res) => {
    return res.status(404).json({message: 'Not Found'});
});

// Wildcard route handler for other routes
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
