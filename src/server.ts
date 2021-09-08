/*
 * The entry file of the app's web server.
 *
 * The server is designed to run locally for development.
 * I haven't found a tool that works like serverless-offline but doesn't require serverless,
 * so this server duplicates the Lambda function.
 */

import express from 'express'
import serveMainPage from './main_page'

const app = express()
const port = Number(process.env.PORT || 8080)

app.get('/', (req, res) => {
  res.send(serveMainPage(req.ip))
})

app.listen(port, () => {
  console.log(`Serving the app on port ${port}`)
})
