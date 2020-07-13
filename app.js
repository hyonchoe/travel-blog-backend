const express = require('express')
const cors = require('cors')
require('dotenv').config()
const dbService = require('./dbServices')

const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cors())
app.use(require('./routes'))

const port = process.env.PORT || 5000
dbService.connect()
    .then((connection) => {
        dbService.setConnection(connection)
        app.listen(port, () => console.log(`Listening on port ${port}`))
    })
    .catch((error) => {
        console.log(error)
        process.exit(1)
    })

module.exports = app