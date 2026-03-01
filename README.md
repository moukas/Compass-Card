# Compass Card

Compass Card is a Home Assistant Lovelace card that visualizes wind direction and wind speed on a graphical compass, with optional sun position, Czech direction labels, a built-in visual editor, and light/dark theme support.

Karta je napsana jako cisty JavaScript bez buildu. Do Home Assistantu ji staci nahrat jako soubor `compass-card.js` a pridat jako Lovelace resource.

Obsahuje i vizualni editor konfigurace pro Lovelace a automaticky motiv pro svetly i tmavy rezim podle aktivniho color scheme.

## Funkce

- graficky kompas se sipkou smeru vetru
- zkratka smeru a rychlost vetru uprostred karty
- ceske i anglicke znaceni smeru vetru
- volitelna poloha slunce podle `sun.sun.attributes.azimuth`
- animace vychodu, zapadu a denni faze slunce
- Lovelace visual editor
- standalone preview stranka `preview.html`
- GitHub Pages preview v `docs/index.html`
- automaticky svetly a tmavy motiv

## HACS Popis

Doporuceny kratky popis pro GitHub repository description a HACS listing:

> A Home Assistant Lovelace compass card for wind direction, wind speed, and optional sun position.

GitHub topics doporucene pro verejny HACS repo:

- `home-assistant`
- `hacs`
- `lovelace`
- `lovelace-card`
- `custom-card`
- `weather`
- `wind`

Presnejsi metadata pro remote repozitar jsou v [`REPOSITORY_METADATA.md`](./REPOSITORY_METADATA.md).

## Instalace

### Manualne

1. Zkopiruj [`compass-card.js`](./compass-card.js) do `config/www/compass-card.js`.
2. V Home Assistantu pridej dashboard resource:

```yaml
url: /local/compass-card.js
type: module
```

3. Pouzij kartu v dashboardu.

### Preview a GitHub Pages

Repo obsahuje i standalone preview:

- lokalni zdroj: [`preview.html`](./preview.html)
- GitHub Pages zdroj: [`docs/index.html`](./docs/index.html)
- samostatna preview stranka v Pages: [`docs/preview.html`](./docs/preview.html)

Pro GitHub Pages nastav v repozitari source na branch `master` a slozku `/docs`.

### HACS

Repo obsahuje `hacs.json`, takze jej lze pridat jako HACS custom repository typu `Dashboard`.

1. Otevri `HACS`.
2. Vpravo nahore otevri menu `...` a zvol `Custom repositories`.
3. Pridej URL tohoto repozitare, napr. `https://github.com/moukas/Compass-Card`.
4. Jako typ zvol `Dashboard`.
5. Otevri repozitar v HACS a klikni na `Download`.
6. Pokud HACS neprida resource automaticky, pridej jej rucne.

Typicka HACS resource cesta vypada takto:

```yaml
url: /hacsfiles/<repo-name>/compass-card.js
type: module
```

Upozorneni:

- HACS podle oficialni dokumentace uklada dashboard prvky do `www/community/` a servíruje je pres `/hacsfiles/`.
- Pokud repozitar lokalne upravis po HACS instalaci, muze byt potreba obnovit browser cache.
- Pokud HACS vytvori i `.gz` variantu souboru, `/hacsfiles/` ji muze servirovat automaticky.
- `hide_default_branch: true` v `hacs.json` zajisti, ze HACS bude preferovat vydane verze z GitHub Releases misto default branch.

Oficialni HACS dokumentace:

- https://www.hacs.xyz/docs/faq/custom_repositories/
- https://hacs.xyz/docs/use/repositories/type/dashboard/
- https://www.hacs.xyz/docs/use/repositories/dashboard/

### Verzovani pro HACS

Repo je pripraveny na verzovani pres GitHub Releases:

- `.github/workflows/validate.yaml` spousti oficialni HACS validaci.
- `.github/workflows/release.yaml` vytvori GitHub Release pri pushi tagu ve tvaru `v*.*.*`.
- `hacs.json` ma zapnute `hide_default_branch`, takze nove verze maji jit ven pres release tagy.

Doporuceny release flow:

1. Zvys verzi v releasovacim procesu podle semantic versioning, napr. `v1.0.0`.
2. Pushni git tag na GitHub.
3. GitHub Actions vytvori Release.
4. HACS pak nabidne novou verzi jako update.

Priklad:

```bash
git tag v0.1.0
git push origin master
git push origin v0.1.0
git push remote master
git push remote v0.1.0
```

Poznamka:

- HACS zobrazuje kratky popis z GitHub repository description, ne z `hacs.json`.
- Po prvnim pushi na GitHub je vhodne nastavit description a topics podle [`REPOSITORY_METADATA.md`](./REPOSITORY_METADATA.md).

Oficialni zdroje k verzi a validaci:

- https://hacs.xyz/docs/publish/action/
- https://www.hacs.xyz/docs/publish/include/
- https://www.hacs.xyz/docs/use/entities/update/

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
- Ve svetlem rezimu karta prepne na svetly motiv, v tmavem rezimu zustane tmavy motiv.

## Otestovano

Karta byla nasazena a otestovana na testovaci Home Assistant instanci:

- resource: `/local/compass-card.js`
- dashboard: `dashboard-pokus`
- testovaci entity: `sensor.compass_test_wind_direction`, `sensor.compass_test_wind_speed`
- slunce: `sun.sun` s atributem `azimuth`
