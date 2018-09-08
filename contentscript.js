chrome.runtime.sendMessage({
    from: "content",
    subject: "showPageAction"
});

let observer_array = [];
let observer = [];

function hasChanged(target, type) {
    let source;

    if (type === "characterData") {
        source = target;
    } else {
        source = target.firstChild;
    }

    let odds = source.textContent;
    let id_list = target.parentNode.classList;

    if (id_list.contains("mv-bet-button-info")) {
        id_list = target.parentNode.getElementsByClassName("bet-button-price")[0].classList;
    }

    for (let i = 0; i < id_list.length; i++) {
        let current_id = id_list.item(i);
        if (id_list.item(i) !== "clicked_element_class" && current_id !== "clicked_element" && current_id !== "bet-button-price") {
            chrome.runtime.sendMessage({
                from: "content",
                subject: "odds_update",
                odds: odds,
                id: id_list.item(i)
            }, function (response) {

                if (response !== null) {

                    let class_List = document.getElementsByClassName(response)[0].classList;
                    let disconnect = false;
                    if (class_List.contains("clicked_element_class")) {
                        disconnect = class_List.length <= 3;
                    } else {
                        disconnect = class_List.length <= 1;
                    }
                    if (disconnect) {
                        let target_remove = document.getElementsByClassName(response)[0];

                        observer[observer_array.indexOf(target_remove)].disconnect();
                        let ind = observer_array.indexOf(target);
                        observer.splice(ind, 1);
                        observer_array.splice(ind, 1);
                    }
                }
            });
        }
    }
}

setTimeout(function () {
    let urlPage = location.href;
    chrome.runtime.sendMessage({from: "content", subject: "get_notif_data"}, function (response) {
        let notifications = JSON.parse(response.notif);
        let indexed_alerts = JSON.parse(response.index);
        if (notifications.Settings.Persistent_Alerts) {

            for (let i = 0; i < indexed_alerts.length; i++) {
                if (notifications.Notifications[indexed_alerts[i]].url === urlPage) {
                    if (document.getElementsByClassName(indexed_alerts[i])[0] === null) {
                        let runners_array = document.querySelectorAll(".runner-line:not(.removed-runner)");
                        let index = notifications.Notifications[indexed_alerts[i]].index;
                        let id = indexed_alerts[i];
                        let back;
                        if (notifications.Notifications[indexed_alerts[i]].back === true) {
                            back = "back";
                        } else {
                            back = "lay";
                        }

                        observer[observer.length] = new MutationObserver(function (mutations) {
                            mutations.forEach(function () {

                                hasChanged(mutations[0].target, mutations[0].type);

                            });
                        });

                        let config = {childList: true, characterData: true, attributes: true, subtree: true};
                        let main_market = document.getElementsByClassName("main-mv-container")[0];
                        let main_count = main_market.getElementsByClassName("runner-line").length;
                        let target, odds;
                        if (index < main_count) {
                            if (back === "back") {
                                target = runners_array[index].getElementsByClassName("bet-button-price")[2];
                                runners_array[index].getElementsByClassName("bet-button-price")[2].classList.add(id);
                                observer[observer.length - 1].observe(target, config);
                                observer_array[observer.length - 1] = target;
                                odds = runners_array[index].getElementsByClassName("bet-button-price")[2].firstChild.textContent;
                            } else {
                                target = runners_array[index].getElementsByClassName("bet-button-price")[3];
                                runners_array[index].getElementsByClassName("bet-button-price")[3].classList.add(id);
                                observer[observer.length - 1].observe(target, config);
                                observer_array[observer.length - 1] = target;
                                odds = runners_array[index].getElementsByClassName("bet-button-price")[3].firstChild.textContent;
                            }
                        } else {
                            if (back === "back") {
                                target = runners_array[index].getElementsByClassName("bet-button-price")[0];
                                runners_array[index].getElementsByClassName("bet-button-price")[0].classList.add(id);
                                observer[observer.length - 1].observe(target, config);
                                observer_array[observer.length - 1] = target;
                                odds = runners_array[index].getElementsByClassName("bet-button-price")[0].firstChild.textContent;
                            } else {
                                target = runners_array[index].getElementsByClassName("bet-button-price")[1];
                                runners_array[index].getElementsByClassName("bet-button-price")[1].classList.add(id);
                                observer[observer.length - 1].observe(target, config);
                                observer_array[observer.length - 1] = target;
                                odds = runners_array[index].getElementsByClassName("bet-button-price")[1].firstChild.textContent;
                            }
                        }

                        chrome.runtime.sendMessage({
                            from: "content",
                            subject: "odds_update",
                            odds: odds,
                            id: id
                        }, function (response) {

                            if (response !== null) {
                                let class_List = document.getElementsByClassName(id)[0].classList;
                                let disconnect = false;
                                if (class_List.contains("clicked_element_class")) {
                                    disconnect = class_List.length <= 3;
                                } else {
                                    disconnect = class_List.length <= 1;
                                }
                                if (disconnect) {
                                    target = document.getElementsByClassName(id)[0];
                                    observer[observer_array.indexOf(target)].disconnect();
                                    observer.splice(ind, 1);
                                    observer_array.splice(ind, 1);
                                }
                            }
                        });
                    }
                }
            }
        }
    });
}, 5000);


chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
    let url = window.location.href;

    if ((msg.from === "popup") && (msg.subject === "removeTag")) {
        let id = msg.remove_id;
        let target = document.getElementsByClassName(id)[0];

        let ind = observer_array.indexOf(target);
        document.getElementsByClassName(id)[0].classList.remove(id);
        observer.splice(ind, 1);
        observer_array.splice(ind, 1);
        sendResponse(true);
    }

    if ((msg.from === "bg") && (msg.subject === "auto_click")) {
        let id = msg.remove_id;
        document.getElementsByClassName(id)[0].click();
        setTimeout(function () {
            document.getElementsByClassName("size-input")[0].focus()
        }, 200);
        sendResponse(true);
    }

    let eventName;
    if (document.getElementsByClassName("venue-name").length > 0) {
        eventName = document.getElementsByClassName("venue-name")[0].textContent;
        eventName = eventName.trim();
    } else if (document.getElementsByClassName("event-header").length > 0) {
        eventName = document.getElementsByClassName("event-header")[0].firstChild.firstChild.textContent;
    } else if (document.getElementsByClassName("title avb").length > 0) {
        eventName = document.getElementsByClassName("title avb")[0].childNodes[0].textContent + " vs. " + document.getElementsByClassName("title avb")[0].childNodes[4].textContent;
    } else if (document.getElementsByClassName("title runners").length > 0) {
        eventName = document.getElementsByClassName("title runners")[0].getElementsByClassName("runner-name")[0].textContent + " vs. " + document.getElementsByClassName("title runners")[0].getElementsByClassName("runner-name")[1].textContent;
    }
    if ((msg.from === "popup") && (msg.subject === "getEventName")) {

        sendResponse(eventName);
    }

    let runners_JSON = {"Runners": {}};

    let runners_array = document.querySelectorAll(".runner-line:not(.removed-runner)");
    let runner_names = [];
    let category_names = [];
    if (document.getElementsByClassName("market-type").length > 0) {
        let main_market = document.getElementsByClassName("main-mv-container")[0];
        let main_count = main_market.getElementsByClassName("runner-line").length;
        for (let i = 0; i < main_count; i++) {
            category_names[i] = document.getElementsByClassName("market-type")[0].textContent;
        }
        let cat_length = [];
        let category = document.getElementsByClassName("mini-mv");
        for (let i = 0; i < category.length; i++) {
            cat_length[i] = category[i].getElementsByClassName("runner-name").length;
        }
        let count = main_count - 1;
        for (let p = 0; p < category.length; p++) {
            for (let j = 0; j < cat_length[p]; j++) {
                count += 1;
                category_names[count] = category[p].getElementsByClassName("market-name-label")[0].textContent;
            }
        }
    }


    if (msg.from === "popup" && msg.subject === "DOMInfo") {
        for (let i = 0; i < runners_array.length; i++) {
            if (url.includes("horse-racing")) {
                runner_names[i] = runners_array[i].getElementsByClassName("runner-name")[0].firstChild.textContent;
            } else {
                runner_names[i] = runners_array[i].getElementsByClassName("runner-name")[0].textContent;
            }
        }

        for (let i = 0; i < runners_array.length; i++) {
            if (document.getElementsByClassName("market-type").length > 0) {
                runners_JSON.Runners[i] = eventName + ": " + category_names[i] + ": " + runner_names[i];
            } else {
                runners_JSON.Runners[i] = eventName + ": " + runner_names[i];
            }
        }

        sendResponse(runners_JSON);
    }


    if (msg.from === "popup" && msg.subject === "setUpListener") {
        let main_market = document.getElementsByClassName("main-mv-container")[0];
        let main_count = main_market.getElementsByClassName("runner-line").length;


        let back = msg.backLay;
        let index = msg.index;


        observer[observer.length] = new MutationObserver(function (mutations) {
            mutations.forEach(function () {
                hasChanged(mutations[0].target, mutations[0].type);
            });
        });


        let config = {childList: true, characterData: true, attributes: true, subtree: true};


        if (document.getElementsByClassName(msg.id)[0] === null) {
            let odds;
            let target;

            if (index < main_count) {
                if (back === "back") {
                    target = runners_array[index].getElementsByClassName("bet-button-price")[2];
                    runners_array[index].getElementsByClassName("bet-button-price")[2].classList.add(msg.id);
                    observer[observer.length - 1].observe(target, config);
                    observer_array[observer.length - 1] = target;
                    odds = runners_array[index].getElementsByClassName("bet-button-price")[2].firstChild.textContent;
                } else {
                    target = runners_array[index].getElementsByClassName("bet-button-price")[3];
                    runners_array[index].getElementsByClassName("bet-button-price")[3].classList.add(msg.id);
                    observer[observer.length - 1].observe(target, config);
                    observer_array[observer.length - 1] = target;
                    odds = runners_array[index].getElementsByClassName("bet-button-price")[3].firstChild.textContent;
                }
            } else {
                if (back === "back") {
                    target = runners_array[index].getElementsByClassName("bet-button-price")[0];
                    runners_array[index].getElementsByClassName("bet-button-price")[0].classList.add(msg.id);
                    observer[observer.length - 1].observe(target, config);
                    observer_array[observer.length - 1] = target;
                    odds = runners_array[index].getElementsByClassName("bet-button-price")[0].firstChild.textContent;
                } else {
                    target = runners_array[index].getElementsByClassName("bet-button-price")[1];
                    runners_array[index].getElementsByClassName("bet-button-price")[1].classList.add(msg.id);
                    observer[observer.length - 1].observe(target, config);
                    observer_array[observer.length - 1] = target;
                    odds = runners_array[index].getElementsByClassName("bet-button-price")[1].firstChild.textContent;
                }
            }

            sendResponse(true);

            chrome.runtime.sendMessage({
                from: "content",
                subject: "odds_update",
                odds: odds,
                id: msg.id
            }, function (response) {

                if (response !== null) {

                    let class_List = document.getElementsByClassName(msg.id)[0].classList;
                    let disconnect = false;
                    if (class_List.contains("clicked_element_class")) {
                        disconnect = class_List.length <= 3;
                    } else {
                        disconnect = class_List.length <= 1;
                    }
                    if (disconnect) {
                        target = document.getElementsByClassName(msg.id)[0];
                        let ind = observer_array.indexOf(target);
                        observer[ind].disconnect();
                        observer.splice(ind, 1);
                        observer_array.splice(ind, 1);
                    }
                }
            });
        }
    }
});

