require('dotenv').config()
const AWS = require('aws-sdk')

const isDev = (process.env.NODE_ENV !== 'production')
const bucketRegion = process.env.S3_BUCKET_REGION
const s3Id = process.env.S3_ID
const accessKey = process.env.S3_ACCESS_KEY
const bucketName = (isDev) ? process.env.S3_BUCKET_NAME : process.env.S3_BUCKET_NAME_PRD
const tempBucketName = (isDev) ? process.env.S3_TEMP_BUCKET_NAME : process.env.S3_TEMP_BUCKET_NAME_PRD

AWS.config.update({region: bucketRegion})
const s3 = new AWS.S3({
    accessKeyId: s3Id,
    secretAccessKey: accessKey,
    signatureVersion: 'v4',
})

const deleteS3Images = (names) => {
  return new Promise((resolve, reject) => {
    const params = {
      Bucket: bucketName,
      Delete: { Objects: names },
    }

    s3.deleteObjects(params, (err, result) => {
      if (err) {
        console.log(err)
        resolve(err) // From end user point of view, failure to delete on S3 is fine
      }
      resolve(result)
    })
  })
}

const genSignedUrlPut = (name, type) => {
  return new Promise((resolve, reject) => {
      const params = { 
          Bucket: tempBucketName,
          Key: name, 
          Expires: 120, 
          ContentType: type,
          ACL:'public-read',
      }
      s3.getSignedUrl('putObject', params, (err, url) => {
        if (err) {
          console.log(err)
          reject(err)
        }
        resolve({ 
          signedUrl: url,
          fileUrlName: name,
          pendingFileUrl: getImageS3URL(name)
        })
      })
    })
}

const copyToPermanentBucket = (name) => {
  return new Promise ((resolve ,reject) => {
    const params = {
      Bucket: bucketName,
      CopySource: `/${tempBucketName}/${name}`,
      Key: name,
      ACL:'public-read',
    }

    s3.copyObject(params, (err, result) => {
      if (err) {
        console.log(err)
        reject(err)
      }
      resolve(result)
    })
  })
}

const getImageS3URL = (name) => {
  return `https://${bucketName}.s3.${bucketRegion}.amazonaws.com/${name}`
}

module.exports = { genSignedUrlPut, getImageS3URL, deleteS3Images, copyToPermanentBucket }