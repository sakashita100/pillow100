javascript
コードをコピーする
const mqtt = require('mqtt');

// MQTTブローカーのURL
const brokerUrl = 'mqtt://broker.hivemq.com';

// MQTTクライアントの作成
const client = mqtt.connect(brokerUrl);

// 接続時のイベントハンドラ
client.on('connect', () => {
    console.log('Connected to MQTT broker');

    // 購読するトピックを指定
    const topic = 'sensor/data';
    client.subscribe(topic, () => {
        console.log(Subscribed to topic '${topic}');
    });
});

// メッセージを受信したときのイベントハンドラ
client.on('message', (topic, message) => {
    console.log(Received message: ${message.toString()} on topic ${topic});
});

// エラー発生時のイベントハンドラ
client.on('error', (error) => {
    console.error(Connection error: ${error});
});
