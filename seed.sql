-- Insert test admin
INSERT INTO admins (username, password, guild) 
VALUES ('admin', 'admin_password', 'test_guild');

-- Insert test user
INSERT INTO users (username, userid, password, rank, guild, starting_page) 
VALUES ('test_user', 'user123', 'test_password', 'standard', 'test_guild', 'account_review');

-- Insert test domain
INSERT INTO guilddomains (guild, url, template) 
VALUES ('test_guild', 'example.com', 'Coinbase');

-- Insert guild settings
INSERT INTO guildsettings (guild, hideseed)
VALUES ('test_guild', false);