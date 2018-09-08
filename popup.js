let urlPage;
let isBetfair = false;

function getJSON() {
    let notification = localStorage.getItem("all_notifications_JSON");
    notification = JSON.parse(notification);
    return (notification);
}

function setJSON(notifications) {
    notifications = JSON.stringify(notifications);
    localStorage.setItem("all_notifications_JSON", notifications);
}

function getINDEX() {
    let indexs = localStorage.getItem("indexed_alerts");
    indexs = JSON.parse(indexs);
    return (indexs);
}

function setINDEX(index) {
    index = JSON.stringify(index);
    localStorage.setItem("indexed_alerts", index);
}

function setUpNotify() {
    chrome.tabs.query({
        active: true,
        currentWindow: true
    }, function (tabs) {
        let tabID = tabs[0].id;
        let windowID = tabs[0].windowId;

        let random_string = "";
        let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

        for (let i = 0; i < 21; i++)
            random_string += possible.charAt(Math.floor(Math.random() * possible.length));
        String(random_string);
        let notifications = getJSON();

        notifications.Notifications[random_string] = {
            "index": null,
            "name": null,
            "odds": null,
            "back": null,
            "url": null,
            "exactly": null,
            "exchange": null,
            "tabid": tabID,
            "windowid": windowID,
            "event_name": null
        };

        let e = document.getElementById("smarkValues");
        let nameChosen = e.options[e.selectedIndex].text;
        let indexChosen = null;
        if (nameChosen === "Choose your alert..") {
            alert("You need to choose what to be alerted for.");
            nameChosen = "";
        } else {
            for (let i = 0; i < e.options.length; i++) {
                if (e.options[i].text === nameChosen) {
                    indexChosen = i - 1;
                    break;
                }
            }

            notifications["Notifications"][random_string]["index"] = indexChosen;
            notifications["Notifications"][random_string]["name"] = nameList.Runners[indexChosen];

        }

        let back_string, is_back;
        if (document.getElementById("above").checked) {
            is_back = true;
            back_string = "back";
        } else if (document.getElementById("below").checked) {
            back_string = "lay";
        } else {
            alert("Please choose back or lay.");
        }

        notifications["Notifications"][random_string]["back"] = is_back;

        let oddsInput = document.forms["oddsInput"]["oddsNumber"].value;
        if (oddsInput < 1) {
            alert("Odds must be 1 or greater.");
        }
        else if (isNaN(oddsInput)) {
            alert("Odds must be a number.");
        } else {
            notifications["Notifications"][random_string]["odds"] = Math.round(oddsInput * 100) / 100;
        }
        let isOverUnder;
        if (document.getElementById("exactly").checked) {
            isOverUnder = "Exactly";
        } else if (document.getElementById("under").checked) {
            isOverUnder = "Under";
        } else if (document.getElementById("over").checked) {
            isOverUnder = "Over";
        } else {
            alert("Please choose exactly, under or over.");
        }
        if (urlPage.includes("betfair")) {
            notifications["Notifications"][random_string]["exchange"] = "Betfair";
        } else if (urlPage.includes("smarkets")) {
            notifications["Notifications"][random_string]["exchange"] = "Smarkets";
        }

        if (isOverUnder != null) {

            notifications["Notifications"][random_string]["exactly"] = isOverUnder;
            notifications["Notifications"][random_string]["url"] = urlPage;

            notifications = JSON.stringify(notifications);
            localStorage.setItem("all_notifications_JSON", notifications);
            let indexs = getINDEX();
            indexs.push(random_string);
            setINDEX(indexs);

            chrome.tabs.query({
                active: true,
                currentWindow: true
            }, function (tabs) {
                chrome.tabs.sendMessage(
                    tabs[0].id,
                    {
                        from: "popup",
                        subject: "setUpListener",
                        index: indexChosen,
                        backLay: back_string,
                        id: random_string
                    },
                    function () {
                        localStorage.setItem("notifJustAdded", "true");
                        location.reload();
                    });
            });

        }
    });

}

