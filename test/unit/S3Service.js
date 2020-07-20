/** 
 * Unit tests for S3Service.js
 * 
 * Run by running 'mocha --exit test/unit' in command line.
 */

require('dotenv').config()
const expect = require('chai').expect
const S3Service = require('../../S3Service')

describe('AWS S3 Services', () => {
    describe('getImageS3URL()', () => {

        it('Generating view url for existing resource', (done) => {
            const isDev = (process.env.NODE_ENV !== 'production')
            const bucketName = (isDev) ? process.env.S3_BUCKET_NAME : process.env.S3_BUCKET_NAME_PRD
            const bucketRegion = process.env.S3_BUCKET_REGION
            const fileName = 'filename'
            const outputMock = `https://${bucketName}.s3.${bucketRegion}.amazonaws.com/${fileName}`

            expect(S3Service.getImageS3URL(fileName)).to.equal(outputMock)
            done()
        })
    })
    // Other S3Services methods are plain wrappers for actual AWS APIs
})