import {
  LitElement,
  html,
} from "./lit/lit-core.min.js"

import "./gauge.min.js?module";

const timerValues = ["01:00", "02:00", "03:00", "04:00", "05:00", "06:00"]

const fireEvent = (node, type, detail, options) => {
    options = options || {};
    detail = detail === null || detail === undefined ? {} : detail;
    const event = new Event(type, {
      bubbles: options.bubbles === undefined ? true : options.bubbles,
      cancelable: Boolean(options.cancelable),
      composed: options.composed === undefined ? true : options.composed,
    });
    event.detail = detail;
    node.dispatchEvent(event);
    return event;
  };

class EasyCareCard extends LitElement {
    static get properties() {
        console.log("%c Lovelace - EsayCare for Waterair  %c 1.0.13 ", "color: #FFFFFF; background: #5D0878; font-weight: 700;", "color: #fdd835; background: #212121; font-weight: 700;")
        return {
            hass: {},
            config: {},
            timers: {},
        };
    }

    constructor() {
        super();
    }

    static async getConfigElement() {
        await import("./easycare-waterair-card-editor.js");
        return document.createElement("easycare-card-editor");
    }

    render() {
        const easyCareConnectionObj = this.hass.states[this.config.poolConnectionEntity];
        if (!this.config || !this.hass) {
            return html``;
        }
        if (!easyCareConnectionObj || easyCareConnectionObj.state === "unavailable")
            return html`
                ${this.getStyles()}
                <ha-card>
                    <div class="card-content" style="padding:0px;" >
                        <div class="poolCard">
                            ${this.getErrorContent()}
                        </div>
                    </div>
                </ha-card>
            `;
        return html`
            ${this.getStyles()}
            <ha-card>
                <div class="card-content" style="padding:0px;" >
                    <div class="poolCard">
                        ${this.getTitleBar()}
                        ${this.getBodyContent()}
                        ${this.getBottomBar()}
                    </div>
                </div>
            </ha-card>
        `;
    }

    firstUpdated(changedProperties) {
        this.createPhGauge(this.shadowRoot.getElementById("phGauge"));
        this.createTemperatureGauge(this.shadowRoot.getElementById("temperatureGauge"));
        this.createChlorineGauge(this.shadowRoot.getElementById("chlorineGauge"));
    }

    setConfig(config) {
        if (!config.poolConnectionEntity) {
            throw new Error("You need to define a poolConnectionEntity");
        }
        this.config = config;
    }

    // The height of your card. Home Assistant uses this to automatically
    // distribute all cards over the available columns.
    getCardSize() {
        return this.config.entities.length + 1;
    }

    getTitleBar() {
        const easyCareConnectionObj = this.hass.states[this.config.poolConnectionEntity];
        const poolDetailObj = this.hass.states["sensor.easycare_pool_detail"];
        const poolNotification = this.hass.states["sensor.easy_care_pool_notification"];
        const poolTreatment = this.hass.states["sensor.easy_care_pool_treatment"];
        return html`
            <div class="poolCardTitleContainer">
                <div class="poolCardTitle">
                    <div class="zoneNom">
                        ${poolDetailObj.state}
                    </div>
                    <div class="zoneMessage">
                    ${(poolNotification && poolNotification.state != 'None') || (poolTreatment && poolTreatment.state != 'None')  ?
                        "Votre piscine a besoin de vous": "Tout va bien !"}
                    </div>
                    <div class="zoneVolume">
                        ${poolDetailObj.attributes.pool_volume}m3
                    </div>
                </div>
                ${easyCareConnectionObj ?
                    html`<div class="poolCardTitleIndicators">
                        <div class="poolCardTitleConnected">
                            <ha-icon icon="${easyCareConnectionObj.state === "on" ? "mdi:network-outline" : "mdi:network-off-outline"}" style="height: 40px;margin-left: 5px;">
                        </div>
                    </div>`: "" }
            </div>
        `;
    }

