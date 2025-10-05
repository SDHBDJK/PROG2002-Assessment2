const express = require('express');
const bodyParser = require('body-parser');

const eventsAPI = require('./controllerAPI/events-controller');
const categoriesAPI = require('./controllerAPI/categories-controller');
const orgsAPI = require('./controllerAPI/orgs-controller');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/api/events', eventsAPI);
app.use('/api/categories', categoriesAPI);
app.use('/api/orgs', orgsAPI);

app.listen(3060, () => console.log('Server up on 3060'));
