import {
  LitElement,
  html,
} from "https://unpkg.com/lit-element@2.0.1/lit-element.js?module";

import "./gauge.min.js?module";

const timerValues = ["Off", "01:00", "02:00", "03:00", "04:00", "05:00", "06:00"]

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
        console.log("%c Lovelace - EsayCare for Waterair  %c 0.0.3 ", "color: #FFFFFF; background: #5D0878; font-weight: 700;", "color: #fdd835; background: #212121; font-weight: 700;")
        return {
            hass: {},
            config: {},
            timers: {},
        };
    }

    constructor() {
        super();
        this.timers = {
            spot: 0,
            escalight: 0,
        }
    }

    static async getConfigElement() {
        await import("./easycare-waterair-card-editor.js");
        return document.createElement("easycare-card-editor");
    }

    render() {
        if (!this.config || !this.hass) {
            return html``;
        }
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
        if (this.config.poolPhEntity)
            this.createPhGauge(this.shadowRoot.getElementById("phGauge"));
        if (this.config.poolTemperatureEntity)
            this.createTemperatureGauge(this.shadowRoot.getElementById("temperatureGauge"));
        if (this.config.poolChlorineEntity)
            this.createChlorineGauge(this.shadowRoot.getElementById("chlorineGauge"));
    }

    setConfig(config) {
        if (!config.poolDetailEntity) {
            throw new Error("You need to define a poolDetailEntity");
        }
        this.config = config;
    }

    // The height of your card. Home Assistant uses this to automatically
    // distribute all cards over the available columns.
    getCardSize() {
        return this.config.entities.length + 1;
    }

    getTitleBar() {
        const poolDetailObj = this.hass.states[this.config.poolDetailEntity];
        const poolNotification = this.hass.states[this.config.poolNotificationEntity];
        const easyCareConnectionObj = this.hass.states[this.config.poolConnectionEntity];
        return html`
            <div class="poolCardTitleContainer">
                <div class="poolCardTitle">
                    <div class="zoneNom">
                        ${poolDetailObj.state}
                    </div>
                    <div class="zoneMessage">
                    ${poolNotification ?
                        "Votre piscine a besoin de vous": ""}
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
        const poolNotification = this.hass.states[this.config.poolNotificationEntity];
        const spotLight = this.hass.states[this.config.spotLightEntity];
        const escaLight = this.hass.states[this.config.escalightEntity];
        return html`
            <div class="poolCardBodyContainer">
                <div class="poolBodyTop">
                </div>
                <div class="poolBodyLightContainer">
                    ${spotLight?
                        html`<div class="poolBodyLightLeft">
                            <div class="lightName">
                                <div class="lightText">Spot</div>
                                <div class="lightImage" style="color:yellow">
                                    <ha-icon icon="mdi:lightbulb-on">
                                </div>
                            </div>
                            <div class="timerContainer">
                                <div class="selectTimer">
                                    ${this.createTimer("spot")}
                                </div>
                                <div class="lightButton">
                                    <ha-icon icon="mdi:launch">
                                </div>
                            </div>
                            <div class="timeRemainning">
                                <div class="timeStatus">
                                    Status:&nbsp;<span style="color:yellow;font-weight: bold;">On</span>
                                </div>
                                <div class="remaining">
                                    00:42
                                </div>
                            </div>
                        </div>`: ""}
                    <div class="poolBodyMiddle">
                        <div class="emptyBodyMiddleDiv">
                        </div>
                        ${poolNotification ?
                            html`<div class="poolTreatmentMessage">
                                    Votre Traitement Easy Pool 2
                                </div>`
                            : ""}
                    </div>
                    ${escaLight?
                        html`
                            <div class="poolBodyLightRight">
                                <div class="lightName">
                                    <div class="lightText">Escalight</div>
                                    <div class="lightImage">
                                    <ha-icon icon="mdi:light-recessed"></ha-icon>
                                    <ha-icon icon="mdi:light-recessed"></ha-icon>
                                    <ha-icon icon="mdi:light-recessed"></ha-icon>
                                    </div>
                                </div>
                                <div class="timerContainer">
                                    <div class="selectTimer">
                                        ${this.createTimer("escalight")}
                                    </div>
                                    <div class="lightButton">
                                        <ha-icon icon="mdi:launch">
                                    </div>
                                </div>
                                <div class="timeRemainning">
                                    <div class="timeStatus">
                                        Status: Off
                                    </div>
                                    <div class="remaining">
                                    </div>
                                </div>
                            </div>`: ""}
                </div>
            </div>
        `;
    }

    _handleClick(entity) {
        fireEvent(this, "hass-more-info", { entityId: entity });
    }

    _formatDate(date) {
        var hours = date.getHours();
        var minutes = date.getMinutes();
        hours = hours < 10 ? '0'+hours : hours;
        minutes = minutes < 10 ? '0'+minutes : minutes;
        var strTime = hours + ':' + minutes;
        return date.getDate() + " " + date.toLocaleDateString("fr-fr", {month: 'long'}) + " " + date.getFullYear() + " à " + strTime;
      }

    getBottomBar() {
        const poolTemperatureObj = this.hass.states[this.config.poolTemperatureEntity];
        const poolPhObj = this.hass.states[this.config.poolPhEntity];
        const poolChlorineObj = this.hass.states[this.config.poolChlorineEntity];
        return html`
        <div class="poolCardBottom">
            <div class="emptyDivContainer">
                <div class="emptyDiv"></div>
                ${poolPhObj ?
                    html`
                        <div class="phGauge" @click="${() => {this._handleClick(this.config.poolPhEntity)}}">
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
                    <div class="temperatureGauge" @click="${() => {this._handleClick(this.config.poolTemperatureEntity)}}">
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
                        <div class="chlorineGauge" @click="${() => {this._handleClick(this.config.poolChlorineEntity)}}">
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

    createTimer(timer) {
        return html`
            <div class="timerComponent">
                <div class="timerButtonLeft" @click="${() => {this.clickTimerLeft(timer)}}"> <ha-icon icon="mdi:minus"/></div>
                <div class="timerValue">${timerValues[this.timers[timer]]}</div>
                <div class="timerButtonRight" @click="${() => {this.clickTimerRight(timer)}}"> <ha-icon icon="mdi:plus"/></div>
            </div>
        `;
    }

    clickTimerLeft(timer) {
        if (this.timers[timer] == 0)
            this.timers[timer] = timerValues.length - 1;
        else
            this.timers[timer] = this.timers[timer] - 1;

        this.requestUpdate();
    }

    clickTimerRight(timer) {
        if (this.timers[timer] == timerValues.length - 1)
            this.timers[timer] = 0;
        else
            this.timers[timer] = this.timers[timer] + 1;

        this.requestUpdate();
    }

    createPhGauge(target) {
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
            limitMax: false,     // If false, max value increases automatically if value > maxValue
            limitMin: false,     // If true, the min value of the gauge will be fixed
            colorStart: '#6FADCF',   // Colors
            colorStop: '#8FC0DA',    // just experiment with them
            strokeColor: '#E0E0E0',  // to see which ones work best for you
            generateGradient: true,
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
        gauge.set(7.5); // set actual value;
    }

    createTemperatureGauge(target) {
        const poolTemperatureObj = this.hass.states[this.config.poolTemperatureEntity];
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
            limitMax: false,     // If false, max value increases automatically if value > maxValue
            limitMin: false,     // If true, the min value of the gauge will be fixed
            colorStart: '#6FADCF',   // Colors
            colorStop: '#8FC0DA',    // just experiment with them
            strokeColor: '#E0E0E0',  // to see which ones work best for you
            generateGradient: true,
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
        // Gauge from http://bernii.github.io/gauge.js/
        // Fix behavior in gaguge.min.js :
        // Replade :
        //   i=this.canvas.clientHeight,e=this.canvas.clientWidth
        // for :
        //   i=this.canvas.height,e=this.canvas.width
        var opts = {
            staticZones: [
                {strokeStyle: '#fc8500', min: 200, max: 212},
                {strokeStyle: '#f98b00', min: 212, max: 224},
                {strokeStyle: '#f69200', min: 224, max: 236},
                {strokeStyle: '#f29900', min: 236, max: 248},
                {strokeStyle: '#eba200', min: 248, max: 260},
                {strokeStyle: '#e7a800', min: 260, max: 272},
                {strokeStyle: '#e1af00', min: 272, max: 284},
                {strokeStyle: '#d9b700', min: 284, max: 296},
                {strokeStyle: '#d1be00', min: 296, max: 308},
                {strokeStyle: '#c7c600', min: 308, max: 320},
                {strokeStyle: '#bbcd0c', min: 320, max: 332},
                {strokeStyle: '#add51c', min: 332, max: 344},
                {strokeStyle: '#9cdc2c', min: 344, max: 356},
                {strokeStyle: '#87e33b', min: 356, max: 368},
                {strokeStyle: '#6beb4a', min: 368, max: 380},
                {strokeStyle: '#40f25b', min: 380, max: 392},

                {strokeStyle: "#40f25b", min: 392, max: 1008}, // Green

                {strokeStyle: '#40f25b', min: 1008, max: 1020},
                {strokeStyle: '#6beb4a', min: 1020, max: 1032},
                {strokeStyle: '#87e33b', min: 1032, max: 1044},
                {strokeStyle: '#9cdc2c', min: 1044, max: 1056},
                {strokeStyle: '#add51c', min: 1056, max: 1068},
                {strokeStyle: '#bbcd0c', min: 1068, max: 1080},
                {strokeStyle: '#c7c600', min: 1080, max: 1092},
                {strokeStyle: '#d1be00', min: 1092, max: 1104},
                {strokeStyle: '#d9b700', min: 1104, max: 1116},
                {strokeStyle: '#e1af00', min: 1116, max: 1128},
                {strokeStyle: '#e7a800', min: 1128, max: 1140},
                {strokeStyle: '#eba200', min: 1140, max: 1152},
                {strokeStyle: '#f29900', min: 1152, max: 1164},
                {strokeStyle: '#f69200', min: 1164, max: 1176},
                {strokeStyle: '#f98b00', min: 1176, max: 1188},
                {strokeStyle: '#fc8500', min: 1188, max: 1200},
            ],
            angle: -0.1, // The span of the gauge arc
            lineWidth: 0.12, // The line thickness
            radiusScale: 0.9, // Relative radius
            pointer: {
                length: 0.5, // // Relative to gauge radius
                strokeWidth: 0.057, // The thickness
                color: '#FFFFFF' // Fill color
            },
            limitMax: false,     // If false, max value increases automatically if value > maxValue
            limitMin: false,     // If true, the min value of the gauge will be fixed
            colorStart: '#6FADCF',   // Colors
            colorStop: '#8FC0DA',    // just experiment with them
            strokeColor: '#E0E0E0',  // to see which ones work best for you
            generateGradient: true,
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
        gauge.maxValue = 1200; // set max gauge value
        gauge.setMinValue(200);  // Prefer setter over gauge.minValue = 0
        gauge.animationSpeed = 32; // set animation speed (32 is default value)
        gauge.set(580); // set actual value;
    }

   getStyles() {
       const poolDetailObj = this.hass.states[this.config.poolDetailEntity];
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
                background-color:#F9B302;
                border-radius: 12px;
                height: 40px;
                width: 95%;
                justify-content: center;
                align-items: center;
                color:#FFFFFF;
                font-size: 14px;
                font-weight: 500;
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
                margin-top: 5px;
                font-size: 12px;
                color: #FFFFFF;
            }
        </style>
        `;
    }
}
customElements.define("easy-care-card", EasyCareCard);