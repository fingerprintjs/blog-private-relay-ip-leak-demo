/*
 * The entry file for the app's Lambda functions
 */

import { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import serveMainPage from './main_page'

/**
 * The function to handle HTTP requests
 */
export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  if (event.requestContext.http.method !== 'GET') {
    return {
      statusCode: 405,
      body: 'Method not supported',
    }
  }
  return {
    statusCode: 200,
    ...serveMainPage(event.requestContext.http.sourceIp),
  }
}