    getBodyContent() {
        const poolNotification = this.hass.states["sensor.easy_care_pool_notification"];
        const poolTreatment = this.hass.states["sensor.easy_care_pool_treatment"];
        const spotLight = this.hass.states["light.easy_care_pool_spot"];
        const spotLightDuration = this.hass.states["number.easy_care_pool_spot_light_duration_in_hours"];
        const escaLight = this.hass.states["light.easy_care_pool_escalight"];
        const escaLightDuration = this.hass.states["number.easy_care_pool_escalight_light_duration_in_hours"];
        return html`
            <div class="poolCardBodyContainer">
                <div class="poolBodyTop">
                </div>
                <div class="poolBodyLightContainer">
                    ${spotLight?
                        html`<div class="poolBodyLightLeft">
                            <div class="lightName">
                                <div class="lightText">Spot</div>
                                <div class="lightImage" style="${spotLight.state == "on" ? "color:yellow" : ""}">
                                    <ha-icon icon="mdi:lightbulb-on">
                                </div>
                            </div>
                            <div class="timerContainer">
                                <div class="selectTimer">
                                    ${this.createTimer("spot", spotLight, spotLightDuration)}
                                </div>
                                <div class="lightButton">
                                    <ha-icon icon="mdi:launch" @click="${() => {this._manageLight(spotLight)}}">
                                </div>
                            </div>
                            <div class="timeRemainning">
                                <div class="timeStatus">
                                    <span style="${spotLight.state == "on" ? "color:yellow;font-weight: bold;": ""}">${spotLight.state  == "on" ? "Allumé" : "Eteint"}</span>
                                </div>
                                <div class="remaining">
                                    ${spotLight.state == "on" ? spotLight.attributes["remaining_time"] : ""}
                                </div>
                            </div>
                        </div>`: ""}
                    <div class="poolBodyMiddle">
                        <div class="emptyBodyMiddleDiv">
                        </div>
                        ${poolNotification && poolNotification.attributes["all_notifications"] && poolNotification.attributes["all_notifications"] != 'None' ? Object.keys(poolNotification.attributes["all_notifications"]).map(notification => {
                            return html`<div class="${poolNotification.attributes["all_notifications"][notification].notification == "gatewayConnectivityLost" || poolNotification.attributes["all_notifications"][notification].notification == "batteryLow" || poolNotification.attributes["all_notifications"][notification].notification == "batteryTooLowToMeasure" ? "poolTreatmentMessageGateway" : "poolTreatmentMessage"}">
                                    <div style="text-align: center;">
                                        ${poolNotification.attributes["all_notifications"][notification].notification == "shouldDoChlorineTreatment" ? "Votre Traitement Easy Pool"
                                            : poolNotification.attributes["all_notifications"][notification].notification == "shouldBeCalibrated" ? "Votre AC1 devrait être calibré"
                                            : poolNotification.attributes["all_notifications"][notification].notification == "shouldBeWintered" ? "Votre AC1 devrait être hiverné"
                                            : poolNotification.attributes["all_notifications"][notification].notification == "batteryLow" ? "Les piles sont bientôt vides"
                                            : poolNotification.attributes["all_notifications"][notification].notification == "batteryTooLowToMeasure" ? "Les piles de votre AC1 sont trop faibles, les mesures sont suspendues" : "WATBOX déconnectée"}
                                    </div>
                                    <div class="poolTreatmentNotificationDate">
                                        ${this._formatDate(new Date(poolNotification.attributes["all_notifications"][notification]["last_update"]))}
                                    </div>
                                </div>`
                        }):""}
                        ${poolTreatment && poolTreatment.state != 'None' ?
                            html`<div class="poolTreatmentMessage">
                                    <div style="text-align: center;">Une action corrective est disponible</div>
                                    <div class="poolTreatmentNotificationDate">
                                        ${this._formatDate(new Date(poolTreatment.attributes["last_update"]))}
                                    </div>
                                </div>`
                            : ""}
                        ${(poolNotification && poolNotification.state != 'None') || (poolTreatment && poolTreatment.state != 'None') ?
                            html`<div class="actionsTodo">Actions À Mener</div>` : ""
                        }
                    </div>
                    ${escaLight?
                        html`
                            <div class="poolBodyLightRight">
                                <div class="lightName">
                                    <div class="lightText">Escalight</div>
                                    <div class="lightImage" style="${escaLight.state == "on" ? "color:yellow" : ""}">
                                        <ha-icon icon="mdi:light-recessed"></ha-icon>
                                        <ha-icon icon="mdi:light-recessed"></ha-icon>
                                        <ha-icon icon="mdi:light-recessed"></ha-icon>
                                    </div>
                                </div>
                                <div class="timerContainer">
                                    <div class="selectTimer">
                                        ${this.createTimer("escalight", escaLight, escaLightDuration)}
                                    </div>
                                    <div class="lightButton">
                                        <ha-icon icon="mdi:launch" @click="${() => {this._manageLight(escaLight)}}">
                                    </div>
                                </div>
                                <div class="timeRemainning">
                                    <div class="timeStatus">
                                        <span style="${escaLight.state == "on" ? "color:yellow;font-weight: bold;": ""}">${escaLight.state == "on" ? "Allumé" : "Eteint"}</span>
                                    </div>
                                    <div class="remaining">
                                        ${escaLight.state == "on" ? escaLight.attributes["remaining_time"]  : ""}
                                    </div>
                                </div>
                            </div>`: ""}
                </div>
            </div>
        `;
    }

