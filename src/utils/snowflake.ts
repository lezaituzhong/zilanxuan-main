export class SnowflakeId {
  private twepoch = 1288834974657n // Twitter Epoch (Nov 04 2010 01:42:54 UTC)
  
  private workerIdBits = 5n
  private dataCenterIdBits = 5n
  private maxWorkerId = -1n ^ (-1n << this.workerIdBits)
  private maxDataCenterId = -1n ^ (-1n << this.dataCenterIdBits)
  private sequenceBits = 12n

  private workerIdShift = this.sequenceBits
  private dataCenterIdShift = this.sequenceBits + this.workerIdBits
  private timestampLeftShift = this.sequenceBits + this.workerIdBits + this.dataCenterIdBits
  private sequenceMask = -1n ^ (-1n << this.sequenceBits)

  private lastTimestamp = -1n
  private workerId: bigint
  private dataCenterId: bigint
  private sequence = 0n

  constructor(workerId: number, dataCenterId: number) {
    const workerIdBig = BigInt(workerId)
    const dataCenterIdBig = BigInt(dataCenterId)

    if (workerIdBig > this.maxWorkerId || workerIdBig < 0n) {
      throw new Error(`Worker ID can't be greater than ${this.maxWorkerId} or less than 0`)
    }
    if (dataCenterIdBig > this.maxDataCenterId || dataCenterIdBig < 0n) {
      throw new Error(`Data Center ID can't be greater than ${this.maxDataCenterId} or less than 0`)
    }

    this.workerId = workerIdBig
    this.dataCenterId = dataCenterIdBig
  }

  public nextId(): string {
    let timestamp = this.timeGen()

    if (timestamp < this.lastTimestamp) {
      throw new Error(`Clock moved backwards. Refusing to generate id for ${this.lastTimestamp - timestamp} milliseconds`)
    }

    if (this.lastTimestamp === timestamp) {
      this.sequence = (this.sequence + 1n) & this.sequenceMask
      if (this.sequence === 0n) {
        timestamp = this.tilNextMillis(this.lastTimestamp)
      }
    } else {
      this.sequence = 0n
    }

    this.lastTimestamp = timestamp

    const id = ((timestamp - this.twepoch) << this.timestampLeftShift) |
               (this.dataCenterId << this.dataCenterIdShift) |
               (this.workerId << this.workerIdShift) |
               this.sequence

    return id.toString()
  }

  private tilNextMillis(lastTimestamp: bigint): bigint {
    let timestamp = this.timeGen()
    while (timestamp <= lastTimestamp) {
      timestamp = this.timeGen()
    }
    return timestamp
  }

  private timeGen(): bigint {
    return BigInt(Date.now())
  }
}
