export const GLOSSARY = {
  mw: {
    label: "MW",
    text: "Megawatt: a measure of power, how fast electricity is being used or produced at one moment. 1 MW can run roughly several hundred homes at once. 1,000 MW = 1 GW (gigawatt).",
  },
  mwh: {
    label: "MWh",
    text: "Megawatt-hour: a measure of energy, the amount used or produced over time. One MW running for one hour is one MWh. For a one-hour reading, the MWh and MW numbers are the same.",
  },
  twh: {
    label: "TWh",
    text: "Terawatt-hour: one billion kilowatt-hours, or a million MWh. Used for a whole year of grid electricity.",
  },
  baseload: {
    label: "baseload",
    text: "Power plants that run around the clock at a steady level, such as nuclear and some coal and gas plants, to cover the minimum demand the grid always has.",
  },
  capacityFactor: {
    label: "capacity factor",
    text: "How much a plant actually produced compared with the most it could produce if it ran at full output all the time. A solar farm has a lower capacity factor than a nuclear plant because the sun does not shine at night.",
  },
  peakDemand: {
    label: "peak demand",
    text: "The highest level of electricity use in a period, such as a day or a year. Grids must be built to meet it.",
  },
  netLoad: {
    label: "net load",
    text: "Demand minus wind and solar output: the amount of electricity that other power sources, such as gas plants and batteries, still have to supply.",
  },
  duckCurve: {
    label: "duck curve",
    text: "The shape of net load over a day when solar is large: it dips at midday as solar peaks, then climbs steeply in the evening as the sun sets while people are still using power.",
  },
  ercot: {
    label: "ERCOT",
    text: "The Electric Reliability Council of Texas, which runs the grid covering most of Texas. A few parts of the state, such as El Paso, are on other grids.",
  },
} as const;

export type GlossaryKey = keyof typeof GLOSSARY;
