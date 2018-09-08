let current_notifications = [];
let pageX, pageY;

function send_Alert(id, odds, notifications) {

    let notification = localStorage.getItem("all_notifications_JSON");
    notification = JSON.parse(notification);

    let isSoundEnabled = notification.Settings.Sound;
    let isBack;
    if (notifications.Notifications[id].back === true) {
        isBack = "Back";
    } else {
        isBack = "Lay";
    }
    let isBetfair;
    if (notifications.Notifications[id].exchange = "Betfair") {
        isBetfair = "betfair.png";
    } else {
        isBetfair = "smarkets.png";
    }

    let alertname = notifications.Notifications[id].name.split(":").pop().trim();

    let tabid = notifications.Notifications[id].tabid;
    let windowid = notifications.Notifications[id].windowid;
    let options = {
        body: isBack + " odds for " + alertname + " are now " + odds,
        icon: isBetfair,
        requireInteraction: true,
        tag: id
    };
    notification = new Notification(notifications.Notifications[id].exchange + " Price Alert!", options);
    if (isSoundEnabled === true) {
        let audio = new Audio("ding.mp3");
        audio.play();
    }


    notification.onclose = function () {
        removeListItem(id);
        current_notifications.splice(current_notifications.indexOf(id), 1);
    };
    notification.onclick = function () {
        removeListItem(id);

        chrome.windows.update(windowid, {focused: true});

        chrome.tabs.query({url: notifications.Notifications[id].url}, function (tabs) {
            chrome.tabs.highlight({"tabs": tabs[0].index}, function () {
            });

        });

        chrome.tabs.sendMessage(tabid, {from: "bg", subject: "auto_click", remove_id: id}, function (response) {
        });
        current_notifications.splice(current_notifications.indexOf(id), 1);
        notification.close();
    }

}

function openPopup() {
    chrome.contextMenus.removeAll();
    let win = window.open("small_popup.html", "extension_popup", "width=250,height=250,status=no,scrollbars=no,resizable=no");
    win.moveTo(pageX + 40, pageY + 30);
}

chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
    let notifications;
    if ((msg.from === "content") && (msg.subject === "odds_update")) {
        notifications = localStorage.getItem("all_notifications_JSON");
        notifications = JSON.parse(notifications);
        let get_odds = notifications.Notifications[msg.id].odds;
        let isOverUnder = notifications.Notifications[msg.id].exactly;
        if (isOverUnder === "Exactly") {
            if (get_odds === msg.odds) {
                if (current_notifications.includes(msg.id)) {
                    sendResponse(null);
                } else {
                    send_Alert(msg.id, msg.odds, notifications);
                    current_notifications[current_notifications.length] = msg.id;
                    sendResponse(msg.id);
                }
            } else {
                sendResponse(null);
            }
        }
        else if (isOverUnder === "Under") {
            if (get_odds >= msg.odds) {
                if (current_notifications.includes(msg.id)) {
                    sendResponse(null);
                } else {
                    send_Alert(msg.id, msg.odds, notifications);
                    current_notifications[current_notifications.length] = msg.id;
                    sendResponse(msg.id);
                }
            } else {
                sendResponse(null);
            }
        }
        else if (isOverUnder === "Over") {
            if (get_odds <= msg.odds) {
                if (current_notifications.includes(msg.id)) {
                    sendResponse(null);
                } else {
                    send_Alert(msg.id, msg.odds, notifications);
                    current_notifications[current_notifications.length] = msg.id;
                    sendResponse(msg.id);
                }
            } else {
                sendResponse(null);
            }
        } else {
            sendResponse(null);
        }
    }

    if ((msg.from === "content") && (msg.subject === "get_notif_data")) {
        notifications = localStorage.getItem("all_notifications_JSON");
        let indexedAlerts = localStorage.getItem("indexed_alerts");
        sendResponse({notif: notifications, index: indexedAlerts});
    }
    if ((msg.from === "content") && (msg.subject === "set_notif_data")) {
        localStorage.setItem("all_notifications_JSON", msg.notification);

    }

    if ((msg.from === "content") && (msg.subject === "get_tab_data")) {
        let tabid, windowid;
        chrome.tabs.query({url: msg.url}, function (tabs) {

            tabid = tabs[0].id;
            windowid = tabs[0].windowId;

            setTimeout(function () {
                notifications = JSON.parse(localStorage.getItem("all_notifications_JSON"));
                notifications["Temp_data"]["tabid"] = tabid;
                notifications["Temp_data"]["windowid"] = windowid;
                notifications = JSON.stringify(notifications);
                localStorage.setItem("all_notifications_JSON", notifications);
            }, 1000);

        });


    }

    if (msg.from === "content" && msg.subject === "create_menu") {
        pageX = msg.pageX;
        pageY = msg.pageY;
        chrome.contextMenus.removeAll(function () {
            chrome.contextMenus.create({
                title: "Create Alert",
                contexts: ["page"],
                onclick: openPopup,
            });
        });
    }

    if (msg.from === "content" && msg.subject === "delete_menu") {
        chrome.contextMenus.removeAll();
    }

});


function removeListItem(id) {

    let indexs = localStorage.getItem("indexed_alerts");
    indexs = JSON.parse(indexs);

    let index_list = indexs.indexOf(id);
    let string_to_remove = indexs[index_list];

    let notifications = localStorage.getItem("all_notifications_JSON");
    notifications = JSON.parse(notifications);
    let tabid = notifications.Notifications[string_to_remove].tabid;


    delete notifications.Notifications[string_to_remove];
    indexs.splice(index_list, 1);

    indexs = JSON.stringify(indexs);
    localStorage.setItem("indexed_alerts", indexs);

    notifications = JSON.stringify(notifications);
    localStorage.setItem("all_notifications_JSON", notifications);

    chrome.runtime.sendMessage({from: "bg", subject: "refreshPage"}, function (response) {
    });
    setTimeout(function () {
        chrome.tabs.sendMessage(tabid, {from: "popup", subject: "removeTag", remove_id: id})
    }, function (response) {
    }, 2000);
}