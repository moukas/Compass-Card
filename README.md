# Compass Card

Graficka custom karta pro Home Assistant, ktera zobrazuje:

- sipku se smerem vetru
- zkratku smeru uprostred kompasu
- rychlost vetru uprostred kompasu

Karta je napsana jako cisty JavaScript bez buildu. Do Home Assistantu ji staci nahrat jako soubor `compass-card.js` a pridat jako Lovelace resource.

Obsahuje i vizualni editor konfigurace pro Lovelace.

## Instalace

### Manualne

1. Zkopiruj [`compass-card.js`](./compass-card.js) do `config/www/compass-card.js`.
2. V Home Assistantu pridej resource:

```yaml
url: /local/compass-card.js
type: module
```

3. Pouzij kartu v dashboardu.

### HACS

Repo obsahuje `hacs.json`, takze jej lze pridat i jako custom repository.

## Konfigurace

```yaml
type: custom:compass-card
title: Vitr
direction_entity: sensor.wind_direction
speed_entity: sensor.wind_speed
direction_language: cs
show_sun: true
sun_entity: sun.sun
sun_attribute: azimuth
speed_unit: km/h
speed_decimals: 1
degree_decimals: 0
show_degrees: true
```

## Parametry

- `direction_entity`: entita se smerem vetru. Podporuje stupne i textove hodnoty jako `N`, `SW`, `Severovychod`.
- `speed_entity`: entita s rychlosti vetru.
- `direction_language`: jazyk zkratek smeru. Podporuje `en` a `cs`.
- `show_sun`: zobrazi polohu slunce na obvodu kompasu.
- `sun_entity`: entita pro polohu slunce. Vychozi je `sun.sun`.
- `sun_attribute`: atribut se stupni azimutu. Vychozi je `azimuth`.
- `title`: volitelny nadpis.
- `speed_unit`: volitelne prepsani jednotky rychlosti.
- `speed_decimals`: pocet desetinnych mist pro rychlost.
- `degree_decimals`: pocet desetinnych mist pro stupne.
- `show_degrees`: zobrazi uprostred i prepocitany uhel.

## Poznamky

- Pokud je smer numeric, karta zobrazi i odpovidajici 16bodovou svetovou zkratku (`N`, `NNE`, `NE` ...).
- Pri `direction_language: cs` karta zobrazi ceske zkratky (`S`, `SV`, `V`, `JZ` ...).
- Pokud je smer textovy, karta se jej pokusi namapovat na uhel, aby se sipka otacela spravne.
- Pri zapnutem `show_sun` karta vykresli samostatny indikator slunce podle azimutu.
- Pokud `sun.sun` poskytuje `elevation` a `rising`, karta prida vyraznejsi animaci pro vychod a zapad slunce.
- Pri `unavailable` nebo `unknown` stavu karta zustane renderovana a zobrazi, ze chybi data.