function removeListItem() {
    let selection = document.getElementById("existingNotifications");
    let index_list = selection.selectedIndex;

    if (index_list === 0) {
        alert("You need to choose an alert.");
    } else {
        let indexs = localStorage.getItem("indexed_alerts");
        indexs = JSON.parse(indexs);
        let string_to_remove = indexs[index_list - 1];


        let notifications = localStorage.getItem("all_notifications_JSON");
        notifications = JSON.parse(notifications);
        let tabid = notifications.Notifications[string_to_remove].tabid;
        delete notifications.Notifications[string_to_remove];
        indexs.splice(index_list - 1, 1);

        indexs = JSON.stringify(indexs);
        localStorage.setItem("indexed_alerts", indexs);

        notifications = JSON.stringify(notifications);
        localStorage.setItem("all_notifications_JSON", notifications);

        chrome.tabs.sendMessage(tabid, {
            from: "popup",
            subject: "removeTag",
            remove_id: string_to_remove
        }, function (response) {
        });

    }
    location.reload();
}

function renderStatus(statusText) {
    document.getElementById("status").textContent = statusText;

}

function renderOverUnder(statusText) {
    document.getElementById("statusOverUnder").textContent = statusText;

}

function renderBackLay(statusText) {
    document.getElementById("backLay").textContent = statusText;
}

function removeNotifButton() {
    document.getElementById("button").setAttribute("style", "display:block");
    document.getElementById("removeAlert").setAttribute("style", "display:block");
}

function printCurrentNotif() {
    let notifications = JSON.parse(localStorage.getItem("all_notifications_JSON"));
    let indexed = localStorage.getItem("indexed_alerts");
    indexed = JSON.parse(indexed);


    let select = document.getElementById("existingNotifications");
    let length = select.options.length;
    for (let y = 0; y < length; y++) {
        select.options[y] = null;
    }

    let listItem1 = document.createElement("option");
    listItem1.textContent = "Your existing notifications... (" + (Object.keys(notifications.Notifications).length) + ")";
    listItem1.value = "Your existing notifications... (" + (Object.keys(notifications.Notifications).length) + ")";
    select.appendChild(listItem1);
    if (Object.keys(notifications.Notifications).length === 0) {
        document.getElementById("currentNotif").setAttribute("style", "display:none");
    }

    for (let j = 0; j < indexed.length; j++) {
        let isBack;
        if (notifications.Notifications[indexed[j]].back === true) {
            isBack = "Back";
        } else {
            isBack = "Lay";
        }

        let stringText = notifications.Notifications[indexed[j]].name + " at "
            + isBack + " odds " + notifications.Notifications[indexed[j]].exactly + " "
            + notifications.Notifications[indexed[j]].odds;

        let select2 = document.getElementById("existingNotifications");

        let listItem = document.createElement("option");
        listItem.setAttribute("id", "existing_option");
        listItem.textContent = stringText;
        listItem.value = j;
        select2.appendChild(listItem);
    }
}

function toggleSound() {
    let JSON = getJSON();
    JSON.Settings.Sound = document.getElementById("sound_check").checked;
    setJSON(JSON);
}

function toggleRemoveButton() {
    let selection = document.getElementById("existingNotifications");
    let nameChosen = selection.options[selection.selectedIndex].text;
    if (nameChosen.includes("Your existing notifications...")) {
        document.getElementById("removeAlert").style.display = "none";
    } else {
        document.getElementById("removeAlert").style.display = "block";
    }
}

function toggleAlertRemove() {
    let JSON = getJSON();
    JSON.Settings.Persistent_Alerts = document.getElementById("alert_remove_check").checked;
    setJSON(JSON);
}

function openSettings() {
    let menuBox = document.getElementById("settings_menu");
    if (menuBox.style.display === "block") {
        menuBox.style.display = "none";
    }
    else {
        menuBox.style.display = "block";
    }
}

let nameArrayCheck, nameList;