    getErrorContent() {
        const easyCareConnectionObj = this.hass.states[this.config.poolConnectionEntity];
        return html`
            ${easyCareConnectionObj && easyCareConnectionObj.attributes["token_valid"] && easyCareConnectionObj.attributes["token_valid"] == true ?
                html`
                    <div class="poolCardBodyContainer" style="min-height: 320px;">
                        <div class="poolBodyMiddle">
                            <div class="poolTreatmentMessage" style="padding: 40px;width: 250px;">
                                <div style="text-align: center;"><b style="font-size: 20px;">Le serveur EasyCare est indisponible.</b> <br/><br/> Les données seront mises à jour dès que possible.</div>
                            </div>
                        </div>
                    </div>`:
                html`
                    <div class="poolCardBodyContainer" style="min-height: 320px;">
                        <div class="poolBodyMiddle">
                            <div class="poolTreatmentMessage" style="padding: 40px;width: 250px;">
                                <div style="text-align: center;"><b style="font-size: 20px;">Le token a exipré !</b> <br/><br/> Mettre à jour la valeur dans configuration.yaml puis redémarrer Home Assistant.</div>
                            </div>
                        </div>
                    </div>`
            }
        `;
    }

    _handleClick(entity) {
        fireEvent(this, "hass-more-info", { entityId: entity.entity_id });
    }

    _manageLight(entity) {
        if (entity.state == "on")
            this.hass.callService('light', 'turn_off', { entity_id: entity.entity_id })
        else
            this.hass.callService('light', 'turn_on', { entity_id: entity.entity_id })
    }

    _formatDate(date) {
        var hours = date.getHours();
        var minutes = date.getMinutes();
        hours = hours < 10 ? '0'+hours : hours;
        minutes = minutes < 10 ? '0'+minutes : minutes;
        var strTime = hours + ':' + minutes;
        return date.getDate() + " " + date.toLocaleDateString("fr-fr", {month: 'short'}) + " " + date.getFullYear() + " à " + strTime;
      }

    getBottomBar() {
        const poolTemperatureObj = this.hass.states["sensor.easy_care_pool_temperature"];
        const poolPhObj = this.hass.states["sensor.easy_care_pool_ph"];
        const poolChlorineObj = this.hass.states["sensor.easy_care_pool_chlorine"];
        return html`
        <div class="poolCardBottom">
            <div class="emptyDivContainer">
                <div class="emptyDiv"></div>
                ${poolPhObj ?
                    html`
                        <div class="phGauge" @click="${() => {this._handleClick(poolPhObj)}}">
                            <div class="phIcon">
                                <ha-icon icon="mdi:ph"/>
                            </div><div class="phCanvas">
                                <canvas height="70" width="100"" id="phGauge"></ canvas>
                            </div>
                            <div class="phValue">
                                ${parseFloat(poolPhObj.state).toFixed(1)}
                            </div>
                            <div class="phDate">
                            ${this._formatDate(new Date(poolPhObj.attributes["last_update"]))}
                            </div>
                        </div>`
                    : html``
                }
            </div>
            ${poolTemperatureObj ?
                html`
                    <div class="temperatureGauge" @click="${() => {this._handleClick(poolTemperatureObj)}}">
                        <div class="temperatureIcon">
                            <ha-icon icon="mdi:thermometer"/>
                        </div>
                        <div class="temperatureCanvas">
                            <canvas height="100" width="150"" id="temperatureGauge"></ canvas>
                        </div>
                        <div class="temperatureValue">
                            ${parseFloat(poolTemperatureObj.state).toFixed(1)}
                        </div>
                        <div class="chlorineDate">
                            ${this._formatDate(new Date(poolTemperatureObj.attributes["last_update"]))}
                        </div>
                    </div>`
                : html``
            }
            <div class="emptyDivContainer">
                <div class="emptyDiv"></div>
                ${poolChlorineObj ?
                    html`
                        <div class="chlorineGauge" @click="${() => {this._handleClick(poolChlorineObj)}}">
                            <div class="chlorineIcon">
                                <ha-icon icon="mdi:water-outline"/>
                            </div>
                            <div class="chlorineCanvas">
                                <canvas height="70" width="100"" id="chlorineGauge"></ canvas>
                            </div>
                            <div class="chlorineValue">
                                ${poolChlorineObj.state}
                            </div>
                            <div class="chlorineDate">
                                ${this._formatDate(new Date(poolChlorineObj.attributes["last_update"]))}
                            </div>
                        </div>`
                    : html``
                }
            </div>
        </div>
        `;
    }

