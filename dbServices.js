/**
 * Handles interaction with MongoDb
 */

require('dotenv').config()
const { MongoClient } = require('mongodb')
const ObjectId = require("mongodb").ObjectID

const SORT_CONDITIONS = { "endDate": -1, "startDate": -1, "_id": -1 }
const RESULT_LIMIT = 25
const TRIPS_DB_NAME = 'trips'
const TRIPINFO_COLL_NAME = 'tripInfo'

const isDev = (process.env.NODE_ENV !== 'production')
const dbUserName = (isDev) ? process.env.DB_ADMIN_USERNAME : process.env.DB_ADMIN_USERNAME_PRD
const dbPassword = (isDev) ? process.env.DB_ADMIN_PASSWORD : process.env.DB_ADMIN_PASSWORD_PRD
const dbName = (isDev) ? process.env.DB_NAME : process.env.DB_NAME_PRD
const uri = (isDev) ? `mongodb+srv://${dbUserName}:${dbPassword}@travelblog-ugmhk.mongodb.net/${dbName}?retryWrites=true&w=majority`
                    : `mongodb+srv://${dbUserName}:${dbPassword}@travelblog.aikd6.mongodb.net/${dbName}?retryWrites=true&w=majority`
let connection

/**
 * Connects to MongoDb client
 */
const connect = async () => {
    try {
        return await new MongoClient(uri, { useUnifiedTopology: true }).connect()
    } catch (error) {
        console.error(error)
        throw error
    }
}

/**
 * Sets the MongoDb connection
 * @param {Object} dbConnection MongoDb connection
 */
const setConnection = (dbConnection) => {
    connection = dbConnection
}

/**
 * Creates new trip in the database
 * @param {Object} newTrip Trip data
 * @returns {Object} Database action result
 */
const createTrip = async (newTrip) => {
    try {
        const client = connection
        const result = await client.db(TRIPS_DB_NAME).collection(TRIPINFO_COLL_NAME).
            insertOne(newTrip)
        return result
    } catch (error){
        throw error
    }
}

/**
 * Deletes existing trip in the database and returns database action result
 * @param {String} tripId Trip ID of trip to delete
 * @param {String} userId Authenticated user ID
 * @returns {Object} Database action result
 */
const deleteTrip = async (tripId, userId) => {
    try {
        const client = connection
        const result = await client.db(TRIPS_DB_NAME).collection(TRIPINFO_COLL_NAME).
            findOneAndDelete({"_id": ObjectId(tripId), "userId": userId})
        return result
    } catch (error) {
        throw error
    }
}

/**
 * Retrieves all trips created by the given user sorted by trip dates
 * @param {String} userId Authenticated user ID
 * @returns {Array} User's trips
 */
const getUserTrips = async (userId) => {
    try {
        const client = connection
        const result = await client.db(TRIPS_DB_NAME).collection(TRIPINFO_COLL_NAME).
            find({"userId": userId}).sort(SORT_CONDITIONS).toArray()   
        return result
    } catch (error) {
        throw error
    }
}

/**
 * Retrieves public trips in the database sorted by trip dates
 * @param {boolean} initialLoad Flag for initial load
 * @param {Object} lastLoadedTripInfo Last loaded trip data
 * @returns {Array} Public trips
 */
const getPublicTrips = async (initialLoad, lastLoadedTripInfo) => {
    let findConditions = { "public": true }
    
    if (!initialLoad){
        const lastLoadedTripId = ObjectId(lastLoadedTripInfo.tripId)
        const lastLoadedTripEndDate = lastLoadedTripInfo.endDate
        const lastLoadedTripStartDate = lastLoadedTripInfo.startDate
        const findMoreConditions =
            { 
            "$or": [
                { "endDate": { "$lt": lastLoadedTripEndDate } },
                {
                "$and": [
                    { "endDate": { "$eq": lastLoadedTripEndDate } },
                    { "startDate": { "$lt": lastLoadedTripStartDate } }
                    ]
                },
                {
                "$and": [
                    { "endDate": { "$eq": lastLoadedTripEndDate } },
                    { "startDate": { "$eq": lastLoadedTripStartDate } },
                    {  "_id": { "$lt": lastLoadedTripId }}
                    ]
                },
                ]
            }
        findConditions = {...findConditions, ...findMoreConditions}
    }

    try {
        const client = connection
        const result = await client.db(TRIPS_DB_NAME).collection(TRIPINFO_COLL_NAME).
            find(findConditions).sort(SORT_CONDITIONS).limit(RESULT_LIMIT+1).toArray()
        if (result.length === RESULT_LIMIT+1){
            result.length = RESULT_LIMIT
        } else if (result.length > 0) {
            result[result.length-1].noMoreRecords = true
        }
        return result
    } catch (error) {
        throw error
    }
}

/**
 * Updates existing trip in the database with given data
 * @param {String} tripId Trip ID for trip to update
 * @param {String} userId Authenticated user ID
 * @param {Object} updatedTrip Updated trip data
 * @returns {Object} Database action result
 */
const updateTrip = async (tripId, userId, updatedTrip) => {
    try {
        const client = connection
        const result = await client.db(TRIPS_DB_NAME).collection(TRIPINFO_COLL_NAME).
            updateOne({"_id": ObjectId(tripId), "userId": userId}, { $set: updatedTrip })
        return result
    } catch (error) {
        throw error
    }
}

/**
 * Retrieves images in the database for the given trip
 * @param {String} tripId Trip ID for given trip
 * @param {String} userId Authenticated user ID
 * @returns {Object} Found trip data (only images)
 */
const getImagesForTrip = async (tripId, userId) => {
    try {
        const client = connection
        const result = await client.db(TRIPS_DB_NAME).collection(TRIPINFO_COLL_NAME).
            findOne({"_id": ObjectId(tripId), "userId": userId}, {projection: {_id:0 , images:1}})
        return result
    } catch (error) {
        throw error
    }
}

/**
 * Generates url file name to use for the uploaded image.
 * This will be the file name for AWS S3 bucket.
 * @returns {String} File name
 */
const genUrlFileName = () => {
    return new ObjectId().toString()
}

module.exports = { connect, setConnection, createTrip, deleteTrip, getUserTrips, getPublicTrips, updateTrip, getImagesForTrip, genUrlFileName }