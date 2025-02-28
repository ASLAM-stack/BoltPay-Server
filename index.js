const express = require('express');
const app = express();
const port = process.env.PORT || 5000;
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion } = require('mongodb');

app.use(express.json());
app.use(cors());

// MongoDB Connection
const uri = `mongodb+srv://${process.env.DB_User}:${process.env.DB_Pass}@boltpay.xxc6e.mongodb.net/?retryWrites=true&w=majority&appName=BoltPay`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    await client.connect(); // Connect to MongoDB
    console.log("Connected to MongoDB!");

    const userCollection = client.db('BoltPay').collection('user');
    const transCollection = client.db('BoltPay').collection('transaction');

    //JWT RELATED API
    app.post('/jwt', async(req,res) =>{
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET,{expiresIn:'120h'})
      res.send({token})
    })
    //middlewares
    const verifyToken = (req, res, next) => {
      // console.log('inside verify token', req.headers.authorization);
      if (!req.headers.authorization) {
        return res.status(401).send({ message: 'unauthorized access' });
      }
      const token = req.headers.authorization.split(' ')[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: 'unauthorized access' })
        }
        req.decoded = decoded;
        next();
      })
    }
    app.get('/user/admin/:email',verifyToken, async(req,res) =>{
      const email = req.params.email;
      if (email !== req.decoded.email ) {
        return res.status(403).send({message: 'forbiden  access'})
      }
      const query = { email: email };
    const user = await userCollection.findOne(query);
       
      res.send(user)
    })
    app.post('/users',async(req,res) =>{
      const user = req.body;
      const query = {email:user.email}
      const exitingUser = await userCollection.findOne(query)
      if(exitingUser){
        return res.send({message:'user already exists',insertedId:null})
      }
      const mobilequery = {mobile:user.mobile}
      const exitingMobile = await userCollection.findOne(mobilequery)
      if(exitingMobile){
        return res.send({message:'Mobile number already exists',insertedId:null})
      }
      const nidquery = {nid:user.nid}
      const exitingNid = await userCollection.findOne(nidquery)
      if(exitingNid){
        return res.send({message:'Nid number already exists',insertedId:null})
      }
      const result = await userCollection.insertOne(user)
      return res.send(result)
    })
    // Example Route - Fetch Users
    app.get('/users', async (req, res) => {
      const users = await userCollection.find().toArray();
      res.send(users);
    });
    app.post("/user")

  } catch (error) {
    console.error("MongoDB Connection Error:", error);
  }
}
run();

app.listen(port, () => {
  console.log(`BoltPay is running on port ${port}`);
});

app.get('/', (req, res) => {
  res.send('BoltPay is working');
});
