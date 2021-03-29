"use strict";
require("dotenv").config();
const PORT = process.env.PORT;

const express = require("express");
const cors = require("cors");
const superagent = require("superagent");

const app = express();
app.use(cors());

app.get("/location", handleLocation);
app.get("/weather", handleWeather);
app.get("/park", handlePark);
app.use('*', notFoundHandler);
app.use(errorHandler);

function notFoundHandler(request, response) {
    response.status(404).send('requested API is Not Found!');
}

function errorHandler(err, request, response, next) {
    response.status(500).send('something is wrong in server');
}

const localLocations = {};
function handleLocation(request, response) {
    const city = request.query.city;
    console.log(city);
    if (localLocations[city]) {
        response.send(localLocations[city]);
    } else {
        let key = process.env.GEOCODE_API_KEY;
        const url = `https://eu1.locationiq.com/v1/search.php?key=${key}&q=${city}&format=json&limit=1`;
        superagent.get(url).then(res => {
            console.log(res.body);
            let object = {
                search_query: city,
                formatted_query: res.body[0].display_name,
                latitude: res.body[0].lat,
                longitude: res.body[0].lon
            }
            console.log(object);
            response.send(object);
        }).catch((err) => {
            console.log("ERROR IN LOCATION API");
            console.log(err)
        })
    }

}


const weatherResponse = [];
function handleWeather(request, response) {
    const city = request.query.city;
    if (weatherResponse) {
        response.send(weatherResponse["city"])
    } else {
        let key = process.env.WEATHER_API_KEY;
        const url = `https://api.weatherbit.io/v2.0/forecast/daily?city=${city}&key=${key}`;
        superagent.get(url).then(res => {
            // console.log(res.body);
            // const getWeather = require("./data/weather.json");
            const cityWeather = res.body["data"];
            // console.log(cityWeather);
            cityWeather.forEach(item => {
                weatherResponse.push({
                    forecast: item.weather.description,
                    time: item.valid_date
                });
            });
            console.log(weatherResponse);
            response.send(weatherResponse);
        }).catch((err) => {
            console.log("ERROR IN LOCATION API");
            console.log(err)
        })
    }

}


// const parkResponse = [];
// function handlePark(request, response) {
//     const city = request.query.city;
//     if (parkResponse) {
//         response.send(parkResponse["city"])
//     } else {
//         let key = process.env.WEATHER_API_KEY;
//         const url = `https://api.weatherbit.io/v2.0/forecast/daily?city=${city}&key=${key}`;
//         superagent.get(url).then(res => {
//             // console.log(res.body);
//             // const getWeather = require("./data/weather.json");
//             const cityWeather = res.body["data"];
//             // console.log(cityWeather);
//             cityWeather.forEach(item => {
//                 parkResponse.push({
//                     forecast: item.weather.description,
//                     time: item.valid_date
//                 });
//             });
//             console.log(parkResponse);
//             response.send(parkResponse);
//         }).catch((err) => {
//             console.log("ERROR IN LOCATION API");
//             console.log(err)
//         })
//     }

// }

app.listen(PORT, () => console.log(`App is running on Server on port: ${PORT}`))