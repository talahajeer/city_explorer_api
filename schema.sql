drop table if exists location;
drop table if exists weather;
drop table if exists Parks;



CREATE  TABLE IF NOT EXISTS location (
    id SERIAL NOT NULL,
    search_query VARCHAR(256),
    formatted_query VARCHAR(256),
    latitude FLOAT(24),
    longitude FLOAT(24)
    );



