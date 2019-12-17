import { Component } from '@angular/core';
import { BluetoothSerial } from '@ionic-native/bluetooth-serial/ngx';
import { AlertController, NavController, ToastController } from '@ionic/angular';

@Component({
    selector: 'app-tab2',
    templateUrl: 'tab2.page.html',
    styleUrls: ['tab2.page.scss'],
})
export class Tab2Page {
    pairedList: pairedlist;
    listToggle = false;
    pairedDeviceID = 0;
    dataSend = '';

    constructor(public navCtrl: NavController,
                private alertCtrl: AlertController,
                private bluetoothSerial: BluetoothSerial,
                private toastCtrl: ToastController) {
        this.checkBluetoothEnabled();
    }

    checkBluetoothEnabled() {
        this.bluetoothSerial.isEnabled().then(success => {
            this.listPairedDevices();
        }, error => {
            this.showError('Please Enable Bluetooth');
        });
    }

    listPairedDevices() {
        this.bluetoothSerial.list().then(success => {
            console.log(success);
            this.pairedList = success;
            this.listToggle = true;
        }, error => {
            this.showError('Please Enable Bluetooth');
            this.listToggle = false;
        });
    }

    selectDevice() {
        const connectedDevice = this.pairedList[this.pairedDeviceID];
        if (!connectedDevice.address) {
            this.showError('Select Paired Device to connect');
            return;
        }

        console.log(connectedDevice);
        const address = connectedDevice.address;
        const name = connectedDevice.name;

        this.connect(address);
    }

    connect(address) {
        // Attempt to connect device with specified address, call app.deviceConnected if success
        this.bluetoothSerial.connect(address).subscribe(success => {
            this.deviceConnected();
            this.showToast('Successfully Connected');
        }, error => {
            this.showError('Error:Connecting to Device');
        });
    }

    deviceConnected() {
        // Subscribe to data receiving as soon as the delimiter is read
        this.bluetoothSerial.subscribe('\n').subscribe(success => {
            this.handleData(success);
            this.showToast('Connected Successfullly');
        }, error => {
            this.showError(error);
        });
    }

    deviceDisconnected() {
        // Unsubscribe from data receiving
        this.bluetoothSerial.disconnect();
        this.showToast('Device Disconnected');
    }

    handleData(data) {
        this.showToast(data);
    }

    sendData() {
        this.dataSend += '\n';
        this.showToast(this.dataSend);

        this.bluetoothSerial.write(this.dataSend).then(success => {
            this.showToast(success);
        }, error => {
            this.showError(error);
        });
    }

    async showError(error) {
        const alert = await this.alertCtrl.create({
            header: 'Error',
            subHeader: error,
            buttons: ['Dismiss'],
        });
        await alert.present();
    }

    async showToast(msj) {
        const toast = await this.toastCtrl.create({
            message: msj,
            duration: 1000,
        });
        await toast.present();
    }

}

interface pairedlist {
    'class': number;
    'id': string;
    'address': string;
    'name': string;
}
