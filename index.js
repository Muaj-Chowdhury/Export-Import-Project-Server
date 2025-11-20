const express = require("express");
const app = express();
const port = process.env.port || 3000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");

// middleware
app.use(cors());
app.use(express.json());

const uri =
  "mongodb+srv://Export-Import-DB:3RdsIoy1P3XzCf9t@cluster0.kw3z4m2.mongodb.net/?appName=Cluster0";

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
      const result = await productsCollection
        .find()
        .toArray();
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

    app.get("/myImports", async (req , res)=>{
        const email = req.query.email
        const result = await importsCollection.find({email: email}).toArray()
        res.send(result)
    })

    app.delete("/myImports/:id", async (req , res)=>{
        const id = req.params.id
        const result = await importsCollection.deleteOne({ _id: new ObjectId(id) })
        res.send(result)
    })

    app.post("/Exports",   async (req, res) => {
      const data = req.body;
      // console.log(data)
      const result = await productsCollection.insertOne(data);
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
