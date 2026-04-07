import { useMemo } from 'react'
import { EUROPEAN_ALPHA2 } from '@/data/iso-country-map'
import type { StatsResponse } from '@mandatoto/shared/types'
import { zipToCounty, zipToDistrict, ZIP_TO_SETTLEMENT } from './stats-utils'

export function useGeoAggregates(stats: StatsResponse) {
  return useMemo(() => {
    const countyVotes: Record<number, number> = {}
    const cityCounts: Record<string, number> = {}
    const districtVotes: Record<number, number> = {}
    let domesticTotal = 0

    for (const [zip, count] of Object.entries(stats.geoBreakdown.byZip)) {
      const countyId = zipToCounty(zip)
      if (countyId !== undefined) countyVotes[countyId] = (countyVotes[countyId] ?? 0) + count
      const district = zipToDistrict(zip)
      if (district !== undefined) {
        districtVotes[district] = (districtVotes[district] ?? 0) + count
        cityCounts['Budapest'] = (cityCounts['Budapest'] ?? 0) + count
      } else {
        const name = ZIP_TO_SETTLEMENT.get(zip)
        if (name) cityCounts[name] = (cityCounts[name] ?? 0) + count
      }
      domesticTotal += count
    }
    domesticTotal += stats.geoBreakdown.noSettlement

    const budapestVotes = countyVotes[1] ?? 0
    const countrysideVotes = domesticTotal - budapestVotes

    const countryVotes = stats.geoBreakdown.byCountry ?? {}
    let euVotes = 0
    for (const [code, count] of Object.entries(countryVotes)) {
      if (EUROPEAN_ALPHA2.has(code)) euVotes += count
    }

    return { countyVotes, cityCounts, districtVotes, domesticTotal, budapestVotes, countrysideVotes, euVotes, countryVotes }
  }, [stats.geoBreakdown])
}
