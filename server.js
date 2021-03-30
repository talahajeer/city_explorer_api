"use strict";
require("dotenv").config();
const PORT = process.env.PORT;

const express = require("express");
const cors = require("cors");
const superagent = require("superagent");
const pg = require("pg");

const app = express();
app.use(cors());
const client = new pg.Client(process.env.DATABASE_URL);

app.get("/location", handleLocation);
// app.get("/weather", handleWeather);
// app.get("/parks", handlePark);
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
            lat = res.body[0].lat;
            lon = res.body[0].lon;
            console.log(object);
            response.send(object);
        }).catch((err) => {
            console.log("ERROR IN LOCATION API");
            console.log(err)
        })
    }

}


// const weatherResponse = {};
// function handleWeather(request, response) {
//     let resArr = [];
//     const city = request.query.city;
//     if (weatherResponse[city]) {
//         response.send(weatherResponse[city])
//     } else {
//         let key = process.env.WEATHER_API_KEY;
//         const url = `https://api.weatherbit.io/v2.0/forecast/daily?&lat=${lat}&lon=${lon}&key=${key}`;
//         superagent.get(url).then(res => {
//             // console.log(res.body);
//             // const getWeather = require("./data/weather.json");
//             const cityWeather = res.body.data;
//             console.log(res.body.data);
//             cityWeather.forEach(item => {

//                 resArr.push({
//                     forecast: item.weather.description,
//                     time: item.valid_date
//                 });
//             });
//             // console.log(weatherResponse);
//             response.send(resArr);
//         }).catch((err) => {
//             console.log("ERROR IN LOCATION API");
//             console.log(err)
//         })
//     }

// }


// const parkResponse = {};
// function handlePark(request, response) {
//     let resArr = [];
//     const city = request.query.city;
//     console.log(city);
//     if (parkResponse[city]) {
//         response.send(parkResponse[city])
//     } else {
//         let key = process.env.PARKS_API_KEY;
//         const url = `https://developer.nps.gov/api/v1/parks?q=${city}&api_key=${key}&limit=10`;
//         superagent.get(url).then(res => {

//             const cityPark = res.body.data;
//             // console.log(cityPark);
//             cityPark.forEach(item => {
//                 resArr.push({
//                     name: item.fullName,
//                     address: item.addresses[0],
//                     fees: item.fees,
//                     description:item.description,
//                     url: item.url
//                 });
//             })


//             console.log(resArr);
//             response.send(resArr);
//         }).catch((err) => {
//             console.log("ERROR IN LOCATION API");
//             console.log(err)
//         })
//     }

// }

app.listen(PORT, () => console.log(`App is running on Server on port: ${PORT}`))