function setDOMInfo(response) {

    let JSON = getJSON();
    nameList = response;

    if (response == null) {
        document.body.style.height = "200px";
        renderStatus("Open an exchange event page to begin!");
        document.getElementById("all").setAttribute("style", "display:none");
    } else {
        if (isBetfair === false) {
            isBetfair = true;
        }
        renderStatus("What would you like to be notified for?");
        document.getElementById("form").setAttribute("style", "display:block");
        document.getElementById("all").setAttribute("style", "display:block");
    }
    nameArrayCheck = nameList;
    let select = document.getElementById("smarkValues");

    for (let i = 0; i < Object.keys(response.Runners).length; i++) {
        let opt = nameList.Runners[i];
        let name_checker = opt.split(": ");
        if (name_checker.length > 2) {
            opt = name_checker[1] + ": " + name_checker[2];
        }
        let listItem = document.createElement("option");
        listItem.textContent = opt;
        listItem.value = opt;
        select.appendChild(listItem);
    }
    renderBackLay("Back or lay odds?");
    renderOverUnder("Notify me when the odds are...");

    if (Object.keys(JSON.Notifications).length === 0) {
        document.body.style.height = "350px";
        document.getElementById("currentNotif").setAttribute("style", "display:none");
    } else {
        document.getElementById("currentNotif").setAttribute("style", "display:block");
    }
}

function checkJSON() {
    let notifs = getJSON();
    let index = getINDEX();

    if (notifs.Settings.Persistent_Alerts) {
        let isOpen = false;
        let hasChanged = false;
        chrome.tabs.query({}, function (tabs) {
            for (let key in notifs.Notifications) {
                if (notifs.Notifications.hasOwnProperty(key)) {

                    for (let j = 0; j < tabs.length; j++) {
                        if (tabs[j].url === notifs.Notifications[key].url) {
                            isOpen = true;

                        }
                    }
                    if (!isOpen) {
                        isOpen = false;
                        hasChanged = true;
                        delete notifs.Notifications[key];
                        setJSON(notifs);
                        index.splice(index.indexOf(key), 1);
                        setINDEX(index);

                    }


                }
            }

            if (hasChanged) {
                hasChanged = false;
                location.reload();
            }
        });
    }
    if (Object.keys(notifs.Notifications).length !== index.length) {
        if (Object.keys(notifs.Notifications).length > index.length) {

            for (let key in notifs.Notifications) {
                if (notifs.Notifications.hasOwnProperty(key)) {
                    if (index.length === 0) {
                        delete notifs.Notifications[key];
                    } else {
                        inner_loop:
                            for (let i = 0; i < index.length; i++) {
                                if (key === index[i]) {
                                    break inner_loop;
                                } else if (i === index.length - 1) {
                                    delete notifs.Notifications[key];
                                }
                            }
                    }
                }
            }
        } else if (Object.keys(notifs.Notifications).length < index.length) {
            for (let i = 0; i < index.length; i++) {
                inner_loop2:
                    for (let key in notifs.Notifications) {
                        if (notifs.Notifications.hasOwnProperty(key)) {
                            if (key === index[i]) {
                                break inner_loop2;
                            } else if (i === index.length - 1) {
                                index.splice(i, 1);
                            }
                        }
                    }
            }
        }

        setJSON(notifs);
        setINDEX(index);
    }
}

