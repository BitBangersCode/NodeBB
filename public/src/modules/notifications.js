'use strict';

/* globals define, socket, translator, utils, config, app, ajaxify, Tinycon*/


define(['sounds'], function(sound) {
	var Notifications = {};

	Notifications.prepareDOM = function() {
		var notifContainer = $('.notifications'),
			notifTrigger = notifContainer.children('a'),
			notifList = $('#notif-list'),
			notifIcon = $('.notifications > a > i');

		notifTrigger.on('click', function(e) {
			e.preventDefault();
			if (!notifContainer.hasClass('open')) {

				socket.emit('notifications.get', null, function(err, data) {

					function createNotification(notification, callback) {
						if (notification.image) {
							image = '<img class="image" src="' + notification.image + '" />';
						} else {
							image = '';
						}

						return '<li class="' + (notification.readClass || '') + '"><a href="' + notification.path + '">' + image + '<span class="pull-right relTime">' + utils.relativeTime(notification.datetime, true) + '</span><span class="text">' + notification.text + '</span></a></li>';
					}

					var	x, html = '';

					if (!err && (data.read.length + data.unread.length) > 0) {
						var	image = '';
						for (x = 0; x < data.unread.length; x++) {
							html += createNotification(data.unread[x]);
						}

						for (x = 0; x < data.read.length; x++) {
							html += createNotification(data.read[x]);
						}

						addSeeAllLink();

					} else {
						html += '<li class="no-notifs"><a>[[notifications:no_notifs]]</a></li>';
						addSeeAllLink();
					}

					function addSeeAllLink() {
						html += '<li class="pagelink"><a href="' + config.relative_path + '/notifications">[[notifications:see_all]]</a></li>';
					}


					translator.translate(html, function(translated) {
						notifList.html(translated);
					});


					updateNotifCount(data.unread.length);

					socket.emit('modules.notifications.mark_all_read', null, function(err) {
						if (!err) {
							updateNotifCount(0);
						}
					});
				});
			}
		});

		var	updateNotifCount = function(count) {
			if (count > 0) {
				notifIcon.removeClass('fa-bell-o').addClass('fa-bell');
			} else {
				notifIcon.removeClass('fa-bell').addClass('fa-bell-o');
			}

			notifIcon.toggleClass('unread-count', count > 0);
			notifIcon.attr('data-content', count > 20 ? '20+' : count);

			Tinycon.setBubble(count);
			localStorage.setItem('notifications:count', count);
		};

		socket.emit('notifications.getCount', function(err, count) {
			if (!err) {
				updateNotifCount(count);
			} else {
				updateNotifCount(0);
			}
		});

		socket.on('event:new_notification', function() {

			app.alert({
				alert_id: 'new_notif',
				title: '[[notifications:new_notification]]',
				message: '[[notifications:you_have_unread_notifications]]',
				type: 'warning',
				timeout: 2000
			});
			app.refreshTitle();

			if (ajaxify.currentPage === 'notifications') {
				ajaxify.refresh();
			}

			var	savedCount = parseInt(localStorage.getItem('notifications:count'), 10) || 0;
			updateNotifCount(savedCount + 1);

			sound.play('notification');
		});
		socket.on('event:notifications.updateCount', function(count) {
			updateNotifCount(count);
		});
	};

	return Notifications;
});
