import { escapeHtml, humanizeIp } from './utils'
import { isIpInRanges } from './check_ip_ranges'
import privateRelayEgressIpRanges from './private_relay_ips'

/**
 * A framework-agnostic implementation of the main page endpoint.
 * It can be used with Express, AWS Lambda, Serverless or something else.
 */
export default function serveMainPage(requestIp: string): string {
  return makePageHtml(humanizeIp(requestIp), isIpInRanges(privateRelayEgressIpRanges, requestIp))
}

function makePageHtml(ip: string, isPrivateRelay: boolean): string {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <title>iCloud Private Relay IP leak demo</title>
  </head>
  <body>
    <div>Your public IP: ${escapeHtml(ip)}</div>
    <div>Your leaking IP: <span id="leakingIP">...</span></div>
    <div>iCloud Private Relay is most likely ${isPrivateRelay ? 'enabled' : 'disabled'}</div>
    <script>
      function printOutput(data) {
        document.getElementById('leakingIP').textContent = data
      }

      try {
        const peerConnection = new RTCPeerConnection({
          iceServers: [{
            urls: 'stun:stun.l.google.com:19302'
          }]
        })

        const ips = []

        function isSTUNCandidate(candidate) {
          return candidate.includes(' typ srflx ')
        }

        function parseIP(candidate) {
          return candidate.split(' ', 5)[4]
        }

        peerConnection.onicecandidate = event => {
          if (event.candidate) {
            const candidateString = event.candidate.candidate
            if (isSTUNCandidate(candidateString)) {
              ips.push(parseIP(candidateString))
            }
          } else {
            // There will be no other ICE candidates
            printOutput(ips.join(', '))
          }
        }

        peerConnection.createDataChannel('')

        peerConnection.createOffer().then(description => {
          peerConnection.setLocalDescription(description)
        })
      } catch (error) {
        printOutput('(browser not supported)')
        throw error
      }
    </script>
  </body>
</html>`
}
