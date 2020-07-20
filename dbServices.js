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

const connect = async () => {
    try {
        return await new MongoClient(uri, { useUnifiedTopology: true }).connect()
    } catch (error) {
        console.log(error)
        throw error
    }
}

const setConnection = (dbConnection) => {
    connection = dbConnection
}

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

const getImagesForTrip = async (tripId, userId) => {
    try {
        const client = connection
        const result = await client.db(TRIPS_DB_NAME).collection(TRIPINFO_COLL_NAME).
            findOne({"_id": ObjectId(tripId), "userId": userId}, {projection: {_id:0 , images:1}})
        return result
    } catch (error) {

    }
}

const genUrlFileName = () => {
    return new ObjectId().toString()
}

module.exports = { connect, setConnection, createTrip, deleteTrip, getUserTrips, getPublicTrips, updateTrip, getImagesForTrip, genUrlFileName }