let pageX, pageY;
document.addEventListener("mousedown", function (event) {

    pageX = event.pageX;
    pageY = event.pageY;
    let element_div = event.srcElement;
    let selection = element_div.className;
    if (document.getElementById("clicked_element") !== null) {
        document.getElementById("clicked_element").removeAttribute("id");
        document.getElementsByClassName("clicked_element_class")[0].classList.remove("clicked_element_class");
    }

    if (selection.includes("mv-bet-button")) {
        chrome.runtime.sendMessage({
            from: "content",
            subject: "create_menu",
            pageX: pageX,
            pageY: pageY
        }, function (response) {
        });
        element_div = element_div.getElementsByClassName("bet-button-price")[0];
        element_div.setAttribute("id", "clicked_element");
        element_div.className += " clicked_element_class";
        setUpTempData(element_div);
    }
    else if (selection.includes("bet-button-price") || selection.includes("bet-button-size")) {
        chrome.runtime.sendMessage({
            from: "content",
            subject: "create_menu",
            pageX: pageX,
            pageY: pageY
        }, function (response) {
        });
        element_div.setAttribute("id", "clicked_element");
        element_div.className += " clicked_element_class";
        setUpTempData(element_div);
    } else {
        chrome.runtime.sendMessage({from: "content", subject: "delete_menu"}, function (response) {
        });
    }

}, true);

