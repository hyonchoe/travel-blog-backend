const request = require('supertest')
const expect = require('chai').expect
const sinon = require('sinon')
const tripMockData = require('../mockData/tripInfo')
const security = require('../../security')
const dbService = require('../../dbServices')
const S3Service = require('../../S3Service')

// Stub these methods before requiring app
sinon.stub(security, 'checkJwt').callsFake((req, res, next) => {
    req.user = {sub: 'userid'}
    next()
})
const app = require('../../app')

describe('Server APIs', () => {
    describe('GET /publicTrips', () => {
        afterEach(() => {
            dbService.getPublicTrips.restore()
        })

        it('Getting public trips without images', done => {
            const dbOutputMock = [ tripMockData.getTripWithDummyId(true, [], []) ]
            const apiOutputMock = [ tripMockData.getTripWithDummyId(false, [], []) ]

            sinon.stub(dbService, 'getPublicTrips').returns(dbOutputMock)
            
            request(app)
                .get('/publicTrips')
                .expect(200, (err, res) => {
                    expect(res.body).to.deep.equal(apiOutputMock)
                    done()
                })            
        })

        it('Getting public trips with images', done => {
            const dbOutputMock = [ tripMockData.getTripWithDummyId(true, [], [
                {fileUrlName: 'fileA'},
                {fileUrlName: 'fileB'},
            ]) ]
            const apiOutputMock = [ tripMockData.getTripWithDummyId(false, [], [
                {fileUrlName: 'fileA', S3Url: 'url_fileA'},
                {fileUrlName: 'fileB', S3Url: 'url_fileB'},
            ]) ]

            sinon.stub(dbService, 'getPublicTrips').returns(dbOutputMock)
            const s3UrlStub = sinon.stub(S3Service, 'getImageS3URL')
            s3UrlStub.withArgs('fileA').returns('url_fileA')
            s3UrlStub.withArgs('fileB').returns('url_fileB')
            
            request(app)
                .get('/publicTrips')
                .expect(200, (err, res) => {
                    S3Service.getImageS3URL.restore()
                    expect(res.body).to.deep.equal(apiOutputMock)
                    done()
                })
        })
    })

    describe('GET /trips passing authentication', () => {
        afterEach(() => {
            dbService.getUserTrips.restore()
        })

        it('Getting user trips without images', (done) => {
            const dbOutputMock = [ tripMockData.getTripWithDummyId(true, [], []) ]
            const apiOutputMock = [ tripMockData.getTripWithDummyId(false, [], []) ]

            sinon.stub(dbService, 'getUserTrips').returns(dbOutputMock)
            
            request(app)
                .get('/trips')
                .expect(200, (err, res) => {
                    expect(res.body).to.deep.equal(apiOutputMock)
                    done()
                })
        })

        it('Getting user trips with images', (done) => {
            const dbOutputMock = [ tripMockData.getTripWithDummyId(true, [], [
                {fileUrlName: 'fileA'},
                {fileUrlName: 'fileB'},
            ]) ]
            const apiOutputMock = [ tripMockData.getTripWithDummyId(false, [], [
                {fileUrlName: 'fileA', S3Url: 'url_fileA'},
                {fileUrlName: 'fileB', S3Url: 'url_fileB'},
            ]) ]

            sinon.stub(dbService, 'getUserTrips').returns(dbOutputMock)
            const s3UrlStub = sinon.stub(S3Service, 'getImageS3URL')
            s3UrlStub.withArgs('fileA').returns('url_fileA')
            s3UrlStub.withArgs('fileB').returns('url_fileB')
            
            request(app)
                .get('/trips')
                .expect(200, (err, res) => {
                    S3Service.getImageS3URL.restore()
                    expect(res.body).to.deep.equal(apiOutputMock)
                    done()
                })
        })
    })

    describe('POST /trips', () => {
        afterEach(() => {
            dbService.createTrip.restore()
            S3Service.copyToPermanentBucket.restore()
        })

        it('Creating user trip without location and images', (done) => {
            const reqBody = tripMockData.getTripWithDummyId(false, [], [])
            
            sinon.stub(S3Service, 'copyToPermanentBucket')
            sinon.stub(dbService, 'createTrip')

            request(app)
                .post('/trips')
                .send(reqBody)
                .expect(200, done)
        })

        it('Creating user trip without images', (done) => {
            const locations = [{latLng: ['20.2', '30.5']}, {latLng: ['50.12', '-25.74']}]
            const reqBody = tripMockData.getTripWithDummyId(false, locations, [])
            
            sinon.stub(S3Service, 'copyToPermanentBucket')
            sinon.stub(dbService, 'createTrip')

            request(app)
                .post('/trips')
                .send(reqBody)
                .expect(200, done)
        })

        it('Creating user trip without location', (done) => {
            const images = [{fileUrlName: 'fileA', S3Url: 'url_fileA'}, {fileUrlName: 'fileB', S3Url: 'url_fileB'}]
            const reqBody = tripMockData.getTripWithDummyId(false, [], images)
            
            sinon.stub(S3Service, 'copyToPermanentBucket')
            sinon.stub(dbService, 'createTrip')

            request(app)
                .post('/trips')
                .send(reqBody)
                .expect(200, done)            
        })

        it('Creating user trip with location and images', (done) => {
            const locations = [{latLng: ['20.2', '30.5']}, {latLng: ['50.12', '-25.74']}]
            const images = [{fileUrlName: 'fileA', S3Url: 'url_fileA'}, {fileUrlName: 'fileB', S3Url: 'url_fileB'}]
            const reqBody = tripMockData.getTripWithDummyId(false, locations, images)
            
            sinon.stub(S3Service, 'copyToPermanentBucket')
            sinon.stub(dbService, 'createTrip')

            request(app)
                .post('/trips')
                .send(reqBody)
                .expect(200, done)
        })
    })

    describe('DELETE /trips/:tripId', () => {
        afterEach(() => {
            dbService.deleteTrip.restore()
            S3Service.deleteS3Images.restore()
        })

        it('Delete a trip', (done) => {
            sinon.stub(dbService, 'deleteTrip').returns({})
            sinon.stub(S3Service, 'deleteS3Images')

            request(app)
                .delete('/trips/:1234')
                .expect(200, done)
        })
    })

    describe('PUT /trips/:tripId', () => {
        afterEach(() => {
            dbService.getImagesForTrip.restore()
            dbService.updateTrip.restore()
            S3Service.copyToPermanentBucket.restore()
            S3Service.deleteS3Images.restore()
        })

        it('Update a trip', (done) => {
            const locations = [{latLng: ['20.2', '30.5']}, {latLng: ['50.12', '-25.74']}]
            const images = [{fileUrlName: 'fileA', S3Url: 'url_fileA'}, {fileUrlName: 'fileB', S3Url: 'url_fileB'}]
            const reqBody = tripMockData.getTripWithDummyId(false, locations, images)
            
            sinon.stub(dbService, 'getImagesForTrip').returns({images: images})
            sinon.stub(dbService, 'updateTrip').returns({})
            sinon.stub(S3Service, 'copyToPermanentBucket')
            sinon.stub(S3Service, 'deleteS3Images')

            request(app)
                .put('/trips/:1234')
                .send(reqBody)
                .expect(200, done)
        })
    })

    describe('GET /get-signed-url', () => {
        afterEach(() => {
            dbService.genUrlFileName.restore()
            S3Service.genSignedUrlPut.restore()
        })

        it('Get s3 signed url', (done) => {
            const urlFileName = 'urlfilename'
            const fileType = 'image/jpeg'
            const apiOutputMock = urlFileName+'_'+fileType
            sinon.stub(dbService, 'genUrlFileName').returns(urlFileName)
            sinon.stub(S3Service, 'genSignedUrlPut').withArgs(urlFileName, fileType).returns(apiOutputMock)

            request(app)
                .get('/get-signed-url')
                .query({ type: fileType })
                .expect(200, (err, res) => {
                    expect(res.text).to.equal(apiOutputMock)
                    done()
                })
        })
    })
})