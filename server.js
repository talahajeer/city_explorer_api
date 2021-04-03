"use strict";

require("dotenv").config();
const PORT = process.env.PORT;

const express = require("express");
const cors = require("cors");
const superagent = require("superagent");
const pg = require("pg");


const app = express();
const client = new pg.Client(process.env.DATABASE_URL);
app.use(cors());


client.connect().then(() => {
    app.listen(PORT, () => console.log(`App is running on Server on port: ${PORT}`))
});



app.get("/location", handleLocation);
app.get("/weather", handleWeather);
app.get("/parks", handlePark);
app.get('/movies', handleMovies);
app.get('/yelp', handleyelp);
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

    let SQL = `SELECT * FROM location WHERE search_query = '${city}';`;

    let SQLInsertion = 'INSERT INTO location (search_query, formatted_query, latitude, longitude) VALUES($1, $2, $3, $4) RETURNING *;';


    client.query(SQL).then(result => {
        if (result.rowCount > 0) {
            lat = result.rows[0].latitude;
            lon = result.rows[0].longitude;
            // console.log(lat,lon);
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
                // console.log(lat, lon);
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
    let key = process.env.WEATHER_API_KEY;
    const url = `https://api.weatherbit.io/v2.0/forecast/daily?&lat=${lat}&lon=${lon}&key=${key}`;

    superagent.get(url).set('Authorization', `Bearer ${key}`).then(res => {
        const cityWeather = res.body.data;
        // console.log(res);
        cityWeather.forEach(item => {
            let object = {
                forecast: item.valid_date,
                time: item.weather.description
            }
            resArr.push(object);
        });
        response.send(resArr);
    }).catch((err) => {
        console.log("ERROR IN WEATHER API");
        console.log(err)
    })
};

function handlePark(request, response) {
    let resArr = [];
    const city = request.query.city;
    // console.log(request.query);
    let key = process.env.PARKS_API_KEY;

    const url = `https://developer.nps.gov/api/v1/parks?api_key=${key}&limit=10`;

    superagent.get(url).then((res) => {
        const cityPark = res.body.data;
        // console.log("from park superaget-----------",cityPark);
        cityPark.forEach(item => {
            let object = {
                name: item.fullName,
                address: item.addresses[0].line1,
                fee: item.entranceFees[0].cost,
                description: item.description,
                url: item.url
            }
            resArr.push(object);
            // console.log(resArr);
        });
        response.send(resArr)
    }).catch((err) => {
        console.log("ERROR IN PARKS API");
        console.log(err)
    })
}



function handleMovies(request, response) {
    let resArr = [];
    let key = process.env.MOVIE_API_KEY;
    const city = request.query.search_query;
    // console.log(city);
    const url = `https://api.themoviedb.org/3/search/movie?api_key=${key}&query=${city}`;

    superagent.get(url).set("Authorization", `Bearer ${key}`).then(res => {
        let moviesData = res.body.results;
        console.log("dataaaaaaaaaaaaaaaaaaaaaaa",moviesData);
        moviesData.forEach(item => {
            let object = {
                title: item.title,
                overview: item.overview,
                average: item.vote_average,
                total_votes: item.vote_count,
                image_url: `https://image.tmdb.org/t/p/w500${item.poster_path}`,
                popularity: item.popularity,
                released_on: item.release_date,
            };
            resArr.push(object);
        });
        // console.log(resArr);
        response.send(resArr);
    }).catch((err) => {
        console.log("ERROR IN MOVIES API");
        console.log(err)
    });
}

function handleyelp(request, response) {
    let startIndex = 0;
    let resArr = [];
    let key = process.env.YELP_API_KEY;
    const city = request.query.location;
    // console.log(request.query);
    const url = `https://api.yelp.com/v3/businesses/search?term=restaurants&location=${city}&limit=25`;

    superagent.get(url).set("Authorization", `Bearer ${key}`).then(data => {
        let yelpData = data.body.businesses;
        yelpData.forEach(element => {
            let object = {
                name: element.name,
                image_url: element.image_url,
                price: element.price,
                rating: element.rating,
                url: element.url
            }
            resArr.push(object);
        });
    }).then(x => {
        let endIndex = startIndex + 5;
        const result = resArr.slice(startIndex, endIndex);
        startIndex += 5;
        response.send(result);
    }).catch((err) => {
        console.log("ERROR IN MOVIES API");
        console.log(err)
    });
}
