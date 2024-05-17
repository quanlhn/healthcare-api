// password mongodb atlas: fZ0vxQopCN5K5gPs

const express = require('express')
const morgan =  require('morgan')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')

// const { MongoClient, ServerApiVersion } = require('mongodb');
// const uri = "mongodb+srv://quanlhn:fZ0vxQopCN5K5gPs@healthcare.2c6h4te.mongodb.net/?retryWrites=true&w=majority&appName=healthcare";

mongoose.connect("mongodb+srv://quanlhn:fZ0vxQopCN5K5gPs@healthcare.2c6h4te.mongodb.net/?retryWrites=true&w=majority&appName=healthcare")
const db = mongoose.connection
db.on('error', (err) => {
    console.log(err)
})

db.once('open', () => {
    console.log('Database connection established')
})

const AuthRoute = require('./routes/auth')
const CaloriesRoute = require('./routes/caloriesCalculate')
const WorkoutRoute = require('./routes/workout')
const ScheduleRoute = require('./routes/schedule')


// const client = new MongoClient(uri, {
//     serverApi: {
//         version: ServerApiVersion.v1,
//         strict: true,
//         deprecationErrors: true,
//     }
// });

const app = express()

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    next();
});

app.use(morgan('dev'))
app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json())

const PORT = process.env.PORT || 8080


app.listen(PORT, () => {
    console.log('Server is running on port ' + PORT)
})


// async function run() {
//     try {
//         // Connect the client to the server	(optional starting in v4.7)
//         await client.connect();
//         // Send a ping to confirm a successful connection
//         await client.db("admin").command({ ping: 1 });
//         console.log("Pinged your deployment. You successfully connected to MongoDB!");
//     } finally {
//         // Ensures that the client will close when you finish/error
//         await client.close();
//     }
// }

// run().catch(console.dir);

app.use('/api', AuthRoute)
app.use('/api/calories-calculate', CaloriesRoute)
app.use('/api/workout', WorkoutRoute)
app.use('/api/schedule', ScheduleRoute)