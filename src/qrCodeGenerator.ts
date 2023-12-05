import QRCode from "../vendor/qrcode/qrcode"
import * as Logging from "@src/lib/logging"
import { browserBg, activeTab } from "./lib/webext"

const logger = new Logging.Logger("qrcode-display")

function displayError() {
    const errorDisplay: HTMLDivElement =
        document.querySelector("div#error-display")
    errorDisplay.classList.remove("hide")
    errorDisplay.innerHTML = "Unable to generate QR code for the given data"
}

function displayQRCode(data, imgElem, opts = { scale: 10 }) {
    QRCode.toDataURL(data, opts, (error: Error, url: string) => {
        if (error) {
            logger.error(error)
            displayError()
        } else {
            imgElem.src = url
        }
    })
}

function setUpPage() {
    const imgElem: HTMLImageElement =
        document.querySelector("div#qr-canvas img")

    const url = new URL(window.location.href)
    let data = url.searchParams.get("data")
    const timeout = parseInt(url.searchParams.get("timeout"), 10)
    data = decodeURIComponent(atob(data))
    displayQRCode(data, imgElem)

    if (timeout && timeout > 0) {
        setTimeout(function () {
            activeTab()
                .then(tabInfo => {
                    browserBg.tabs.remove(tabInfo.id)
                })
                .catch(error => {
                    logger.error("Unable to close tab" + error)
                })
        }, timeout * 1000)
    }

    const textarea = document.getElementsByName(
        "data",
    )[0] as HTMLTextAreaElement
    textarea.value = data
    textarea.addEventListener(
        "input",
        throttle(event => displayQRCode(event.target.value, imgElem), 1000),
    )
}

function throttle(fn, ms) {
    let timeLast
    return (...args) => {
        const time = (timeLast = Date.now())
        setTimeout(() => {
            if (time == timeLast) fn(...args)
        }, ms)
    }
}

window["QRCode"] = QRCode
window.addEventListener("load", setUpPage)
