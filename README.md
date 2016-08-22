# oiika-website
website stuff

## mongodb stuff

### config paths

/var/lib/mongodb-production/ (production db path)
/var/lib/mongodb-development/ (development db path)
/etc/mongod-production.conf (production config file)
/etc/mongod-development.conf (development config file)
/etc/init/mongodb.conf (start script)

### useful commands

> /etc/init/mongod start
> sudo service mongod start
> sudo service mongod restart

> show dbs
> show collections
> use dbName
> db.getUsers() (https://docs.mongodb.com/manual/reference/method/db.getUsers/)
> db.createUser() (https://docs.mongodb.com/manual/reference/method/db.createUser/)
> db.copyDatabase() (https://docs.mongodb.com/manual/reference/method/db.copyDatabase/#db.copyDatabase)
