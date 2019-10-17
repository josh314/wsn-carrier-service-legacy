// List of lists: each element is the tuple [ *state postal code*, *rate zone*]
const stateZonesList: Array<[string, number]> = [
  [ "AL", 0 ],
  // [ "AK", 2 ],
  [ "AZ", 1 ],
  [ "AR", 1 ],
  [ "CA", 1 ],
  [ "CO", 1 ],
  [ "CT", 0 ],
  [ "DE", 0 ],
  [ "DC", 0 ],
  [ "FL", 0 ],
  [ "GA", 0 ],
  // [ "HI", 0 ],
  [ "ID", 1 ],
  [ "IL", 0 ],
  [ "IN", 0 ],
  [ "IA", 1 ],
  [ "KS", 1 ],
  [ "KY", 0 ],
  [ "LA", 1 ],
  [ "ME", 0 ],
  [ "MD", 0 ],
  [ "MA", 0 ],
  [ "MI", 0 ],
  [ "MN", 1 ],
  [ "MS", 0 ],
  [ "MO", 1 ],
  [ "MT", 1 ],
  [ "NE", 1 ],
  [ "NV", 1 ],
  [ "NH", 0 ],
  [ "NJ", 0 ],
  [ "NM", 1 ],
  [ "NY", 0 ],
  [ "NC", 0 ],
  [ "ND", 1 ],
  [ "OH", 0 ],
  [ "OK", 1 ],
  [ "OR", 1 ],
  [ "PA", 0 ],
  [ "RI", 0 ],
  [ "SC", 0 ],
  [ "SD", 1 ],
  [ "TN", 0 ],
  [ "TX", 1 ],
  [ "UT", 1 ],
  [ "VT", 0 ],
  [ "VA", 0 ],
  [ "WA", 1 ],
  [ "WV", 0 ],
  [ "WI", 0 ],
  [ "WY", 1 ],
];

// stateZones.get( *state postal code* ) returns *rate zone*
const stateZones: Map<string, number> = new Map(stateZonesList);

interface ZoneRate {
  boxLot: number,
  palletBreakdown: number,
  palletFreight: [ number, number, number, number, number ],
}
const zoneRates: Array<ZoneRate> = [
  {
    boxLot: 30,
    palletBreakdown: 180,
    palletFreight: [ 260, 340, 400, 440, 480 ]
  },
  {
    boxLot: 30,
    palletBreakdown: 180,
    palletFreight: [ 360, 440, 500, 540, 580 ]
  },
];

/****************************************************
 * Exported rate functions
 * 
 ***************************************************/

export function getBoxRate(state: string, numberOfLots: number): number {
  return (numberOfLots > 0) ? zoneRates[stateZones.get(state)].boxLot : 0;
}

export function getPalletBreakdownRate(state: string, numberOfLots: number): number {
  return zoneRates[stateZones.get(state)].palletBreakdown * numberOfLots;
}

export function getPalletFreightRate(state: string, numberOfLots: number): number {
  if(numberOfLots <= 0) {
    return 0;
  }

  const zone: ZoneRate = zoneRates[stateZones.get(state)];

  const idx = Math.min( numberOfLots , zone.palletFreight.length ) - 1;// Don't forget the -1!

  return zone.palletFreight[ idx ];
}
