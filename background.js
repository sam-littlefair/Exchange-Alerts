var current_notifications = [];

chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
 if ((msg.from === 'content') && (msg.subject === 'odds_update')) {
	var notifications = localStorage.getItem("all_notifications_JSON");
	notifications = JSON.parse(notifications);
	console.log("trig");
	var get_odds = notifications.Notifications[msg.id].odds;
	var isOverUnder = notifications.Notifications[msg.id].exactly;
	console.log(isOverUnder + get_odds + " " + msg.odds);
	if(isOverUnder == "Exactly"){
		if(get_odds == msg.odds){
			if(current_notifications.includes(msg.id)){
				sendResponse(null);
			}else{
				send_Alert(msg.id, msg.odds, notifications);
				current_notifications[current_notifications.length] = msg.id;		
				sendResponse(msg.id);				
			}
		}else{
			sendResponse(null);
		}
	}
	else if(isOverUnder == "Under"){
		if(get_odds >= msg.odds){
			if(current_notifications.includes(msg.id)){
				sendResponse(null);
			}else{
				send_Alert(msg.id, msg.odds, notifications);
				current_notifications[current_notifications.length] = msg.id;		
				sendResponse(msg.id);				
			}
		}else{
			sendResponse(null);
		}
	}
	else if(isOverUnder == "Over"){
		if(get_odds <= msg.odds){
			if(current_notifications.includes(msg.id)){
				sendResponse(null);
			}else{
				send_Alert(msg.id, msg.odds, notifications);
				current_notifications[current_notifications.length] = msg.id;		
				sendResponse(msg.id);				
			}
		}else{
			sendResponse(null);
		}
	}else{
		sendResponse(null);
	}
  }
  
  if ((msg.from === 'content') && (msg.subject === 'get_notif_data')) {
	  var notifications = localStorage.getItem("all_notifications_JSON");
	  var indexed_alerts = localStorage.getItem("indexed_alerts");
	  sendResponse({notif:notifications,index:indexed_alerts});
  }
    if ((msg.from === 'content') && (msg.subject === 'set_notif_data')) {
		localStorage.setItem("all_notifications_JSON", msg.notification);

  }
  
    if ((msg.from === 'content') && (msg.subject === 'get_tab_data')) {
	var tabid;
	chrome.tabs.query({url: msg.url}, function(tabs) {

           tabid = tabs[0].id;
		   windowid = tabs[0].windowId;
		
		setTimeout(function(){ var notifications = JSON.parse(localStorage.getItem("all_notifications_JSON"));
		notifications["Temp_data"]["tabid"] = tabid;
		notifications["Temp_data"]["windowid"] = windowid;
		notifications = JSON.stringify(notifications);
		localStorage.setItem("all_notifications_JSON", notifications);
		},1000);
		
	});
	
	
	}
	
	 if(msg.from == "content" && msg.subject == "create_menu") {
		pageX = msg.pageX;
		pageY = msg.pageY;
        chrome.contextMenus.removeAll(function() {
            chrome.contextMenus.create({
			  title: "Create Alert", 
			  contexts:["page"], 
			  onclick: openPopup,
			});
        });
    }
	
	if(msg.from == "content" && msg.subject == "delete_menu") {
        chrome.contextMenus.removeAll();
    }

});

function send_Alert(id, odds, notifications){

	var notification = localStorage.getItem("all_notifications_JSON");
	notification = JSON.parse(notification);
	
	isSoundEnabled = notification.Settings.Sound;
	var isBack;
	if(notifications.Notifications[id].back == true){
		isBack = "Back";
	}else{
		isBack = "Lay";
	}
	var isBetfair;
	if(notifications.Notifications[id].exchange = "Betfair"){
		isBetfair = "betfair.png";
	}else{
		isBetfair = "smarkets.png";
	}
	
	var alertname = notifications.Notifications[id].name.split(":").pop().trim();
	
	var tabid = notifications.Notifications[id].tabid;
	var windowid = notifications.Notifications[id].windowid;
	console.log(tabid + " " + windowid);
	var options = {
					body: isBack + " odds for " + alertname + " are now " + odds,
					icon: isBetfair,
					requireInteraction: true,
					tag: id
				}
				notification = new Notification(notifications.Notifications[id].exchange + " Price Alert!", options);
				if(isSoundEnabled == true){
					var audio = new Audio('ding.mp3');
					audio.play();
				}


		notification.onclose = function(event){
				removeListItem(id);
				current_notifications.splice(current_notifications.indexOf(id), 1);
			}
		notification.onclick = function() { 
				removeListItem(id);
				
			chrome.windows.update(windowid, {focused: true});
			
			chrome.tabs.query({url: notifications.Notifications[id].url}, function (tabs) {
				chrome.tabs.highlight({'tabs': tabs[0].index}, function() {});
				
			});
			
			chrome.tabs.sendMessage(tabid, {from: 'bg', subject: 'auto_click', remove_id: id}, function(response){});
			current_notifications.splice(current_notifications.indexOf(id), 1);
			notification.close();
		}

}

function removeListItem(id){

		var indexs = localStorage.getItem("indexed_alerts");
		indexs = JSON.parse(indexs);
		
		var index_list = indexs.indexOf(id);
		var string_to_remove = indexs[index_list];

		var notifications = localStorage.getItem("all_notifications_JSON");
		notifications = JSON.parse(notifications);
		var tabid = notifications.Notifications[string_to_remove].tabid;
		
		
		delete notifications.Notifications[string_to_remove];
		indexs.splice(index_list, 1);
		
		indexs = JSON.stringify(indexs);
		localStorage.setItem("indexed_alerts", indexs);
		
		notifications = JSON.stringify(notifications);
		localStorage.setItem("all_notifications_JSON", notifications);
		
		chrome.runtime.sendMessage({from: 'bg', subject: 'refreshPage'}, function(response){});
		setTimeout(function(){chrome.tabs.sendMessage(tabid, {from: 'popup', subject: 'removeTag', remove_id: id})}, function(response){}, 2000);
	}


var pageX, pageY;

function openPopup(){
	chrome.contextMenus.removeAll();
	var win = window.open("small_popup.html", "extension_popup", "width=250,height=250,status=no,scrollbars=no,resizable=no");
	win.moveTo(pageX + 40, pageY + 30);
}