    createTimer(timer, entity, durationObj) {
        return html`
            <div class="timerComponent">
                ${entity.state == "off" ?
                    html`<div class="timerButtonLeft" @click="${() => {this.clickTimerLeft(timer, durationObj)}}"> <ha-icon icon="mdi:minus"/></div>`
                    : "" }
                <div class="timerValue">${entity.state == "on" ? "Off" : timerValues[parseInt(durationObj.state) - 1]}</div>
                ${entity.state == "off" ?
                    html`<div class="timerButtonRight" @click="${() => {this.clickTimerRight(timer, durationObj)}}"> <ha-icon icon="mdi:plus"/></div>`
                    : "" }
            </div>
        `;
    }

    clickTimerLeft(timer, durationObj) {
        if (parseInt(durationObj.state) - 1 == 0)
            this.hass.callService( 'number','set_value', { entity_id: durationObj.entity_id, value: timerValues.length+".0" } )
        else
            this.hass.callService('number', 'set_value', { entity_id: durationObj.entity_id, value: (parseInt(durationObj.state) - 1) + ".0" })
    }

    clickTimerRight(timer, durationObj) {
        if (parseInt(durationObj.state) == timerValues.length)
            this.hass.callService( 'number','set_value', { entity_id: durationObj.entity_id, value: "1.0" } )
        else
            this.hass.callService('number', 'set_value', { entity_id: durationObj.entity_id, value: (parseInt(durationObj.state) + 1) + ".0" })
    }

    createPhGauge(target) {
        const poolPhObj = this.hass.states["sensor.easy_care_pool_ph"];
        // Gauge from http://bernii.github.io/gauge.js/
        // Fix behavior in gaguge.min.js :
        // Replade :
        //   i=this.canvas.clientHeight,e=this.canvas.clientWidth
        // for :
        //   i=this.canvas.height,e=this.canvas.width
        var opts = {
            staticLabels: {
                font: "10px sans-serif",  // Specifies font
                labels: [4, 5, 6, 7, 8, 9],  // Print labels at these values
                color: "#FFFFFF",  // Optional: Label text color
                fractionDigits: 0  // Optional: Numerical precision. 0=round off.
            },
            staticZones: [
                {strokeStyle: '#fc8500', min: 3, max: 3.2},
                {strokeStyle: '#f98b00', min: 3.2, max: 3.4},
                {strokeStyle: '#f69200', min: 3.4, max: 3.6},
                {strokeStyle: '#f29900', min: 3.6, max: 3.8},
                {strokeStyle: '#eba200', min: 3.8, max: 4},
                {strokeStyle: '#e7a800', min: 4, max: 4.2},
                {strokeStyle: '#e1af00', min: 4.2, max: 4.4},
                {strokeStyle: '#d9b700', min: 4.4, max: 4.6},
                {strokeStyle: '#d1be00', min: 4.6, max: 4.8},
                {strokeStyle: '#c7c600', min: 4.8, max: 5},
                {strokeStyle: '#bbcd0c', min: 5, max: 5.2},
                {strokeStyle: '#add51c', min: 5.2, max: 5.4},
                {strokeStyle: '#9cdc2c', min: 5.4, max: 5.6},
                {strokeStyle: '#87e33b', min: 5.6, max: 5.8},
                {strokeStyle: '#6beb4a', min: 5.8, max: 6},
                {strokeStyle: '#40f25b', min: 6, max: 6.2},

                {strokeStyle: "#40f25b", min: 6.2, max: 7.2}, // Green

                {strokeStyle: '#40f25b', min: 7.2, max: 7.4},
                {strokeStyle: '#70e948', min: 7.4, max: 7.6},
                {strokeStyle: '#8ee136', min: 7.6, max: 7.8},
                {strokeStyle: '#a4d925', min: 7.8, max: 8},
                {strokeStyle: '#b6d012', min: 8, max: 8.2},
                {strokeStyle: '#c5c700', min: 8.2, max: 8.4},
                {strokeStyle: '#d0bf00', min: 8.4, max: 8.6},
                {strokeStyle: '#dab600', min: 8.6, max: 8.8},
                {strokeStyle: '#e2ae00', min: 8.8, max: 9},
                {strokeStyle: '#e8a600', min: 9, max: 9.2},
                {strokeStyle: '#f09d00', min: 9.2, max: 9.4},
                {strokeStyle: '#f59400', min: 9.4, max: 9.6},
                {strokeStyle: '#f88c00', min: 9.6, max: 9.8},
                {strokeStyle: '#fc8500', min: 9.8, max: 10},
            ],
            angle: -0.1, // The span of the gauge arc
            lineWidth: 0.12, // The line thickness
            radiusScale: 0.9, // Relative radius
            pointer: {
                length: 0.5, // // Relative to gauge radius
                strokeWidth: 0.057, // The thickness
                color: '#FFFFFF' // Fill color
            },
            limitMax: true,     // If false, max value increases automatically if value > maxValue
            limitMin: true,     // If true, the min value of the gauge will be fixed
            colorStart: '#6FADCF',   // Colors
            colorStop: '#8FC0DA',    // just experiment with them
            strokeColor: '#E0E0E0',  // to see which ones work best for you
            generateGradient: false,
            highDpiSupport: true,     // High resolution support
            // renderTicks is Optional
            renderTicks: {
                divisions: 14,
                divWidth: 1,
                divLength: 0.5,
                divColor: '#FFFFFF',
                subDivisions: 0,
                subLength: 0,
                subWidth: 0,
                subColor: '#FFFFF'
            }
        };
        var gauge = new Gauge(target).setOptions(opts); // create sexy gauge!
        gauge.maxValue = 10; // set max gauge value
        gauge.setMinValue(3);  // Prefer setter over gauge.minValue = 0
        gauge.animationSpeed = 32; // set animation speed (32 is default value)
        gauge.set(poolPhObj.state); // set actual value;
    }

