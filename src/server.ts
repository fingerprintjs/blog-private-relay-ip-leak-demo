/*
 * The entry file of the app's web server
 */

import express from 'express'
import serveMainPage from './main_page'

const app = express()
const port = 8080

app.get('/', (req, res) => {
  res.send(serveMainPage(req.ip))
})

app.listen(port, () => {
  console.log(`Serving the app on port ${port}`)
})
