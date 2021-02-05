var express = require('express')
var path = require('path')
var Registry = require('azure-iothub').Registry;
const bodyParser = require('body-parser');

var app = express()
var port = 3000

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// this is the only supported scenario
app.get('/api/twin/:deviceId', (req, res) => {
    var deviceId = req.params.deviceId;
    var sasToken = req.headers.authorization;
    const registry = Registry.fromSharedAccessSignature(sasToken);
    registry.getTwin(deviceId, (err, twin) => {
        if (err) { res.status(500).json(err.responseBody ? JSON.parse(err.responseBody) : { "Message": "Error getting twin" }); return; }
        res.send(twin);
    });
})

app.use(express.static('build'));
app.get('*', (req, res) => res.sendFile(path.resolve(__dirname + '/build/index.html')));

app.listen(port, () => {
    console.log(`Twin Viewer app listening at http://localhost:${port}`)
})