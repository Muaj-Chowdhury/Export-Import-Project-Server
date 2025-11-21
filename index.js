require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB URI using environment variables
const uri = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@${process.env.MONGO_CLUSTER}/${process.env.MONGO_DB}?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

app.get("/", (req, res) => {
  res.send("hello world");
});

async function run() {
  try {
    await client.connect();
    const db = client.db("import-export-db");
    const productsCollection = db.collection("all-products");
    const importsCollection = db.collection("Imports");

    app.get("/latest-products", async (req, res) => {
      const result = await productsCollection
        .find()
        .sort({ createdAt: "desc" })
        .limit(6)
        .toArray();
      console.log(result);
      res.send(result);
    });

    app.get("/all-products", async (req, res) => {
      const result = await productsCollection.find().toArray();
      res.send(result);
    });

    app.get("/products/:id", async (req, res) => {
      const { id } = req.params;
      const result = await productsCollection
        .find({ _id: new ObjectId(id) })
        .toArray();
      res.send({
        success: true,
        result,
      });
    });

    app.post("/Imports", async (req, res) => {
      const data = req.body;
      const productId = data.productId;
      const importedQuantity = data.importedQuantity;
      try {
        // 1️ Insert import record
        const importResult = await importsCollection.insertOne(data);

        // 2️ Decrement available quantity using ObjectId
        const updatedResult = await productsCollection.updateOne(
          { _id: new ObjectId(productId) },
          { $inc: { availableQuantity: -importedQuantity } }
        );

        res.send({
          success: true,
          importResult,
          updatedResult,
          message: "Product imported and quantity updated",
        });
      } catch (err) {
        console.error(err);
        res.status(500).send({ error: "Failed to import product" });
      }
    });

    app.get("/myImports", async (req, res) => {
      const email = req.query.email;
      const result = await importsCollection.find({ email: email }).toArray();
      res.send(result);
    });

    app.delete("/myImports/:id", async (req, res) => {
      const id = req.params.id;
      const result = await importsCollection.deleteOne({
        _id: new ObjectId(id),
      });
      res.send(result);
    });

    app.post("/products", async (req, res) => {
      const data = req.body;
      // console.log(data)
      const result = await productsCollection.insertOne(data);
      res.send(result);
    });

    app.get("/myExports", async (req, res) => {
      const email = req.query.email;
      const result = await productsCollection
        .find({ exporterEmail: email })
        .toArray();
      res.send(result);
    });

    app.delete("/products/:id", async (req, res) => {
      const id = req.params.id;
      const result = await productsCollection.deleteOne({
        _id: new ObjectId(id),
      });
      res.send(result);
    });

    app.put("/products/:id", async (req, res) => {
      const id = req.params.id;
      const data = req.body;
      console.log(data);

      const result = await productsCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: data }
      );
      res.send(result);
      console.log(result);
    });

    app.get("/search", async (req, res) => {
      const search_text = req.query.search;
      const result = await modelCollection
        .find({name: {$regex: search_text , $options: "i"}})
        .toArray();
      res.send(result);
    });

    await client.db("admin").command({ ping: 1 });

    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`server listening on port ${port} `);
});