    createTemperatureGauge(target) {
        const poolTemperatureObj = this.hass.states["sensor.easy_care_pool_temperature"];
        // Gauge from http://bernii.github.io/gauge.js/
        // Fix behavior in gaguge.min.js :
        // Replade :
        //   i=this.canvas.clientHeight,e=this.canvas.clientWidth
        // for :
        //   i=this.canvas.height,e=this.canvas.width
        var opts = {
            staticLabels: {
                font: "10px sans-serif",  // Specifies font
                labels: [0, 12, 28, 35],  // Print labels at these values
                color: "#FFFFFF",  // Optional: Label text color
                fractionDigits: 0  // Optional: Numerical precision. 0=round off.
            },
            staticZones: [
                {strokeStyle: "#04b4f1", min: 0, max: 12}, // Blue
                {strokeStyle: "#40f25b", min: 12, max: 20}, // Green
                {strokeStyle: '#fc8500', min: 20, max: 20.5},
                {strokeStyle: '#40f25b', min: 20, max: 20.5},
                {strokeStyle: '#6beb4a', min: 20.5, max: 21},
                {strokeStyle: '#87e33b', min: 21, max: 21.5},
                {strokeStyle: '#9cdc2c', min: 21.5, max: 22},
                {strokeStyle: '#add51c', min: 22, max: 22.5},
                {strokeStyle: '#bbcd0c', min: 22.5, max: 23},
                {strokeStyle: '#c7c600', min: 23, max: 23.5},
                {strokeStyle: '#d1be00', min: 23.5, max: 24},
                {strokeStyle: '#d9b700', min: 24, max: 24.5},
                {strokeStyle: '#e1af00', min: 24.5, max: 25},
                {strokeStyle: '#e7a800', min: 25, max: 25.5},
                {strokeStyle: '#eba200', min: 25.5, max: 26},
                {strokeStyle: '#f29900', min: 26, max: 26.5},
                {strokeStyle: '#f69200', min: 26.5, max: 27},
                {strokeStyle: '#f98b00', min: 27, max: 27.5},
                {strokeStyle: '#fc8500', min: 27.5, max: 28},
                {strokeStyle: "#f90700", min: 28, max: 35}, // Red
            ],
            angle: -0.1, // The span of the gauge arc
            lineWidth: 0.12, // The line thickness
            radiusScale: 0.9, // Relative radius
            pointer: {
                length: 0.5, // // Relative to gauge radius
                strokeWidth: 0.057, // The thickness
                color: '#FFFFFF' // Fill color
            },
            limitMax: true,     // If false, max value increases automatically if value > maxValue
            limitMin: true,     // If true, the min value of the gauge will be fixed
            colorStart: '#6FADCF',   // Colors
            colorStop: '#8FC0DA',    // just experiment with them
            strokeColor: '#E0E0E0',  // to see which ones work best for you
            generateGradient: false,
            highDpiSupport: true,     // High resolution support
            // renderTicks is Optional
            renderTicks: {
                divisions: 14,
                divWidth: 1,
                divLength: 0.5,
                divColor: '#FFFFFF',
                subDivisions: 0,
                subLength: 0,
                subWidth: 0,
                subColor: '#FFFFF'
            }
        };
        var gauge = new Gauge(target).setOptions(opts); // create sexy gauge!
        gauge.maxValue = 35; // set max gauge value
        gauge.setMinValue(0);  // Prefer setter over gauge.minValue = 0
        gauge.animationSpeed = 32; // set animation speed (32 is default value)
        gauge.set(poolTemperatureObj.state); // set actual value;
    }

