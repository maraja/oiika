# oiika
website stuff

# To install node v6 and npm on ubuntu
curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash -
sudo apt-get install -y nodejs

# mongo
mongo -u username -p password --authenticationDatabase mydatabase
mongo -u oiika -p oiikadoceo --authenticationDatabase oiika

# mongo to see if it's listening on port 27017
lsof -i 27017

# to make mongo work externally, make sure to change /etc/mongod.conf and allow inbound rule in firewall
sudo ufw enable
sudo ufw allow 27017/tcp

# in /etc/mongod.conf
bindIp: 0.0.0.0

# to connect externally
mongo mongo_ip_address:mongo_port/mongo_db -u username -p password
mongo thehotspot.ca:27017/oiika -u oiika -p passwordgoeshere
