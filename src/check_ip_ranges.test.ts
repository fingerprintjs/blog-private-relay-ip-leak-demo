import { isIpInRanges, parseIpRanges } from './check_ip_ranges'

describe('Check IP ranges', () => {
  async function* generateRawIpRanges() {
    yield '172.224.247.34/32'
    yield '2a04:4e41:002f:006f::'
    yield '146.75.155.12'
    yield '172.224.240.0/28'
    yield '::ffff:104.28.38.184/120'
    await new Promise((resolve) => setTimeout(resolve, 1))
    yield 'not an ip range'
    yield '2606:54c0:27e0:1ca0::/72'
  }

  it('parses IP ranges', async () => {
    const ranges = await parseIpRanges(generateRawIpRanges())

    expect(ranges).toEqual({
      v4: [
        { startIp: 0x681c26b8n, subnetBits: 8 }, // ::ffff:104.28.38.184/120
        { startIp: 0x924b9b0cn, subnetBits: 0 }, // 146.75.155.12
        { startIp: 0xace0f000n, subnetBits: 4 }, // 172.224.240.0/28
        { startIp: 0xace0f722n, subnetBits: 0 }, // 172.224.247.34/32
      ],
      v6: [
        { startIp: 0x260654c027e01ca00000000000000000n, subnetBits: 56 }, // 2606:54c0:27e0:1ca0::/56
        { startIp: 0x2a044e41002f006f0000000000000000n, subnetBits: 0 }, // 2a04:4e41:002f:006f::
      ],
    })
  })

  it('checks if IP is in ranges', async () => {
    const ranges = await parseIpRanges(generateRawIpRanges())

    expect(isIpInRanges(ranges, '172.224.247.33')).toBeFalse()
    expect(isIpInRanges(ranges, '172.224.247.34')).toBeTrue()
    expect(isIpInRanges(ranges, '172.224.247.35')).toBeFalse()
    expect(isIpInRanges(ranges, '172.224.239.255')).toBeFalse()
    expect(isIpInRanges(ranges, '172.224.240.0')).toBeTrue()
    expect(isIpInRanges(ranges, '::ffff:172.224.240.15')).toBeTrue()
    expect(isIpInRanges(ranges, '::ffff:172.224.240.16')).toBeFalse()

    expect(isIpInRanges(ranges, '2a04:4e41:002f:006e:ffff:ffff:ffff:ffff')).toBeFalse()
    expect(isIpInRanges(ranges, '2a04:4e41:002f:006f::0')).toBeTrue()
    expect(isIpInRanges(ranges, '2a04:4e41:002f:006f::1')).toBeFalse()
    expect(isIpInRanges(ranges, '2606:54c0:27e0:1c9f:ffff:ffff:ffff:ffff')).toBeFalse()
    expect(isIpInRanges(ranges, '2606:54c0:27e0:1ca0::')).toBeTrue()
    expect(isIpInRanges(ranges, '2606:54c0:27e0:1ca0:00ff:ffff:ffff:ffff')).toBeTrue()
    expect(isIpInRanges(ranges, '2606:54c0:27e0:1ca0:0100::')).toBeFalse()
  })
})
