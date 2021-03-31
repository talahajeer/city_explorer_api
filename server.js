"use strict";
require("dotenv").config();
const PORT = process.env.PORT;

const express = require("express");
const cors = require("cors");
const superagent = require("superagent");
const pg = require("pg");
const { query } = require("express");

const app = express();
const client = new pg.Client(process.env.DATABASE_URL);
app.use(cors());


client.connect().then(() => {
    app.listen(PORT, () => console.log(`App is running on Server on port: ${PORT}`))
});

app.get('/', (request, response) => {
    let name = request.query.name;
    let SQL = 'SELECT * FROM location WHERE name=$1';
    client.query(SQL, [name]).then(result => {
        response.send(result.rows);
    });
});


app.get("/location", handleLocation);
app.get("/weather", handleWeather);
app.get("/parks", handlePark);
app.use('*', notFoundHandler);
app.use(errorHandler);

function notFoundHandler(request, response) {
    response.status(404).send('requested API is Not Found!');
}

function errorHandler(err, request, response, next) {
    response.status(500).send('something is wrong in server');
}
let lat = "";
let lon = "";



const localLocations = {};

function handleLocation(request, response) {
    const city = request.query.city;
    // console.log(city);

    let key = process.env.GEOCODE_API_KEY;

    let SQL = `SELECT * FROM location WHERE name=${city}`;

    let SQLInsertion = 'INSERT INTO location (name, display_name,latitude,longitude) VALUES($1, $2, $3, $4) RETURNING *';

    client.query(SQL).then(data => {
        data.rows.forEach(value => {
            localLocations[value.search_query] = value;
        });
    });

    client.query(SQL, [city]).then(result => {
        if (result.rowCount > 0) {
            // console.log(result.rows[0]);
            response.send(localLocations[city]);
        } else {
            const url = `https://eu1.locationiq.com/v1/search.php?key=${key}&q=${city}&format=json&limit=1`;

            superagent.get(url).then(res => {
                // console.log(res.body);
                let object = {
                    search_query: city,
                    formatted_query: res.body[0].display_name,
                    latitude: res.body[0].lat,
                    longitude: res.body[0].lon
                }
                lat = res.body[0].lat;
                lon = res.body[0].lon;
                
                let values = [city, res.body[0].display_name, lat, lon];
                client.query(SQLInsertion, values).then(() => {
                    localLocations[city] = object;
                    response.send(object);
                });
            }).catch((err) => {
                console.log("ERROR IN LOCATION API");
                console.log(err)
            })
        }
    })


}


const weatherResponse = {};
function handleWeather(request, response) {

    const city = request.query.search_query;
    let key = process.env.WEATHER_API_KEY;

    let SQLInsertion = 'INSERT INTO weather (period, forecast) VALUES($1, $2) RETURNING *';

    let SQL = `SELECT * FROM weathers WHERE period=$1`;

    client.query(SQL, [city]).then(result => {
        if (result.rowCount > 0) {
            response.send(result.rows);
        } else {
            const url = `https://api.weatherbit.io/v2.0/forecast/daily?city=${city}&country=US&key=${key}`;

            superagent.get(url).then(res => {

                const cityWeather = res.body.data;
                // console.log(res.body.data);
                cityWeather.forEach(item => {
                    let values = [item.valid_date, item.weather.description];

                    client.query(SQLInsertion, values);
                });
                client.query(SQL, [city]).then(data => {
                    response.send(data.rows);
                })
            }).catch((err) => {
                console.log("ERROR IN WEATHER API");
                console.log(err)
            })
        }
    });


const parkResponse = {};
function handlePark(request, response) {

    const city = request.query.search_query;
    let key = process.env.PARKS_API_KEY;

    let SQL = 'SELECT * FROM Parks WHERE name=$1';
    let SQLInsertion = 'INSERT INTO Parks (name,url,fee,descrition) VALUES($1, $2,$3,$4) RETURNING *';

    client.query(SQL, [city]).then(result => {
        if (result.rowCount > 0) {
            response.send(result.rows);
        } else {
            const url = `https://developer.nps.gov/api/v1/parks?q=${city}&api_key=${key}&limit=10`;

            superagent.get(url).then(res => {

                const cityPark = res.body.data;
                // console.log(cityPark);
                cityPark.forEach(item => {
                    let values = [item.fullName, item.url, item.fees, item.description];

                    client.query(SQLInsertion, values);

                })
                client.query(SQL, [city]).then(data => {
                    response.send(data.rows)
                })
            }).catch((err) => {
                console.log("ERROR IN PARKS API");
                console.log(err)
            })
        }
    })


}


