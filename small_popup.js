function setUpNotify() {
    let random_string = "";
    let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (let i = 0; i < 21; i++) {
        random_string += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    String(random_string);

    let notificationData = localStorage.getItem("all_notifications_JSON");
    notificationData = JSON.parse(notificationData);
    let tabid = notificationData["Temp_data"]["tabid"];
    let windowid = notificationData["Temp_data"]["windowid"];

    notificationData.Notifications[random_string] = {
        "index": null,
        "name": null,
        "odds": null,
        "back": null,
        "url": null,
        "exactly": null,
        "exchange": null,
        "tabid": tabid,
        "windowid": windowid
    };

    let isOverUnder, odds;
    let error = false;
    if (document.getElementById("exactly").checked) {
        isOverUnder = "Exactly";
    } else if (document.getElementById("under").checked) {
        isOverUnder = "Under";
    } else if (document.getElementById("over").checked) {
        isOverUnder = "Over";
    } else {
        document.getElementById("error").textContent = "Choose exactly/under/over.";
        error = true;
    }

    let oddsInput = document.forms["oddsInput"]["oddsNumber"].value;

    if (oddsInput === "") {
        document.getElementById("error").textContent = "Enter odds.";
        error = true;
    }
    else if (oddsInput < 1) {
        document.getElementById("error").textContent = "Odds above 1.";
        error = true;
    }
    else if (isNaN(oddsInput)) {
        document.getElementById("error").textContent = "Not a number.";
        error = true;
    } else {
        odds = Math.round(oddsInput * 100) / 100;
    }

    let isBack = notificationData["Temp_data"]["back"] === "back";

    if (!error) {
        let options = [];
        let name;
        let index = notificationData["Temp_data"]["index"];
        chrome.tabs.sendMessage(tabid, {from: "popup", subject: "DOMInfo"}, function (response) {
            for (let i = 0; i < Object.keys(response.Runners).length; i++) {
                options[i] = response.Runners[i];
            }
            name = options[index];

            notificationData["Notifications"][random_string].index = notificationData["Temp_data"]["index"];
            notificationData["Notifications"][random_string].name = name;
            notificationData["Notifications"][random_string].odds = odds;
            notificationData["Notifications"][random_string].back = isBack;
            notificationData["Notifications"][random_string].url = notificationData["Temp_data"]["url"];
            notificationData["Notifications"][random_string].exactly = isOverUnder;
            notificationData["Notifications"][random_string].exchange = notificationData["Temp_data"]["exchange"];

            chrome.tabs.sendMessage(
                notificationData["Temp_data"]["tabid"], {
                    from: "popup", subject: "setUpListener",
                    index: notificationData["Temp_data"].index,
                    backLay: notificationData["Temp_data"].back, id: random_string
                },
                function (response) {

                }
             );
            notificationData["Temp_data"] = {
                "index": null,
                "name": null,
                "back": null,
                "url": null,
                "exchange": null,
                "imageurl": null,
                "event": null,
                "tabid": null,
                "windowid": null
            };
            notificationData = JSON.stringify(notificationData);
            localStorage.setItem("all_notifications_JSON", notificationData);

            let indexs = JSON.parse(localStorage.getItem("indexed_alerts"));
            indexs.push(random_string);
            indexs = JSON.stringify(indexs);
            localStorage.setItem("indexed_alerts", indexs);


            document.getElementById("button").textContent = "Added!";
            setTimeout(function () {
                window.close();
            }, 500);

        });
    }
}

document.addEventListener("DOMContentLoaded", function () {
    let notificationData = localStorage.getItem("all_notifications_JSON");
    notificationData = JSON.parse(notificationData);
    if (notificationData.Temp_data.back === "back") {
        document.getElementById("selection_name").textContent = "Back: " + notificationData.Temp_data.name;
    } else {
        document.getElementById("selection_name").textContent = "Lay: " + notificationData.Temp_data.name;
    }

    if (notificationData.Temp_data.imageurl === "none") {
        document.getElementById("selection_image").setAttribute("style", "display:none;");
    } else {
        document.getElementById("selection_image").setAttribute("src", notificationData.Temp_data.imageurl);
    }
    document.getElementById("button").addEventListener("click", setUpNotify);
});

document.addEventListener("keypress", function (event) {
    if (event.keyCode === 13) {
        event.preventDefault();
        document.getElementById("selection_name").click();
        document.getElementById("button").click();
    }
});
