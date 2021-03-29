"use strict";

const PORT = 5000;
const express = require("express");
const cors = require("cors");
const app = express();
app.use(cors());

app.get("/location", handleLocation);
app.get("/weather", handleWeather);

function handleLocation(request, response) {
    const getLocation = require("./data/location.json");
    const city = request.query.city;
    console.log(city);
    let object = {
        search_query: city,
        name: getLocation[0].display_name,
        latitude: getLocation[0].lat,
        longitude: getLocation[0].lon
    }
    console.log(object);
    response.send(object);
}


function handleWeather(request, response) {
    const weatherResponse = [];
    if(weatherResponse){
        weatherResponse = [];
    }
    const getWeather = require("./data/weather.json");
    const cityWeather = getWeather.data;
    cityWeather.forEach(item => {

        weatherResponse.push({
            forecast: item.weather.description,
            time: item.valid_date
        });
    });

    response.send(weatherResponse);
}

app.listen(process.env.PORT || 5000, ()=> console.log(`App is running on Server on port: ${PORT}`))