    createChlorineGauge(target) {
        const poolChlorineObj = this.hass.states["sensor.easy_care_pool_chlorine"];
        // Gauge from http://bernii.github.io/gauge.js/
        // Fix behavior in gaguge.min.js :
        // Replade :
        //   i=this.canvas.clientHeight,e=this.canvas.clientWidth
        // for :
        //   i=this.canvas.height,e=this.canvas.width
        var opts = {
            staticZones: [
                {strokeStyle: '#fc8500', min: 450, max: 455},
                {strokeStyle: '#f98b00', min: 455, max: 460},
                {strokeStyle: '#f69200', min: 460, max: 465},
                {strokeStyle: '#f29900', min: 465, max: 470},
                {strokeStyle: '#eba200', min: 470, max: 475},
                {strokeStyle: '#e7a800', min: 475, max: 480},
                {strokeStyle: '#e1af00', min: 480, max: 485},
                {strokeStyle: '#d9b700', min: 485, max: 490},
                {strokeStyle: '#d1be00', min: 490, max: 495},
                {strokeStyle: '#c7c600', min: 495, max: 500},
                {strokeStyle: '#bbcd0c', min: 500, max: 505},
                {strokeStyle: '#add51c', min: 505, max: 510},
                {strokeStyle: '#9cdc2c', min: 510, max: 515},
                {strokeStyle: '#87e33b', min: 515, max: 520},
                {strokeStyle: '#6beb4a', min: 520, max: 525},
                {strokeStyle: '#40f25b', min: 525, max: 530},

                {strokeStyle: "#40f25b", min: 530, max: 770}, // Green

                {strokeStyle: '#40f25b', min: 770, max: 775},
                {strokeStyle: '#6beb4a', min: 775, max: 780},
                {strokeStyle: '#87e33b', min: 780, max: 785},
                {strokeStyle: '#9cdc2c', min: 785, max: 790},
                {strokeStyle: '#add51c', min: 790, max: 795},
                {strokeStyle: '#bbcd0c', min: 795, max: 800},
                {strokeStyle: '#c7c600', min: 800, max: 805},
                {strokeStyle: '#d1be00', min: 805, max: 810},
                {strokeStyle: '#d9b700', min: 810, max: 815},
                {strokeStyle: '#e1af00', min: 815, max: 820},
                {strokeStyle: '#e7a800', min: 820, max: 825},
                {strokeStyle: '#eba200', min: 825, max: 830},
                {strokeStyle: '#f29900', min: 830, max: 835},
                {strokeStyle: '#f69200', min: 835, max: 840},
                {strokeStyle: '#f98b00', min: 840, max: 845},
                {strokeStyle: '#fc8500', min: 841, max: 850},
            ],
            angle: -0.1, // The span of the gauge arc
            lineWidth: 0.12, // The line thickness
            radiusScale: 0.9, // Relative radius
            pointer: {
                length: 0.5, // // Relative to gauge radius
                strokeWidth: 0.057, // The thickness
                color: '#FFFFFF' // Fill color
            },
            limitMax: true,     // If false, max value increases automatically if value > maxValue
            limitMin: true,     // If true, the min value of the gauge will be fixed
            colorStart: '#6FADCF',   // Colors
            colorStop: '#8FC0DA',    // just experiment with them
            strokeColor: '#E0E0E0',  // to see which ones work best for you
            generateGradient: false,
            highDpiSupport: true,     // High resolution support
            // renderTicks is Optional
            renderTicks: {
                divisions: 14,
                divWidth: 1,
                divLength: 0.5,
                divColor: '#FFFFFF',
                subDivisions: 0,
                subLength: 0,
                subWidth: 0,
                subColor: '#FFFFF'
            }
        };
        var gauge = new Gauge(target).setOptions(opts); // create sexy gauge!
        gauge.maxValue = 850; // set max gauge value
        gauge.setMinValue(450);  // Prefer setter over gauge.minValue = 0
        gauge.animationSpeed = 32; // set animation speed (32 is default value)
        gauge.set(poolChlorineObj.state); // set actual value;
    }

