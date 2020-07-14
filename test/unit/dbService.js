const expect = require('chai').expect
const tripMockData = require('../mockData/tripInfo')
const dbService = require('../../dbServices')
const dbHandler = require('../dbHandler')

describe('MongoDB Services', () => {
    before( async () => {
        const connection = await dbHandler.connect()
        dbService.setConnection(connection)
    })
    afterEach( async () => {
        await dbHandler.clearDatabase()
    })
    after( async () => {
        await dbHandler.closeDatabase()
        dbService.setConnection(null)
    })

    it('Create a trip', async () => {
        const tripToAdd = tripMockData.getTripForCreation([], [], true)

        await dbService.createTrip(tripToAdd)
        
        const collectionCount = await dbHandler.getConnection().db('trips').collection('tripInfo')
            .countDocuments({})
        expect(collectionCount).to.equal(1)
    })

    it('Delete a trip', async () => {
        const tripToAdd = tripMockData.getTripForCreation([], [], true)
        const result = await dbHandler.getConnection().db('trips').collection('tripInfo').
            insertOne(tripToAdd)

        await dbService.deleteTrip(result.insertedId, 'userid')
        
        const collectionCount = await dbHandler.getConnection().db('trips').collection('tripInfo')
            .countDocuments({})
        expect(collectionCount).to.equal(0)
    })

    describe('Get public trips', () => {
        it('Initial load', async () => {
            const tripToAdd1 = tripMockData.getTripForCreation([], [], true)
            const tripToAdd2 = tripMockData.getTripForCreation([], [], true)
            const tripToAdd3 = tripMockData.getTripForCreation([], [], false)
            await dbHandler.getConnection().db('trips').collection('tripInfo').
                insertMany([tripToAdd1, tripToAdd2, tripToAdd3])
    
                const result = await dbService.getPublicTrips(true)
    
                expect(result.length).to.equal(2)
            })
    
            it('Subsequent load', async () => {
                const tripToAdd1 = tripMockData.getTripForCreation([], [], true)
                const tripToAdd2 = tripMockData.getTripForCreation([], [], false)
                const tripToAdd3 = tripMockData.getTripForCreationOlderDate([], [], true)
                let result = await dbHandler.getConnection().db('trips').collection('tripInfo').
                    insertMany([tripToAdd1, tripToAdd2, tripToAdd3])
                // Use first entry as last loaded trip
                const lastLoadedTrip = await dbHandler.getConnection().db('trips').collection('tripInfo').
                findOne({ '_id': result.insertedIds[0] })
    
                result = await dbService.getPublicTrips(false, {
                    tripId: lastLoadedTrip._id.toString(),
                    endDate: lastLoadedTrip.endDate,
                    startDate: lastLoadedTrip.startDate
                })
    
                expect(result.length).to.equal(1)
            })
    })

    describe('Get user trips', () => {
        it('Correct user id', async () => {
            const tripToAdd = tripMockData.getTripForCreation([], [], true)
            const userId = tripToAdd.userId
            await dbHandler.getConnection().db('trips').collection('tripInfo').
                insertOne(tripToAdd)

            const result = await dbService.getUserTrips(userId)

            expect(result.length).to.equal(1)
        })
        
        it('Wrong user id', async () => {
            const tripToAdd = tripMockData.getTripForCreation([], [], true)
            const userId = tripToAdd.userId
            await dbHandler.getConnection().db('trips').collection('tripInfo').
                insertOne(tripToAdd)

            const result = await dbService.getUserTrips(userId+'wrong')

            expect(result.length).to.equal(0)
        })
        
    })

    describe('Update trip', () => {
        it('Correct user id', async () => {
            const tripToAdd = tripMockData.getTripForCreation([], [], true)
            const userId = tripToAdd.userId
            let result = await dbHandler.getConnection().db('trips').collection('tripInfo').
                insertOne(tripToAdd)
            
            tripToAdd.title = 'updated title'
            result = await dbService.updateTrip(result.insertedId.toString(), userId, tripToAdd)

            expect(result.modifiedCount).to.equal(1)
        })
        
        it('Wrong user id', async () => {
            const tripToAdd = tripMockData.getTripForCreation([], [], true)
            const userId = tripToAdd.userId
            let result = await dbHandler.getConnection().db('trips').collection('tripInfo').
                insertOne(tripToAdd)

            tripToAdd.title = 'updated title'
            result = await dbService.updateTrip(result.insertedId.toString(), userId+'wrong', tripToAdd)

            expect(result.modifiedCount).to.equal(0)
        })            
    })

    describe('Get images for trip', () => {
        const imageInfo = [
            {fileUrlName: 'fileA'},
            {fileUrlName: 'fileB'}
        ]
        it('Wrong user id', async () => {
            const tripToAdd = tripMockData.getTripForCreation([], imageInfo, true)
            const userId = tripToAdd.userId
            let result = await dbHandler.getConnection().db('trips').collection('tripInfo').
                insertOne(tripToAdd)

            tripToAdd.title = 'updated title'
            result = await dbService.getImagesForTrip(result.insertedId.toString(), userId+'wrong')

            expect(result).to.equal(null)
        })

        it('Trip has image info', async () => {
            const tripToAdd = tripMockData.getTripForCreation([], imageInfo, true)
            const userId = tripToAdd.userId
            let result = await dbHandler.getConnection().db('trips').collection('tripInfo').
                insertOne(tripToAdd)

            tripToAdd.title = 'updated title'
            result = await dbService.getImagesForTrip(result.insertedId.toString(), userId)

            expect(result.images.length).to.equal(2)
        })

        it('Trip has no image info', async () => {
            const tripToAdd = tripMockData.getTripForCreation([], [], true)
            const userId = tripToAdd.userId
            let result = await dbHandler.getConnection().db('trips').collection('tripInfo').
                insertOne(tripToAdd)

            tripToAdd.title = 'updated title'
            result = await dbService.getImagesForTrip(result.insertedId.toString(), userId)

            expect(result.images.length).to.equal(0)
        })
    })

    it('Generate URL file name for image', () => {
        const urlFileName = dbService.genUrlFileName()
        expect(urlFileName.length).to.be.gt(0)
    })
})