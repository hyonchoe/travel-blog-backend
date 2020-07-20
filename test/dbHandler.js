/**
 * Memory MongoDB handler to managing memory database for testing
 */

const { Db, MongoClient } = require('mongodb')
const ObjectId = require("mongodb").ObjectID
const { MongoMemoryServer } = require('mongodb-memory-server')
const tripMockData = require('./mockData/tripInfo')

const mongoServer = new MongoMemoryServer()
let connection

const publicCounts = 4
const privateCounts = 4
const publicsWithImgsLocs = 2
const privateWithImgsLocs = 2
const lastLoadedPublicTripIndex = 2
const publicCountsSubs = 1
const tripsWithImgsLocs = publicsWithImgsLocs + privateWithImgsLocs
const testSetSize = publicCounts + privateCounts
const locInfo1 = {
    fmtAddr: 'Seattle, WA, USA',
    latLng: [47.6062095, -122.3320708],
    city: 'Seattle',
    state: 'WA',
    country: 'United States',
}
const locInfo2 = {
    fmtAddr: 'Dallas, TX, USA',
    latLng: [32.7766642, -96.79698789999999],
    city: 'Dallas',
    state: 'TX',
    country: 'United States',
}
const newLocInfo = {
    fmtAddr: 'Barcelona, Spain',
    latLng: [41.38506389999999, 2.1734035],
    city: 'Barcelona',
    state: 'CT',
    country: 'Spain',
}
const imgInfo1 = {
    name: 'testimage1',
    fileUrlName: 'testimage1fileurlname',
}
const imgInfo2 = {
    name: 'testimage2',
    fileUrlName: 'testimage2fileurlname',
}
const newImgInfo = {
    name: 'testimage3',
    fileUrlName: 'testimage3fileurlname',
    S3Url: 'pendingfileurl'
}

const getPublicCounts = () => (publicCounts)
const getSubsPublicCounts = () => (publicCountsSubs)
const getPrivateCounts = () => (privateCounts)
const getPublicWithImgsLocs = () => (publicsWithImgsLocs)
const getPrivateWithImgsLocs = () => (privateWithImgsLocs)
const getLocInfos = () => ([locInfo1, locInfo2])
const imgInfos = () => ([imgInfo1, imgInfo2])
const getNewLocInfo = () => (newLocInfo)
const getNewImgInfo = () => (newImgInfo)
const getLastLoadedPublicTripIndex = () => (lastLoadedPublicTripIndex)

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

    const trips = []        
    for(let i=0; i<testSetSize; i++){
        const isPublic = (i%2 == 0)
        let locations = []
        let images = []
        if (i < tripsWithImgsLocs){
            locations = [locInfo1, locInfo2]
            images = [imgInfo1, imgInfo2]
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
    getPublicCounts, getPrivateCounts, getPublicWithImgsLocs, getPrivateWithImgsLocs,
    getLocInfos, imgInfos, getLastLoadedPublicTripIndex, getSubsPublicCounts,
    getNewLocInfo, getNewImgInfo, getNewObjectIdStr
 }