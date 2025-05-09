# Lovelace Card : EasyCare for Waterair [@yyrkoon94](https://www.github.com/yyrkoon94)

[![hacs_badge](https://img.shields.io/badge/HACS-Custom-41BDF5.svg)](https://github.com/hacs/integration)
[![release][release-badge]][release-url]

<a href="https://www.buymeacoffee.com/yyrkoon94" target="_blank"><img src="https://www.buymeacoffee.com/assets/img/custom_images/white_img.png" alt="Buy Me A Coffee" style="height: auto !important;width: auto !important;" ></a>

A [Home Assistant][home-assistant] Lovelace Card to display Waterair Pool with EasyCare connection.

This Card needs the Custom Component [EasyCare for Waterair][ha-easycare-waterair] to be installed first.

![Screenshot](https://raw.githubusercontent.com/yyrkoon94/lovelace-easycare-waterair/master/screenshot4.png)
![Screenshot](https://raw.githubusercontent.com/yyrkoon94/lovelace-easycare-waterair/master/screenshot3.png)

## Installation

The simplest way to install this card is to add this repository to HACS. If you wish to install it manually, you may follow the instructions below.

### Upload to HA

Download source code zip file file from the [latest-release][release-url].
Put the contains of the 'dist' repository into your `config/www` in a folder named `community/lovelace-easycare-waterair`.

### Add the custom to Lovelace resources
Add reference to `idf-mobilite.js` in Dashboard :
    _Settings_ → _Dashboards_ → _More Options icon_ → _Resources_ → _Add Resource_ → Set _Url_ as `/local/community/lovelace-easycare-waterair/easycare-waterair.js` → Set _Resource type_ as `JavaScript Module`.
      **Note:** If you do not see the Resources menu, you will need to enable _Advanced Mode_ in your _User Profile_

## Usage
The Lovelace Card come with a custom Card Editor to configure the card. If you don't see it, you must create first a custom card to have the editor in the **Add Card** list. So just create a **Custom Card** and add the folowing code :
```
type: custom:easy-care-card
```

Then clic on the code editor, you will see this page :
![Screenshot](https://raw.githubusercontent.com/yyrkoon94/lovelace-easycare-waterair/master/cardeditor1.png)

Just fill the Entities and you will see the different part of the Card appears.

You can choose different options :
- Small card display : display a small version of the card
- Use transparent display : display the card in "transparent" color
- Display background image : display the pool background image

If you want to do it manually (or if the Card Editor doesn't work), you can use this template :
```
type: custom:easy-care-card
poolConnectionEntity: binary_sensor.easy_care_connection
```

<!-- Badges -->
[release-badge]: https://img.shields.io/github/v/release/yyrkoon94/lovelace-easycare-waterair?style=flat-square
[downloads-badge]: https://img.shields.io/github/downloads/yyrkoon94/lovelace-easycare-waterair/total?style=flat-square

<!-- References -->
[home-assistant]: https://www.home-assistant.io/
[home-assitant-theme-docs]: https://www.home-assistant.io/integrations/frontend/#defining-themes
[hacs]: https://hacs.xyz
[release-url]: https://github.com/yyrkoon94/lovelace-easycare-waterair/releases
[ha-easycare-waterair]: https://github.com/yyrkoon94/ha-easycare-waterair

