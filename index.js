const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;

//middleware
app.use(cors())
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.rsjkylo.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const userCollection = client.db("dvsDB").collection("users");
    const candidateCollection = client.db("dvsDB").collection("candidate");
    const createVoteCollection = client.db("dvsDB").collection("create-vote");

    app.post("/users", async (req, res) => {
      const newUser = req.body;
      console.log("new user:", newUser);
      const result = await userCollection.insertOne(newUser);
      res.send(result);
    });
    

    app.get("/users", async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });
    // user verify for admin
    app.patch('/users/verify/:id',async(req,res)=>{
      const id = req.params.id
      const query = {_id : new ObjectId(id)}
      console.log(query)
      const doc = {
        $set:{
          verify : 'true'
        }
      }
      const result = await userCollection.updateOne(query,doc)
      console.log(result)
      res.send({message:true})
    })

    app.get("/users/:id", async (req, res) => {
      const id = req.params.id
      console.log(id)
      const result = await userCollection.findOne({_id: new ObjectId(id)})
      res.send(result);
    });

    //candidate releted api
    app.post("/candidate", async (req, res) => {
      const isExcits = await candidateCollection.findOne({
        $or:
        [
        {candidateEmail: req.body.candidateEmail},
        {candidateID: req.body.candidateID}
        ]
      })
      if(isExcits){
        return res.status(400).send({message:"This Candidate is wrong"})
      }
      else{
        const newCandidate = req.body;
        const result = await candidateCollection.insertOne(newCandidate);
        res.send(result);
      }
    });
    // user deleted
    app.delete('/users/:id',async(req,res)=>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await userCollection.deleteOne(query)
      res.send(result)
    })
    // candidate deleted
    app.delete('/candidate/:id',async(req,res)=>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await candidateCollection.deleteOne(query)
      res.send(result)
    })
    app.get("/candidate", async (req, res) => {
      const cursor = await candidateCollection.find().toArray();
      res.send(cursor);
    });

    // create-vor realeted api
    app.post("/create-vote", async (req, res) => {
      const newCreateVote = req.body;
      const result = await createVoteCollection.insertOne(newCreateVote);
      res.send(result);
    });

    app.get("/create-vote", async (req, res) => {
      const cursor = await createVoteCollection.find().toArray();
      res.send(cursor);
    });
    // pagination
    app.get('/paginatedUsers', async (req, res) => {
      try {
        const allUser = await userCollection.find({}).toArray();
        const page = parseInt(req.query.page);
        const limit = parseInt(req.query.limit);
    
        const startIndex = (page - 1) * limit;
        const lastIndex = page * limit;
    
        const results = {};
        results.totalUser = allUser.length;
        results.pageCount = Math.ceil(allUser.length / limit);
    
        if (lastIndex < allUser.length) {
          results.next = {
            page: page + 1,
          };
        }
    
        if (startIndex > 0) {
          results.prev = {
            page: page - 1,
          };
        }
    
        results.result = allUser.slice(startIndex, lastIndex);
        res.json(results);
      } catch (error) {
        console.error('Error fetching paginated users:', error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    });



    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log(
    //   "Pinged your deployment. You successfully connected to MongoDB!"
    // );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("VSD server is running....");
});

app.listen(port, () => {
  console.log(`App is running on port ${port}`);
});
