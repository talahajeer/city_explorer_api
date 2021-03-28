"use strict";

const PORT = process.env.PORT || 3000;
const express = require("express");
const cors = require("cors");
const app = express();
app.use(cors());

app.get("./location", handleLocation);
app.get("./weather", handleWeather);

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
    response.send(object);
}


function handleWeather(request, response) {
    const getWeather = require("./data/weather.json");
    const cityWeather = getWeather.data;
    const weatherResponse = [];
    cityWeather.forEach((item,property) => {

        weatherResponse.push({
            forecast: item[description],
            time: item[datetime]
        });
    });

    response.send(weatherResponse);
}

app.listen(PORT, ()=> console.log(`App is running on Server on port: ${PORT}`))