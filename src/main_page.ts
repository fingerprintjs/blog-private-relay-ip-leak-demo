import { escapeHtml, humanizeIp } from './utils'
import { isIpInRanges } from './check_ip_ranges'
import privateRelayEgressIpRanges from './private_relay_ips'

interface Page {
  body: string
  headers: Record<string, string>
}

/**
 * A framework-agnostic implementation of the main page endpoint.
 * It can be used with Express, AWS Lambda, Serverless or something else.
 */
export default function serveMainPage(requestIp: string): Page {
  return {
    body: makePageHtml(humanizeIp(requestIp), isIpInRanges(privateRelayEgressIpRanges, requestIp)),
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  }
}

function makePageHtml(ip: string, isPrivateRelay: boolean): string {
  const bigIpMaxLength = 15
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <title>iCloud Private Relay IP leak demo</title>
    <link href="https://fonts.googleapis.com/css2?family=Work+Sans:wght@500&family=Fira+Mono:wght@700" rel="stylesheet" />
    <style>
      html, body {
        padding: 0;
        margin: 0;
      }
      body {
        min-width: 100vw;
        min-height: 100vh;
        display: flex;
        justify-content: center;
        align-items: center;
        color: #0D102B;
        font-family: 'Work Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell,
          'Open Sans', 'Helvetica Neue', sans-serif;
        font-size: 0.875rem;
        font-weight: 500;
        line-height: 1.4;
        box-sizing: border-box;
        padding: 0 20px; /* Matches the website layout */
      }
      main {
        max-width: 100%;
      }
      section {
        background: #fff;
        border-radius: 1rem;
        box-shadow: 0 0.5rem 2rem rgba(13, 16, 43, 0.1);
        padding: 1.5rem;
        margin-bottom: 1rem;
      }
      .header {
        letter-spacing: 0.03em;
        text-transform: uppercase;
        color: rgba(13, 16, 43, 0.72);
        margin-bottom: 0.2rem;
      }
      .ip {
        font-family: Fira Mono, monospace;
        font-weight: bold;
        font-size: 2rem;
        letter-spacing: -0.01em;
        line-height: 1.3;
        white-space: pre-line;
      }
      .ip.compact {
        font-size: 1em;
      }
      .status {
        letter-spacing: 0.03em;
        text-transform: uppercase;
        color: rgba(13, 16, 43, 0.72);
        margin-top: 1rem;
        padding-top: 1rem;
        border-top: 1px solid #E3E3ED;
        display: flex;
        align-items: center;
      }
      .status .icon {
        flex: none;
        width: 0.625rem;
        height: 0.625rem;
        border-radius: 100%;
        background: #E0E0E0;
        margin-right: 0.5rem;
      }
      .status .icon.on {
        background: #FF5D22;
      }
      @media (max-width: 500px), (max-height: 340px) {
        html {
          font-size: 12px;
        }
      }
    </style>
  </head>
  <body>
    <main>
      <section>
        <div class="header">Your public IP</div>
        <div class="ip ${ip.length > bigIpMaxLength ? 'compact' : ''}">${escapeHtml(ip)}</div>
        <div class="status">
          <div class="icon ${isPrivateRelay ? 'on' : ''}"></div>
          iCloud Private Relay ${isPrivateRelay ? 'enabled' : 'switched&nbsp;off'}
        </div>
      </section>
      <section>
        <div class="header" id="leakingIpHeader">Your leaking IP</div>
        <div class="ip" id="leakingIp">...</div>
      </section>
    </main>
    <script>
      function printOutput(data) {
        const output = document.getElementById('leakingIp')
        output.textContent = data.join(',\\n')
        output.classList.toggle('compact', data.length > 1 || Math.max(...data.map(l => l.length)) > ${bigIpMaxLength})

        const outputHeader = document.getElementById('leakingIpHeader')
        outputHeader.textContent = outputHeader.textContent.replace(/ips?/i, data.length > 1 ? 'IPs' : 'IP')
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
            printOutput(ips)
          }
        }

        peerConnection.createDataChannel('')

        peerConnection.createOffer().then(description => {
          peerConnection.setLocalDescription(description)
        })
      } catch (error) {
        printOutput(['(browser not supported)'])
        throw error
      }
    </script>
  </body>
</html>`
}
