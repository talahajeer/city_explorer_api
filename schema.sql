drop table if exists location;
drop table if exists weather;
drop table if exists Parks;



CREATE  TABLE IF NOT EXISTS location (name VARCHAR(255), display_name VARCHAR(255),latitude FLOAT ,longitude FLOAT);

CREATE  TABLE IF NOT EXISTS weather (period VARCHAR(155),forecast VARCHAR (255));

CREATE TABLE IF NOT EXISTS Parks (name VARCHAR(255),url VARCHAR(255),fee VARCHAR(10),description VARCHAR(255));

CREATE TABLE IF NOT EXISTS movies(search_query VARCHAR(256),title VARCHAR(265),overview VARCHAR(1000),average_votes FLOAT,total_votes INT,image_url VARCHAR(265),popularity FLOAT,released_on VARCHAR(256)
);