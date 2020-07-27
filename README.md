## Project Name & Description
### Name
Travel Blog backend (REST API)

### Description
REST API backend for web application that allows user to document and view their travlels.
Provides CRUD actions for trip data.

For frontend, visit https://github.com/hyonchoe/travel-blog

## Live Demo / Deployed Application
Live website that makes use of this REST API: https://notemytravels.netlify.app/

## Installation and Setup Instructions
Note: You will need `node` and `npm` installed.

### Installation:
Clone this repository, then run `npm install` in the repo folder.

### To run tests:
Run `mocha --delay -- exit test/integration` for integration tests.

Run `mocha --exit test/unit` for unit tests.

### To start server:
Run `node app.js`.

## Reflection
I developed this project:
- to learn Node.js and React (for frontend piece) as it was my first time working with both of them
- to give myself a tool to track my travels and reflect back on experiences

Challenge I experienced during this project development was time-consuming nature of the initial learning and research phase.
Examples include:
- deciding where to store images
- AWS S3 direct upload
- unit testing tools

The tools/technology used to build this project include: Node.js, Express, MongoDB Atlas, AWS S3, cors, Auth0, JavaScript.

Mocha, Chai, Sinon, Supertest, and Memory MongoDB were used for testing needs.
