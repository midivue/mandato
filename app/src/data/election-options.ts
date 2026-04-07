import dkLogo from '@/assets/parties/dk.jpg'
import fideszLogo from '@/assets/parties/fidesz-kdnp.jpg'
import miHazankLogo from '@/assets/parties/mi-hazank.jpg'
import mkkpLogo from '@/assets/parties/mkkp.jpg'
import tiszaLogo from '@/assets/parties/tisza.jpg'

import dobrevPortrait from '@/assets/pm/dobrev-klara.jpg'
import magyarPortrait from '@/assets/pm/magyar-peter.jpg'
import nagyPortrait from '@/assets/pm/nagy-david.jpg'
import orbanPortrait from '@/assets/pm/orban-viktor.jpg'
import toroczkaiPortrait from '@/assets/pm/toroczkai-laszlo.jpg'

export type PartyId = 'mkkp' | 'tisza' | 'mi_hazank' | 'dk' | 'fidesz_kdnp'

export type PartyOption = {
  id: PartyId
  ballotNumber: number
  shortName: string
  fullName: string
  logoSrc: string
  topFiveCandidates: string[]
}

export type PrimeMinisterOption = {
  id: PartyId
  candidateName: string
  partyShortName: string
  portraitSrc: string
}

// Source: docs/data/valasztashu/partlistak_20260327.csv
// + first candidate (Sorszám=1) from each party list CSV.
export const PARTY_OPTIONS: PartyOption[] = [
  {
    id: 'mkkp',
    ballotNumber: 1,
    shortName: 'MKKP',
    fullName: 'Magyar Kétfarkú Kutya Párt',
    logoSrc: mkkpLogo,
    topFiveCandidates: [
      'Nagy Dávid',
      'Dr. Neulinger Ágnes',
      'Sándor Balázs',
      'Szin Richárd',
      'Dr. Pásztor Eszter',
    ],
  },
  {
    id: 'tisza',
    ballotNumber: 2,
    shortName: 'TISZA',
    fullName: 'Tisztelet és Szabadság Párt',
    logoSrc: tiszaLogo,
    topFiveCandidates: [
      'Magyar Péter',
      'Rost Andrea',
      'Gajdos László',
      'Forsthoffer Ágnes',
      'Kapitány István',
    ],
  },
  {
    id: 'mi_hazank',
    ballotNumber: 3,
    shortName: 'Mi Hazánk',
    fullName: 'Mi Hazánk Mozgalom',
    logoSrc: miHazankLogo,
    topFiveCandidates: [
      'Toroczkai László',
      'Dúró Dóra',
      'Dr. Apáti István',
      'Novák Előd',
      'Dr. Borvendég Zsuzsanna',
    ],
  },
  {
    id: 'dk',
    ballotNumber: 4,
    shortName: 'DK',
    fullName: 'Demokratikus Koalíció',
    logoSrc: dkLogo,
    topFiveCandidates: [
      'Dobrev Klára',
      'Dr. Molnár Csaba',
      'Kálmán Olga',
      'Rónai Sándor',
      'Varju László',
    ],
  },
  {
    id: 'fidesz_kdnp',
    ballotNumber: 5,
    shortName: 'FIDESZ-KDNP',
    fullName: 'FIDESZ - Magyar Polgári Szövetség, Kereszténydemokrata Néppárt',
    logoSrc: fideszLogo,
    topFiveCandidates: [
      'Orbán Viktor',
      'Dr. Semjén Zsolt',
      'Kövér László',
      'Gál Kinga',
      'Szentkirályi Alexandra',
    ],
  },
]

export const PARTY_SHORT: Record<string, string> = Object.fromEntries(
  PARTY_OPTIONS.map((p) => [p.id, p.shortName]),
)

export const PRIME_MINISTER_OPTIONS: PrimeMinisterOption[] = [
  {
    id: 'mkkp',
    candidateName: 'Nagy Dávid',
    partyShortName: 'MKKP',
    portraitSrc: nagyPortrait,
  },
  {
    id: 'tisza',
    candidateName: 'Magyar Péter',
    partyShortName: 'TISZA',
    portraitSrc: magyarPortrait,
  },
  {
    id: 'mi_hazank',
    candidateName: 'Toroczkai László',
    partyShortName: 'Mi Hazánk',
    portraitSrc: toroczkaiPortrait,
  },
  {
    id: 'dk',
    candidateName: 'Dobrev Klára',
    partyShortName: 'DK',
    portraitSrc: dobrevPortrait,
  },
  {
    id: 'fidesz_kdnp',
    candidateName: 'Orbán Viktor',
    partyShortName: 'FIDESZ-KDNP',
    portraitSrc: orbanPortrait,
  },
]
