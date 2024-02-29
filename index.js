const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;

//middleware
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://electronic-voting-system-beta.vercel.app",
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.rsjkylo.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

//middlewares
const logger = (req, res, next) => {
  console.log("log: info", req.method, req.url);
  next();
};

const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token;
  // console.log("token in the middleware", token);
  if (!token) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "unauthorized access" });
    }
    req.user = decoded;
    next();
  });
};

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const userCollection = client.db("dvsDB").collection("users");
    const userFeedbackCollection= client.db("dvsDB").collection("feedbacks");
    const candidateCollection = client.db("dvsDB").collection("candidate");
    const createVoteCollection = client.db("dvsDB").collection("create-vote");
    const CandidateUnderUserCollection = client
      .db("dvsDB")
      .collection("CandiateUnderUser");
    const participateVoteCollection = client
      .db("dvsDB")
      .collection("participate");
    const createPollCollection = client.db("dvsDB").collection("create-poll");
    const pollAnsCollection = client.db("dvsDB").collection("poll-ans");
    const notificationCollection = client
      .db("dvsDB")
      .collection("notification");
    const pollParticipateCollection = client
      .db("dvsDB")
      .collection("poll-participate");

    // auth related api
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      console.log("user for token", user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: true,
          sameSite: "none",
        })
        .send({ success: true });
    });

    app.post("/logout", async (req, res) => {
      const user = req.body;
      console.log("logging out", user);
      res.clearCookie("token", { maxAge: 0 }).send({ success: true });
    });

    // setvices related api
    app.post("/users", async (req, res) => {
      const newUser = req.body;
      const result = await userCollection.insertOne(newUser);
      res.send(result);
    });

    app.get("/users", verifyToken, async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });
    app.get("/users/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      const result = await userCollection.findOne({ email: email });
      res.send(result);
    });

    // user verify for admin

    app.patch("/users/isRole/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      console.log(query);
      const doc = {
        $set: {
          isRole: "Admin",
        },
      };
      const result = await userCollection.updateOne(query, doc);
      res.send(result);
    });

    app.patch("/users/verify/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      console.log(query);
      const doc = {
        $set: {
          verify: "true",
        },
      };
      const result = await userCollection.updateOne(query, doc);
      res.send(result);
    });

    app.patch("/users/:id", async (req, res) => {
      const data = req.params;
      const data2 = req.body;
      console.log(data2);
      const filter = { _id: new ObjectId(data.id) };
      console.log(filter);
      const updateDoc = {
        $set: {
          isRole: data2.updateIsRole,
        },
      };
      const result = await userCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    app.get("/users/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const result = await userCollection.findOne({ _id: new ObjectId(id) });
    });

    // app.patch("/candidate/:id", async (req, res) => {
    //   const data = req.params;
    //   const data2 = req.body;
    //   // console.log(data2)
    //   const filter = { _id: new ObjectId(data.id) };
    //   // console.log(filter);
    //   const updateDoc = {
    //     $set: {
    //       voteCount: data2.updateVoteCount2,
    //     },
    //   };
    //   const result = await candidateCollection.updateOne(filter, updateDoc);
    //   res.send(result);
    // });

    app.patch("/users/:id", async (req, res) => {
      const data = req.params;
      const data2 = req.body;
      console.log(data2);
      const filter = { _id: new ObjectId(data.id) };
      console.log(filter);
      const updateDoc = {
        $set: {
          isRole: data2.updateIsRole,
        },
      };
      const result = await userCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    //candidate releted api
    app.post("/candidate", async (req, res) => {
      const newCandidate = req.body;
      const result = await candidateCollection.insertOne(newCandidate);
      res.send(result);
    });

    // candidate deleted
    app.delete("/candidate/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await candidateCollection.deleteOne(query);
      res.send(result);
    });

    app.patch("/candidate/verify/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      console.log(query);
      const doc = {
        $set: {
          isverify: "true",
        },
      };
      const result = await candidateCollection.updateOne(query, doc);
      res.send(result);
    });

    app.get("/candidate", verifyToken, async (req, res) => {
      const cursor = await candidateCollection.find().toArray();
      res.send(cursor);
    });

    app.delete("/candidate/under/:voteName", async (req, res) => {
      const voteNameParam = req.params.voteName;
      const cursor = { voteName: voteNameParam };
      const result = await candidateCollection.deleteMany(cursor);
      res.send(result);
    });

    app.get("/candidate/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const result = await candidateCollection.findOne({
        _id: new ObjectId(id),
      });
      // console.log(id);
      res.send(result);
    });

    app.patch("/candidate/:id", async (req, res) => {
      const data = req.params;
      const data2 = req.body;
      // console.log(data2)
      const filter = { _id: new ObjectId(data.id) };
      // console.log(filter);
      const updateDoc = {
        $set: {
          voteCount: data2.updateVoteCount2,
        },
      };
      const result = await candidateCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    // user deleted
    app.delete("/users/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await userCollection.deleteOne(query);
      res.send(result);
    });

    //Notification

    app.post("/notification", async (req, res) => {
      const notification = req.body;
      console.log(notification);
      const result = await notificationCollection.insertOne(notification);
      res.send(result);
    });

    app.get("/notification", async (req, res) => {
      const result = await notificationCollection.find().toArray();
      res.send(result);
    });

    app.get("/notification/:email", async (req, res) => {
      const email = req.params.email;
      const query = { receiverEmail: email };
      const result = await notificationCollection.find(query).toArray();
      res.send(result);
    });

    app.delete("/notification/:email", async (req, res) => {
      const email = req.params.email;
      const query = { $or: [{ senderEmail: email }, { receiverEmail: email }] };
      const result = await notificationCollection.deleteMany(query);
      res.send(result);
    });

    //participate vote releted api
    app.get("/participate", verifyToken, async (req, res) => {
      const result = await participateVoteCollection.find().toArray();
      res.send(result);
    });

    app.post("/participate", async (req, res) => {
      const newParticipate = req.body;
      console.log("newParticipate", newParticipate);
      const result = await participateVoteCollection.insertOne(newParticipate);
      res.send(result);
    });

    // create-vor realeted api
    app.patch("/create-vote/:id", async (req, res) => {
      const id = req.params.id;
      const data2 = req.body;
      console.log(data2);
      const filter = { _id: new ObjectId(id) };
      console.log(filter);
      const updateDoc = {
        $set: {
          position: data2.position,
        },
      };
      const result = await createVoteCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    // app.post("/create-vote", async (req, res) => {
    //   const newCreateVote = req.body;
    //   const result = await createVoteCollection.insertOne(newCreateVote);
    //   res.send(result);
    // });
    app.post("/create-vote", async (req, res) => {
      const isExcits = await createVoteCollection.findOne({
        name: req.body.name,
      });
      if (isExcits) {
        return res.status(400).send({ message: "This Candidate is wrong" });
      } else {
        const newCandidate = req.body;
        const result = await createVoteCollection.insertOne(newCandidate);
        res.send(result);
      }
    });

    app.get("/create-vote", async (req, res) => {
      const filter = req.query;
      // console.log(filter);
      const query = {
        OrganizatonName: {$regex: filter.search, $options: 'i'},
        // name: {$regex: filter.search, $options: 'i'}
      }
      const cursor = await createVoteCollection.find(query).toArray();
      res.send(cursor);
    });

    app.get("/create-vote", async (req, res) => {
      const cursor = await createVoteCollection.find().toArray();
      res.send(cursor);
    });
    app.get("/create-vote/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await createVoteCollection.findOne(query);
      res.send(result);
    });
    app.post("/candidate/under/users", async (req, res) => {
      const body = req.body;
      console.log(body);
      const result = await CandidateUnderUserCollection.insertOne(body);
      res.send(result);
    });
    app.get(
      "/candidate/under/users/:voteName",
      verifyToken,
      async (req, res) => {
        const paramsVoteName = req.params.voteName;
        const result = await CandidateUnderUserCollection.find({
          voteName: paramsVoteName,
        }).toArray();
        res.send(result);
      }
    );

    app.delete("/candidate/under/users/:voteName", async (req, res) => {
      const voteNameParam = req.params.voteName;
      const cursor = { voteName: voteNameParam };
      const result = await CandidateUnderUserCollection.deleteMany(cursor);
      res.send(result);
    });

    app.get("/CandiateUnderUser", verifyToken, async (req, res) => {
      const cursor = await CandidateUnderUserCollection.find().toArray();
      res.send(cursor);
    });
    app.delete("/candidateUnderVoter/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await CandidateUnderUserCollection.deleteOne(query);
      res.send(result);
    });
    app.patch("/candidateUnderVoter/verify/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      console.log(query);
      const doc = {
        $set: {
          isverify: "true",
        },
      };
      const result = await CandidateUnderUserCollection.updateOne(query, doc);
      res.send(result);
    });

    //Specific Vote Delete
    app.delete("/create-vote/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await createVoteCollection.deleteOne(query);
      res.send(result);
    });

    //Specific Vote Details Update
    app.put("/create-vote/update/:id", async (req, res) => {
      const id = req.params.id;
      const obj = req.body;
      console.log(obj);
      const query = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateElection = {
        $set: {
          OrganizatonName: obj.OrganizatonName,
          Type: obj.Type,
          endDate: obj.endDate,
          endTime: obj.endTime,
          name: obj.name,
          photo: obj.photo,
          startDate: obj.startDate,
          startTime: obj.startTime,
        },
      };
      const result = await createVoteCollection.updateOne(
        query,
        updateElection,
        options
      );
      res.send(result);
    });

    app.get("/create-vote/:name", async (req, res) => {
      const name = req.params.name;
      const result = await createVoteCollection.findOne({
        name: name,
      });
      res.send(result);
    });

    // create Poll

    // app.post("/create-poll", async (req, res) => {
    //   const newCreatePoll = req.body;
    //   const result = await createPollCollection.insertOne(newCreatePoll);
    //   res.send(result);
    // });
    app.post("/create-poll", async (req, res) => {
      const isExcits = await createPollCollection.findOne({
        userName: req.body.userName,
      });
      if (isExcits) {
        return res.status(400).send({ message: "This user name  is wrong" });
      } else {
        const newPoll = req.body;
        const result = await createPollCollection.insertOne(newPoll);
        res.send(result);
      }
    });

    app.get("/create-poll", async (req, res) => {
      const cursor = await createPollCollection.find().toArray();
      res.send(cursor);
    });

    app.get("/create-poll/:id", async (req, res) => {
      const id = req.params.id;
      const result = await createPollCollection.findOne({
        _id: new ObjectId(id),
      });
      console.log(id);
      res.send(result);
    });

    app.delete("/create-poll/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await createPollCollection.deleteOne(query);
      res.send(result);
    });

    // poll-ans
    app.post("/poll-ans", async (req, res) => {
      const newPollAns = req.body;
      const result = await pollAnsCollection.insertOne(newPollAns);
      res.send(result);
    });

    app.get("/poll-ans", async (req, res) => {
      const cursor = await pollAnsCollection.find().toArray();
      res.send(cursor);
    });

    app.get("/poll-ans/:id", async (req, res) => {
      const id = req.params.id;
      const result = await pollAnsCollection.findOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    app.patch("/poll-ans/:id", async (req, res) => {
      const data = req.params.id;
      const data2 = req.body;
      console.log(data2);
      const filter = { _id: new ObjectId(data) };
      console.log(filter);
      const updateDoc = {
        $set: {
          pollVoteCount: data2?.updataVoteCount,
        },
      };
      const result = await pollAnsCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    //poll participate user
    app.post("/poll-participate", async (req, res) => {
      const newPollParticipate = req.body;
      const result = await pollParticipateCollection.insertOne(
        newPollParticipate
      );
      res.send(result);
    });

    app.get("/poll-participate", verifyToken, async (req, res) => {
      const cursor = await pollParticipateCollection.find().toArray();
      res.send(cursor);
    });

    // pagination
    // app.get("/paginatedUsers", async (req, res) => {
    //   try {
    //     const allUser = await userCollection.find({}).toArray();
    //     const page = parseInt(req.query.page);
    //     const limit = parseInt(req.query.limit);

    //     const startIndex = (page - 1) * limit;
    //     const lastIndex = page * limit;
    //     const results = {};
    //     results.totalUser = allUser.length;
    //     results.pageCount = Math.ceil(allUser.length / limit);

    //     if (lastIndex < allUser.length) {
    //       results.next = {
    //         page: page + 1,
    //       };
    //     }

    //     if (startIndex > 0) {
    //       results.prev = {
    //         page: page - 1,
    //       };
    //     }

    //     results.result = allUser.slice(startIndex, lastIndex);
    //     res.json(results);
    //   } catch (error) {
    //     console.error("Error fetching paginated users:", error);
    //     res.status(500).json({ error: "Internal Server Error" });
    //   }
    // });

    // Backend code
    app.get("/paginatedUsers", verifyToken, async (req, res) => {
      try {
        const allUser = await userCollection.find({}).toArray();
        const page = parseInt(req.query.page);
        const limit = parseInt(req.query.limit);
        const searchName = req.query.searchName;

        const filteredUsers = allUser.filter((user) => {
          return (
            !searchName ||
            user.name.toLowerCase().includes(searchName.toLowerCase())
          );
        });
        const startIndex = (page - 1) * limit;
        const lastIndex = page * limit;
        const results = {};
        results.totalUser = filteredUsers.length;
        results.pageCount = Math.ceil(filteredUsers.length / limit);
        if (lastIndex < filteredUsers.length) {
          results.next = {
            page: page + 1,
          };
        }
        if (startIndex > 0) {
          results.prev = {
            page: page - 1,
          };
        }

        results.result = filteredUsers.slice(startIndex, lastIndex);
        res.json(results);
      } catch (error) {
        console.error("Error fetching paginated users:", error);
        res.status(500).json({ error: "Internal Server Error" });
      }
    });
    app.post("/feedback", async (req, res) => {
      const newFeedback = req.body;
      const result = await userFeedbackCollection.insertOne(newFeedback);
      res.send(result);
    });
    app.get("/feedback", async (req, res) => {
      const result = await userFeedbackCollection.find().toArray();
      res.send(result);
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
