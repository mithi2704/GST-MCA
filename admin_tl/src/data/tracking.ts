export interface TrackingRow {
  employeeId: string
  name: string
  checkIn: string
  checkOut: string
  location: string
  workingHours: string
}

export const trackingRows: TrackingRow[] = []

export interface GeoRecord {
  time: string
  location: string
  coords: string
}

export const geoRecords: GeoRecord[] = []
