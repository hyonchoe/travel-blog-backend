require('dotenv').config()
const { MongoClient } = require('mongodb')
const ObjectId = require("mongodb").ObjectID

const isDev = (process.env.NODE_ENV !== 'production')
const dbusername = (isDev) ? process.env.DB_ADMIN_USERNAME : process.env.DB_ADMIN_USERNAME_PRD
const dbpassword = (isDev) ? process.env.DB_ADMIN_PASSWORD : process.env.DB_ADMIN_PASSWORD_PRD
const dbname = (isDev) ? process.env.DB_NAME : process.env.DB_NAME_PRD

const uri = (isDev) ? `mongodb+srv://${dbusername}:${dbpassword}@travelblog-ugmhk.mongodb.net/${dbname}?retryWrites=true&w=majority`
                    : `mongodb+srv://${dbusername}:${dbpassword}@travelblog.aikd6.mongodb.net/${dbname}?retryWrites=true&w=majority`
const sortConditions = { "endDate": -1, "startDate": -1, "_id": -1 }
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
        let result = await client.db("trips").collection("tripInfo").
            insertOne(newTrip)
        return result
    } catch (error){
        throw error
    }
}

const deleteTrip = async (tripId, userId) => {
    try {
        const client = connection
        let result = await client.db("trips").collection("tripInfo").
            findOneAndDelete({"_id": ObjectId(tripId), "userId": userId})
        return result
    } catch (error) {
        throw error
    }
}

const getUserTrips = async (userId) => {
    try {
        const client = connection
        const result = await client.db("trips").collection("tripInfo").
            find({"userId": userId}).sort(sortConditions).toArray()   
        return result
    } catch (error) {
        throw error
    }
}

const getPublicTrips = async (initialLoad, lastLoadedTripInfo) => {
    let findConditions = { "public": true }
    const resultLimit = 25

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
        const result = await client.db("trips").collection("tripInfo").
            find(findConditions).sort(sortConditions).limit(resultLimit+1).toArray()
        if (result.length === resultLimit+1){
            result.length = resultLimit
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
        const result = await client.db("trips").collection("tripInfo").
            updateOne({"_id": ObjectId(tripId), "userId": userId}, { $set: updatedTrip })
        return result
    } catch (error) {
        throw error
    }
}

const getImagesForTrip = async (tripId, userId) => {
    try {
        const client = connection
        const result = await client.db("trips").collection("tripInfo").
            findOne({"_id": ObjectId(tripId), "userId": userId}, {projection: {_id:0 , images:1}})
        return result
    } catch (error) {

    }
}

const genUrlFileName = () => {
    return new ObjectId().toString()
}

module.exports = { connect, setConnection, createTrip, deleteTrip, getUserTrips, getPublicTrips, updateTrip, getImagesForTrip, genUrlFileName }