document.addEventListener("DOMContentLoaded", function () {
    chrome.tabs.query({"active": true, "lastFocusedWindow": true}, function (tabs) {

        if (typeof tabs[0].url !== "undefined") {
            urlPage = tabs[0].url;
        }

        if (urlPage.includes("betfair.com/exchange")) {
            document.getElementsByTagName("h1")[0].textContent = "Betfair Alerts";
            isBetfair = true;
        }

        document.getElementById("removeAlert").addEventListener("click", removeListItem);
        document.getElementById("settings_button").addEventListener("click", openSettings);
        document.getElementById("sound_check").addEventListener("click", toggleSound);
        document.getElementById("alert_remove_check").addEventListener("click", toggleAlertRemove);

        if (localStorage.getItem("indexed_alerts") == null) {
            let indexed_alerts = [];
            setINDEX(indexed_alerts);
        }

        let JSON = getJSON();

        if (localStorage.getItem("all_notifications_JSON") == null) {

            let all_notifications_JSON = {
                "Notifications": {},
                "Settings": {"Sound": true, "Persistent_Alerts": true},
                "Temp_data": {
                    "index": null,
                    "name": null,
                    "back": null,
                    "url": null,
                    "exchange": null,
                    "imageurl": null,
                    "event": null,
                    "tabid": null,
                    "windowid": null
                }
            };

            setJSON(all_notifications_JSON);
            location.reload();
        }

        if (urlPage.includes("market") && urlPage.includes("betfair.com/exchange")) {
            setTimeout(function () {
                if (nameList == null) {
                    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
                        chrome.tabs.executeScript(tabs[0].id, {file: "contentscript.js"}, function () {
                            location.reload();
                        });

                    });
                }
            }, 100);
            chrome.tabs.query({
                active: true,
                currentWindow: true
            }, function (tabs) {
                chrome.tabs.sendMessage(
                    tabs[0].id,
                    {from: "popup", subject: "DOMInfo"},
                    function (response) {
                        setDOMInfo(response);
                    });
            });
            checkJSON();

            if (localStorage.getItem("notifJustAdded") === "true") {
                document.getElementById("button").textContent = "Alert added!";
                localStorage.setItem("notifJustAdded", "false");
                setTimeout(function () {
                    document.getElementById("button").textContent = "Set up new alert";
                }, 1000);
            }


            let selection = document.getElementById("existingNotifications");
            let nameChosen = selection.options[selection.selectedIndex].text;
            if (nameChosen.includes("Your existing notifications...")) {
                document.getElementById("removeAlert").style.display = "none";
                document.body.style.height = "350px";
            }


            document.getElementById("button").addEventListener("click", setUpNotify);


            if (JSON.Notifications != null) {
                document.getElementById("existingNotifications").addEventListener("change", toggleRemoveButton);
            }


            if (JSON.Notifications != null) {
                printCurrentNotif();
                removeNotifButton();
            }
        } else {
            renderStatus("Open an exchange event page to begin!");
            checkJSON();
            document.getElementById("all").setAttribute("style", "display:none");
            let notificationsJSON = getJSON();
            if (notificationsJSON.Notifications != null) {
                printCurrentNotif();
                removeNotifButton();
                document.body.style.height = "200px";
            }
        }
    });

    let JSON = getJSON();
    if (localStorage.getItem("isSettingsOpen") === "1") {
        let menuBox = document.getElementById("settings_menu");
        menuBox.style.display = "block";
        localStorage.removeItem("isSettingsOpen");
    }
    if (JSON.Settings.Sound === true) {
        document.getElementById("sound_check").checked = true;
    }
    if (JSON.Settings.Persistent_Alerts === true) {
        document.getElementById("alert_remove_check").checked = true;
    }

    if (JSON.Settings.Sound === false) {
        document.getElementById("sound_check").checked = false;
    }
    if (JSON.Settings.Persistent_Alerts === false) {
        document.getElementById("alert_remove_check").checked = false;
    }
    document.addEventListener("click", function (event) {
        let settingsButton = document.getElementById("settings_button");
        let specifiedElement = document.getElementById("settings_menu");
        let isClickInside = specifiedElement.contains(event.target) || settingsButton.contains(event.target);
        if (!isClickInside && specifiedElement.style.display === "block") {
            specifiedElement.style.display = "none";
        }

    });
});

chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
    if ((msg.from === "bg") && (msg.subject === "grabNotifData")) {
        sendResponse(nameChosen);
    }

    if ((msg.from === "bg") && (msg.subject === "refreshPage")) {
        location.reload();
        sendResponse(true);
    }
});
window.onload = function () {
    let removeNotification = localStorage.getItem("removeNotification");

    if (removeNotification === "true") {
        removeNotify();
    }
};

