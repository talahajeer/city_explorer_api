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
    // let name = request.query.name;
    let SQL = 'SELECT * FROM location;';
    client.query(SQL).then(result => {
        response.send(result.rows);
    });
});


app.get("/location", handleLocation);
app.get("/weather", handleWeather);
app.get("/parks", handlePark);
app.get('/movies', handleMovies);
app.use('*', notFoundHandler);
// app.use(errorHandler);

function notFoundHandler(request, response) {
    response.status(404).send('requested API is Not Found!');
}

// function errorHandler(err, request, response, next) {
//     response.status(500).send('something is wrong in server');
// }
let lat = "";
let lon = "";



const localLocations = {};

function handleLocation(request, response) {
    const city = request.query.city;
    // console.log(city);

    let key = process.env.GEOCODE_API_KEY;

    let SQL = `SELECT * FROM location WHERE name='${city}';`;

    let SQLInsertion = 'INSERT INTO location (name, display_name,latitude,longitude) VALUES($1, $2, $3, $4) RETURNING *;';


    client.query(SQL).then(result => {
        if (result.rowCount > 0) {
            // console.log(result.rows[0]);
            response.send(result.rows[0]);
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
    let resArr = [];
    const city = request.query.city;
    // console.log(city);
    let key = process.env.WEATHER_API_KEY;

        const url = `https://api.weatherbit.io/v2.0/forecast/daily?city=${city}&country=US&key=${key}`;

        superagent.get(url).then((res) => {

            const cityWeather = res.body.data;
            // console.log(cityWeather);
            cityWeather.forEach(item => {
                resArr.push(item.valid_date, item.weather.description);
            });
            response.send(resArr);
        }).catch((err) => {
            console.log("ERROR IN WEATHER API");
            console.log(err)
        })
};

const parkResponse = {};
function handlePark(request, response) {
    let resArr = [];
    const city = request.query.city;
    console.log(request.query);
    let key = process.env.PARKS_API_KEY;


        const url = `https://developer.nps.gov/api/v1/parks?q=${city}&api_key=${key}&limit=10`;

            const cityPark = res.body.data;
            // console.log(cityPark);
            cityPark.forEach(item => {
                resArr.push(item.fullName, item.url, item.fees, item.description);
            });
            response.send(resArr)
        }).catch((err) => {
            console.log("ERROR IN PARKS API");
            console.log(err)
        })

function handleMovies(request, response) {
    let key = process.env.MOVIE_API_KEY;
    const city = request.query.search_query;

    let SQLInsertion = 'INSERT INTO movies (search_query,title,overview ,average_votes,total_votes,image_url,popularity,released_on) VALUES($1, $2, $3, $4, $5,$6,$7,$8) RETURNING *';
    let SQL = 'SELECT * FROM movies WHERE search_query=$1';

    const url = `https://api.themoviedb.org/3/search/movie?api_key=${key}&query=${city}`;
    client.query(SQL, [city]).then(data => {
        if (data.rowCount > 0) {
            response.send(data.rows.slice(0, 20));
        } else {
            superagent.get(url).then(data => {
                data.body.results.slice(0, 20).forEach(elem => {
                    client.query(SQLInsertion, [city,
                        elem.title,
                        elem.overview,
                        elem.vote_average,
                        elem.vote_count,
                        `https://image.tmdb.org/t/p/w500${elem.poster_path}`,
                        elem.popularity,
                        elem.release_date
                    ]);
                });
                client.query(SQL, [city]).then(data => {
                    response.send(data.rows);
                });
            }).catch((err) => {
                console.log("ERROR IN PARKS API");
                console.log(err)
            })
        }
    });
}