function setUpTempData(element_div) {
    let url = window.location.href;
    chrome.runtime.sendMessage({from: "content", subject: "get_tab_data", url: url}, function (response) {

    });

    let eventName, imageurl;
    if (document.getElementsByClassName("venue-name").length > 0) {
        eventName = document.getElementsByClassName("venue-name")[0].textContent;
        eventName = eventName.trim();
    } else if (document.getElementsByClassName("event-header").length > 0) {
        eventName = document.getElementsByClassName("event-header")[0].firstChild.firstChild.textContent;
    } else if (document.getElementsByClassName("title avb").length > 0) {
        eventName = document.getElementsByClassName("title avb")[0].childNodes[0].textContent + " vs. " + document.getElementsByClassName("title avb")[0].childNodes[4].textContent;
    } else if (document.getElementsByClassName("title runners").length > 0) {
        eventName = document.getElementsByClassName("title runners")[0].getElementsByClassName("runner-name")[0].textContent + " vs. " + document.getElementsByClassName("title runners")[0].getElementsByClassName("runner-name")[1].textContent;
    }

    eventName = eventName.trim();
    let runners = document.querySelectorAll(".runner-line:not(.removed-runner)");
    let actual_runner, index;
    if (document.getElementById("clicked_element") !== null) {
        for (let i = 0; i < runners.length; i++) {
            if (runners[i].getElementsByClassName("clicked_element_class").length !== 0) {
                actual_runner = runners[i];
                index = i;
                break;
            }
        }
    }

    if (actual_runner.getElementsByClassName("horse-racing-silk").length > 0) {
        imageurl = actual_runner.getElementsByClassName("horse-racing-silk")[0].src;
    } else {
        imageurl = "none";
    }

    let runnerName = actual_runner.getElementsByClassName("runner-name")[0].firstChild.textContent;
    let backLay;
    let odds_all = actual_runner.getElementsByClassName("mv-bet-button-info");

    for (let i = 0; i < odds_all.length; i++) {
        if (odds_all[i].getElementsByClassName("clicked_element_class").length > 0) {
            let main_market = document.getElementsByClassName("main-mv-container")[0];
            let main_count = main_market.getElementsByClassName("runner-line").length;

            if (index < main_count) {
                if (i < 3) {
                    backLay = "back";

                } else {
                    backLay = "lay";
                }
                break;
            } else {
                if (i < 1) {
                    backLay = "back";

                } else {
                    backLay = "lay";
                }
            }
        }
    }


    let exchange;
    if (url.includes("betfair")) {
        exchange = "Betfair";
    } else {
        exchange = "Smarkets";
    }

    chrome.runtime.sendMessage({from: "content", subject: "get_notif_data"}, function (response) {
        let notification = JSON.parse(response.notif);
        notification["Temp_data"]["index"] = index;
        notification["Temp_data"]["name"] = runnerName;
        notification["Temp_data"]["back"] = backLay;
        notification["Temp_data"]["url"] = url;
        notification["Temp_data"]["exchange"] = exchange;
        notification["Temp_data"]["imageurl"] = imageurl;
        notification["Temp_data"]["event"] = eventName;

        notification = JSON.stringify(notification);
        chrome.runtime.sendMessage({
            from: "content",
            subject: "set_notif_data",
            notification: notification
        }, function (response) {
        });
    });

}