

module.exports = {init:(PORT, IPCNODE)=>{
  const run = (req, res) => {
    var params = req.params;
    let body, pk =req.params.pk;
    console.log(req.body)
    try {
      body = JSON.parse(req.body);
    } catch(e) {
      body = req.body
    }
    console.log(req.params);
    console.log(Buffer.from(pk, 'hex'));
    const args = {...req.params};
    delete args.actionname;
    delete args.pk
    IPCNODE.run(Buffer.from(pk, 'hex'), params.actionname, body||args).then(a=>{
      res.write(JSON.stringify(a))
      res.status(200).end()
    }).catch((err)=>{
      res.write(JSON.stringify(err))
      res.status(500).end()
    });
  }
  const express = require("express")
  const bodyParser = require("body-parser")
  const app = express()
  app.use(bodyParser.json())
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`))
  app.use(bodyParser.json())
  app.get("/:pk/:actionname", run)
  app.post("/:pk/:actionname", run)
}}