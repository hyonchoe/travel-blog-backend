require('dotenv').config()
const { MongoClient } = require('mongodb')
const ObjectId = require("mongodb").ObjectID

const dbusername = process.env.DB_ADMIN_USERNAME
const dbpassword = process.env.DB_ADMIN_PASSWORD
const dbname = process.env.DB_NAME
const uri = `mongodb+srv://${dbusername}:${dbpassword}@travelblog-ugmhk.mongodb.net/${dbname}?retryWrites=true&w=majority`
const sortConditions = { "endDate": -1, "startDate": -1, "_id": -1 }

const createTrip = async (newTrip) => {
    const mgClient = new MongoClient(uri, { useUnifiedTopology: true })
    try {
        const client = await mgClient.connect()
        let result = await client.db("trips").collection("tripInfo").
            insertOne(newTrip)
        return result
    } catch (error){
        throw error
    }
}

const deleteTrip = async (tripId, userId) => {
    const mgClient = new MongoClient(uri, { useUnifiedTopology: true })
    try {
        const client = await mgClient.connect()
        let result = await client.db("trips").collection("tripInfo").
            findOneAndDelete({"_id": ObjectId(tripId), "userId": userId})
        return result
    } catch (error) {
        throw error
    }
}

const getUserTrips = async (userId) => {
    const mgClient = new MongoClient(uri, { useUnifiedTopology: true })
    try {
        const client = await mgClient.connect()
        const result = await client.db("trips").collection("tripInfo").
            find({"userId": userId}).sort(sortConditions).toArray()
        return result
    } catch (error) {
        throw error
    }
}

const getPublicTrips = async (initialLoad, lastLoadedTripInfo) => {
    const mgClient = new MongoClient(uri, { useUnifiedTopology: true })
    let findConditions = { "public": true }
    const resultLimit = 25

    if (!initialLoad){
        const lastLoadedTripId = ObjectId(lastLoadedTripInfo.tripId)
        const lastLoadedTripEndDate = new Date(lastLoadedTripInfo.endDate)
        const lastLoadedTripStartDate = new Date(lastLoadedTripInfo.startDate)
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
        const client = await mgClient.connect()
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
    const mgClient = new MongoClient(uri, { useUnifiedTopology: true })

    try {
        const client = await mgClient.connect()
        const result = await client.db("trips").collection("tripInfo").
            updateOne({"_id": ObjectId(tripId), "userId": userId}, { $set: updatedTrip })
        return result
    } catch (error) {
        throw error
    }
}

const getImagesForTrip = async (tripId, userId) => {
    const mgClient = new MongoClient(uri, { useUnifiedTopology: true })
    
    try {
        const client = await mgClient.connect()
        const result = await client.db("trips").collection("tripInfo").
            findOne({"_id": ObjectId(tripId), "userId": userId}, {projection: {_id:0 , images:1}})
        return result
    } catch (error) {

    }
}

const genUrlFileName = () => {
    return new ObjectId().toString()
}

module.exports = { createTrip, deleteTrip, getUserTrips, getPublicTrips, updateTrip, getImagesForTrip, genUrlFileName }