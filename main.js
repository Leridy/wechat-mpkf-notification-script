// ==UserScript==
// @name         客服通知脚本
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://mpkf.weixin.qq.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    try{
        function makeNotice(type, DOMList) {
            let notification = null;
            if (type === 'body') {
                const informData = {
                    message: null,
                    time: null,
                    user: null,
                    icon: null,
                    sendFlag: null,
                }
                const message = {
                    title: '',
                    body: '',
                }
                DOMList.forEach(ele => {
                    // if(ele.target.className === 'card_content_detail') informData.message = ele.target.innerText;
                    // if(ele.target.className === 'card_content_time') informData.time = ele.target.innerText;
                    if(ele.target.className === 'card_message_state'){
                        // informData.user = ele.target.previousElementSibling.innerText;
                        informData.sendFlag = parseInt(ele.target.innerHTML, 10) > 0;
                    }
                    // console.log(informData);
                    if(ele.target.className === 'card_content_time') {
                        const outerNode = ele.target.parentNode.parentNode.parentNode
                        // console.log(outerNode);
                        informData.icon = outerNode.childNodes[0].childNodes[0].src;
                        informData.user = outerNode.childNodes[1].childNodes[0].childNodes[0].innerText;
                        informData.message = outerNode.childNodes[1].childNodes[1].childNodes[0].innerText;
                        informData.time = ele.target.innerText;
                    }
                    // console.log(DOMList)
                })
                if ( informData.message !== null && informData.time !== null && informData.user !== null && informData.icon && informData.sendFlag ) {
                    message.title = `${informData.user} 的新消息 - 微信客服`
                    message.body = `${informData.time} : ${informData.message}`
                    message.icon = informData.icon;
                    notification = new Notification(message.title, wechatNotificationOption(message.body, message.icon, message.icon));
                }
            } else {
                const {removedNodes: [removeItem], addedNodes:[addItem], target} = DOMList.pop();
                // console.log(removeItem, addItem, target);
                // console.log(DOMList);
                const oldValue = removeItem === undefined ? '' : removeItem.data || removeItem.innerHTML;
                const newValue = addItem === undefined ? '' : addItem.data || addItem.innerHTML;
                if (typeof parseInt(oldValue, 10) === 'number' && typeof parseInt(newValue, 10) === 'number' && oldValue < newValue) {
                    let notice = null;
                    switch (type) {
                        case 'replyNeed':
                            notice = wechatNotificationOption('有新的消息待回复');
                            break;
                        case 'importNeed':
                            notice = wechatNotificationOption('有新的用户需要接入');
                            break;
                        default:
                            break;
                    }
                    notification = new Notification('微信公众平台客服通知', notice);
                }
            }
            if( notification instanceof Notification) {
                notification.onclick = (event) => { window.focus() }
            }
        }

        const wechatNotificationOption = (body, icon = undefined, image = undefined) => {
            return {
                tag: Math.random() * 100,
                body,
                icon,
                image,
            }
        }

        class WechatServerNotify {

            constructor() {
                // console.log(this);
                //  window.makeNotice = this.makeNotice;
                //  window.importNotice = this.importNotice;
                //  window.replayNotice = this.replayNotice
            }

            getRequiredDOM() {
                let replyInformDOM = null;
                let importInformDOM = null;
                const requiredDOM = document.querySelectorAll('.tab_item');
                requiredDOM.forEach((ele) => {
                    if (ele.innerHTML.indexOf('回复') !== -1) replyInformDOM = ele;
                    if (ele.innerHTML.indexOf('接入') !== -1) importInformDOM = ele;
                })
                return { replyInformDOM, importInformDOM }
            }

            obDynamicDOM() {
                const { getRequiredDOM, importNotice, replayNotice, bodyObserver } = this;
                // 需要回复的消息更新提醒监听器
                const { replyInformDOM, importInformDOM } = getRequiredDOM();
                const needReplyObserver = new MutationObserver(replayNotice);
                // 需要引入的提醒监听器
                const needImportObserver = new MutationObserver(importNotice);
                const bodyChangeObserver = new MutationObserver(bodyObserver);
                bodyChangeObserver.observe(document.body, { childList: true, subtree: true, characterData: true, characterDataOldValue:true })
                needReplyObserver.observe(replyInformDOM, { characterData: true, subtree: true, childList:true });
                needImportObserver.observe(importInformDOM, { characterData: true, subtree:true, childList:true });
            }

            importNotice(...args) {
                console.log('需要接入');
                makeNotice('importNeed', ...args);
            }

            replayNotice(...args) {
                console.log('需要回复');
                makeNotice('replyNeed', ...args);
            }

            bodyObserver(...args) {
                console.log('body 改变');
                makeNotice('body', ...args);
            }

            checkAndRequestNotification() {
                // 先检查浏览器是否支持
                if (!("Notification" in window)) {
                    alert("你的浏览器不支持通知");
                }

                // 检查用户是否同意接受通知
                else if (Notification.permission === "granted") {
                    // If it's okay let's create a notification
                    const notification = new Notification("微信小程序客服消息", wechatNotificationOption('已经通过权限请求，测试消息'));
                }

                // 否则我们需要向用户获取权限
                else if (Notification.permission !== 'denied') {
                    Notification.requestPermission(function (permission) {
                        // 如果用户同意，就可以向他们发送通知
                        if (permission === "granted") {
                            const notification = new Notification("微信小程序客服消息", wechatNotificationOption('已经通过权限请求，测试消息'));
                        }
                    });
                } else {
                    alert('不开通知，小心扣工资');
                }


                // 最后，如果执行到这里，说明用户已经拒绝对相关通知进行授权
                // 出于尊重，我们不应该再打扰他们了
            }

        }

        const dd = new WechatServerNotify();
        dd.checkAndRequestNotification();
        dd.obDynamicDOM();
    } catch (e) {
        console.log(e)
    }

    // Your code here...
})();