/*
 * A CLI script for downloading iCloud Private Relay egress IP ranges
 */

import * as readline from 'readline'
import * as path from 'path'
import { promises as fsAsync } from 'fs'
import got from 'got'
import { IPRange, IPRangeCache, parseIpRanges } from './check_ip_ranges'

const isCI = !!process.env.CI

async function* getRawIps(ipListUrl: string) {
  const clearProgress = () => {
    if (!isCI) {
      process.stdout.clearLine(0)
      process.stdout.cursorTo(0)
    }
  }
  const printProgress = (progress: number) => {
    if (!isCI) {
      clearProgress()
      process.stdout.write(`Downloading IP ranges: ${(progress * 100).toFixed(1)}%`)
    }
  }

  printProgress(0)

  const stream = got.stream(ipListUrl)
  stream.on('downloadProgress', (progress) => printProgress(progress.percent))

  const reader = readline.createInterface({
    input: stream,
    crlfDelay: Infinity,
  })
  for await (const line of reader) {
    const rawIpRange = line.split(',', 1)[0]
    yield rawIpRange
  }

  clearProgress()
}

function getIpRanges(ipListUrl: string) {
  return parseIpRanges(getRawIps(ipListUrl))
}

async function outputIpRanges(ipRanges: IPRangeCache, filePath: string) {
  const stringifyIpRange = ({ startIp, subnetBits }: IPRange) =>
    `{ startIp: 0x${startIp.toString(16)}n, subnetBits: ${subnetBits} }`

  const stringifyIpRanges = (ipRanges: IPRange[]) =>
    `[\n${ipRanges.map((ipRange) => `    ${stringifyIpRange(ipRange)},`).join('\n')}\n  ]`

  await fsAsync.writeFile(
    filePath,
    `import { IPRangeCache } from './check_ip_ranges'

const privateRelayEgressIpRanges: IPRangeCache = {
${Object.entries(ipRanges)
  .map(([key, value]) => `  ${key}: ${stringifyIpRanges(value)},`)
  .join('\n')}
}

export default privateRelayEgressIpRanges
`,
  )
}

getIpRanges('https://mask-api.icloud.com/egress-ip-ranges.csv').then((ipRanges) =>
  outputIpRanges(ipRanges, path.join(__dirname, 'private_relay_ips.ts')),
)
