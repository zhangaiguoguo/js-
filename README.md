# js-BroadcastChannel
浏览器同网站标签页之间通信（无兼容问题）
// 创建一个同ip跨标签页通信的实例 @arguments [ key/实例标识/ , options?/配置项/{sendSelf:boolean/当触发订阅的事件，通知别的标签页时，是否一起触发当前窗口所订阅的事件/}]
currenBroadcastChannel = createBroadcastChannel();
//subscribe 订阅一个事件 arguments[key,callback]
currenBroadcastChannel.subscribe(useGlobalNoticeRef("dict"), function(message) {
    updateCurrentDictData(message.dictType, message.newValue);
});

currenBroadcastChannel.subscribe(useGlobalNoticeRef("sampleCategory"), function() {
    sampleCategoryStore().getSampleCategory();
});
//触发订阅的事件 {type:"订阅key",message:object/*发送的数据*/,broadcastChannelName/实例名称/,sendSelf/是否也通知本标签页所订阅的事件/}
// currenBroadcastChannel.dispatch({
//     type:"xxxx",
//     message:{},
//     broadcastChannelName?:'xxx',
//     sendSelf:boolean
// })
