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
      let { minPrice, maxPrice, providerEmail } = req.query;

      const filter = {};

      // Filter by provider email
      if (providerEmail && providerEmail.trim() !== "") {
        filter.Email = providerEmail; // match DB field
      }

      // Filter by price using $gte and $lte
      if ((minPrice && minPrice.trim() !== "") || (maxPrice && maxPrice.trim() !== "")) {
        filter.Price = {}; 

        if (minPrice && minPrice.trim() !== "") {
          filter.Price.$gte = Number(minPrice);
        }

        if (maxPrice && maxPrice.trim() !== "") {
          filter.Price.$lte = Number(maxPrice);
        }
      }

      const result = await servicesCollection.find(filter).toArray();
      res.send(result);

    } catch (error) {
      console.error(error);
      res.status(500).send({ success: false, error: 'Server error' });
    }
  });


  // Add review to a service
  app.post('/services/:id/reviews', async (req, res) => {
    try {
      const { id } = req.params;
      const { rating, comment, userEmail } = req.body;

      if (!rating || !userEmail) {
        return res.status(400).send({ success: false, error: "Rating and userEmail are required" });
      }

      const service = await servicesCollection.findOne({ _id: new ObjectId(id) });
      if (!service) {
        return res.status(404).send({ success: false, error: "Service not found" });
      }

      const review = {
        userEmail,
        rating: Number(rating),
        comment: comment || "",
        date: new Date()
      };

      const result = await servicesCollection.updateOne(
        { _id: new ObjectId(id) },
        { $push: { reviews: review } }
      );

      res.send({ success: true, result, review });
    } catch (err) {
      console.error(err);
      res.status(500).send({ success: false, error: "Server error" });
    }
  });


  // Top 8 rated services
   app.get('/services/top-rated', async (req, res) => {
    try {
      const result = await servicesCollection
        .find({ reviews: { $exists: true, $ne: [] } }) // Only services with reviews
        .sort({ "reviews.rating": -1 }) // Sort by rating
        .limit(8) // Top 8
        .toArray();

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
        const providerEmail = updateData.providerEmail || updateData.Email;

        if (!providerEmail) {
          return res.status(400).send({ success: false, error: 'providerEmail required' });
        }

        const service = await servicesCollection.findOne({ _id: new ObjectId(id) });
        if (!service) {
          return res.status(404).send({ success: false, error: 'Service not found' });
        }

        if (service.Email !== providerEmail) {
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

        if (service.Email !== providerEmail) {
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

      let filter = {};

      if (userEmail) {
        filter.userEmail = userEmail;
      }

      const bookings = await bookingsCollection.find(filter).toArray();
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

    // Check duplicate booking
    const exists = await bookingsCollection.findOne({
      serviceId: data.serviceId,
      userEmail: data.userEmail
    });

    if (exists) {
      return res.status(400).send({ success: false, error: "You already booked this service" });
    }

    // Check owner booking themselves
    const service = await servicesCollection.findOne({ _id: data.serviceId });
    if (service.providerEmail === data.userEmail) {
      return res.status(400).send({ success: false, error: "Provider cannot book their own service" });
    }

    const result = await bookingsCollection.insertOne(data);
    res.send({ success: true, result });
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
