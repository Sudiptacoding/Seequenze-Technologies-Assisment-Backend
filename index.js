const express = require('express')
require('dotenv').config()
var cors = require('cors')
var jwt = require('jsonwebtoken');
const app = express()
app.use(cors())
app.use(express.json())
const port = process.env.PORT || 3000
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.vdfwpbk.mongodb.net/?retryWrites=true&w=majority`

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        const database = client.db("TextNode");
        const userCollection = database.collection("users");
        const notes = database.collection("notes");
        const trash = database.collection("trash");


        // Create Token
        app.post('/jwt', (req, res) => {
            try {
                const token = jwt.sign(req.body, process.env.SEQUIRITY, { expiresIn: '1h' });
                res.send({ token })
            } catch (error) {
                console.log(error)
            }
        })

        // Verify
        const VerifyToken = (req, res, next) => {
            if (!req.headers.authorization) {
                return res.status(401).send({ message: "unAuthorize access" })
            }
            const token = req.headers.authorization.split(' ')[1];
            jwt.verify(token, process.env.SEQUIRITY, function (err, decoded) {
                if (err) {
                    return res.status(401).send({ message: "unAuthorize access" })
                }
                req.decoded = decoded;
                next()
            });
        }


        // Save all User
        app.post('/user', async (req, res) => {
            const email = await userCollection.findOne({ email: req.body.email })
            if (email) {
                return res.send({ sucess: true })
            }
            const result = await userCollection.insertOne(req.body)
            res.send(result)
        })


        // Save all Noats
        app.post('/notes', VerifyToken, async (req, res) => {
            const result = await notes.insertOne(req.body)
            res.send(result)
        })

        // Save all Noats in trash
        app.post('/trash', VerifyToken, async (req, res) => {
            const result = await trash.insertOne(req.body)
            res.send(result)
        })

        // gate all notes
        app.get('/notes', VerifyToken, async (req, res) => {
            const result = await notes.find({ email: req.query.email }).toArray()
            res.send(result)
        })

        // gate all notes trash
        app.get('/trash', VerifyToken, async (req, res) => {
            const result = await trash.find({ email: req.query.email }).toArray()
            res.send(result)
        })

        // update all notes
        app.put('/notes/:id', VerifyToken, async (req, res) => {
            const filter = { _id: new ObjectId(req.params.id) };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    ...req.body
                },
            };
            const result = await notes.updateOne(filter, updateDoc, options);
            res.send(result)
        })

        // Delet all notes
        app.delete('/notes/:id', VerifyToken, async (req, res) => {
            const result = await notes.deleteOne({ _id: new ObjectId(req.params.id) })
            res.send(result)
        })

        // Delet all notes for tresh
        app.delete('/trash/:id', VerifyToken, async (req, res) => {
            const result = await trash.deleteOne({ _id: req.params.id })
            res.send(result)
        })


        // Get tags
        app.get('/uniqueTags', async (req, res) => {
            const data = await notes.find({ email: req.query.email }).toArray()
            const allTags = data.reduce((acc, obj) => {
                acc.push(...obj.tags);
                return acc;
            }, []);
            const uniqueTags = [...new Set(allTags)];
            res.send(uniqueTags)
        });



        app.get('/tagsData', async (req, res) => {
            const data = await notes.find().toArray()
            const targetTag = req.query.tag;
            const filteredData = data.filter(obj => obj.tags.includes(targetTag));
            res.send(filteredData)
        });



        // Check Ture gide or not 


        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})