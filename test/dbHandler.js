const { Db, MongoClient } = require('mongodb')
const { MongoMemoryServer } = require('mongodb-memory-server')

const mongoServer = new MongoMemoryServer()
let connection

const connect = async () => {
    const uri = await mongoServer.getConnectionString()
    connection = await MongoClient.connect(uri, { useUnifiedTopology: true })
    return connection
}

const getConnection = () => {
    return connection
}

const closeDatabase = async () => {
    if (connection){
        await connection.close()
    }
    if (mongoServer){
        await mongoServer.stop()
    }
}

const clearDatabase = async () => {
    if (connection){
        await connection.db('trips').dropDatabase()
    }
}

module.exports = { connect, getConnection, closeDatabase, clearDatabase }