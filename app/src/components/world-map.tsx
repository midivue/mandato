import { useState, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { geoNaturalEarth1, geoPath } from 'd3-geo'
import { feature } from 'topojson-client'
import type { Topology } from 'topojson-specification'
import type { FeatureCollection } from 'geojson'

import { COUNTRIES } from '@/data/countries'
import { ISO_NUM_TO_ALPHA2 } from '@/data/iso-country-map'
import { MAP_COLOR_SCALE, getMapColor } from '@/lib/map-utils'
import worldTopo from '@/data/world-110m.json'

const W = 640
const H = 320

const worldFeatures = (
  feature(
    worldTopo as unknown as Topology,
    (worldTopo as unknown as Topology).objects.countries,
  ) as FeatureCollection
).features

const projection = geoNaturalEarth1()
  .scale(135)
  .translate([W / 2, H / 2 + 10])
const pathGen = geoPath(projection)

const COUNTRY_NAME = new Map(
  COUNTRIES.map((c) => [c.code, { en: c.nameEn, hu: c.nameHu }]),
)

type WorldMapProps = {
  countryVotes: Record<string, number>
}

export function WorldMap({ countryVotes }: WorldMapProps) {
  const { i18n, t } = useTranslation()
  const isHu = i18n.language === 'hu'
  const [hovered, setHovered] = useState<{ alpha2: string; x: number; y: number } | null>(null)

  const maxVotes = useMemo(
    () => Math.max(1, ...Object.values(countryVotes)),
    [countryVotes],
  )

  const handleMouse = useCallback(
    (alpha2: string, e: React.MouseEvent) => {
      const rect = (e.currentTarget as SVGElement).closest('svg')!.getBoundingClientRect()
      setHovered({ alpha2, x: e.clientX - rect.left, y: e.clientY - rect.top })
    },
    [],
  )

  const handleLeave = useCallback(() => setHovered(null), [])

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        <defs>
          <clipPath id="world-clip">
            <rect x="0" y="0" width={W} height={H} />
          </clipPath>
        </defs>
        <g clipPath="url(#world-clip)">
          {worldFeatures.map((f, idx) => {
            const alpha2 = ISO_NUM_TO_ALPHA2[String(f.id)] ?? ''
            const d = pathGen(f)
            if (!d) return null
            const votes = countryVotes[alpha2] ?? 0
            const isHU = alpha2 === 'HU'
            return (
              <path
                key={f.id != null ? String(f.id) : `_${idx}`}
                d={d}
                fill={isHU ? '#fef3c7' : getMapColor(votes, maxVotes)}
                stroke={isHU ? '#d97706' : '#e4e4e7'}
                strokeWidth={isHU ? 1.2 : 0.3}
                className="cursor-pointer transition-opacity duration-150 hover:opacity-80"
                onMouseEnter={(e) => handleMouse(alpha2, e)}
                onMouseMove={(e) => handleMouse(alpha2, e)}
                onMouseLeave={handleLeave}
              />
            )
          })}
        </g>
      </svg>

      {hovered && (
        <div
          className="pointer-events-none absolute z-10 rounded-lg border border-zinc-200 bg-white px-3 py-2 shadow-md"
          style={{ left: hovered.x + 12, top: hovered.y - 40 }}
        >
          <p className="text-xs font-semibold text-zinc-900">
            {(() => {
              const n = COUNTRY_NAME.get(hovered.alpha2)
              return n ? (isHu ? n.hu : n.en) : hovered.alpha2
            })()}
          </p>
          <p className="text-xs tabular-nums text-zinc-500">
            {countryVotes[hovered.alpha2] ?? 0} {t('stats.geoVotes')}
          </p>
        </div>
      )}

      <div className="mt-3 flex items-center justify-center gap-1.5">
        <span className="text-[10px] text-zinc-400">0</span>
        {MAP_COLOR_SCALE.map((color, i) => (
          <div key={i} className="h-2.5 w-5 rounded-sm" style={{ backgroundColor: color }} />
        ))}
        <span className="text-[10px] text-zinc-400">{maxVotes}</span>
      </div>
    </div>
  )
}
