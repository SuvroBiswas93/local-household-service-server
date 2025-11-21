const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config()
const express = require('express')
const cors = require('cors')
const app = express()
const port = process.env.port || 3000

app.use(cors())
app.use(express.json())



const uri = process.env.MONGODB_URI

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    
    await client.connect();
   
    const db = client.db('HomeHero')
    const servicesCollection = db.collection('services')
    const bookingsCollection = db.collection('bookings')

    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
