/**
 * Memory MongoDB handler to managing memory database for testing
 */

const { Db, MongoClient } = require('mongodb')
const ObjectId = require("mongodb").ObjectID
const { MongoMemoryServer } = require('mongodb-memory-server')
const tripMockData = require('./mockData/tripInfo')

const mongoServer = new MongoMemoryServer()
let connection

/**
 * Generates unique ID to use in database
 * @returns {string} ID string
 */
const getNewObjectIdStr = () => {
    return new ObjectId().toString()
}

/**
 * Connects to memory MongoDB
 * @returns {Object} MongoDB connection
 */
const connect = async () => {
    const uri = await mongoServer.getConnectionString()
    connection = await MongoClient.connect(uri, { useUnifiedTopology: true })
    return connection
}

/**
 * Gets MongoDB connection
 * @returns {Object} MongoDB connection
 */
const getConnection = () => {
    return connection
}

/**
 * Closes MongoDB connection
 */
const closeDatabase = async () => {
    if (connection){
        await connection.close()
    }
    if (mongoServer){
        await mongoServer.stop()
    }
}

/**
 * Clear out the MongoDB data
 */
const clearDatabase = async () => {
    if (connection){
        await connection.db('trips').dropDatabase()
    }
}

/**
 * Create test DB of 8 trips total for testing purpose:
 * - 4 public trips
 * - 4 private trips
 * @returns {Array} Trips data at index 0 and tripIds at index 1
 */
const setupWithTestingRecords = async () => {
    await clearDatabase()

    const dbMockData = tripMockData.memMongoDbMockData()
    const trips = []        
    for(let i=0; i<dbMockData.getTestSetSize(); i++){
        const isPublic = (i%2 == 0)
        let locations = []
        let images = []
        if (i < dbMockData.getTripsWithImgsLocs()){
            locations = dbMockData.getLocInfos()
            images = dbMockData.imgInfos()
        }
        const trip = tripMockData.getTripForCreation(locations, images, isPublic)
        trips.push(trip)
    }
    const result = await connection.db('trips').collection('tripInfo').
                    insertMany(trips)

    return [trips, result.insertedIds]
}

module.exports = { 
    connect, getConnection, closeDatabase, clearDatabase, setupWithTestingRecords,
    getNewObjectIdStr
 }