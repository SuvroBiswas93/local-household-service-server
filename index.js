const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const express = require('express')
const cors = require('cors')
const app = express()
const port = process.env.port || 3000

app.use(cors())
app.use(express.json())

const uri = process.env.MONGODB_URI

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {

    const db = client.db('HomeHero')
    const servicesCollection = db.collection('services')
    const bookingsCollection = db.collection('bookings')

    // Get all services OR provider specific
    app.get('/services', async (req, res) => {
      try {
        const { providerEmail } = req.query;
        const filter = providerEmail ? { providerEmail } : {};
        const result = await servicesCollection.find(filter).toArray();
        res.send(result);
      } catch (err) {
        console.error(err);
        res.status(500).send({ success: false, error: 'Server error' });
      }
    });

    // Get single service
    app.get('/services/:id', async (req, res) => {
      const { id } = req.params;
      const result = await servicesCollection.findOne({ _id: new ObjectId(id) });
      res.send({
        success: true,
        result
      })
    });

    // Update service
    app.put('/services/:id', async (req, res) => {
      try {
        const { id } = req.params;
        const updateData = req.body;
        const providerEmail = updateData.providerEmail;

        if (!providerEmail) {
          return res.status(400).send({ success: false, error: 'providerEmail required' });
        }

        const service = await servicesCollection.findOne({ _id: new ObjectId(id) });
        if (!service) {
          return res.status(404).send({ success: false, error: 'Service not found' });
        }

        if (service.providerEmail !== providerEmail) {
          return res.status(403).send({ success: false, error: 'Not allowed to update this service' });
        }

        const result = await servicesCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: updateData }
        );

        res.send({
          success: true,
          result
        });

      } catch (err) {
        console.error(err);
        res.status(500).send({ success: false, error: 'Server error' });
      }
    });

    // Delete service
    app.delete('/services/:id', async (req, res) => {
      try {
        const { id } = req.params;
        const { providerEmail } = req.query;

        if (!providerEmail) {
          return res.status(400).send({ success: false, error: 'providerEmail required' });
        }

        const service = await servicesCollection.findOne({ _id: new ObjectId(id) });
        if (!service) {
          return res.status(404).send({ success: false, error: 'Service not found' });
        }

        if (service.providerEmail !== providerEmail) {
          return res.status(403).send({ success: false, error: 'Not allowed to delete this service' });
        }

        const result = await servicesCollection.deleteOne({ _id: new ObjectId(id) });

        res.send({
          success: result.deletedCount > 0
        });

      } catch (err) {
        console.error(err);
        res.status(500).send({ success: false, error: 'Server error' });
      }
    });

    // Get bookings
    app.get('/bookings', async (req, res) => {
      const { userEmail } = req.query;
      const bookings = await bookingsCollection.find({ userEmail }).toArray();
      res.send(bookings);
    });

    // Add service
    app.post('/services', async (req, res) => {
      const data = req.body;
      const result = await servicesCollection.insertOne(data);
      res.send(result);
    });

    // Add booking
    app.post('/bookings', async (req, res) => {
      const data = req.body;
      data.serviceId = new ObjectId(data.serviceId);

      const result = await bookingsCollection.insertOne(data);

      res.send({
        success: true,
        result
      });
    });

    // Delete booking
    app.delete('/bookings/:id', async (req, res) => {
      const { id } = req.params;
      const result = await bookingsCollection.deleteOne({ _id: new ObjectId(id) });
      res.send({ success: result.deletedCount > 0 });
    });

    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");

  } finally {
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