   getStyles() {
       const poolDetailObj = this.hass.states["sensor.easycare_pool_detail"];
       const imagesUrl = new URL('images/', import.meta.url).href
       var image = imagesUrl + "pool.jpg"
       if (poolDetailObj.attributes.pool_custom_photo && poolDetailObj.attributes.pool_custom_photo != "")
           image = "http://easycare.waterair.com/"+poolDetailObj.attributes.pool_custom_photo
        return html`
        <style>
            .poolCard {
                background-image: url(${image});
                display:flex;
                flex-direction:column;
                justify-content: space-between;
                border-radius: 12px;
                min-height: 400px;
            }
            .poolCardTitleContainer {
                display:flex;
                flex-direction:column;
            }
            .poolCardTitle {
                display: flex;
                justify-content: space-between;
                width:100%;
                background: rgba(0, 0, 0, 0.7);
                border-radius: 12px 12px 0px 0px;
                height: 25px;
            }
            .poolCardTitleIndicators  {
                display: flex;
                justify-content: space-between;
                width:100%;
                height: 25px;
            }
            .poolCardTitleConnected {
                display: flex;
                color:#FFFFFF;
                height: 40px;
                width: 40px;
                background: rgba(0, 0, 0, 0.7);
                border-radius: 0px 0px 40px 0px;
            }
            .zoneNom {
                display: flex;
                align-self: center;
                padding-left: 12px;
                color:#FFFFFF;
                font-size: 12px;
                font-weight: 400;
            }
            .zoneMessage {
                display: flex;
                align-self: center;
                justify-content:center;
                color:#FFFFFF;
                font-size: 16px;
                font-weight: 400;
                width: 100%;
            }
            .zoneVolume {
                display: flex;
                align-self: center;
                justify-content:right;
                padding-right: 12px;
                color:#FFFFFF;
                font-size: 12px;
                font-weight: 400;
            }
            .poolCardBodyContainer {
                display:flex;
                justify-content: space-between;
                width:100%;
                flex-direction:column;
            }
            .poolBodyTop {
                display: flex;
                height: 20px;
            }
            .poolBodyLightContainer {
                display: flex;
                height: 200px;
            }
            .poolBodyLightLeft {
                display: flex;
                flex:2;
                background: rgba(0, 0, 0, 0.7);
                border-radius: 0px 30px 30px 0px;
                padding-right: 5px;
                padding-left: 5px;
                min-width: 100px;
                color: #FFFFFF;
                flex-direction: column;
            }
            .poolBodyLightRight {
                display: flex;
                flex:2;
                background: rgba(0, 0, 0, 0.7);
                border-radius: 30px 0px 0px 30px;
                padding-right: 5px;
                padding-left: 5px;
                min-width: 100px;
                color: #FFFFFF;
                flex-direction: column;
            }
            .lightName {
                display: flex;
                align-self: center;
                font-size: 18px;
                margin-top: 10px;
                flex-direction: column;
                border-bottom: 1px solid #FFFFFF;
                width: 95%;
            }
            .lightText {
                display: flex;
                align-self: center;
                padding-bottom: 5px;
            }
            .lightImage {
                display: flex;
                align-self: center;
                display: flex;
                margin-bottom: 10px;
            }
            .timerContainer {
                display: flex;
                align-self: center;
                font-size: 18px;
                margin-top: 10px;
                flex-direction: column;
                border-bottom: 1px solid #FFFFFF;
                width: 95%;
            }
            .selectTimer {
                display: flex;
                align-self: center;
                padding-bottom: 5px;
                width:100%;
            }
            .lightButton {
                display: flex;
                align-self: center;
                margin-bottom: 10px;
                cursor: pointer;
            }
            .timeRemainning {
                display: flex;
                align-self: center;
                margin-top: 10px;
                flex-direction: column;
            }
            .timeStatus {
                display: flex;
                align-self: center;
            }
            .remaining {
                display: flex;
                align-self: center;
                color: lightblue;
                font-weight: bold;
            }
            .poolBodyMiddle {
                display: flex;
                flex: 5;
                flex-direction:column-reverse;
                align-items: center;
            }
            .poolTreatmentMessage {
                display: flex;
                flex-direction: column;
                background-color:#F9B302;
                border-radius: 12px;
                width: 210px;
                justify-content: center;
                align-items: center;
                padding-top: 3px;
                padding-left: 5px;
                padding-right: 5px;
                margin-bottom: 10px;
                color:#FFFFFF;
                font-size: 16px;
                font-weight: 500;
            }
            .poolTreatmentMessageGateway {
                display: flex;
                flex-direction: column;
                background-color: #EE6002;
                border-radius: 12px;
                width: 210px;
                justify-content: center;
                align-items: center;
                padding-top: 3px;
                padding-left: 5px;
                padding-right: 5px;
                margin-bottom: 10px;
                color:#FFFFFF;
                font-size: 16px;
                font-weight: 500;
            }
            .poolTreatmentNotificationDate {
                font-size: 8px;
            }
            .actionsTodo {
                background: rgba(0, 0, 0, 0.7);
                border-radius: 12px;
                padding: 5px 10px 5px 10px;
                margin-bottom: 5px;
                color: #FFFFFF;
                font-size: 14px;
                font-weight: 500;
                font-variant-caps: small-caps;
            }
            .emptyBodyMiddleDiv {
                display: flex;
                width: 100%;
                height: 5px;
            }
            .timerComponent {
                display: flex;
                width:100%
            }
            .timerButtonLeft {
                display: flex;
                align-items: center;
                justify-content: center;
                border: 0;
                flex: 1;
                color: #FFFFFF;
                font-size: 18px;
                font-weight: bold;
                cursor: pointer;
                text-align: center;
            }
            .timerValue {
                display: flex;
                align-items: center;
                justify-content: center;
                flex: 2;
                text-align: center;
                color: #FFFFFF;
                font-size: 20px
            }
            .timerButtonRight {
                display: flex;
                align-items: center;
                justify-content: center;
                border: 0;
                flex: 1;
                color: #FFFFFF;
                font-size: 18px;
                font-weight: bold;
                cursor: pointer;
                text-align: center;
            }
            .poolCardBottom {
                display: flex;
                justify-content: space-between;
                width:100%;
                border-radius: 0px 0px 12px 12px;
                height: 140px;
            }
            .emptyDivContainer {
                display: flex;
                align-self: center;
                position: relative;
                justify-content: center;
                flex-direction: column;
                flex:2;
                height: 100%;
            }
            .emptyDiv {
                display: flex;
                height: 40px;
            }
            .phGauge {
                display: flex;
                align-self: center;
                position: relative;
                justify-content: center;
                flex-direction: column;
                height: 100%;
                width: 100%;
                background: rgba(0, 0, 0, 0.7);
                border-radius: 0px 0px 0px 12px;
            }
            .phIcon {
                color: #FFFFFF;
                position: absolute;
                display: flex;
                top: 2px;
                border-radius: 12px;
                left: 5px;
            }
            .phCanvas {
                display: flex;
                justify-content: center;
            }
            .phValue {
                color: #FFFFFF;
                position: absolute;
                justify-content: center;
                display: flex;
                width: 100%;
                font-size: 16px;
                font-weight: 600;
                top: 63px;
            }
            .phDate {
                display: flex;
                justify-content: center;
                text-align: center;
                margin-top: 5px;
                font-size: 12px;
                color: #FFFFFF;
            }
            .temperatureGauge {
                display: flex;
                align-self: center;
                position: relative;
                justify-content: center;
                flex-direction: column;
                flex:3;
                background: rgba(0, 0, 0, 0.7);
                border-radius: 12px 12px 0px 0px;
                height: 100%;
                width: 100%;
            }
            .temperatureIcon {
                color: #FFFFFF;
                position: absolute;
                display: flex;
                top: 10px;
                border-radius: 12px;
                left: 10px;
            }
            .temperatureCanvas {
                display: flex;
                justify-content: center;
            }
            .temperatureValue {
                color: #FFFFFF;
                position: absolute;
                justify-content: center;
                display: flex;
                width: 100%;
                font-size: 22px;
                font-weight: 600;
                top: 88px;
            }
            .temperatureDate {
                display: flex;
                justify-content: center;
                text-align: center;
                margin-top: 5px;
                font-size: 12px;
                color: #FFFFFF;
            }
            .chlorineGauge {
                display: flex;
                align-self: center;
                position: relative;
                justify-content: center;
                flex-direction: column;
                height: 100%;
                width: 100%;
                background: rgba(0, 0, 0, 0.7);
                border-radius: 0px 0px 12px 0px;
            }
            .chlorineIcon {
                color: #FFFFFF;
                position: absolute;
                display: flex;
                top: 2px;
                border-radius: 12px;
                left: 5px;
            }
            .chlorineCanvas {
                display: flex;
                justify-content: center;
            }
            .chlorineValue {
                color: #FFFFFF;
                position: absolute;
                justify-content: center;
                display: flex;
                width: 100%;
                font-size: 16px;
                font-weight: 600;
                width: 100%;
                top: 63px;
            }
            .chlorineDate {
                display: flex;
                justify-content: center;
                text-align: center;
                margin-top: 5px;
                font-size: 12px;
                color: #FFFFFF;
            }
        </style>
        `;
    }
}
customElements.define("easy-care-card", EasyCareCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'easy-care-card',
  name: 'Easy Care card for Waterair',
  preview: false,
  description: 'Lovelace Card to display Waterair Pool details with EasyCare connection.',
});